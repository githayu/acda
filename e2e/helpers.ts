import { expect, Page } from '@playwright/test'
import { deflateSync } from 'node:zlib'

/** RGBの組 */
export type Rgb = [number, number, number]

/** 透明度つきの色 */
export type Rgba = [number, number, number, number]

/** 変換結果としてlocalStorageに保存されたデータ */
export type SavedResult = {
  /** 変換結果の画像に含まれる不透明な色 (重複なし) */
  colors: Rgb[]
  gameType: 'acnh' | 'acnl'
  height: number
  palette: Rgb[]
  /** 透明な画素の数 */
  transparentCount: number
  width: number
}

/** CRC32の計算表 */
const crcTable = Array.from({ length: 256 }, (_, n) =>
  Array.from({ length: 8 }).reduce<number>((c) => (c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1), n)
)

/** PNGのチャンクのCRC32 */
const crc32 = (buf: Buffer) => {
  const crc = buf.reduce((c, byte) => crcTable[(c ^ byte) & 0xff] ^ (c >>> 8), 0xffffffff)

  return (crc ^ 0xffffffff) >>> 0
}

/** PNGのチャンクを組み立てる */
const chunk = (type: string, data: Buffer) => {
  const length = Buffer.alloc(4)
  const crc = Buffer.alloc(4)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])

  length.writeUInt32BE(data.length)
  crc.writeUInt32BE(crc32(body))

  return Buffer.concat([length, body, crc])
}

/**
 * 各ピクセルの色を関数で指定してPNGを作る (透明度つきの色を返すと、透明度つきのPNGになる)
 * MARK: createPng
 */
export const createPng = (
  width: number,
  height: number,
  colorAt: (x: number, y: number) => Rgb | Rgba
) => {
  const header = Buffer.alloc(13)
  const hasAlpha = colorAt(0, 0).length === 4

  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header.writeUInt8(8, 8)
  header.writeUInt8(hasAlpha ? 6 : 2, 9)

  const rows = Array.from({ length: height }, (_, y) =>
    Buffer.from([0, ...Array.from({ length: width }, (_, x) => colorAt(x, y)).flat()])
  )

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/**
 * 横に色の帯が並ぶテスト用の画像を作る
 * MARK: createStripePng
 */
export const createStripePng = (colors: Rgb[], size = 64) =>
  createPng(size, size, (x) => colors[Math.floor((x / size) * colors.length)])

/**
 * 変換ダイアログで画像を選び、自動リサイズ (画像全体) で変換する
 * MARK: convertImage
 */
export const convertImage = async (
  page: Page,
  png: Buffer,
  configure?: (page: Page) => Promise<void>
) => {
  const dialog = page.getByRole('dialog')

  await dialog.locator('input[type="file"]').setInputFiles({
    buffer: png,
    mimeType: 'image/png',
    name: 'fixture.png',
  })

  await dialog.getByRole('button', { name: '自動リサイズ' }).click()
  await configure?.(page)
  await dialog.getByRole('button', { exact: true, name: '変換' }).click()
  await expect(dialog).toBeHidden()
  await expect.poll(() => readSavedResult(page)).not.toBeNull()
}

/**
 * localStorageに保存された変換結果を読み出し、画像に含まれる色を数える
 * MARK: readSavedResult
 */
export const readSavedResult = (page: Page) =>
  page.evaluate<null | SavedResult>(async () => {
    const raw = localStorage.getItem('saved-data')
    if (!raw) return null

    const data = JSON.parse(raw)
    const img = new Image()

    img.src = data.imageDataUrl
    await img.decode()

    const canvas = document.createElement('canvas')

    canvas.width = img.width
    canvas.height = img.height

    const context = canvas.getContext('2d')
    if (!context) return null

    context.drawImage(img, 0, 0)

    const pixels = context.getImageData(0, 0, img.width, img.height).data
    const colors = new Map<string, [number, number, number]>()
    let transparentCount = 0

    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] === 0) {
        transparentCount++
        continue
      }

      const rgb: [number, number, number] = [pixels[i], pixels[i + 1], pixels[i + 2]]

      colors.set(rgb.join(), rgb)
    }

    return {
      colors: [...colors.values()],
      gameType: data.gameType,
      height: img.height,
      palette: data.palette,
      transparentCount,
      width: img.width,
    }
  })

/** RGBの組を比較用の文字列にする */
export const rgbKey = ([r, g, b]: Rgb) => `${r},${g},${b}`
