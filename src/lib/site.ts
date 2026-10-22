import { Metadata } from 'next'

/** サイトの公開URL */
export const siteUrl = 'https://acnl.hayu.io'

/** シェア時のタイトル */
export const siteTitle = 'マイデザイン作成支援ツール - とびだせどうぶつの森'

/** サイトの説明 */
export const siteDescription = 'とびだせどうぶつの森用のマイデザイン作成支援ツールです。'

/** FacebookアプリID (共有ダイアログ用) */
export const facebookAppId = '133712920164211'

/** Facebookの管理者ID (fb:admins) */
export const facebookAdmins = '100005212231778'

/** 全ページ共通のOGP (ページ側でopenGraphを指定すると上書きされるため展開して使う) */
export const baseOpenGraph: NonNullable<Metadata['openGraph']> = {
  description: siteDescription,
  images: '/favicon.ico',
  siteName: 'acnl.hayu.io',
  type: 'website',
}
