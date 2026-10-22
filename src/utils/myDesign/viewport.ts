/** 幅と高さ */
export type Size = {
  height: number
  width: number
}

/** 表示する内容の拡大率と位置 (枠の左上からのずれ、CSSピクセル) */
export type View = {
  scale: number
  x: number
  y: number
}

/** 1シートの大きさ (ピクセル) */
export const SHEET_SIZE = 32

/** 枠いっぱいに表示したときに対して、拡大できる倍率の上限 */
export const MAX_ZOOM = 8

/** 内容全体が枠いっぱいに収まる拡大率 */
const fitScale = (content: Size, box: Size) =>
  Math.min(box.width / content.width, box.height / content.height)

/** 縮小できる下限の拡大率 (元の大きさ。枠に収まらない場合は収まる大きさ) */
const minScale = (content: Size, box: Size) => Math.min(1, fitScale(content, box))

/**
 * 最初の表示 (元の大きさで、枠の中央に置く)
 * MARK: initialView
 */
export const initialView = (content: Size, box: Size): View => {
  const scale = minScale(content, box)

  return {
    scale,
    x: (box.width - content.width * scale) / 2,
    y: (box.height - content.height * scale) / 2,
  }
}

/** 1つの軸で、内容が枠より小さければ枠からはみ出さないように、大きければ枠の外に余白が出ないようにする */
const clampAxis = (offset: number, contentLength: number, boxLength: number) => {
  const limit = boxLength - contentLength

  return Math.min(Math.max(limit, 0), Math.max(Math.min(limit, 0), offset))
}

/**
 * 拡大率を元の大きさから、枠いっぱいのMAX_ZOOM倍までに収め、内容が枠から外れないよう位置を直す
 * MARK: clampView
 */
export const clampView = (view: View, content: Size, box: Size): View => {
  const scale = Math.min(
    fitScale(content, box) * MAX_ZOOM,
    Math.max(minScale(content, box), view.scale)
  )

  return {
    scale,
    x: clampAxis(view.x, content.width * scale, box.width),
    y: clampAxis(view.y, content.height * scale, box.height),
  }
}

/**
 * 枠の上の点 (pointX, pointY) を中心に、拡大率をfactor倍にする
 * MARK: zoomAt
 */
export const zoomAt = (
  view: View,
  factor: number,
  pointX: number,
  pointY: number,
  content: Size,
  box: Size
): View => {
  const scale = clampView({ ...view, scale: view.scale * factor }, content, box).scale
  const ratio = scale / view.scale

  return clampView(
    {
      scale,
      x: pointX - (pointX - view.x) * ratio,
      y: pointY - (pointY - view.y) * ratio,
    },
    content,
    box
  )
}

/**
 * 枠の上の点にあるシートの位置を返す (画像の外ならnull)
 * MARK: sheetAt
 */
export const sheetAt = (view: View, pointX: number, pointY: number, content: Size) => {
  const x = (pointX - view.x) / view.scale
  const y = (pointY - view.y) / view.scale

  if (x < 0 || y < 0 || x >= content.width || y >= content.height) return null

  return { x: Math.floor(x / SHEET_SIZE), y: Math.floor(y / SHEET_SIZE) }
}
