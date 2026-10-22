'use client'

import { useAtom } from 'jotai'
import React from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { canvasState, paletteState, selectIndexState } from '@/store'
import { HSVPalette } from '@/utils'

import { Picker } from './Picker'

export const AtsumoriPalette = () => {
  const [palette] = useAtom(paletteState)
  const [canvas] = useAtom(canvasState)
  const [selectIndex, setSelectIndex] = useAtom(selectIndexState)

  /** ホバー (フォーカス) でツールチップを開いている色のインデックス */
  const [hoverIndex, setHoverIndex] = React.useState<number>()

  const handleClick = (paletteIndex: number) => {
    const newIndex = selectIndex === paletteIndex ? undefined : paletteIndex

    setSelectIndex(newIndex)
    canvas?.selectColor(newIndex)
    canvas?.app?.render()
  }

  /** ツールチップの開閉 (閉じるのは自分が開いていた場合のみ) */
  const handleOpenChange = (paletteIndex: number, open: boolean) => {
    setHoverIndex((prev) => (open ? paletteIndex : prev === paletteIndex ? undefined : prev))
  }

  return (
    <div className="grid w-fit grid-cols-5 justify-center gap-0.5">
      {palette.map(([r, g, b], index) => {
        const steps = HSVPalette.findSteps([r, g, b])
        const isSelected = selectIndex === index

        return (
          <Tooltip
            // パレットは位置で色を識別し同じ色が重複し得るため、インデックスをkeyにする
            // eslint-disable-next-line @eslint-react/no-array-index-key
            key={index}
            onOpenChange={(open) => handleOpenChange(index, open)}
            open={isSelected || hoverIndex === index}
          >
            <TooltipTrigger asChild>
              <button
                className="flex size-9 cursor-pointer items-center justify-center rounded-md border-none text-xs font-bold text-white hover:opacity-80"
                onClick={() => handleClick(index)}
                style={{
                  backgroundColor: `rgb(${r},${g},${b})`,
                  boxShadow: isSelected ? '0 0 0 2px #fff, 0 0 0 4px #000' : 'none',
                  textShadow: '0 0 2px #000, 0 0 4px #000',
                }}
              >
                {index + 1}
              </button>
            </TooltipTrigger>

            <TooltipContent align="start" className="max-w-none px-1 pt-2.5 pb-1" side="bottom">
              <Picker steps={steps} />
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
