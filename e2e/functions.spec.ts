import { expect, Page, test } from '@playwright/test'

import { defaultColors, defaultPalettes } from '../src/store/app'
import { isNear, mainCanvas, snapshot, snapshotCells } from './canvas'
import { convertImage, createPng, readSavedResult, Rgb, Rgba, rgbKey } from './helpers'

/** 0xRRGGBBをRGBにする */
const toRgb = (hex: number): Rgb => [hex >> 16, (hex >> 8) & 0xff, hex & 0xff]

/** ACNLの色テーブルの色 */
const acnl = (index: number) => toRgb(defaultColors[index])

const red = acnl(0x14)
const blue = acnl(0x94)
const yellow = acnl(0x73)
const green = acnl(0xf3)

/** メインのキャンバスの背景色 (0x333333) */
const background: Rgb = [0x33, 0x33, 0x33]

/** 左右で色が違う画像 */
const halfPng = (size: number) => createPng(size, size, (x) => (x < size / 2 ? red : blue))

/** 4つの区画で色が違う画像 (左上が赤、右上が青、左下が黄、右下が緑) */
const quadrantPng = createPng(64, 64, (x, y) =>
  y < 32 ? (x < 32 ? red : blue) : x < 32 ? yellow : green
)

/** 画像を選んで、切り抜きの画面を開く */
const selectFile = async (page: Page, png: Buffer) => {
  await page.getByRole('dialog').locator('input[type="file"]').setInputFiles({
    buffer: png,
    mimeType: 'image/png',
    name: 'fixture.png',
  })
}

/** 切り抜きの画面で、画像上の範囲 (画像の割合で指定) をドラッグして選ぶ */
const dragCrop = async (page: Page, from: [number, number], to: [number, number]) => {
  const image = page.getByRole('dialog').locator('.ReactCrop img')
  const box = await image.boundingBox()

  if (!box) throw new Error('切り抜きの画像が表示されていない')

  await page.mouse.move(box.x + box.width * from[0], box.y + box.height * from[1])
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * to[0], box.y + box.height * to[1], { steps: 10 })
  await page.mouse.up()
}

/** 変換を実行して、結果が保存されるまで待つ */
const runConvert = async (page: Page) => {
  const dialog = page.getByRole('dialog')

  await dialog.getByRole('button', { exact: true, name: '変換' }).click()
  await expect(dialog).toBeHidden()
  await expect.poll(() => readSavedResult(page)).not.toBeNull()
}

test.describe('切り抜き', () => {
  test('選んだ範囲だけが変換され、範囲は正方形のデザインに合わせて正方形になる', async ({
    page,
  }) => {
    await page.goto('/')
    await selectFile(page, halfPng(256))
    await dragCrop(page, [0.55, 0.05], [0.95, 0.9])

    const selection = await page.locator('.ReactCrop__crop-selection').boundingBox()

    expect(Math.abs((selection?.width ?? 0) - (selection?.height ?? 1))).toBeLessThanOrEqual(1)

    await page.getByRole('dialog').getByRole('button', { name: '決定' }).click()
    await runConvert(page)

    const result = await readSavedResult(page)

    expect(result?.colors.map(rgbKey)).toEqual([rgbKey(blue)])
  })

  test('範囲を選んでも、自動リサイズを押すと画像全体が変換される', async ({ page }) => {
    await page.goto('/')
    await selectFile(page, halfPng(256))
    await dragCrop(page, [0.55, 0.05], [0.95, 0.9])
    await page.getByRole('dialog').getByRole('button', { name: '自動リサイズ' }).click()
    await runConvert(page)

    const result = await readSavedResult(page)

    expect(new Set(result?.colors.map(rgbKey))).toEqual(new Set([rgbKey(blue), rgbKey(red)]))
  })

  test('画像以外のファイルは受け付けない', async ({ page }) => {
    await page.goto('/')
    await page
      .getByRole('dialog')
      .locator('input[type="file"]')
      .setInputFiles({
        buffer: Buffer.from('not an image'),
        mimeType: 'text/plain',
        name: 'note.txt',
      })

    await expect(page.getByRole('dialog').getByRole('button', { name: '決定' })).toBeHidden()
    await expect(page.getByText('ここに画像をドラッグまたはクリック！')).toBeVisible()
  })
})

test.describe('変換サイズ', () => {
  const sizes = [
    { game: 'とびだせ', height: 32, value: '32x32', width: 32 },
    { game: 'とびだせ', height: 64, value: '64x64', width: 64 },
    { game: 'とびだせ', height: 96, value: '96x96', width: 96 },
    { game: 'とびだせ', height: 16, value: '16x16', width: 16 },
    { game: 'とびだせ', height: 32, value: '16x32', width: 16 },
    { game: 'とびだせ', height: 48, value: '32x48', width: 32 },
    { game: 'とびだせ', height: 64, value: '52x64', width: 52 },
    { game: 'あつまれ', height: 64, value: '64x64', width: 64 },
  ]

  for (const size of sizes) {
    test(`${size.game}で ${size.value} を選ぶと、その大きさで変換される`, async ({ page }) => {
      await page.goto('/')
      await convertImage(page, quadrantPng, async () => {
        const dialog = page.getByRole('dialog')

        await dialog.getByRole('radio', { name: size.game }).click()
        await dialog.getByRole('button', { name: '変換サイズ' }).click()
        await dialog.getByRole('combobox').selectOption(size.value)
      })

      expect(await readSavedResult(page)).toMatchObject({
        height: size.height,
        width: size.width,
      })
    })
  }
})

test.describe('キャンバスの表示', () => {
  test.skip(({ isMobile }) => isMobile, 'デスクトップのサイドバーで確認する')

  test('ミニマップでシートを選ぶと、メインのキャンバスにそのシートが表示される', async ({
    page,
  }) => {
    await page.goto('/')
    await convertImage(page, quadrantPng, async () => {
      await page.getByRole('dialog').getByRole('button', { name: '変換サイズ' }).click()
      await page.getByRole('dialog').getByRole('combobox').selectOption('64x64')
    })

    await expect.poll(async () => isNear((await snapshotCells(page)).fill(0, 0), red)).toBe(true)

    // ミニマップ (280px) の中央に64×64の画像があり、右上のシートは青
    const minimap = page.locator('.minimap canvas')
    const offset = (280 - 64) / 2

    await minimap.click({ position: { x: offset + 48, y: offset + 16 } })
    await expect.poll(async () => isNear((await snapshotCells(page)).fill(0, 0), blue)).toBe(true)

    await minimap.click({ position: { x: offset + 16, y: offset + 48 } })
    await expect.poll(async () => isNear((await snapshotCells(page)).fill(0, 0), yellow)).toBe(true)
  })

  test('ミニマップはホイールで拡大でき、ページはスクロールしない', async ({ page }) => {
    await page.goto('/')
    await convertImage(page, quadrantPng, async () => {
      await page.getByRole('dialog').getByRole('button', { name: '変換サイズ' }).click()
      await page.getByRole('dialog').getByRole('combobox').selectOption('64x64')
    })

    const minimap = page.locator('.minimap canvas')
    const box = await minimap.boundingBox()

    if (!box) throw new Error('ミニマップが表示されていない')

    // 最初は元の大きさで中央にあり、左上の(20, 20)は画像の外なので押しても何も起きない
    await minimap.click({ position: { x: 156, y: 156 } })
    await expect.poll(async () => isNear((await snapshotCells(page)).fill(0, 0), green)).toBe(true)
    await minimap.click({ position: { x: 20, y: 20 } })
    await expect.poll(async () => isNear((await snapshotCells(page)).fill(0, 0), green)).toBe(true)

    const scrollY = await page.evaluate(() => window.scrollY)

    // 左上のシート (赤) の上で拡大すると、(20, 20)が左上のシートになる
    await page.mouse.move(box.x + 120, box.y + 120)
    await page.mouse.wheel(0, -1500)
    await minimap.click({ position: { x: 20, y: 20 } })
    await expect.poll(async () => isNear((await snapshotCells(page)).fill(0, 0), red)).toBe(true)

    expect(await page.evaluate(() => window.scrollY)).toBe(scrollY)
  })

  test('拡大したミニマップはドラッグで動かせ、ドラッグではシートを選ばない', async ({ page }) => {
    await page.goto('/')
    await convertImage(page, quadrantPng, async () => {
      await page.getByRole('dialog').getByRole('button', { name: '変換サイズ' }).click()
      await page.getByRole('dialog').getByRole('combobox').selectOption('64x64')
    })

    const minimap = page.locator('.minimap canvas')
    const box = await minimap.boundingBox()

    if (!box) throw new Error('ミニマップが表示されていない')

    await page.mouse.move(box.x + 120, box.y + 120)
    // 約7.4倍に拡大すると、画像 (64×64) が枠より大きくなって動かせるようになる
    await page.mouse.wheel(0, -1000)

    // (40, 140)は左上のシート (赤) の左端付近にある
    await minimap.click({ position: { x: 40, y: 140 } })
    await expect.poll(async () => isNear((await snapshotCells(page)).fill(0, 0), red)).toBe(true)

    // 左へドラッグして右側を表示する。ドラッグしただけではシートは変わらない
    await page.mouse.move(box.x + 250, box.y + 140)
    await page.mouse.down()
    await page.mouse.move(box.x + 30, box.y + 140, { steps: 10 })
    await page.mouse.up()
    await expect.poll(async () => isNear((await snapshotCells(page)).fill(0, 0), red)).toBe(true)

    // 同じ位置を押すと、右上のシート (青) が選ばれる
    await minimap.click({ position: { x: 250, y: 60 } })
    await expect.poll(async () => isNear((await snapshotCells(page)).fill(0, 0), blue)).toBe(true)
  })

  test('元の大きさのままでも、ドラッグでミニマップの画像を動かせる', async ({ page }) => {
    await page.goto('/')
    await convertImage(page, quadrantPng, async () => {
      await page.getByRole('dialog').getByRole('button', { name: '変換サイズ' }).click()
      await page.getByRole('dialog').getByRole('combobox').selectOption('64x64')
    })

    const minimap = page.locator('.minimap canvas')
    const box = await minimap.boundingBox()

    if (!box) throw new Error('ミニマップが表示されていない')

    // 中央 (108〜172) にある画像の右下のシートをつかみ、左上へ動かす
    await page.mouse.move(box.x + 156, box.y + 156)
    await page.mouse.down()
    await page.mouse.move(box.x + 56, box.y + 56, { steps: 10 })
    await page.mouse.up()

    // 動かす前は画像の外だった(56, 56)に、右下のシート (緑) が来ている
    await minimap.click({ position: { x: 56, y: 56 } })
    await expect.poll(async () => isNear((await snapshotCells(page)).fill(0, 0), green)).toBe(true)
  })

  test('色を選ぶとその色のマスだけが強調され、もう一度押すと元に戻る', async ({ page }) => {
    await page.goto('/')
    await convertImage(page, halfPng(64))
    await page.getByRole('radio', { name: '15色' }).click()

    const left = () => snapshotCells(page).then((cells) => cells.fill(0, 0))
    const right = () => snapshotCells(page).then((cells) => cells.fill(31, 0))
    const redNo = (await readSavedResult(page))?.palette.findIndex((rgb) => isNear(rgb, red))

    await page.getByRole('button', { exact: true, name: `${(redNo ?? 0) + 1}` }).click()

    // 選んでいない色は、透明度0.3で背景に重ねた色になる
    const dimmed = blue.map((c, i) => Math.round(c * 0.3 + background[i] * 0.7)) as Rgb

    await expect.poll(async () => isNear(await left(), red)).toBe(true)
    await expect.poll(async () => isNear(await right(), dimmed)).toBe(true)

    await page.getByRole('button', { exact: true, name: `${(redNo ?? 0) + 1}` }).click()
    await expect.poll(async () => isNear(await right(), blue)).toBe(true)
  })

  test('選んだ色は、番号の表示を切り替えても選んだままになる', async ({ page }) => {
    await page.goto('/')
    await convertImage(page, halfPng(64))
    await page.getByRole('radio', { name: '15色' }).click()
    await page.getByRole('button', { exact: true, name: '1' }).click()

    const fills = async () => {
      const cells = await snapshotCells(page)

      return [cells.fill(0, 0), cells.fill(31, 0)]
    }

    const before = await fills()

    await page.getByRole('button', { exact: true, name: '番号' }).click()
    await expect
      .poll(async () => (await fills()).every((rgb, i) => isNear(rgb, before[i])))
      .toBe(true)
  })

  test('透明な画素のマスには番号を描かない', async ({ page }) => {
    await page.goto('/')
    await convertImage(
      page,
      createPng(32, 32, (x): Rgba => (x < 16 ? [0, 0, 0, 0] : [...red, 255]))
    )

    const centers = async () => {
      const cells = await snapshotCells(page)

      return [cells.center(0, 0), cells.center(31, 0)]
    }

    const before = await centers()

    await page.getByRole('button', { exact: true, name: '番号' }).click()

    // 番号を消すと、色のあるマスの中央は変わるが、透明のマスの中央は変わらない
    await expect.poll(async () => isNear((await centers())[1], before[1])).toBe(false)
    expect(isNear((await centers())[0], before[0])).toBe(true)
  })
})

test.describe('メインのキャンバスのピンチ', () => {
  test.skip(({ isMobile }) => !isMobile, 'タッチ操作はモバイルで確認する')

  test('指2本で広げると拡大され、拡大中は指1本のドラッグで動かせる', async ({ page }) => {
    await page.goto('/')
    await convertImage(page, halfPng(64))

    const canvas = mainCanvas(page)
    const box = await canvas.boundingBox()

    if (!box) throw new Error('メインのキャンバスが表示されていない')

    // 拡大していないときは、指1本のドラッグをページのスクロールに任せる
    expect(await canvas.evaluate((el) => el.style.touchAction)).toBe('pan-x pan-y')
    expect(isNear((await snapshotCells(page)).fill(0, 0), red)).toBe(true)

    // 右寄りの位置で、指の間を3倍に広げる
    const cdp = await page.context().newCDPSession(page)
    const centerX = box.x + box.width * 0.97
    const centerY = box.y + box.height / 2
    const touch = (type: 'touchEnd' | 'touchMove' | 'touchStart', gap: number) =>
      cdp.send('Input.dispatchTouchEvent', {
        touchPoints:
          type === 'touchEnd'
            ? []
            : [
                { id: 1, x: centerX - gap, y: centerY },
                { id: 2, x: centerX + gap, y: centerY },
              ],
        type,
      })

    await touch('touchStart', 10)

    for (let gap = 12; gap <= 30; gap += 2) await touch('touchMove', gap)

    await touch('touchEnd', 30)

    // 左上のマスに、画像の右半分 (青) が見えている
    await expect.poll(async () => isNear((await snapshotCells(page)).fill(0, 0), blue)).toBe(true)
    expect(await canvas.evaluate((el) => el.style.touchAction)).toBe('none')

    // 指1本で右へドラッグすると、左側 (赤) が見えてくる
    const drag = (type: 'touchEnd' | 'touchMove' | 'touchStart', x: number) =>
      cdp.send('Input.dispatchTouchEvent', {
        touchPoints: type === 'touchEnd' ? [] : [{ id: 1, x, y: centerY }],
        type,
      })

    await drag('touchStart', box.x + 20)

    for (let x = box.x + 40; x <= box.x + 220; x += 20) await drag('touchMove', x)

    await drag('touchEnd', box.x + 220)
    await expect.poll(async () => isNear((await snapshotCells(page)).fill(0, 0), red)).toBe(true)
  })
})

test.describe('メインのキャンバスの拡大 (PC)', () => {
  test.skip(({ isMobile }) => isMobile, 'マウスの操作はデスクトップで確認する')

  test('Ctrl＋ホイールで拡大され、拡大中はマウスのドラッグで動かせる', async ({ page }) => {
    await page.goto('/')
    await convertImage(page, halfPng(64))

    const box = await mainCanvas(page).boundingBox()

    if (!box) throw new Error('メインのキャンバスが表示されていない')

    await expect.poll(async () => isNear((await snapshotCells(page)).fill(0, 0), red)).toBe(true)

    // ふつうのホイールでは拡大しない
    await page.mouse.move(box.x + box.width * 0.97, box.y + box.height / 2)
    await page.mouse.wheel(0, -300)
    await expect.poll(async () => isNear((await snapshotCells(page)).fill(0, 0), red)).toBe(true)

    // 右寄りの位置でCtrl＋ホイールすると、左上のマスに画像の右半分 (青) が見える
    await page.keyboard.down('Control')

    for (let i = 0; i < 5; i++) await page.mouse.wheel(0, -100)

    await page.keyboard.up('Control')
    await expect.poll(async () => isNear((await snapshotCells(page)).fill(0, 0), blue)).toBe(true)

    // 目盛りの帯は拡大しても上端と左端に残り、マスがその下にもぐらない
    const shot = await snapshot(mainCanvas(page))

    expect(isNear(shot.colorAt(box.width / 2, 3), background)).toBe(true)
    expect(isNear(shot.colorAt(3, box.height / 2), background)).toBe(true)

    // マウスで右へドラッグすると、左側 (赤) が見えてくる
    await page.mouse.move(box.x + 20, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + 600, box.y + box.height / 2, { steps: 10 })
    await page.mouse.up()
    await expect.poll(async () => isNear((await snapshotCells(page)).fill(0, 0), red)).toBe(true)
  })
})

test.describe('番号と格子', () => {
  // モバイルではツールバー、デスクトップではミニマップの下の切り替えを使う
  test('番号を消すとマスの中央も塗りの色になり、格子を消すと線の位置も塗りの色になる', async ({
    page,
  }) => {
    await page.goto('/')
    await convertImage(page, halfPng(64))

    const cells = () => snapshotCells(page)

    // 白い番号が描かれているので、中央は塗りの色と違う
    await expect.poll(async () => isNear((await cells()).center(2, 2), red)).toBe(false)
    await page.getByRole('button', { exact: true, name: '番号' }).click()
    await expect.poll(async () => isNear((await cells()).center(2, 2), red)).toBe(true)

    // 中央の太い格子線 (17列目の左端) で確かめる
    await expect.poll(async () => isNear((await cells()).gridLine(16, 2), blue)).toBe(false)
    await page.getByRole('button', { exact: true, name: '格子' }).click()
    await expect.poll(async () => isNear((await cells()).gridLine(16, 2), blue)).toBe(true)
  })
})

test.describe('設定', () => {
  test('2番目以降のプリセットのパレットを選ぶと、その色だけで変換される', async ({ page }) => {
    await page.goto('/')
    await convertImage(page, quadrantPng, async () => {
      const dialog = page.getByRole('dialog')

      await dialog.getByRole('button', { name: 'パレットを使用' }).click()
      await dialog.getByRole('switch').click()
      await dialog.locator('button.grid').nth(4).click()
    })

    const preset = new Set(defaultPalettes[4].map((index) => rgbKey(acnl(index))))
    const result = await readSavedResult(page)

    expect(result?.colors.every((rgb) => preset.has(rgbKey(rgb)))).toBe(true)
  })

  test('色が多い画像で最大色数を15にすると、ちょうど15色を使う', async ({ page }) => {
    await page.goto('/')
    await convertImage(
      page,
      createPng(64, 64, (x, y) => [x * 4, y * 4, ((x + y) * 2) % 256])
    )

    expect((await readSavedResult(page))?.palette).toHaveLength(15)
  })

  test('設定は、新規作成でダイアログを開き直しても残っている', async ({ page }) => {
    await page.goto('/')
    await convertImage(page, quadrantPng, async () => {
      const dialog = page.getByRole('dialog')

      await dialog.getByRole('button', { name: '変換サイズ' }).click()
      await dialog.getByRole('combobox').selectOption('96x96')
      await dialog.getByRole('button', { name: '最大色数' }).click()

      const slider = dialog.getByRole('slider')

      await slider.focus()
      await slider.press('Home')
    })

    await page.getByRole('button', { name: '新規作成' }).click()

    const dialog = page.getByRole('dialog')

    await dialog.getByRole('button', { name: '変換設定' }).click()
    await dialog.getByRole('button', { name: '変換サイズ' }).click()
    await expect(dialog.getByRole('combobox')).toHaveValue('96x96')
    await dialog.getByRole('button', { name: '最大色数' }).click()
    await expect(dialog.getByRole('slider')).toHaveAttribute('aria-valuenow', '2')
  })

  test('あつまれではパレットの指定がなく、変換結果は再読み込みしてもあつまれのまま', async ({
    isMobile,
    page,
  }) => {
    await page.goto('/')
    await convertImage(page, quadrantPng, async () => {
      const dialog = page.getByRole('dialog')

      await dialog.getByRole('radio', { name: 'あつまれ' }).click()
      await expect(dialog.getByRole('button', { name: 'パレットを使用' })).toBeHidden()
    })

    await page.reload()
    await expect.poll(async () => (await readSavedResult(page))?.gameType).toBe('acnh')

    if (isMobile) return

    // あつまれのパレットでは、色を選ぶとつまみ (いろあい・あざやかさ・あかるさ) が開く
    await page.getByRole('button', { exact: true, name: '1' }).click()
    await expect(page.getByRole('tooltip')).toContainText('いろあい')
  })

  test('新規作成で別の画像を変換すると、前の結果が置き換わる', async ({ page }) => {
    await page.goto('/')
    await convertImage(page, halfPng(64))
    await page.getByRole('button', { name: '新規作成' }).click()
    await convertImage(
      page,
      createPng(32, 32, () => green)
    )

    expect((await readSavedResult(page))?.colors.map(rgbKey)).toEqual([rgbKey(green)])
  })
})
