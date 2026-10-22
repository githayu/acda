'use client'

import { useAtom, useAtomValue } from 'jotai'
import { Grid3x3, Hash } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  canvasState,
  gameTypeState,
  PaletteViewMode,
  paletteViewState,
  showGridState,
  showNumberState,
} from '@/store'

/**
 * キャンバスの番号と格子の表示を切り替える
 * MARK: useDisplayToggles
 */
const useDisplayToggles = () => {
  const [showNumber, setShowNumber] = useAtom(showNumberState)
  const [showGrid, setShowGrid] = useAtom(showGridState)
  const canvas = useAtomValue(canvasState)

  /** 表示する項目 ('number'・'grid') の一覧 */
  const value = [showNumber && 'number', showGrid && 'grid'].filter((item) => item !== false)

  /** 表示する項目の一覧を受け取り、キャンバスに反映する */
  const handleValueChange = (values: string[]) => {
    const nextNumber = values.includes('number')
    const nextGrid = values.includes('grid')

    setShowNumber(nextNumber)
    setShowGrid(nextGrid)

    if (!canvas) return

    // eslint-disable-next-line react-hooks/immutability
    canvas.showNumber = nextNumber
    canvas.showGrid = nextGrid
    canvas.drawCanvas()
    canvas.drawGrid()
    canvas.app?.render()
  }

  return { handleValueChange, value }
}

/**
 * 番号と格子の切り替え (variant='toolbar'はモバイルのツールバー用のアイコン表示)
 * MARK: DisplayToggles
 */
export const DisplayToggles = ({ variant = 'default' }: { variant?: 'default' | 'toolbar' }) => {
  const { t } = useTranslation()
  const { handleValueChange, value } = useDisplayToggles()

  if (variant === 'toolbar') {
    const itemClassName =
      'text-white hover:bg-white/20 hover:text-white data-[state=on]:bg-white/30 data-[state=on]:text-white'

    return (
      <ToggleGroup onValueChange={handleValueChange} type="multiple" value={value}>
        <ToggleGroupItem aria-label={t('view.番号')} className={itemClassName} value="number">
          <Hash className="size-5" />
        </ToggleGroupItem>

        <ToggleGroupItem aria-label={t('view.格子')} className={itemClassName} value="grid">
          <Grid3x3 className="size-5" />
        </ToggleGroupItem>
      </ToggleGroup>
    )
  }

  return (
    <ToggleGroup className="w-full" onValueChange={handleValueChange} type="multiple" value={value}>
      <ToggleGroupItem className="flex-1" value="number">
        {t('view.番号')}
      </ToggleGroupItem>

      <ToggleGroupItem className="flex-1" value="grid">
        {t('view.格子')}
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

/**
 * とびだせのパレットの表示 (全色・15色) の切り替え
 * MARK: PaletteViewToggle
 */
export const PaletteViewToggle = () => {
  const { t } = useTranslation()
  const gameType = useAtomValue(gameTypeState)
  const [paletteView, setPaletteView] = useAtom(paletteViewState)

  const handlePaletteViewChange = (value: string) => {
    if (value) setPaletteView(value as PaletteViewMode)
  }

  if (gameType !== 'acnl') return null

  return (
    <ToggleGroup
      className="w-full"
      onValueChange={handlePaletteViewChange}
      type="single"
      value={paletteView}
    >
      <ToggleGroupItem className="flex-1" value="fixed">
        {t('view.全色')}
      </ToggleGroupItem>

      <ToggleGroupItem className="flex-1" value="selected">
        {t('view.15色')}
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

/**
 * デスクトップのミニマップの下に表示する切り替え (番号・格子・パレットの表示)
 * MARK: MinimapControls
 */
export const MinimapControls = () => {
  const gameType = useAtomValue(gameTypeState)

  return (
    <div className={`flex w-full gap-2 ${gameType === 'acnl' ? 'flex-row' : 'flex-col'}`}>
      <DisplayToggles />

      <PaletteViewToggle />
    </div>
  )
}
