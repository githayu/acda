## プロジェクト概要

とびだせどうぶつの森 (ACNL) とあつまれどうぶつの森 (ACNH) のマイデザイン作成支援ツール。画像をゲームで使える色に減色し、マス目ごとの色番号の設計図として表示する。処理はすべてブラウザ内で行い、静的に書き出して Firebase Hosting で配信する。

## 開発コマンド

```bash
pnpm dev             # 開発サーバー (Turbopack)
pnpm build           # 静的書き出し (out/)
pnpm preview         # Firebase Hosting エミュレーターで out/ を配信
pnpm deploy:hosting  # 書き出して Firebase Hosting にデプロイ
pnpm lint            # ESLint (自動修正あり)
pnpm test            # 単体テスト (Vitest)
pnpm e2e             # E2E テスト (Playwright。ビルドしてエミュレーター上で実行)
E2E_BASE_URL=https://acnl-hayu-io.web.app pnpm e2e  # デプロイした本番の環境に対して実行
```

型チェックは `pnpm exec tsc --noEmit` (TypeScript 7)。

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router、`output: 'export'` の静的書き出し)
- **言語**: TypeScript 7 (`typescript` は `@typescript/typescript6` のエイリアス、`tsc` は `@typescript/native`)
- **状態管理**: jotai
- **UI**: shadcn/ui (Radix UI) + Tailwind CSS v4
- **描画**: Pixi.js v8
- **国際化**: i18next / react-i18next (日本語・英語)
- **テスト**: Vitest (単体)、Playwright (E2E)
- **配信**: Firebase Hosting (プロジェクト `acnl-hayu-io`)

## ディレクトリ構造

```
src/
├── app/                 # ページ (/、/about) とレイアウト
├── components/          # UI
│   ├── Form/            # 変換ダイアログ (画像の選択・切り抜き・変換設定)
│   ├── Palette/         # パレット (とびだせ: Palette、あつまれ: Atsumori・Picker)
│   ├── Toolbar/         # モバイル用のツールバー
│   └── ui/              # shadcn/ui の部品 (lint 対象外)
├── lib/                 # サイト情報・汎用フック
├── locales/             # 翻訳 (ja、en)
├── store/               # jotai の atom と ACNL の色テーブル
└── utils/myDesign/      # 変換・描画のロジック
    ├── Canvas.ts        # 変換 (Converter)・ミニマップ・メインのキャンバス
    ├── color.ts         # 色の変換、使える色の決め方、切り抜き範囲
    ├── quantize.ts      # 減色 (メディアンカット、透明の扱い)
    ├── HSV.ts           # ACNH の色指定の段階と RGB の対応
    ├── viewport.ts      # ミニマップの拡大・縮小と移動
    ├── panelSize.ts     # デザインの大きさ
    └── savedData.ts     # localStorage の保存データ
e2e/                     # Playwright の E2E テスト
.docs/                   # 計画書と調査結果
```

## 実装の注意点

- **ゲームの値**: ACNL の色テーブルはゲームの画面から取った値、ACNH の色の段階はゲームのつまみの段階 (いろあい30・あざやかさ15・あかるさ15) に合わせている。プリセットのパレットは旧版と同じ位置の色を指す (`src/store/colors.test.ts` で検証)。
- **減色**: 1デザインは最大15色。透明度が半分未満の画素はゲームの透明 (画素値15) として扱う。複数枚のデザインも全体で1つのパレットにする (1枚ずつ分けるとつなぎ目が目立つため)。
- **ロジックはテストできる形で切り出す**: DOM や Pixi.js に依存しない純粋関数を `utils/myDesign/` に置き、単体テストを付ける。
- **E2E は機能を確かめる**: 見た目ではなく、操作の結果を確かめる。メインのキャンバスは WebGL なので、撮影した PNG をマスごとに読んで確かめる (`e2e/canvas.ts`)。変換結果は localStorage の保存データを画素に戻して確かめる (`e2e/helpers.ts`)。
- **キャンバスの破棄**: `Canvas.destroy()` を使う (二重に呼んでもよい)。破棄したあとは、変換中の画像の読み込みが終わってもイベントを出さない。
- **静的書き出し**: サーバーの機能 (Route Handler、cookies、画像最適化など) は使えない。`localStorage` などブラウザの API は、マウントしたあとに読む。
