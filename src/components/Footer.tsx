'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LANGUAGE_STORAGE_KEY } from '@/i18n'
import { facebookAppId, siteTitle, siteUrl } from '@/lib/site'

/** シェア先ごとの共有URL */
const shareLinks = [
  {
    href: `https://x.com/intent/tweet?${new URLSearchParams({ text: siteTitle, url: siteUrl })}`,
    label: 'X',
  },
  {
    href: `https://www.facebook.com/dialog/share?${new URLSearchParams({ app_id: facebookAppId, display: 'page', href: siteUrl })}`,
    label: 'Facebook',
  },
  {
    href: `https://social-plugins.line.me/lineit/share?${new URLSearchParams({ url: siteUrl })}`,
    label: 'LINE',
  },
  {
    href: `https://b.hatena.ne.jp/entry/panel/?${new URLSearchParams({ url: siteUrl })}`,
    label: 'B!',
  },
]

/** 著作権表示の年 */
const copyrightYear = new Date().getFullYear()

export const Footer = () => {
  const { i18n, t } = useTranslation()

  const handleLanguageChange = (value: string) => {
    if (!value) return

    i18n?.changeLanguage(value, () => localStorage.setItem(LANGUAGE_STORAGE_KEY, value))
  }

  return (
    <footer className="mx-auto mt-auto w-full max-w-3xl p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav className="flex items-center gap-4 text-sm">
            <Link className="hover:underline" href="/about">
              About
            </Link>
          </nav>

          <ul className="ml-auto flex flex-wrap items-center justify-end gap-2">
            {shareLinks.map(({ href, label }) => (
              <li key={label}>
                <Button asChild size="sm" variant="outline">
                  <a href={href} rel="noopener noreferrer" target="_blank">
                    {label}
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </div>

        {/* 狭い画面では、著作権表示を言語の選択の下 (最下部) の中央に置く */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Select
              name="language"
              onValueChange={handleLanguageChange}
              value={i18n?.language ?? ''}
            >
              <SelectTrigger className="w-30" size="sm">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {Object.keys(i18n.services.resourceStore.data).map((lang, idx) => {
                  let label = '日本語'

                  switch (lang) {
                    case 'en':
                      label = 'English'
                      break
                  }

                  return (
                    <SelectItem key={[idx, lang].join()} value={lang}>
                      {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

            {t('app.翻訳者') && <p className="text-xs text-muted-foreground">{t('app.翻訳者')}</p>}
          </div>

          <small className="self-center text-muted-foreground sm:self-auto">
            © 2012-{copyrightYear}{' '}
            <a
              className="hover:underline"
              href="https://hayu.io"
              rel="noopener noreferrer"
              target="_blank"
            >
              hayu.io
            </a>
          </small>
        </div>
      </div>
    </footer>
  )
}
