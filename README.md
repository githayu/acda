# どうぶつの森 マイデザイン作成支援ツール

[https://acnl.hayu.io](https://acnl.hayu.io)

画像をとびだせどうぶつの森・あつまれどうぶつの森で使える色に減色し、マス目ごとの色番号の設計図として表示するツールです。

大半は高校の頃に作ったWebサービスなので、あまり参考にしないでね。

## 移行について

2026/10/22にPHP (Google App Engine) で動かしていた旧版から、Next.js の静的サイトに移行しました。変換はすべてブラウザ内で行い、Firebase Hosting で配信しています。

- 画像をサーバーへアップロードしなくなりました
- あつまれどうぶつの森のマイデザインに対応しました
- 色のデータと減色の方法を、ゲームの仕様に合わせて見直しました

## 開発

```bash
pnpm install
pnpm dev             # 開発サーバー
pnpm build           # 静的書き出し (out/)
pnpm test            # 単体テスト
pnpm e2e             # E2E テスト
pnpm deploy:hosting  # Firebase Hosting へデプロイ
```
