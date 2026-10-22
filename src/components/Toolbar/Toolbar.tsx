'use client'

import { useAtomValue } from 'jotai'
import { Map, Palette as PaletteIcon } from 'lucide-react'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { AtsumoriPalette, DisplayToggles, Palette, PaletteViewToggle } from '@/components'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { canvasState, gameTypeState } from '@/store'

export const Toolbar = () => {
  const { t } = useTranslation()
  const canvas = useAtomValue(canvasState)
  const gameType = useAtomValue(gameTypeState)
  const [minimapOpen, setMinimapOpen] = React.useState(false)
  const [paletteOpen, setPaletteOpen] = React.useState(false)

  /** ダイアログが開いた時にminimapをレンダリング */
  React.useEffect(() => {
    if (!minimapOpen || !canvas) return

    const timer = setTimeout(() => {
      canvas.minimap.render('.minimap-mobile')
    }, 100)

    return () => clearTimeout(timer)
  }, [minimapOpen, canvas])

  return (
    <>
      <div className="flex w-fit gap-1 self-end rounded-lg bg-black/60 p-1 md:hidden">
        <DisplayToggles variant="toolbar" />

        <Button
          aria-label={t('view.ミニマップを開く')}
          className="text-white hover:bg-white/20"
          onClick={() => setMinimapOpen(true)}
          size="icon"
          variant="ghost"
        >
          <Map className="size-5" />
        </Button>

        <Button
          aria-label={t('view.パレットを開く')}
          className="text-white hover:bg-white/20"
          onClick={() => setPaletteOpen(true)}
          size="icon"
          variant="ghost"
        >
          <PaletteIcon className="size-5" />
        </Button>
      </div>

      <Dialog onOpenChange={setMinimapOpen} open={minimapOpen}>
        <DialogContent className="w-auto max-w-none">
          <DialogTitle className="sr-only">{t('view.ミニマップ')}</DialogTitle>

          <div className="flex justify-center p-4">
            <div className="minimap-mobile size-70" />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setPaletteOpen} open={paletteOpen}>
        <DialogContent className="w-auto max-w-none">
          <DialogTitle className="sr-only">{t('view.パレット')}</DialogTitle>

          <div className="mx-auto mt-6 flex w-70 flex-col items-center gap-4">
            <PaletteViewToggle />

            {gameType === 'acnl' ? <Palette /> : <AtsumoriPalette />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
