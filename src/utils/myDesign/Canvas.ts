import type { PercentCrop } from 'react-image-crop'

import { RGB } from 'color-convert'
import { chunk } from 'lodash-es'
import { Application, Container, Graphics, Sprite, Text, TextStyle, Texture } from 'pixi.js'

import { GameType } from '@/store'

import { findPaletteIndex, getAvailableColors, getCropRect, rgbToHex } from './color'
import { quantize } from './quantize'
import { type PanelSize, parseSavedData, type SavedCanvasData } from './savedData'
import {
  clampView,
  initialView,
  SHEET_SIZE,
  sheetAt,
  type View,
  type Size as ViewSize,
  zoomAt,
} from './viewport'

/** メインのキャンバスの1マスと目盛りの幅 (キャンバスの座標) */
const CELL_SIZE = 20

type CanvasOptions = {
  crop?: PercentCrop
  file?: File
  gameType?: GameType
  maxColorNumber?: number
  paletteIndex?: number
  panelSize?: PanelSize
  savedData?: SavedCanvasData
  showGrid?: boolean
  showNumber?: boolean
}

const STORAGE_KEY = 'saved-data'

/** 保存データをlocalStorageから取得 (形が正しくなければnull) */
export const getSavedData = (): null | SavedCanvasData => {
  if (typeof window === 'undefined') return null

  return parseSavedData(localStorage.getItem(STORAGE_KEY))
}

/** 保存データをlocalStorageに保存 */
export const saveData = (data: SavedCanvasData): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/** 保存データを削除 */
export const clearSavedData = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

class Converter extends EventTarget {
  canvas: HTMLCanvasElement
  /** 破棄されたか (破棄後に画像の読み込みが終わっても、変換もイベントの通知もしない) */
  isCancelled = false
  palette: RGB[] = []

  /** ピクセルを繰り返し読み出すため、CPU側に保持するcontextを使う */
  get context() {
    return this.canvas.getContext('2d', { willReadFrequently: true })
  }

  get panelHeight() {
    return this.options.panelSize?.height ?? 32
  }

  get panelWidth() {
    return this.options.panelSize?.width ?? 32
  }

  constructor(public options: CanvasOptions) {
    super()

    this.canvas = document.createElement('canvas')

    if (options.savedData) {
      this.restore(options.savedData)
    } else {
      this.convert()
    }
  }

  convert() {
    const { file } = this.options

    if (!file) return

    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onerror = (err) => {
      URL.revokeObjectURL(url)
      this.notify('fail', err)
    }

    img.onload = () => {
      URL.revokeObjectURL(url)

      const context = this.context

      if (this.isCancelled || !context) return

      try {
        const crop = getCropRect(
          this.options.crop,
          img.width,
          img.height,
          this.panelWidth / this.panelHeight
        )

        this.canvas.width = this.panelWidth
        this.canvas.height = this.panelHeight

        context.drawImage(
          img,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          this.panelWidth,
          this.panelHeight
        )

        const imgData = context.getImageData(0, 0, this.canvas.width, this.canvas.height)
        const { gameType = 'acnl', maxColorNumber = 15, paletteIndex } = this.options

        const result = quantize(
          imgData.data,
          getAvailableColors(gameType, paletteIndex),
          maxColorNumber
        )

        this.palette = result.palette
        imgData.data.set(result.pixels)
        context.putImageData(imgData, 0, 0)

        this.notify('done')
      } catch (error) {
        this.notify('fail', error)
      }
    }

    img.src = url
  }

  /** 変換の結果を知らせる (破棄されていれば知らせない) */
  notify(type: 'done' | 'fail', detail?: unknown) {
    if (this.isCancelled) return

    this.dispatchEvent(new CustomEvent(type, { detail }))
  }

  /** 保存データから復元 */
  restore(savedData: SavedCanvasData) {
    const img = new Image()

    img.onerror = (err) => this.notify('fail', err)

    img.onload = () => {
      const context = this.context

      if (this.isCancelled || !context) return

      this.canvas.width = savedData.panelSize.width
      this.canvas.height = savedData.panelSize.height

      context.drawImage(img, 0, 0)

      this.palette = savedData.palette
      this.options.gameType = savedData.gameType
      this.options.panelSize = savedData.panelSize

      this.notify('done')
    }

    img.src = savedData.imageDataUrl
  }
}

class Minimap extends EventTarget {
  app: Application | null = null
  /** 画像を載せる入れ物 (拡大・縮小と移動はこれに対して行う) */
  content = new Container()
  height = 280
  initPromise: Promise<void>
  /** シートの枠と影 (拡大しても線が太くならないよう、表示上の座標で描く) */
  overlay = new Graphics()
  sheetX = 0
  sheetY = 0
  /** 画像の拡大率と位置 */
  view: View = { scale: 1, x: 0, y: 0 }
  width = 280

  get box(): ViewSize {
    return { height: this.height, width: this.width }
  }

  get imageSize(): ViewSize {
    return { height: this.core.canvas.height, width: this.core.canvas.width }
  }

  constructor(public core: Converter) {
    super()

    // イベントリスナーを先に登録
    this.core.addEventListener('done', () => {
      this.onCoreReady()
    })

    this.initPromise = this.init()
  }

  /** ホイールで拡大・縮小し、ドラッグで移動し、クリックでシートを選べるようにする (カーソルはドラッグ中だけ変える) */
  bindEvents(canvas: HTMLCanvasElement) {
    /** ドラッグとクリックを分ける移動量 (CSSピクセル) */
    const dragThreshold = 4
    let drag: null | { moved: boolean; startX: number; startY: number; view: View } = null

    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault()

        this.setView(
          zoomAt(
            this.view,
            Math.exp(-e.deltaY * 0.002),
            e.offsetX,
            e.offsetY,
            this.imageSize,
            this.box
          )
        )
      },
      { passive: false }
    )

    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId)
      drag = { moved: false, startX: e.offsetX, startY: e.offsetY, view: this.view }
    })

    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return

      const dx = e.offsetX - drag.startX
      const dy = e.offsetY - drag.startY

      if (!drag.moved && Math.hypot(dx, dy) < dragThreshold) return

      drag.moved = true
      canvas.style.cursor = 'grabbing'

      this.setView({ ...drag.view, x: drag.view.x + dx, y: drag.view.y + dy })
    })

    canvas.addEventListener('pointerup', (e) => {
      const sheet =
        drag && !drag.moved ? sheetAt(this.view, e.offsetX, e.offsetY, this.imageSize) : null

      drag = null
      canvas.style.cursor = ''

      if (sheet) this.selectSheet(sheet.x, sheet.y)
    })

    canvas.addEventListener('pointercancel', () => {
      drag = null
      canvas.style.cursor = ''
    })
  }

  drawIchimatsu() {
    if (!this.app) return
    const gridSize = 20
    const grids = new Graphics()

    for (let x = 0; x < this.width; x += gridSize) {
      for (let y = 0; y < this.height; y += gridSize) {
        const gridX = x / gridSize
        const gridY = y / gridSize
        const color = (gridX % 2) - (gridY % 2) ? 0xffffff : 0xdddddd

        grids.rect(x, y, gridSize, gridSize)
        grids.fill(color)
      }
    }

    this.app.stage.addChild(grids)
  }

  /** 選んでいないシートを暗くし、シートの境目に線を引く */
  drawOverlay() {
    const { height, width } = this.imageSize
    const { scale, x, y } = this.view
    const sheetsX = Math.ceil(width / SHEET_SIZE)
    const sheetsY = Math.ceil(height / SHEET_SIZE)

    this.overlay.clear()

    for (let sx = 0; sx < sheetsX; sx++) {
      for (let sy = 0; sy < sheetsY; sy++) {
        const left = x + sx * SHEET_SIZE * scale
        const top = y + sy * SHEET_SIZE * scale
        const right = x + Math.min((sx + 1) * SHEET_SIZE, width) * scale
        const bottom = y + Math.min((sy + 1) * SHEET_SIZE, height) * scale
        const isSelected = sx === this.sheetX && sy === this.sheetY

        this.overlay
          .rect(left, top, right - left, bottom - top)
          .fill({ alpha: isSelected ? 0 : 0.5, color: 0x000000 })
          .stroke({ color: 0x000000, width: 1 })
      }
    }
  }

  async init() {
    this.app = new Application()

    await this.app.init({
      autoDensity: true,
      autoStart: false,
      backgroundAlpha: 0.5,
      height: this.height,
      resolution: window.devicePixelRatio ?? 1,
      width: this.width,
    })

    this.drawIchimatsu()
    this.app.stage.addChild(this.content, this.overlay)
    this.bindEvents(this.app.canvas)
    this.app.render()
  }

  async onCoreReady() {
    await this.initPromise
    if (!this.app || !this.app.renderer) return

    const texture = Texture.from(this.core.canvas)

    // ドット絵として拡大するため、補間せずに表示する
    texture.source.scaleMode = 'nearest'

    this.content.removeChildren().forEach((child) => child.destroy())
    this.content.addChild(new Sprite(texture))
    this.setView(initialView(this.imageSize, this.box))
  }

  async render(container: string) {
    await this.initPromise
    const elem = document.querySelector(container)

    if (elem && this.app?.canvas) {
      elem.innerHTML = ''
      elem.appendChild(this.app.canvas as HTMLCanvasElement)
    }
  }

  /** シートを選び、メインのキャンバスに知らせる */
  selectSheet(x: number, y: number) {
    this.sheetX = x
    this.sheetY = y
    this.drawOverlay()
    this.app?.render()

    this.dispatchEvent(new CustomEvent('onChangeSheet', { detail: { x, y } }))
  }

  /** 拡大率と位置を変えて描き直す (枠から外れないよう直してから使う) */
  setView(view: View) {
    this.view = clampView(view, this.imageSize, this.box)
    this.content.scale.set(this.view.scale)
    this.content.position.set(this.view.x, this.view.y)
    this.drawOverlay()
    this.app?.render()
  }
}

export class Canvas {
  app: Application | null = null
  core: Converter
  gridContainer = new Container()
  gridGraphics: Graphics | null = null
  height = 660
  initPromise: Promise<void>
  isDestroyed = false
  isInitialized = false

  minimap: Minimap
  numberContainer = new Container()
  /** パレットの番号 (1〜15) を描いたテクスチャ */
  numberTextures: Texture[] = []
  /** マスを載せる入れ物 (拡大・縮小と移動はこれに対して行い、目盛りの内側だけに表示する) */
  root = new Container()
  /** 上端と左端に固定する目盛り */
  ruler = new Graphics()
  /** 目盛りの番号 (列と行の1〜32、描き直すたびに作らず使い回す) */
  rulerTexts: null | { columns: Text[]; rows: Text[] } = null
  /** 選択中の色の番号 (未選択ならundefined) */
  selectIndex?: number
  showGrid: boolean
  showNumber: boolean
  /** 拡大率と位置 */
  view: View = { scale: 1, x: 0, y: 0 }
  width = 660

  /** マスを表示する範囲 (目盛りの内側、640×640)。拡大・縮小と移動はこの範囲を基準にする */
  get box(): ViewSize {
    return { height: this.height - CELL_SIZE, width: this.width - CELL_SIZE }
  }

  constructor(options: CanvasOptions) {
    this.core = new Converter(options)
    this.showGrid = options.showGrid ?? true
    this.showNumber = options.showNumber ?? true

    // イベントリスナーを先に登録
    this.core.addEventListener('done', () => {
      this.onCoreReady()
    })

    this.minimap = new Minimap(this.core)
    this.initPromise = this.init()
  }

  /**
   * 指2本のピンチ (PCではCtrl＋ホイールやトラックパッドのピンチ) で拡大・縮小し、
   * 拡大中は指1本 (PCではマウス) のドラッグで動かせるようにする
   * MARK: bindGestures
   */
  bindGestures(canvas: HTMLCanvasElement) {
    /** 触れている指の位置 (キャンバスの座標) */
    const pointers = new Map<number, { x: number; y: number }>()
    let gesture: null | { distance: number; midX: number; midY: number; view: View } = null

    /** 画面上の位置を、マスを表示する範囲の座標 (目盛りの内側の左上が原点) に直す */
    const toCanvasPoint = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const ratio = this.width / rect.width

      return {
        x: (e.clientX - rect.left) * ratio - CELL_SIZE,
        y: (e.clientY - rect.top) * ratio - CELL_SIZE,
      }
    }

    /** 今触れている指から、ジェスチャーの基準 (指の間の距離と中間の位置) を取り直す */
    const startGesture = () => {
      const [a, b] = [...pointers.values()]

      gesture = {
        distance: b ? Math.hypot(a.x - b.x, a.y - b.y) : 0,
        midX: b ? (a.x + b.x) / 2 : a.x,
        midY: b ? (a.y + b.y) / 2 : a.y,
        view: this.view,
      }
    }

    // ふつうのホイールはページのスクロールに任せ、Ctrl付き (トラックパッドのピンチを含む) だけ拡大・縮小する
    canvas.addEventListener(
      'wheel',
      (e) => {
        if (!e.ctrlKey && !e.metaKey) return

        e.preventDefault()

        const point = toCanvasPoint(e)
        // マウスのホイールは1回の量が大きいため、1回で極端に拡大しないよう量を抑える
        const delta = Math.max(-50, Math.min(50, e.deltaY))

        this.setView(
          zoomAt(this.view, Math.exp(-delta * 0.005), point.x, point.y, this.box, this.box)
        )
      },
      { passive: false }
    )

    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId)
      pointers.set(e.pointerId, toCanvasPoint(e))
      startGesture()
    })

    canvas.addEventListener('pointermove', (e) => {
      if (!gesture || !pointers.has(e.pointerId)) return

      pointers.set(e.pointerId, toCanvasPoint(e))

      const [a, b] = [...pointers.values()]

      if (b && gesture.distance > 0) {
        const distance = Math.hypot(a.x - b.x, a.y - b.y)
        const midX = (a.x + b.x) / 2
        const midY = (a.y + b.y) / 2
        const zoomed = zoomAt(
          gesture.view,
          distance / gesture.distance,
          gesture.midX,
          gesture.midY,
          this.box,
          this.box
        )

        // 指の中間が動いた分だけ、拡大しながら移動する
        this.setView({
          ...zoomed,
          x: zoomed.x + midX - gesture.midX,
          y: zoomed.y + midY - gesture.midY,
        })
      } else if (!b && gesture.view.scale > 1) {
        canvas.style.cursor = 'grabbing'
        this.setView({
          ...gesture.view,
          x: gesture.view.x + a.x - gesture.midX,
          y: gesture.view.y + a.y - gesture.midY,
        })
      }
    })

    /** 指が離れたら、残っている指で基準を取り直す */
    const endPointer = (e: PointerEvent) => {
      pointers.delete(e.pointerId)
      canvas.style.cursor = ''

      if (pointers.size) startGesture()
      else gesture = null
    }

    canvas.addEventListener('pointerup', endPointer)
    canvas.addEventListener('pointercancel', endPointer)
  }

  /** メインのキャンバスとミニマップを破棄する (2回目以降は何もしない) */
  destroy() {
    if (this.isDestroyed) return

    this.isDestroyed = true
    this.core.isCancelled = true

    // init完了前にdestroyするとPixiのResizePluginが未初期化で例外になるため、init完了を待つ
    this.initPromise.then(() => this.app?.destroy())
    this.minimap.initPromise.then(() => this.minimap.app?.destroy())
  }

  /** 選択中のシートを描画する (選択中の色があれば、その色だけを強調する) */
  drawCanvas() {
    if (!this.app?.renderer || !this.core.context) return

    const select = this.selectIndex

    // 前回の描画を破棄する (番号のテクスチャは使い回すので残す)
    this.gridContainer.removeChildren().forEach((child) => child.destroy())

    const max = SHEET_SIZE
    const cellSize = 20
    const offset = 20
    const startX = this.minimap.sheetX * max
    const startY = this.minimap.sheetY * max

    const imgData = this.core.context.getImageData(startX, startY, max, max)
    const grids = new Graphics()
    const numberTextures = this.getNumberTextures()
    const numbers: Sprite[] = []

    chunk(imgData.data, 4).forEach(([r, g, b, a], idx) => {
      const x = offset + (idx % max) * cellSize
      const y = offset + Math.floor(idx / max) * cellSize

      // 透明の画素は市松模様で表す
      if (a === 0) {
        const half = cellSize / 2

        grids.rect(x, y, cellSize, cellSize).fill(0xffffff)
        grids
          .rect(x, y, half, half)
          .rect(x + half, y + half, half, half)
          .fill(0xdddddd)

        return
      }

      const paletteNo = findPaletteIndex(this.core.palette, [r, g, b])
      const isSelected = select === undefined || select === paletteNo

      if (this.showNumber && isSelected && paletteNo >= 0) {
        const sprite = new Sprite(numberTextures[paletteNo])

        sprite.position.set(x + (cellSize - sprite.width) / 2, y + (cellSize - sprite.height) / 2)

        numbers.push(sprite)
      }

      // 選択中の色以外は薄く表示する
      grids
        .rect(x, y, cellSize, cellSize)
        .fill({ alpha: isSelected ? 1 : 0.3, color: rgbToHex([r, g, b]) })
    })

    this.gridContainer.addChild(grids, ...numbers)
  }

  /** 格子線を、拡大・移動に合わせて画面の座標で描き直す (拡大しても線の太さは変えない) */
  drawGrid() {
    if (!this.app) return

    if (!this.gridGraphics) {
      this.gridGraphics = new Graphics()
      this.app.stage.addChild(this.gridGraphics)
    }

    const g = this.gridGraphics.clear()

    if (!this.showGrid) return

    const { scale, x, y } = this.view
    const toScreenX = (index: number) => CELL_SIZE + x + index * CELL_SIZE * scale
    const toScreenY = (index: number) => CELL_SIZE + y + index * CELL_SIZE * scale
    const top = Math.max(CELL_SIZE, toScreenY(0))
    const bottom = Math.min(this.height, toScreenY(SHEET_SIZE))
    const left = Math.max(CELL_SIZE, toScreenX(0))
    const right = Math.min(this.width, toScreenX(SHEET_SIZE))

    for (let index = 0; index <= SHEET_SIZE; index++) {
      // 中央の十文字は太線にする
      const width = index === SHEET_SIZE / 2 ? 3 : 1
      const lineX = toScreenX(index)
      const lineY = toScreenY(index)

      if (lineX >= CELL_SIZE && lineX <= this.width) {
        g.moveTo(lineX, top).lineTo(lineX, bottom).stroke({ color: 0x000000, width })
      }

      if (lineY >= CELL_SIZE && lineY <= this.height) {
        g.moveTo(left, lineY).lineTo(right, lineY).stroke({ color: 0x000000, width })
      }
    }
  }

  /** 目盛りを上端と左端に固定し、マスの境目の区切り線と、見えている列と行の番号を描き直す */
  drawRuler() {
    if (!this.app) return

    if (!this.rulerTexts) {
      const style = new TextStyle({ fill: 0xdddddd, fontFamily: 'Verdana', fontSize: 10 })
      const createTexts = () =>
        Array.from({ length: SHEET_SIZE }, (_, i) => new Text({ style, text: `${i + 1}` }))

      this.rulerTexts = { columns: createTexts(), rows: createTexts() }
      this.app.stage.addChild(this.ruler, ...this.rulerTexts.columns, ...this.rulerTexts.rows)
    }

    const { scale, x, y } = this.view
    const size = CELL_SIZE * scale
    const g = this.ruler.clear()

    // 目盛りの帯 (下にマスがもぐっても見えないよう塗りつぶす)
    g.rect(0, 0, this.width, CELL_SIZE).rect(0, 0, CELL_SIZE, this.height).fill(0x333333)

    this.rulerTexts.columns.forEach((text, i) => {
      const left = CELL_SIZE + x + i * CELL_SIZE * scale

      // マスの右の境目に区切り線だけを引く (枠で囲むと、拡大したときに長方形になり、端で分かれて見える)
      if (left + size > CELL_SIZE && left < this.width) {
        g.moveTo(left + size, 0)
          .lineTo(left + size, CELL_SIZE)
          .stroke({ color: 0x777777, width: 1 })
      }

      text.position.set(left + (size - text.width) / 2, (CELL_SIZE - text.height) / 2)

      // 端で半分だけ見えているマスの番号は、左上の角や枠の外にはみ出すので出さない
      text.visible = text.x >= CELL_SIZE && text.x + text.width <= this.width
    })

    this.rulerTexts.rows.forEach((text, i) => {
      const top = CELL_SIZE + y + i * CELL_SIZE * scale

      if (top + size > CELL_SIZE && top < this.height) {
        g.moveTo(0, top + size)
          .lineTo(CELL_SIZE, top + size)
          .stroke({ color: 0x777777, width: 1 })
      }

      text.position.set((CELL_SIZE - text.width) / 2, top + (size - text.height) / 2)
      text.visible = text.y >= CELL_SIZE && text.y + text.height <= this.height
    })

    // 左上の角は、列と行の目盛りが重ならないよう上から塗る
    g.rect(0, 0, CELL_SIZE, CELL_SIZE).fill(0x333333)
  }

  /** パレットの番号 (1〜15) のテクスチャを作る (作成済みならそれを返す) */
  getNumberTextures() {
    if (this.numberTextures.length || !this.app?.renderer) return this.numberTextures

    const { renderer } = this.app

    this.numberTextures = Array.from({ length: 15 }, (_, i) => {
      const text = new Text({
        resolution: window.devicePixelRatio ?? 1,
        style: {
          fill: 0xffffff,
          fontFamily: 'Verdana',
          fontSize: 10,
          fontWeight: 'bold',
          stroke: { color: 0x000000, width: 2 },
        },
        text: `${i + 1}`,
      })
      const texture = renderer.generateTexture(text)

      text.destroy()

      return texture
    })

    return this.numberTextures
  }

  async init() {
    this.app = new Application()

    await this.app.init({
      autoDensity: true,
      autoStart: false,
      backgroundColor: 0x333333,
      height: this.height,
      resolution: window.devicePixelRatio ?? 1,
      width: this.width,
    })

    // マスは目盛りの内側だけに表示する
    const cellArea = new Graphics()
      .rect(CELL_SIZE, CELL_SIZE, this.width - CELL_SIZE, this.height - CELL_SIZE)
      .fill(0xffffff)

    this.app.stage.addChild(this.root, cellArea)
    this.root.mask = cellArea
    // マスは目盛りの内側の左上 (20, 20) から描かれているので、そこを拡大・縮小の原点にする
    this.root.pivot.set(CELL_SIZE, CELL_SIZE)
    this.root.position.set(CELL_SIZE, CELL_SIZE)
    this.root.addChild(this.gridContainer, this.numberContainer)
    this.bindGestures(this.app.canvas)
    this.updateTouchAction()

    this.drawRuler()
    this.drawGrid()
    this.app.render()

    this.minimap.addEventListener('onChangeSheet', () => {
      this.drawCanvas()
      if (this.app) this.app.render()
    })
  }

  async onCoreReady() {
    await this.initPromise
    if (!this.app || !this.app.renderer) return

    this.drawCanvas()
    this.app.render()
    this.save()
  }

  async render(container: string) {
    await this.initPromise
    const elem = document.querySelector(container)

    if (elem && this.app?.canvas) {
      elem.innerHTML = ''
      elem.appendChild(this.app.canvas as HTMLCanvasElement)
    }
  }

  /** 変換結果をlocalStorageに保存 */
  save() {
    const data: SavedCanvasData = {
      gameType: this.core.options.gameType ?? 'acnl',
      imageDataUrl: this.core.canvas.toDataURL(),
      palette: this.core.palette,
      panelSize: {
        height: this.core.panelHeight,
        width: this.core.panelWidth,
      },
      savedAt: Date.now(),
    }

    saveData(data)
  }

  /** 色を選ぶ (undefinedで解除) */
  selectColor(index?: number) {
    this.selectIndex = index
    this.drawCanvas()
  }

  /** 拡大率と位置を変えて描き直す (枠から外れないよう直してから使う) */
  setView(view: View) {
    this.view = clampView(view, this.box, this.box)
    this.root.scale.set(this.view.scale)
    this.root.position.set(CELL_SIZE + this.view.x, CELL_SIZE + this.view.y)
    this.drawGrid()
    this.drawRuler()
    this.updateTouchAction()
    this.app?.render()
  }

  /**
   * 拡大していないときは、指1本のドラッグをページのスクロールに任せる
   * 拡大中はキャンバスの中を動かすため、ブラウザの操作を止める
   */
  updateTouchAction() {
    if (!this.app) return

    this.app.canvas.style.touchAction = this.view.scale > 1 ? 'none' : 'pan-x pan-y'
  }
}
