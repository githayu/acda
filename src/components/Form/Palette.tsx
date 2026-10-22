'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'

import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Switch } from '@/components/ui/switch'

import { defaultColors, defaultPalettes } from '../../store'

type PaletteProps = {
  index?: number
  onChange?: (index: number) => void
}

export const Palette: React.FC<PaletteProps> = ({ index, onChange }) => {
  const { t } = useTranslation()

  const [page, setPage] = React.useState(index !== undefined && index >= 0 ? index + 1 : 0)
  const [prevIndex, setPrevIndex] = React.useState(index)

  // indexが外部から変わったときはページを追従させる
  if (index !== prevIndex) {
    setPrevIndex(index)

    if (index !== undefined && index >= 0) setPage(index + 1)
  }

  const usePalette = React.useMemo(() => page > 0, [page])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    onChange?.(newPage - 1)
  }

  return (
    <AccordionItem value="palette">
      <AccordionTrigger>{t('dialog.パレットを使用')}</AccordionTrigger>

      <AccordionContent>
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-2">
            <Switch
              checked={usePalette}
              onCheckedChange={(checked) => handlePageChange(checked ? 1 : 0)}
            />
            <span className="text-sm">{usePalette ? 'ON' : 'OFF'}</span>
          </label>

          {usePalette && (
            <div className="grid grid-cols-4 gap-2">
              {defaultPalettes.map((paletteIndices, idx) => {
                const isSelected = page === idx + 1

                return (
                  <button
                    className={`grid grid-cols-5 gap-0.5 rounded-lg bg-muted/50 p-1 transition-all hover:scale-102 hover:bg-muted ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    }`}
                    key={paletteIndices.join()}
                    onClick={() => handlePageChange(idx + 1)}
                  >
                    {paletteIndices.map((colorIndex) => (
                      <div
                        className="aspect-square rounded-sm"
                        key={colorIndex}
                        style={{
                          backgroundColor: `#${defaultColors[colorIndex].toString(16).padStart(6, '0')}`,
                        }}
                      />
                    ))}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
