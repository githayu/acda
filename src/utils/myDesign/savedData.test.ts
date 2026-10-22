import { describe, expect, test } from 'vitest'

import { parseSavedData } from './savedData'

/** 正しい形の保存データ */
const valid = {
  gameType: 'acnl',
  imageDataUrl: 'data:image/png;base64,AAAA',
  palette: [
    [255, 0, 0],
    [0, 0, 255],
  ],
  panelSize: { height: 32, width: 32 },
  savedAt: 1,
}

/** 一部を書き換えた保存データの文字列 */
const withPatch = (patch: Record<string, unknown>) => JSON.stringify({ ...valid, ...patch })

describe('parseSavedData', () => {
  test('正しい形のデータは、そのまま読み込める', () => {
    expect(parseSavedData(JSON.stringify(valid))).toEqual(valid)
  })

  test('保存されていない、または壊れたJSONならnull', () => {
    expect(parseSavedData(null)).toBeNull()
    expect(parseSavedData('{')).toBeNull()
    expect(parseSavedData('"text"')).toBeNull()
  })

  test('旧版の保存形式や、知らないゲームの種類は読み込まない', () => {
    expect(parseSavedData(JSON.stringify({ design: {} }))).toBeNull()
    expect(parseSavedData(withPatch({ gameType: 'acww' }))).toBeNull()
  })

  test('画像のdata URLでなければ読み込まない', () => {
    expect(parseSavedData(withPatch({ imageDataUrl: 'https://example.com/a.png' }))).toBeNull()
  })

  test('パレットが16色以上か、RGBの範囲外の値を含むなら読み込まない', () => {
    expect(parseSavedData(withPatch({ palette: Array(16).fill([0, 0, 0]) }))).toBeNull()
    expect(parseSavedData(withPatch({ palette: [[256, 0, 0]] }))).toBeNull()
    expect(parseSavedData(withPatch({ palette: [[0, 0]] }))).toBeNull()
  })

  test('大きさが正の整数でなければ読み込まない', () => {
    expect(parseSavedData(withPatch({ panelSize: { height: 0, width: 32 } }))).toBeNull()
    expect(parseSavedData(withPatch({ panelSize: { height: 32.5, width: 32 } }))).toBeNull()
    expect(parseSavedData(withPatch({ panelSize: null }))).toBeNull()
  })
})
