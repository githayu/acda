import { RGB } from 'color-convert'

import { colorDistance } from './quantize'

/** ACNHの色指定のつまみの位置 (いろあい0〜29、あざやかさ・あかるさ0〜14) */
export type HsvSteps = {
  hue: number
  saturation: number
  value: number
}

/** いろあいの段階数 */
export const HUE_STEPS = 30

/** あざやかさの段階数 */
export const SATURATION_STEPS = 15

/** あかるさの段階数 */
export const VALUE_STEPS = 15

/** あざやかさ1段階あたりの彩度 (%) */
const SATURATION_INCREMENT = 6.68

/** あかるさ0段階目の明度 (%) */
const VALUE_START = 7.843

/** あかるさ1段階あたりの明度 (%) */
const VALUE_INCREMENT = 5.85

/**
 * つまみの位置をRGBに変換する
 * 1段階ごとに、いろあいは12度、あざやかさは6.68%、あかるさは5.85% (0段階目は7.843%) 変わる
 * MARK: stepsToRgb
 */
export const stepsToRgb = ({ hue, saturation, value }: HsvSteps): RGB => {
  const s = (SATURATION_INCREMENT * saturation) / 100
  const v = (VALUE_START + VALUE_INCREMENT * value) / 100
  const chroma = v * s
  const sector = hue / 5
  const x = chroma * (1 - Math.abs((sector % 2) - 1))
  const m = v - chroma

  // 色相環を60度ずつ6つに分け、それぞれでRGBのどの成分が最大・中間になるかを決める
  const [r, g, b] = [
    [chroma, x, 0],
    [x, chroma, 0],
    [0, chroma, x],
    [0, x, chroma],
    [x, 0, chroma],
    [chroma, 0, x],
  ][Math.min(Math.floor(sector), 5)]

  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

export class HSVPalette {
  /** ACNHで指定できる全色 (同じRGBになる組み合わせも含む) */
  static fullColor: { rgb: RGB; steps: HsvSteps }[] = Array.from(
    { length: HUE_STEPS * SATURATION_STEPS * VALUE_STEPS },
    (_, i) => {
      const steps = {
        hue: Math.floor(i / (SATURATION_STEPS * VALUE_STEPS)),
        saturation: Math.floor(i / VALUE_STEPS) % SATURATION_STEPS,
        value: i % VALUE_STEPS,
      }

      return { rgb: stepsToRgb(steps), steps }
    }
  )

  /** RGBからつまみの位置を引くための表 */
  static stepsByRgb = HSVPalette.fullColor.reduce((map, { rgb, steps }) => {
    const key = rgb.join()

    if (!map.has(key)) map.set(key, steps)

    return map
  }, new Map<string, HsvSteps>())

  /**
   * RGBに対応するつまみの位置を返す (指定できない色なら、いちばん近い色の位置)
   * MARK: findSteps
   */
  static findSteps(rgb: RGB): HsvSteps {
    const exact = HSVPalette.stepsByRgb.get(rgb.join())

    if (exact) return exact

    return HSVPalette.fullColor.reduce((nearest, color) =>
      colorDistance(color.rgb, rgb) < colorDistance(nearest.rgb, rgb) ? color : nearest
    ).steps
  }
}
