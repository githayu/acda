import { RGB } from 'color-convert'

/** 減色の結果 */
export type QuantizeResult = {
  /** 画像に使われる色 (最大でmaxColors色、使える色の並び順) */
  palette: RGB[]
  /** 減色後のRGBAのバイト列 (透明の画素はすべて0) */
  pixels: Uint8ClampedArray
}

/** この透明度未満の画素は、ゲームの透明 (画素値15) として扱う */
export const ALPHA_THRESHOLD = 128

/** 2色の距離の2乗 */
export const colorDistance = ([r1, g1, b1]: RGB, [r2, g2, b2]: RGB) =>
  (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2

/**
 * 色の一覧の中から、いちばん近い色の番号を返す
 * MARK: findNearestIndex
 */
export const findNearestIndex = (colors: RGB[], rgb: RGB) =>
  colors.reduce(
    (nearest, color, index) =>
      colorDistance(color, rgb) < colorDistance(colors[nearest], rgb) ? index : nearest,
    0
  )

/** RGBの各成分の幅 (最大−最小) */
const channelRanges = (bucket: RGB[]) =>
  [0, 1, 2].map((channel) => {
    const values = bucket.map((rgb) => rgb[channel])

    return Math.max(...values) - Math.min(...values)
  })

/** グループの平均の色 */
const average = (bucket: RGB[]): RGB => {
  const sum = bucket.reduce<RGB>(([r, g, b], [pr, pg, pb]) => [r + pr, g + pg, b + pb], [0, 0, 0])

  return [
    Math.round(sum[0] / bucket.length),
    Math.round(sum[1] / bucket.length),
    Math.round(sum[2] / bucket.length),
  ]
}

/** グループを、幅がいちばん広い成分の中央で2つに分ける */
const splitBucket = (bucket: RGB[]): [RGB[], RGB[]] => {
  const ranges = channelRanges(bucket)
  const channel = ranges.indexOf(Math.max(...ranges))
  const sorted = [...bucket].sort((a, b) => a[channel] - b[channel])
  const middle = Math.floor(sorted.length / 2)

  return [sorted.slice(0, middle), sorted.slice(middle)]
}

/** 分ける価値の大きさ (画素の数×色の幅)。分けられないグループは0 */
const splitScore = (bucket: RGB[]) =>
  bucket.length < 2 ? 0 : bucket.length * Math.max(...channelRanges(bucket))

/**
 * メディアンカットで、使える色の中からmaxColors色以内を選ぶ (使える色の番号を返す)
 * MARK: selectPalette
 */
export const selectPalette = (colors: RGB[], availableColors: RGB[], maxColors: number) => {
  /** 各グループの平均にいちばん近い、使える色の番号 */
  const nearestOf = (bucket: RGB[]) => findNearestIndex(availableColors, average(bucket))

  const buckets: RGB[][] = [colors]
  const nearest = [nearestOf(colors)]
  const scores = [splitScore(colors)]

  while (new Set(nearest).size < maxColors) {
    const target = scores.indexOf(Math.max(...scores))

    if (scores[target] === 0) break

    const halves = splitBucket(buckets[target])
    const halvesNearest = halves.map(nearestOf)
    const nextNearest = nearest.toSpliced(target, 1, ...halvesNearest)

    // 分けると2色同時に増えて上限を超える場合は、そのグループはもう分けない
    if (new Set(nextNearest).size > maxColors) {
      scores[target] = 0
      continue
    }

    buckets.splice(target, 1, ...halves)
    nearest.splice(target, 1, ...halvesNearest)
    scores.splice(target, 1, ...halves.map(splitScore))
  }

  return [...new Set(nearest)].sort((a, b) => a - b)
}

/**
 * 画像を、使える色の中から選んだmaxColors色以内に減色する
 * 透明度がALPHA_THRESHOLD未満の画素は透明 (RGBAがすべて0) にする
 * MARK: quantize
 */
export const quantize = (
  pixels: Uint8ClampedArray,
  availableColors: RGB[],
  maxColors: number
): QuantizeResult => {
  const opaque: RGB[] = []

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] >= ALPHA_THRESHOLD) opaque.push([pixels[i], pixels[i + 1], pixels[i + 2]])
  }

  const palette = opaque.length
    ? selectPalette(opaque, availableColors, maxColors).map((index) => availableColors[index])
    : []

  const result = new Uint8ClampedArray(pixels.length)

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < ALPHA_THRESHOLD) continue

    const color = palette[findNearestIndex(palette, [pixels[i], pixels[i + 1], pixels[i + 2]])]

    result.set([...color, 255], i)
  }

  return { palette, pixels: result }
}
