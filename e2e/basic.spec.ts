import { expect, test } from '@playwright/test'

import { convertImage, createPng, createStripePng, readSavedResult } from './helpers'

/** ACNLで使える色のみで構成した4色の画像 */
const fourColorPng = createStripePng([
  [0xff, 0x00, 0x00],
  [0x00, 0x00, 0xff],
  [0xff, 0xff, 0x00],
  [0xff, 0xff, 0xff],
])

test.describe('S1: 初めて開く', () => {
  test('変換ダイアログが自動で開き、閉じたあと新規作成で開き直せる', async ({ page }) => {
    await page.goto('/')

    const dialog = page.getByRole('dialog', { name: '変換する画像を選択' })

    await expect(dialog).toBeVisible()

    await dialog.getByRole('button', { name: 'Close' }).click()
    await expect(dialog).toBeHidden()

    await page.getByRole('button', { name: '新規作成' }).click()
    await expect(dialog).toBeVisible()
  })

  test('aboutページの新規作成でトップに戻ってダイアログが開く', async ({ page }) => {
    await page.goto('/about')
    await page.getByRole('button', { name: '新規作成' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('dialog', { name: '変換する画像を選択' })).toBeVisible()
  })
})

test.describe('S2・S3: とびだせの画像を変換して保存する', () => {
  test('変換結果が表示され、再読み込みで復元される', async ({ isMobile, page }) => {
    await page.goto('/')
    await convertImage(page, fourColorPng)

    const result = await readSavedResult(page)

    expect(result).toMatchObject({ gameType: 'acnl', height: 32, width: 32 })
    expect(result?.palette.length).toBeLessThanOrEqual(15)
    expect(result?.colors).toHaveLength(4)

    await expect(page.locator('.test canvas')).toBeVisible()

    if (!isMobile) await expect(page.getByRole('button', { exact: true, name: '1' })).toBeVisible()

    await page.reload()

    await expect(page.locator('.test canvas')).toBeVisible()
    await expect(page.getByRole('dialog')).toBeHidden()
  })
})

test.describe('変換ダイアログ', () => {
  test('範囲を選ばずに決定すると知らせ、画像を選ぶまで変換は押せない', async ({ page }) => {
    await page.goto('/')

    const dialog = page.getByRole('dialog')

    await dialog.getByRole('button', { name: '変換設定' }).click()
    await expect(dialog.getByRole('button', { exact: true, name: '変換' })).toBeDisabled()

    await dialog.getByRole('button', { name: '画像ファイルから' }).click()
    await dialog.locator('input[type="file"]').setInputFiles({
      buffer: fourColorPng,
      mimeType: 'image/png',
      name: 'fixture.png',
    })

    const message = page.waitForEvent('dialog').then(async (alert) => {
      const text = alert.message()

      await alert.dismiss()

      return text
    })

    await dialog.getByRole('button', { name: '決定' }).click()

    expect(await message).toBe('範囲を選択して下さい')
    await expect(dialog.getByRole('button', { name: '自動リサイズ' })).toBeVisible()
  })

  test('どの画素の色も違う画像でも変換できる', async ({ page }) => {
    await page.goto('/')
    await convertImage(
      page,
      createPng(32, 32, (x, y) => [x * 8, y * 8, ((x + y) * 4) % 256])
    )

    const result = await readSavedResult(page)

    expect(result?.colors.length).toBeGreaterThan(1)
    expect(result?.colors.length).toBeLessThanOrEqual(15)
  })

  test('透明な部分は、ゲームと同じく透明のまま変換される', async ({ page }) => {
    await page.goto('/')
    await convertImage(
      page,
      createPng(32, 32, (x) => (x < 16 ? [255, 0, 0, 0] : [0, 0, 255, 255]))
    )

    const result = await readSavedResult(page)

    expect(result?.transparentCount).toBe(16 * 32)
    expect(result?.colors).toHaveLength(1)
    expect(result?.palette).toHaveLength(1)
  })
})

test.describe('S9: 言語の切り替え', () => {
  test('英語に切り替えると表示が変わり、再読み込みしても英語のまま', async ({ page }) => {
    await page.goto('/about')

    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'English' }).click()

    await expect(page.getByText('How to Use This Tool')).toBeVisible()

    await page.reload()

    await expect(page.getByText('How to Use This Tool')).toBeVisible()
  })
})

test.describe('S10: aboutページとシェアリンク', () => {
  test('使い方の画像がすべて読み込まれる', async ({ page }) => {
    await page.goto('/about')

    const images = page.locator('main img, ol img')

    await expect(images).toHaveCount(4)

    for (const image of await images.all()) {
      await expect
        .poll(() =>
          image.evaluate(
            (el) => el instanceof HTMLImageElement && el.complete && el.naturalWidth > 0
          )
        )
        .toBe(true)
    }
  })

  test('シェアリンクがサイトのURLを共有する', async ({ page }) => {
    await page.goto('/about')

    const hrefs = await page
      .getByRole('link', { name: /^(X|Facebook|LINE|B!)$/ })
      .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))

    expect(hrefs).toHaveLength(4)

    for (const href of hrefs) {
      expect(decodeURIComponent(href)).toContain('https://acnl.hayu.io')
    }
  })
})
