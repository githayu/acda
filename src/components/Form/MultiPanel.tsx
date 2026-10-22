'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Rnd } from 'react-rnd'

import type { PanelSize } from '@/utils/myDesign/savedData'

import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { GameType } from '@/store'
import { PRO_DESIGN_SIZES, toSizeValue } from '@/utils/myDesign/panelSize'

export type Design = {
  hidden?: boolean
  label: string
  options: {
    label: string
    value: string
  }[]
}

export type MultiPanelProps = {
  /** あつまれではプロデザインの形 (とびだせ専用) を出さない */
  gameType?: GameType
  height?: number
  onChange?: (size: PanelSize) => void
  width?: number
}

export const MultiPanel: React.FC<MultiPanelProps> = (props) => {
  const { t } = useTranslation()

  const [isCustom, setIsCustom] = React.useState(false)

  const sizes = React.useMemo<Design[]>(
    () => [
      {
        label: t('dialog.マイデザイン'),
        options: [
          { label: t('dialog.1枚'), value: '32x32' },
          { label: t('dialog.縦横2枚'), value: '64x64' },
          { label: t('dialog.縦横3枚'), value: '96x96' },
        ],
      },
      {
        hidden: props.gameType === 'acnh',
        label: t('dialog.Proデザイン'),
        options: [
          { label: t('dialog.シャツ・ワンピース - 半袖/袖'), value: PRO_DESIGN_SIZES[0] },
          { label: t('dialog.シャツ・ワンピース - 長袖/袖'), value: PRO_DESIGN_SIZES[1] },
          { label: t('dialog.ワンピース - ノースリーブ'), value: PRO_DESIGN_SIZES[2] },
          { label: t('dialog.顔出し看板'), value: PRO_DESIGN_SIZES[3] },
        ],
      },
      {
        label: t('dialog.その他'),
        options: [{ label: t('dialog.任意サイズ'), value: 'custom' }],
      },
    ],
    [props.gameType, t]
  )

  const current = toSizeValue({ height: props.height ?? 32, width: props.width ?? 32 })
  const visibleSizes = sizes.filter(({ hidden }) => !hidden)
  const isPreset = visibleSizes.some(({ options }) =>
    options.some(({ value }) => value === current)
  )
  const size = isCustom || !isPreset ? 'custom' : current

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsCustom(e.target.value === 'custom')

    if (e.target.value === 'custom') return

    const [width, height] = e.target.value.split('x').map((n) => Number(n))

    props.onChange?.({ height, width })
  }

  return (
    <AccordionItem value="panel-size">
      <AccordionTrigger>{t('dialog.変換サイズ')}</AccordionTrigger>

      <AccordionContent>
        <div className="flex flex-col gap-4">
          <select
            className="w-full rounded border bg-background px-3 py-2 text-sm"
            onChange={handleSizeChange}
            value={size}
          >
            {visibleSizes.map((size) => (
              <optgroup key={size.label} label={size.label}>
                {size.options.map((option) => {
                  const label =
                    option.value === 'custom' ? option.label : `${option.label} (${option.value})`

                  return (
                    <option key={option.value} value={option.value}>
                      {label}
                    </option>
                  )
                })}
              </optgroup>
            ))}
          </select>

          {size === 'custom' && (
            <div
              style={{
                backgroundImage:
                  'linear-gradient(#9ca3af 1px, transparent 0), linear-gradient(90deg, #9ca3af 1px, transparent 0)',
                backgroundSize: '32px 32px',
                boxShadow: '-1px -1px 0 #9ca3af inset',
                height: 'calc(32px * 5)',
                width: 'calc(32px * 5)',
              }}
            >
              <Rnd
                bounds="parent"
                default={{
                  height: props.height ?? 32,
                  width: props.width ?? 32,
                  x: 64,
                  y: 64,
                }}
                dragGrid={[32, 32]}
                minHeight={32}
                minWidth={32}
                onResizeStop={(_, __, ref) => {
                  props.onChange?.({
                    height: ref.clientHeight,
                    width: ref.clientWidth,
                  })
                }}
                resizeGrid={[32, 32]}
                style={{ backgroundColor: '#171717' }}
              />
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
