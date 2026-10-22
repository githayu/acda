import { expect, test } from '@playwright/test'

import { defaultColors, defaultPalettes } from '../src/store/app'
import { convertImage, createStripePng, readSavedResult, Rgb, rgbKey } from './helpers'

/** 0xRRGGBBをRGBにする */
const toRgb = (hex: number): Rgb => [hex >> 16, (hex >> 8) & 0xff, hex & 0xff]

/** ACNLの色テーブルから選んだ8色 (はっきり違う色) */
const eightColors = [4, 20, 36, 52, 68, 100, 116, 143].map((index) => toRgb(defaultColors[index]))

/** 8色の帯の画像 */
const eightColorPng = createStripePng(eightColors)

test.describe('S4: パレットを指定する', () => {
  test('出力の色が、選んだプリセットのパレットの色だけでできている', async ({ page }) => {
    await page.goto('/')
    await convertImage(page, eightColorPng, async () => {
      await page.getByRole('button', { name: 'パレットを使用' }).click()
      await page.getByRole('switch').click()
    })

    const preset = new Set(defaultPalettes[0].map((index) => rgbKey(toRgb(defaultColors[index]))))
    const result = await readSavedResult(page)

    expect(result?.colors.every((rgb) => preset.has(rgbKey(rgb)))).toBe(true)
  })
})

test.describe('S5: 最大色数', () => {
  test('出力の色数が、設定した上限以下になる', async ({ page }) => {
    await page.goto('/')
    await convertImage(page, eightColorPng, async () => {
      await page.getByRole('button', { name: '最大色数' }).click()

      const slider = page.getByRole('slider')

      await slider.focus()
      await slider.press('Home')
      await slider.press('ArrowRight')
      await expect(slider).toHaveAttribute('aria-valuenow', '3')
    })

    const result = await readSavedResult(page)

    expect(result?.colors.length).toBeLessThanOrEqual(3)
    expect(result?.palette.length).toBeLessThanOrEqual(3)
  })
})

test.describe('S6: あつまれの画像を変換する', () => {
  test('色を選ぶと、いろあい・あざやかさ・あかるさのツールチップが開く', async ({
    isMobile,
    page,
  }) => {
    test.skip(isMobile, 'デスクトップのサイドバーで確認する')

    await page.goto('/')
    await convertImage(page, eightColorPng, async () => {
      await page.getByRole('radio', { name: 'あつまれ' }).click()
    })

    const result = await readSavedResult(page)

    expect(result?.gameType).toBe('acnh')
    expect(result?.colors.length).toBeLessThanOrEqual(15)

    await page.getByRole('button', { exact: true, name: '1' }).click()

    const tooltip = page.getByRole('tooltip')

    await expect(tooltip).toContainText('いろあい')
    await expect(tooltip).toContainText('あざやかさ')
    await expect(tooltip).toContainText('あかるさ')
  })
})

test.describe('S7: とびだせの15色の並び', () => {
  test('ゲームのデザイン画面と同じく3列×5行で、番号は左上から横に並ぶ', async ({
    isMobile,
    page,
  }) => {
    test.skip(isMobile, 'デスクトップのサイドバーで確認する')

    await page.goto('/')
    await convertImage(page, eightColorPng)
    await page.getByRole('radio', { name: '15色' }).click()

    const box = (name: string) => page.getByRole('button', { exact: true, name }).boundingBox()
    const [first, second, fourth] = await Promise.all([box('1'), box('2'), box('4')])

    expect(second?.y).toBe(first?.y)
    expect(second?.x).toBeGreaterThan(first?.x ?? 0)
    expect(fourth?.x).toBe(first?.x)
    expect(fourth?.y).toBeGreaterThan(first?.y ?? 0)
  })
})

test.describe('消去', () => {
  test('消去すると保存した変換結果がなくなり、変換ダイアログが開く', async ({ page }) => {
    await page.goto('/')
    await convertImage(page, eightColorPng)

    await page.getByRole('button', { name: '消去' }).click()

    await expect(page.getByRole('dialog', { name: '変換する画像を選択' })).toBeVisible()
    expect(await readSavedResult(page)).toBeNull()

    await page.reload()

    await expect(page.getByRole('dialog', { name: '変換する画像を選択' })).toBeVisible()
  })
})

test.describe('ゲームで作れないサイズ', () => {
  test('あつまれではとびだせのプロデザインの形を選べず、選んでいた場合は1枚に戻る', async ({
    page,
  }) => {
    await page.goto('/')

    const dialog = page.getByRole('dialog')

    await dialog.getByRole('button', { name: '変換設定' }).click()
    await dialog.getByRole('button', { name: '変換サイズ' }).click()

    const select = dialog.getByRole('combobox')

    await select.selectOption('52x64')
    await dialog.getByRole('radio', { name: 'あつまれ' }).click()

    await expect(select).toHaveValue('32x32')
    await expect(select.locator('option[value="52x64"]')).toHaveCount(0)
    await expect(select.locator('option[value="64x64"]')).toHaveCount(1)
  })
})

test.describe('S11: モバイル', () => {
  test('ツールバーからミニマップとパレットを開ける', async ({ isMobile, page }) => {
    test.skip(!isMobile, 'モバイルの画面で確認する')

    await page.goto('/')
    await convertImage(page, eightColorPng)

    // キャンバスが画面の幅に収まり、横にはみ出さない
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true)

    await expect(page.getByRole('button', { exact: true, name: '番号' })).toBeVisible()
    await expect(page.getByRole('button', { exact: true, name: '格子' })).toBeVisible()

    await page.getByRole('button', { name: 'ミニマップを開く' }).click()
    await expect(page.getByRole('dialog', { name: 'ミニマップ' }).locator('canvas')).toBeVisible()
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: 'パレットを開く' }).click()

    const palette = page.getByRole('dialog', { name: 'パレット' })

    await expect(palette).toBeVisible()

    // 番号と格子の切り替えはダイアログではなくツールバーにある
    await expect(palette.getByRole('button', { exact: true, name: '番号' })).toHaveCount(0)
    await palette.getByRole('radio', { name: '15色' }).click()
    await palette.getByRole('button', { exact: true, name: '1' }).click()

    // 色を選ぶと選択中になり、とびだせではツールチップは開かない (隠れたサイドバーの分も開かない)
    await expect(palette.getByRole('button', { exact: true, name: '1' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    await expect(page.getByRole('tooltip')).toHaveCount(0)
  })
})
