/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Firebase Hostingでは画像最適化サーバーがないため、元画像をそのまま配信する */
  images: {
    unoptimized: true,
  },
  /** Firebase Hostingで配信するため静的ファイルとして書き出す */
  output: 'export',
  reactStrictMode: true,
}

export default nextConfig
