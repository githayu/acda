import { GoogleAnalytics } from '@next/third-parties/google'
import { Metadata, Viewport } from 'next'
import { Inter, LINE_Seed_JP } from 'next/font/google'
import { ReactNode } from 'react'

import {
  baseOpenGraph,
  facebookAdmins,
  gaMeasurementId,
  siteDescription,
  siteTitle,
  siteUrl,
} from '@/lib/site'

import { Providers } from './providers'
import './globals.css'

/** 本番用のビルドだけで計測する (開発やE2Eのアクセスを計測しない) */
const isAnalyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'

/** 英数字のフォント */
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

/** 日本語のフォント (文字数が多いため事前読み込みはせず、代替フォントの寸法データもないため調整しない) */
const lineSeedJp = LINE_Seed_JP({
  adjustFontFallback: false,
  preload: false,
  variable: '--font-line-seed-jp',
  weight: ['400', '700', '800'],
})

export const metadata: Metadata = {
  authors: [{ name: 'Hayu' }],
  description: siteDescription,
  facebook: {
    admins: facebookAdmins,
  },
  keywords: [
    'とびだせどうぶつの森',
    'マイデザイン',
    'マイデザインツール',
    'ツール',
    'ジェネレーター',
    'Animal Crossing',
    'New Leaf',
    'Custom Design Assistant',
  ],
  metadataBase: new URL(siteUrl),
  openGraph: {
    ...baseOpenGraph,
    title: siteTitle,
    url: '/',
  },
  title: siteTitle,
}

export const viewport: Viewport = {
  initialScale: 1,
  width: 'device-width',
}

type RootLayoutProps = {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      className={`${inter.variable} ${lineSeedJp.variable}`}
      itemScope
      itemType="http://schema.org/Other"
      lang="ja"
    >
      <head>
        <meta content={siteTitle} itemProp="name" />
        <meta content={siteDescription} itemProp="description" />
        <meta content={`${siteUrl}/favicon.ico`} itemProp="image" />
      </head>

      <body>
        <Providers>{children}</Providers>
      </body>

      {isAnalyticsEnabled && <GoogleAnalytics gaId={gaMeasurementId} />}
    </html>
  )
}
