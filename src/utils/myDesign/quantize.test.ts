import { RGB } from 'color-convert'
import { describe, expect, test } from 'vitest'

import { getAvailableColors } from './color'
import { quantize } from './quantize'

const size = 32

/** RGBAの1画素 */
type Rgba = [number, number, number, number]

/** 各ピクセルの色を関数で指定してRGBAのバイト列を作る */
const createPixels = (colorAt: (x: number, y: number) => RGB | Rgba) =>
  new Uint8ClampedArray(
    Array.from({ length: size * size }, (_, i) => {
      const color = colorAt(i % size, Math.floor(i / size))

      return color.length === 4 ? color : [...color, 255]
    }).flat()
  )

/** バイト列に含まれる不透明な色 (重複なし) */
const opaqueColors = (pixels: Uint8ClampedArray) => {
  const colors = new Set<string>()

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] === 255) colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`)
  }

  return colors
}

/** 色の集合を比較用の文字列の集合にする */
const toKeys = (colors: RGB[]) => new Set(colors.map((rgb) => rgb.join()))

/** 色相と明るさを変えた、どの画素の色も違うグラデーション */
const gradient = createPixels((x, y) => [x * 8, y * 8, ((x + y) * 4) % 256])

const acnl = getAvailableColors('acnl')

describe('quantize', () => {
  test('使える色だけでできた画像は、そのままの色で出力される', () => {
    const four = [acnl[4], acnl[30], acnl[100], acnl[149]]
    const result = quantize(
      createPixels((x) => four[Math.floor(x / 8)]),
      acnl,
      15
    )

    expect(toKeys(result.palette)).toEqual(toKeys(four))
    expect(opaqueColors(result.pixels)).toEqual(toKeys(four))
  })

  test('どの画素の色も違う画像でも、ACNLの色だけを使って15色で出力される', () => {
    const result = quantize(gradient, acnl, 15)
    const used = opaqueColors(result.pixels)

    expect(result.palette).toHaveLength(15)
    expect(used.size).toBeLessThanOrEqual(15)
    expect([...used].every((key) => toKeys(acnl).has(key))).toBe(true)
    expect([...used].every((key) => toKeys(result.palette).has(key))).toBe(true)
  })

  test('最大色数を指定すると、色が足りる画像ではちょうどその数を使う', () => {
    for (const maxColors of [2, 5, 10]) {
      const result = quantize(gradient, acnl, maxColors)

      expect(result.palette).toHaveLength(maxColors)
      expect(opaqueColors(result.pixels).size).toBeLessThanOrEqual(maxColors)
    }
  })

  test('色の塊が分かれる画像でも、最大色数を超えない', () => {
    // 再現できるように、決まった種から作る疑似乱数で、6つの色の塊にばらつきを加えた画像を作る
    for (let seed = 1; seed <= 50; seed++) {
      let state = seed

      const random = () => {
        state = (state * 1103515245 + 12345) % 2 ** 31

        return state / 2 ** 31
      }

      const centers = Array.from({ length: 6 }, () => [
        random() * 255,
        random() * 255,
        random() * 255,
      ])
      const pixels = new Uint8ClampedArray(16 * 16 * 4)

      for (let i = 0; i < 16 * 16; i++) {
        const [r, g, b] = centers[Math.floor(random() * centers.length)]
        const jitter = () => random() * 40 - 20

        pixels.set([r + jitter(), g + jitter(), b + jitter(), 255], i * 4)
      }

      for (const maxColors of [3, 5, 8, 15]) {
        expect(quantize(pixels, acnl, maxColors).palette.length).toBeLessThanOrEqual(maxColors)
      }
    }
  })

  test('少しの画素しかない色 (目や輪郭など) も、上限に余裕があれば残る', () => {
    const spots = [acnl[4], acnl[30], acnl[60], acnl[100], acnl[120], acnl[140]]
    const pixels = createPixels((x, y) =>
      y === 16 && x % 5 === 0 && x / 5 < spots.length ? spots[x / 5] : acnl[149]
    )

    const result = quantize(pixels, acnl, 15)

    expect(opaqueColors(result.pixels)).toEqual(toKeys([acnl[149], ...spots]))
  })

  test('プリセットのパレットを指定すると、その15色だけで出力される', () => {
    const preset = getAvailableColors('acnl', 0)
    const used = opaqueColors(quantize(gradient, preset, 15).pixels)

    expect([...used].every((key) => toKeys(preset).has(key))).toBe(true)
  })

  test('あつまれでは、ゲームで指定できる色だけで15色以内になる', () => {
    const acnh = getAvailableColors('acnh')
    const used = opaqueColors(quantize(gradient, acnh, 15).pixels)

    expect(used.size).toBeLessThanOrEqual(15)
    expect([...used].every((key) => toKeys(acnh).has(key))).toBe(true)
  })

  test('透明度が半分未満の画素は透明になり、パレットの色に数えない', () => {
    const pixels = createPixels((x): Rgba => (x < 16 ? [255, 0, 0, 0] : [0, 0, 255, 255]))
    const result = quantize(pixels, acnl, 15)

    expect(result.palette).toHaveLength(1)
    expect(Array.from(result.pixels.subarray(0, 4))).toEqual([0, 0, 0, 0])
    expect(result.pixels[16 * 4 + 3]).toBe(255)
  })

  test('すべて透明な画像は、パレットが空で全画素が透明になる', () => {
    const result = quantize(
      createPixels((): Rgba => [255, 255, 255, 0]),
      acnl,
      15
    )

    expect(result.palette).toEqual([])
    expect(result.pixels.every((value) => value === 0)).toBe(true)
  })

  test('パレットは使える色の並び順で、同じ画像なら毎回同じ結果になる', () => {
    const first = quantize(gradient, acnl, 15)
    const indexes = first.palette.map((rgb) =>
      acnl.findIndex((color) => color.join() === rgb.join())
    )

    expect(indexes).toEqual([...indexes].sort((a, b) => a - b))
    expect(quantize(gradient, acnl, 15)).toEqual(first)
  })
})
