import { Locator, Page } from '@playwright/test'
import { inflateSync } from 'node:zlib'

import type { Rgb } from './helpers'

/** 読み込んだPNGの画素 */
type DecodedPng = {
  /** RGBAのバイト列 */
  data: Uint8Array
  height: number
  width: number
}

/** Paethフィルタの予測値 */
const paeth = (a: number, b: number, c: number) => {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)

  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

/**
 * 8bitのRGBかRGBAのPNGを、RGBAのバイト列に展開する
 * MARK: decodePng
 */
export const decodePng = (png: Buffer): DecodedPng => {
  let offset = 8
  let width = 0
  let height = 0
  let channels = 4
  const idat: Buffer[] = []

  while (offset < png.length) {
    const length = png.readUInt32BE(offset)
    const type = png.toString('ascii', offset + 4, offset + 8)
    const body = png.subarray(offset + 8, offset + 8 + length)

    if (type === 'IHDR') {
      width = body.readUInt32BE(0)
      height = body.readUInt32BE(4)
      channels = body[9] === 6 ? 4 : 3
    }

    if (type === 'IDAT') idat.push(body)

    offset += 12 + length
  }

  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * channels
  const pixels = new Uint8Array(stride * height)

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))

    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? pixels[y * stride + x - channels] : 0
      const up = y > 0 ? pixels[(y - 1) * stride + x] : 0
      const upLeft = x >= channels && y > 0 ? pixels[(y - 1) * stride + x - channels] : 0
      const predictor = [0, left, up, Math.floor((left + up) / 2), paeth(left, up, upLeft)][filter]

      pixels[y * stride + x] = (row[x] + predictor) & 0xff
    }
  }

  const data = new Uint8Array(width * height * 4)

  for (let i = 0; i < width * height; i++) {
    data.set(pixels.subarray(i * channels, i * channels + 3), i * 4)
    data[i * 4 + 3] = channels === 4 ? pixels[i * channels + 3] : 255
  }

  return { data, height, width }
}

/** 要素を撮影した画像 */
export type Snapshot = {
  /** 要素の座標 (CSSピクセル) の色を返す */
  colorAt: (x: number, y: number) => Rgb
}

/**
 * 要素を撮影し、座標を指定して色を読めるようにする
 * MARK: snapshot
 */
export const snapshot = async (locator: Locator): Promise<Snapshot> => {
  const box = await locator.boundingBox()
  const png = decodePng(await locator.screenshot({ animations: 'disabled' }))
  const scale = png.width / (box?.width ?? png.width)

  return {
    colorAt: (x, y) => {
      const i = (Math.floor(y * scale) * png.width + Math.floor(x * scale)) * 4

      return [png.data[i], png.data[i + 1], png.data[i + 2]]
    },
  }
}

/** メインのキャンバスの1マスの大きさ (キャンバスの幅660pxのとき) */
const CELL = 20

/** メインのキャンバスの要素 */
export const mainCanvas = (page: Page) => page.locator('.test canvas')

/**
 * メインのキャンバスを撮影し、マス (0始まり) の色を読めるようにする
 * 番号や格子線を避けて、マスの左上寄りの色 (塗り) と、中央の色 (番号) を読む
 * MARK: snapshotCells
 */
export const snapshotCells = async (page: Page) => {
  const canvas = mainCanvas(page)
  const box = await canvas.boundingBox()
  const ratio = (box?.width ?? 660) / 660
  const shot = await snapshot(canvas)
  const cellPoint = (col: number, row: number, dx: number, dy: number) =>
    shot.colorAt((CELL + col * CELL + dx) * ratio, (CELL + row * CELL + dy) * ratio)

  return {
    /** マスの中央 (番号が描かれる位置) の色 */
    center: (col: number, row: number) => cellPoint(col, row, CELL / 2, CELL / 2),
    /** マスの塗りの色 */
    fill: (col: number, row: number) => cellPoint(col, row, 4, 4),
    /** マスの左端の格子線の位置の色 */
    gridLine: (col: number, row: number) => cellPoint(col, row, 0, 4),
  }
}

/** 2色がほぼ同じか (撮影時の色の誤差を許す) */
export const isNear = ([r1, g1, b1]: Rgb, [r2, g2, b2]: Rgb, tolerance = 6) =>
  Math.abs(r1 - r2) <= tolerance && Math.abs(g1 - g2) <= tolerance && Math.abs(b1 - b2) <= tolerance
