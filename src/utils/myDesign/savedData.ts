import { RGB } from 'color-convert'

import type { GameType } from '@/store'

/** 変換するデザインの大きさ (ピクセル) */
export type PanelSize = {
  height: number
  width: number
}

/** localStorage保存用データ */
export type SavedCanvasData = {
  gameType: GameType
  imageDataUrl: string
  palette: RGB[]
  panelSize: PanelSize
  savedAt: number
}

/** 0〜255の整数か */
const isChannel = (value: unknown) =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 255

/** RGBの組か */
const isRgb = (value: unknown): value is RGB =>
  Array.isArray(value) && value.length === 3 && value.every(isChannel)

/** 1以上の整数か */
const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0

/** オブジェクトの値を型を決めずに取り出す */
const field = (value: object, key: string): unknown => Reflect.get(value, key)

/**
 * localStorageの文字列を保存データとして読み込む (形が正しくなければnull)
 * MARK: parseSavedData
 */
export const parseSavedData = (raw: null | string): null | SavedCanvasData => {
  if (!raw) return null

  let data: unknown

  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }

  if (typeof data !== 'object' || data === null) return null

  const gameType = field(data, 'gameType')
  const imageDataUrl = field(data, 'imageDataUrl')
  const palette = field(data, 'palette')
  const panelSize = field(data, 'panelSize')
  const savedAt = field(data, 'savedAt')

  if (gameType !== 'acnl' && gameType !== 'acnh') return null
  if (typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image/')) return null
  if (!Array.isArray(palette) || palette.length > 15 || !palette.every(isRgb)) return null
  if (typeof panelSize !== 'object' || panelSize === null) return null

  const height = field(panelSize, 'height')
  const width = field(panelSize, 'width')

  if (!isPositiveInteger(height) || !isPositiveInteger(width)) return null

  return {
    gameType,
    imageDataUrl,
    palette,
    panelSize: { height, width },
    savedAt: typeof savedAt === 'number' ? savedAt : 0,
  }
}
