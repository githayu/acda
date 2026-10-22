'use client'

import Image from 'next/image'
import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/** 使い方の各手順に対応するスクリーンショット */
const usageImages = [
  { height: 267, src: '/images/about/about_001.png', width: 489 },
  { height: 357, src: '/images/about/about_003.png', width: 500 },
  { height: 313, src: '/images/about/about_004.png', width: 500 },
  { height: 350, src: '/images/about/about_005.png', width: 500 },
]

/**
 * 使い方・ヒント・免責事項
 * MARK: About
 */
export const About = () => {
  const { t } = useTranslation()

  const usageContents = t<'usage.contents', { returnObjects: true }, string[][]>('usage.contents', {
    returnObjects: true,
  })

  const hintsContents = t<'hintsAndTips.contents', { returnObjects: true }, string[]>(
    'hintsAndTips.contents',
    { returnObjects: true }
  )

  const disclaimerContents = t<'disclaimer.contents', { returnObjects: true }, string[]>(
    'disclaimer.contents',
    { returnObjects: true }
  )

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('usage.使い方')}</CardTitle>
        </CardHeader>

        <CardContent>
          <ol className="flex flex-col gap-6">
            {usageImages.map((image, index) => (
              <li className="flex items-start gap-3" key={image.src}>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </span>

                <div className="flex min-w-0 flex-col gap-3">
                  <Image
                    alt={`${index + 1}`}
                    className="h-auto max-w-full rounded ring-1 ring-border"
                    height={image.height}
                    loading="eager"
                    src={image.src}
                    width={image.width}
                  />

                  <div className="flex flex-col gap-1 text-sm leading-relaxed">
                    {(usageContents[index] ?? []).map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('hintsAndTips.変換のヒント・概要')}</CardTitle>
        </CardHeader>

        <CardContent>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed">
            {hintsContents.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('disclaimer.免責事項')}</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-1 text-sm leading-relaxed">
          {disclaimerContents.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
