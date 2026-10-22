import { describe, expect, test } from 'vitest'

import { defaultColors, defaultPalettes } from './app'
import { legacyIndexes, legacyPalettes } from './legacyColors.fixture'

/** 色テーブルの有効な色 */
const validColors = defaultColors.filter((hex) => hex >= 0)

describe('ACNLの色テーブル', () => {
  test('16×16の表に159色があり、重複がない', () => {
    expect(defaultColors).toHaveLength(256)
    expect(validColors).toHaveLength(159)
    expect(new Set(validColors).size).toBe(159)
  })

  test('使える番号は、旧版の159色と同じ位置にある', () => {
    const validIndexes = defaultColors.flatMap((hex, index) => (hex >= 0 ? [index] : []))

    expect(new Set(validIndexes)).toEqual(new Set(legacyIndexes))
  })

  test('各行の0x?9〜0x?eは無効で、0x?fは白から黒へのグレーの段階になる', () => {
    const grays = Array.from({ length: 15 }, (_, row) => defaultColors[row * 16 + 15])

    for (let row = 0; row < 16; row++) {
      expect(defaultColors.slice(row * 16 + 9, row * 16 + 15)).toEqual(Array(6).fill(-1))
    }

    expect(grays[0]).toBe(0xffffff)
    expect(grays[14]).toBe(0x000000)
    expect(grays.every((hex, i) => i === 0 || (hex & 0xff) < (grays[i - 1] & 0xff))).toBe(true)
  })
})

describe('プリセットのパレット', () => {
  test('旧版の12種類と同じ色を同じ順番で指す', () => {
    expect(defaultPalettes).toEqual(
      legacyPalettes.map((ids) => ids.map((id) => legacyIndexes[id - 1]))
    )
  })
})
