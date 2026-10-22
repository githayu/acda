'use client'

import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { FilePlus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  canvasState,
  isFormOpenState,
  isShowCanvasState,
  paletteState,
  selectIndexState,
} from '@/store'
import { clearSavedData } from '@/utils'

export const Header = () => {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const setIsFormOpen = useSetAtom(isFormOpenState)
  const [canvas, setCanvas] = useAtom(canvasState)
  const setPalette = useSetAtom(paletteState)
  const setSelectIndex = useSetAtom(selectIndexState)
  const isShowCanvas = useAtomValue(isShowCanvasState)

  /** 変換ダイアログを開く (トップ以外ではトップへ移動してから開く) */
  const handleCreate = () => {
    setIsFormOpen(true)

    if (pathname !== '/') router.push('/')
  }

  /** 保存した変換結果を消して、変換からやり直す */
  const handleClear = () => {
    canvas?.destroy()
    clearSavedData()
    setCanvas(undefined)
    setPalette([])
    setSelectIndex(undefined)

    handleCreate()
  }

  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex items-center gap-2 py-2 sm:gap-4">
          <h1 className="min-w-0 grow text-lg font-bold sm:text-xl">
            <Link href="/">{t('app.どうぶつの森 マイデザイン作成支援ツール')}</Link>
          </h1>

          {/* 狭い画面ではタイトルが1行に収まるよう、ボタンはアイコンだけにする */}
          <Button
            aria-label={t('app.新規作成')}
            onClick={handleCreate}
            size="sm"
            title={t('app.既存のデータは削除されます')}
            variant="outline"
          >
            <FilePlus className="sm:hidden" />
            <span className="hidden sm:inline">{t('app.新規作成')}</span>
          </Button>

          {isShowCanvas && (
            <Button aria-label={t('app.消去')} onClick={handleClear} size="sm" variant="outline">
              <Trash2 className="sm:hidden" />
              <span className="hidden sm:inline">{t('app.消去')}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
