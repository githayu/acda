'use client'

import { useAtomValue } from 'jotai'
import { useEffect } from 'react'

import {
  AtsumoriPalette,
  Footer,
  Form,
  Header,
  MinimapControls,
  Palette,
  Toolbar,
} from '@/components'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { canvasState, gameTypeState, isShowCanvasState } from '@/store'

export const App = () => {
  const isShowCanvas = useAtomValue(isShowCanvasState)
  const gameType = useAtomValue(gameTypeState)

  /** サイドバーを表示する幅か (Tailwindのmd) */
  const isDesktop = useMediaQuery('(min-width: 48rem)')
  const canvas = useAtomValue(canvasState)

  // モバイルのダイアログへ移したミニマップを、デスクトップの幅になったらサイドバーへ戻す
  useEffect(() => {
    if (isDesktop) canvas?.minimap.render('.minimap')
  }, [canvas, isDesktop])

  return (
    <div className="flex min-h-dvh flex-col gap-4">
      <Header />

      <Form />

      <div className={`mx-auto w-full max-w-240 px-4 ${isShowCanvas ? 'block' : 'hidden'}`}>
        <div className="flex flex-col justify-center gap-4 md:flex-row">
          <div className="flex max-w-full flex-col gap-2">
            <Toolbar />

            <div className="test aspect-square w-full max-w-full shrink-0 md:w-165" />
          </div>

          {/* デスクトップ用サイドバー */}
          <div className="hidden w-70 flex-col gap-4 md:flex">
            <div className="minimap size-70" />

            {/* 狭い画面ではパレットのダイアログに同じものを出すため、隠れた側のツールチップが開かないよう描画しない */}
            {isDesktop && (
              <>
                <MinimapControls />

                {gameType === 'acnl' ? <Palette /> : <AtsumoriPalette />}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
