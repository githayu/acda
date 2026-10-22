import { describe, expect, test } from 'vitest'

import { defaultColors, defaultPalettes } from '@/store'

import { findPaletteIndex, getAvailableColors, getCropRect, hexToRgb, rgbToHex } from './color'

describe('hexToRgb / rgbToHex', () => {
  test('成分が16未満の色も、桁を落とさずに相互変換できる', () => {
    expect(rgbToHex([0x05, 0x10, 0xff])).toBe(0x0510ff)
    expect(hexToRgb(0x0510ff)).toEqual([0x05, 0x10, 0xff])
    expect(rgbToHex([0, 0, 0x0f])).toBe(0x00000f)
  })

  test('ACNLの全色が往復しても変わらない', () => {
    const hexes = defaultColors.filter((hex) => hex >= 0)

    expect(hexes.map((hex) => rgbToHex(hexToRgb(hex)))).toEqual(hexes)
  })
})

describe('getAvailableColors', () => {
  test('とびだせでパレット未指定なら、色テーブルの有効な色をすべて使う', () => {
    const colors = getAvailableColors('acnl')

    expect(colors).toHaveLength(defaultColors.filter((hex) => hex >= 0).length)
    expect(colors).not.toContainEqual([-1, -1, -1])
  })

  test('とびだせでプリセットを指定すると、そのパレットの15色だけを使う', () => {
    defaultPalettes.forEach((palette, index) => {
      expect(getAvailableColors('acnl', index)).toEqual(
        palette.map((colorIndex) => hexToRgb(defaultColors[colorIndex]))
      )
    })
  })

  test('とびだせで範囲外のパレット番号なら、パレット未指定と同じになる', () => {
    const all = getAvailableColors('acnl')

    expect(getAvailableColors('acnl', -1)).toEqual(all)
    expect(getAvailableColors('acnl', defaultPalettes.length)).toEqual(all)
  })

  test('あつまれでは、パレットの指定に関係なく指定できる全色を使う', () => {
    const colors = getAvailableColors('acnh', 0)

    expect(colors).toHaveLength(30 * 15 * 15)
    expect(new Set(colors.map((rgb) => rgb.join())).size).toBeGreaterThan(1)
  })
})

describe('findPaletteIndex', () => {
  test('同じ色の番号を返し、なければ-1を返す', () => {
    const palette: [number, number, number][] = [
      [255, 0, 0],
      [0, 0, 255],
    ]

    expect(findPaletteIndex(palette, [0, 0, 255])).toBe(1)
    expect(findPaletteIndex(palette, [0, 255, 0])).toBe(-1)
  })
})

describe('getCropRect', () => {
  test('切り抜きの指定がなければ画像全体を使う', () => {
    expect(getCropRect(undefined, 400, 300)).toEqual({ height: 300, width: 400, x: 0, y: 0 })
  })

  test('パーセントの指定をピクセルに変換する', () => {
    expect(getCropRect({ height: 50, unit: '%', width: 25, x: 10, y: 20 }, 400, 300)).toEqual({
      height: 150,
      width: 100,
      x: 40,
      y: 60,
    })
  })

  test('幅や高さが0の切り抜き (クリックしただけ) は、画像全体を使う', () => {
    expect(getCropRect({ height: 0, unit: '%', width: 0, x: 30, y: 30 }, 400, 300)).toEqual({
      height: 300,
      width: 400,
      x: 0,
      y: 0,
    })
  })

  test('デザインの縦横比と違う範囲は、中央を基準にその比率まで狭める', () => {
    const crop = { height: 50, unit: '%' as const, width: 50, x: 0, y: 0 }

    // 200×150の範囲を、正方形のデザインに合わせて150×150にする
    expect(getCropRect(crop, 400, 300, 1)).toEqual({ height: 150, width: 150, x: 25, y: 0 })

    // 200×150の範囲を、縦長 (32×48) のデザインに合わせて100×150にする
    expect(getCropRect(crop, 400, 300, 32 / 48)).toEqual({ height: 150, width: 100, x: 50, y: 0 })

    // 200×150の範囲を、横長 (2:1) のデザインに合わせて200×100にする
    expect(getCropRect(crop, 400, 300, 2)).toEqual({ height: 100, width: 200, x: 0, y: 25 })
  })

  test('範囲の指定がなければ、縦横比が違っても画像全体を引き伸ばして使う', () => {
    expect(getCropRect(undefined, 400, 300, 1)).toEqual({ height: 300, width: 400, x: 0, y: 0 })
  })
})
