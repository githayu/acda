import { describe, expect, test } from 'vitest'

import { clampView, initialView, MAX_ZOOM, sheetAt, zoomAt } from './viewport'

/** ミニマップの枠 */
const box = { height: 280, width: 280 }

/** 1枚 (32×32) と縦横3枚 (96×96) と顔出し看板 (52×64) のデザイン */
const single = { height: 32, width: 32 }
const triple = { height: 96, width: 96 }
const board = { height: 64, width: 52 }

/** 枠より大きい任意サイズ (32×320) */
const tall = { height: 320, width: 32 }

describe('initialView', () => {
  test('最初は元の大きさのまま、枠の中央に置く', () => {
    expect(initialView(single, box)).toEqual({ scale: 1, x: 124, y: 124 })
    expect(initialView(board, box)).toEqual({ scale: 1, x: 114, y: 108 })
  })

  test('枠に収まらない大きさのときだけ、収まるまで縮める', () => {
    expect(initialView(tall, box).scale).toBe(280 / 320)
  })
})

describe('zoomAt', () => {
  test('カーソルの位置にある画像上の点は、拡大しても同じ位置にある', () => {
    const view = initialView(triple, box)
    const zoomed = zoomAt(view, 4, 130, 150, triple, box)

    // 拡大前にカーソルの下にあった画像上の点
    const imageX = (130 - view.x) / view.scale
    const imageY = (150 - view.y) / view.scale

    expect(zoomed.scale).toBeCloseTo(4)
    expect(imageX * zoomed.scale + zoomed.x).toBeCloseTo(130)
    expect(imageY * zoomed.scale + zoomed.y).toBeCloseTo(150)
  })

  test('元の大きさより小さくは縮小できず、枠いっぱいの上限倍より大きくは拡大できない', () => {
    const view = initialView(triple, box)

    expect(zoomAt(view, 0.1, 140, 140, triple, box)).toEqual(view)
    expect(zoomAt(view, 1000, 140, 140, triple, box).scale).toBeCloseTo((280 / 96) * MAX_ZOOM)
  })
})

describe('clampView', () => {
  test('拡大して動かしても、画像が枠から外れて余白が出ない', () => {
    const scale = 12

    expect(clampView({ scale, x: 500, y: 500 }, triple, box)).toMatchObject({ x: 0, y: 0 })
    expect(clampView({ scale, x: -5000, y: -5000 }, triple, box)).toMatchObject({
      x: 280 - 96 * scale,
      y: 280 - 96 * scale,
    })
  })

  test('画像が枠より小さいときは、枠の中なら自由に動かせ、枠からははみ出さない', () => {
    const view = initialView(single, box)

    expect(clampView({ ...view, x: 10, y: 200 }, single, box)).toMatchObject({ x: 10, y: 200 })
    expect(clampView({ ...view, x: -50, y: 500 }, single, box)).toMatchObject({ x: 0, y: 248 })
  })
})

describe('sheetAt', () => {
  test('押した位置のシートを返し、画像の外ならnullを返す', () => {
    const view = initialView(triple, box)

    expect(sheetAt(view, view.x + 10, view.y + 10, triple)).toEqual({ x: 0, y: 0 })
    expect(sheetAt(view, view.x + 70, view.y + 40, triple)).toEqual({ x: 2, y: 1 })
    expect(sheetAt(view, view.x - 1, view.y + 10, triple)).toBeNull()
  })

  test('拡大して動かしたあとも、表示されている位置のシートを返す', () => {
    const view = clampView({ scale: 10, x: -500, y: 0 }, triple, box)

    // 画像のx=50の位置 (2枚目のシート) が、枠のx=0に来ている
    expect(sheetAt(view, 1, 1, triple)).toEqual({ x: 1, y: 0 })
  })

  test('32の倍数でない幅の端は、最後のシートとして扱う', () => {
    const view = initialView(board, box)

    expect(sheetAt(view, view.x + 51.5, view.y + 10, board)).toEqual({ x: 1, y: 0 })
  })
})
