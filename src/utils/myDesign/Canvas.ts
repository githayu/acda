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
  /** 選択中の色の番号 (未選択ならundefined) */
  selectIndex?: number
  showGrid: boolean
  showNumber: boolean
  width = 660

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

  drawGrid() {
    if (!this.app) return

    // 既存のグリッドを削除
    if (this.gridGraphics) {
      this.app.stage.removeChild(this.gridGraphics)
      this.gridGraphics.destroy()
      this.gridGraphics = null
    }

    if (!this.showGrid) return

    const g = new Graphics()
    const centerX = 20 + 16 * 20
    const centerY = 20 + 16 * 20

    // 細線 (黒)
    for (let y = 20; y <= this.height; y += 20) {
      g.moveTo(20, y).lineTo(this.width, y).stroke({ color: 0x000000, width: 1 })
    }

    for (let x = 20; x <= this.width; x += 20) {
      g.moveTo(x, 20).lineTo(x, this.height).stroke({ color: 0x000000, width: 1 })
    }

    // 十文字の太線 (中央)
    g.moveTo(20, centerY).lineTo(this.width, centerY).stroke({ color: 0x000000, width: 3 })
    g.moveTo(centerX, 20).lineTo(centerX, this.height).stroke({ color: 0x000000, width: 3 })

    this.gridGraphics = g
    this.app.stage.addChild(g)
  }

  drawRuler() {
    if (!this.app) return
    const gridSize = 20
    const grids = new Graphics()
    const numberStyle = new TextStyle({
      fill: 0xdddddd,
      fontFamily: 'Verdana',
      fontSize: 10,
    })

    // x
    for (let x = gridSize; x < this.width; x += gridSize) {
      const number = new Text({ style: numberStyle, text: `${x / gridSize}` })
      const numX = (gridSize - number.width) / 2 + x
      const numY = (gridSize - number.height) / 2

      number.position.set(numX, numY)

      this.app.stage.addChild(number)

      grids.rect(x, 0, gridSize, gridSize)
      grids.stroke({ color: 0xdddddd, width: 1 })
    }

    // y
    for (let y = gridSize; y < this.height; y += gridSize) {
      const number = new Text({ style: numberStyle, text: `${y / gridSize}` })
      const numX = (gridSize - number.width) / 2
      const numY = (gridSize - number.height) / 2 + y

      number.position.set(numX, numY)

      this.app.stage.addChild(number)

      grids.rect(0, y, gridSize, gridSize)
      grids.stroke({ color: 0xdddddd, width: 1 })
    }

    this.app.stage.addChild(grids)
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

    this.app.stage.addChild(this.gridContainer)
    this.app.stage.addChild(this.numberContainer)

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
}
