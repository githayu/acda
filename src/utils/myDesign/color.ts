import type { PercentCrop } from 'react-image-crop'

import { RGB } from 'color-convert'

import { defaultColors, defaultPalettes, GameType } from '@/store'

import { HSVPalette } from './HSV'

/** 画像上の切り抜き範囲 (ピクセル) */
export type CropRect = {
  height: number
  width: number
  x: number
  y: number
}

/**
 * 0xRRGGBB形式の数値をRGBに変換する
 * MARK: hexToRgb
 */
export const hexToRgb = (hex: number): RGB => [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff]

/**
 * RGBを0xRRGGBB形式の数値に変換する
 * MARK: rgbToHex
 */
export const rgbToHex = ([r, g, b]: RGB) => (r << 16) | (g << 8) | b

/**
 * 変換に使える色の一覧を返す
 * ACNLはプリセットのパレットを指定するとその15色、指定しなければ全色。ACNHは指定できる全色
 * MARK: getAvailableColors
 */
export const getAvailableColors = (gameType: GameType, paletteIndex?: number): RGB[] => {
  if (gameType === 'acnh') return HSVPalette.fullColor.map(({ rgb }) => rgb)

  const palette =
    paletteIndex !== undefined && paletteIndex >= 0 ? defaultPalettes.at(paletteIndex) : undefined
  const hexes = palette ? palette.map((index) => defaultColors[index]) : defaultColors

  return hexes.filter((hex) => hex >= 0).map(hexToRgb)
}

/**
 * パレットの中から同じ色の番号を探す (見つからなければ-1)
 * MARK: findPaletteIndex
 */
export const findPaletteIndex = (palette: RGB[], [r, g, b]: RGB) =>
  palette.findIndex(([pr, pg, pb]) => pr === r && pg === g && pb === b)

/**
 * 切り抜き範囲を、中央を基準に指定の縦横比 (幅÷高さ) に収まるよう狭める
 * MARK: fitAspect
 */
export const fitAspect = (rect: CropRect, aspect: number): CropRect => {
  if (rect.width / rect.height > aspect) {
    const width = rect.height * aspect

    return { ...rect, width, x: rect.x + (rect.width - width) / 2 }
  }

  const height = rect.width / aspect

  return { ...rect, height, y: rect.y + (rect.height - height) / 2 }
}

/**
 * パーセントで指定した切り抜き範囲を、画像のピクセル単位に変換する
 * 範囲の指定がなければ画像全体を使い、指定があればデザインの縦横比 (aspect) に合わせる
 * MARK: getCropRect
 */
export const getCropRect = (
  crop: Partial<PercentCrop> | undefined,
  imageWidth: number,
  imageHeight: number,
  aspect?: number
): CropRect => {
  if (!crop?.width || !crop.height) return { height: imageHeight, width: imageWidth, x: 0, y: 0 }

  const rect = {
    height: (crop.height / 100) * imageHeight,
    width: (crop.width / 100) * imageWidth,
    x: ((crop.x ?? 0) / 100) * imageWidth,
    y: ((crop.y ?? 0) / 100) * imageHeight,
  }

  return aspect ? fitAspect(rect, aspect) : rect
}
