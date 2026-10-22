import { describe, expect, test } from 'vitest'

import { HSVPalette, stepsToRgb } from './HSV'

describe('stepsToRgb', () => {
  test('あかるさ0は真っ黒ではなく、明度7.843%の暗い灰色になる', () => {
    expect(stepsToRgb({ hue: 0, saturation: 0, value: 0 })).toEqual([20, 20, 20])
  })

  test('あかるさ14でも真っ白にはならず、明度89.743%が上限になる', () => {
    expect(stepsToRgb({ hue: 0, saturation: 0, value: 14 })).toEqual([229, 229, 229])
  })

  test('あざやかさ14は彩度93.52%で、純色にはならない', () => {
    expect(stepsToRgb({ hue: 0, saturation: 14, value: 14 })).toEqual([229, 15, 15])
  })

  test('いろあいは1段階12度で、5段階ごとに赤・黄・緑・水色・青・紫の順に進む', () => {
    const vivid = (hue: number) => stepsToRgb({ hue, saturation: 14, value: 14 })

    expect(vivid(5)).toEqual([229, 229, 15])
    expect(vivid(10)).toEqual([15, 229, 15])
    expect(vivid(15)).toEqual([15, 229, 229])
    expect(vivid(20)).toEqual([15, 15, 229])
    expect(vivid(25)).toEqual([229, 15, 229])
  })
})

describe('HSVPalette', () => {
  test('いろあい30段階×あざやかさ15段階×あかるさ15段階の組み合わせがある', () => {
    expect(HSVPalette.fullColor).toHaveLength(30 * 15 * 15)
  })

  test('指定できる色は、つまみの位置を引き直すと同じ色に戻る', () => {
    for (const { rgb } of HSVPalette.fullColor) {
      expect(stepsToRgb(HSVPalette.findSteps(rgb))).toEqual(rgb)
    }
  })

  test('指定できない色は、いちばん近い色のつまみの位置になる', () => {
    expect(HSVPalette.findSteps([0, 0, 0]).value).toBe(0)
    expect(HSVPalette.findSteps([255, 255, 255])).toMatchObject({ saturation: 0, value: 14 })
  })
})
