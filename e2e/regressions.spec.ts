import { expect, Page, test } from '@playwright/test'
import { writeFileSync } from 'node:fs'

import { isNear, snapshotCells } from './canvas'
import { convertImage, createPng, readSavedResult } from './helpers'

/** 左右で色が違う画像 */
const halfPng = createPng(64, 64, (x) => (x < 32 ? [255, 0, 0] : [0, 0, 255]))

/** ページの例外とコンソールのエラーを集める */
const collectErrors = (page: Page) => {
  const errors: string[] = []

  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })

  return errors
}

test.describe('画面の移動と変換のやり直し', () => {
  test.skip(({ isMobile }) => isMobile, 'デスクトップで確認する')

  test('復元したあとAboutへ移動して戻っても例外にならず、消去できる', async ({ page }) => {
    const errors = collectErrors(page)

    await page.goto('/')
    await convertImage(page, halfPng)
    await page.reload()
    await page.getByRole('link', { name: 'About' }).click()
    await expect(page).toHaveURL('/about')

    // Aboutではキャンバスを破棄して共有状態から外すので、破棄済みのキャンバスを消去する操作はない
    await expect(page.getByRole('button', { name: '消去' })).toHaveCount(0)

    await page.getByRole('link', { name: 'どうぶつの森 マイデザイン作成支援ツール' }).click()
    await expect(page.locator('.test canvas')).toBeVisible()
    await page.getByRole('button', { name: '消去' }).click()

    expect(await readSavedResult(page)).toBeNull()
    expect(errors).toEqual([])
  })

  test('変換せずにゲームを切り替えて閉じても、表示中の結果のパレットのまま', async ({ page }) => {
    await page.goto('/')
    await convertImage(page, halfPng, async () => {
      await page.getByRole('dialog').getByRole('radio', { name: 'あつまれ' }).click()
    })

    await page.getByRole('button', { name: '新規作成' }).click()
    await page.getByRole('dialog').getByRole('button', { name: '変換設定' }).click()
    await page.getByRole('dialog').getByRole('radio', { name: 'とびだせ' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()

    // あつまれのパレット (色ごとの番号のボタン) のままで、色を選べる
    await expect(page.getByRole('radio', { name: '全色' })).toHaveCount(0)
    await page.getByRole('button', { exact: true, name: '1' }).click()
    await expect(page.getByRole('tooltip')).toContainText('いろあい')
  })

  test('色を選んでから別の画像を変換すると、選択は解除されている', async ({ page }) => {
    await page.goto('/')
    await convertImage(page, halfPng)
    await page.getByRole('radio', { name: '15色' }).click()
    await page.getByRole('button', { exact: true, name: '1' }).click()

    await page.getByRole('button', { name: '新規作成' }).click()
    await convertImage(
      page,
      createPng(32, 32, (x) => (x < 16 ? [0, 255, 0] : [255, 255, 0]))
    )

    const first = page.getByRole('button', { exact: true, name: '1' })

    expect(await first.evaluate((el) => getComputedStyle(el).boxShadow)).toBe('none')

    // 押すと選択になる (解除として扱われない)
    await first.click()
    await expect.poll(() => first.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none')
  })

  test('モバイルの幅でミニマップを開いたあと広げても、サイドバーでシートを選べる', async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 412 })
    await page.goto('/')
    await convertImage(page, halfPng, async () => {
      await page.getByRole('dialog').getByRole('button', { name: '変換サイズ' }).click()
      await page.getByRole('dialog').getByRole('combobox').selectOption('64x64')
    })

    await page.getByRole('button', { name: 'ミニマップを開く' }).click()
    await expect(page.getByRole('dialog').locator('canvas')).toBeVisible()
    await page.keyboard.press('Escape')
    await page.setViewportSize({ height: 900, width: 1280 })

    const minimap = page.locator('.minimap canvas')

    await expect(minimap).toBeVisible()

    // 中央 (108〜172) にある画像の右上のシート (青) を押す
    await minimap.click({ position: { x: 156, y: 124 } })
    await expect
      .poll(async () => isNear((await snapshotCells(page)).fill(0, 0), [0, 0, 255]))
      .toBe(true)
  })
})

test.describe('画像以外のファイル', () => {
  test('画像を選んだあとに画像以外を落としても、例外にならず選んだ画像が残る', async ({ page }) => {
    const errors = collectErrors(page)

    await page.goto('/')

    const dialog = page.getByRole('dialog')
    const input = dialog.locator('input[type="file"]')

    await input.setInputFiles({ buffer: halfPng, mimeType: 'image/png', name: 'a.png' })
    await dialog.getByRole('button', { name: 'キャンセル' }).click()
    await input.setInputFiles({ buffer: Buffer.from('x'), mimeType: 'text/plain', name: 'a.txt' })
    await dialog.getByRole('button', { name: '変換設定' }).click()

    await expect(dialog.getByRole('button', { exact: true, name: '変換' })).toBeEnabled()
    expect(errors).toEqual([])
  })

  test('明らかに巨大なファイル (50MB超) は、知らせて受け付けない', async ({ page }, testInfo) => {
    // Playwrightは50MBを超える内容を直接渡せないため、ファイルに書き出して渡す
    const hugeFile = testInfo.outputPath('huge.png')

    writeFileSync(hugeFile, Buffer.alloc(51 * 1024 * 1024))
    await page.goto('/')

    const dialog = page.getByRole('dialog')
    const message = page.waitForEvent('dialog').then(async (alert) => {
      const text = alert.message()

      await alert.dismiss()

      return text
    })

    await dialog.locator('input[type="file"]').setInputFiles(hugeFile)

    expect(await message).toBe('ファイルサイズ制限を超えています。')
    await expect(dialog.getByRole('button', { name: '決定' })).toBeHidden()
  })
})
