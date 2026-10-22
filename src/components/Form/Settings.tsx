'use client'

import { atom, useAtom } from 'jotai'
import { useTranslation } from 'react-i18next'

import type { PanelSize } from '@/utils/myDesign/savedData'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { GameType } from '@/store'
import { isSizeAvailable } from '@/utils/myDesign/panelSize'

import { MultiPanel, Palette } from '.'

export type SettingsState = {
  /** 変換に使うゲーム (表示中の結果のゲームとは別に持ち、変換したときに反映する) */
  gameType: GameType
  maxColorNumber: number
  paletteIndex: number
  panelSize: PanelSize
}

export const formSettingState = atom<SettingsState>({
  gameType: 'acnl',
  maxColorNumber: 15,
  paletteIndex: -1,
  panelSize: { height: 32, width: 32 },
})

export const Settings = () => {
  const { t } = useTranslation()

  const [state, setState] = useAtom(formSettingState)
  const { gameType } = state

  /** ゲームを切り替える (そのゲームで作れない大きさなら1枚に戻す) */
  const handleGameTypeChange = (value: string) => {
    if (value !== 'acnl' && value !== 'acnh') return

    setState((prev) => ({
      ...prev,
      gameType: value,
      panelSize: isSizeAvailable(value, prev.panelSize)
        ? prev.panelSize
        : { height: 32, width: 32 },
    }))
  }

  return (
    <div className="flex flex-col gap-4 px-2">
      <div className="flex flex-row items-center gap-4">
        <span className="text-sm font-medium">{t('dialog.ゲーム選択')}</span>

        <ToggleGroup onValueChange={handleGameTypeChange} type="single" value={gameType}>
          <ToggleGroupItem className="px-4" value="acnl">
            {t('view.とびだせ')}
          </ToggleGroupItem>

          <ToggleGroupItem className="px-4" value="acnh">
            {t('view.あつまれ')}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Accordion collapsible type="single">
        {gameType === 'acnl' && (
          <Palette
            index={state.paletteIndex}
            onChange={(paletteIndex) => setState((prev) => ({ ...prev, paletteIndex }))}
          />
        )}

        <MultiPanel
          gameType={gameType}
          height={state.panelSize.height}
          onChange={(panelSize) => setState((v) => ({ ...v, panelSize }))}
          width={state.panelSize.width}
        />

        <AccordionItem value="max-colors">
          <AccordionTrigger>{t('dialog.最大色数')}</AccordionTrigger>

          <AccordionContent>
            <div className="flex items-center gap-4 pt-2">
              <Slider
                className="flex-1"
                max={15}
                min={2}
                onValueChange={([value]) =>
                  setState((v) => ({
                    ...v,
                    maxColorNumber: value,
                  }))
                }
                step={1}
                value={[state.maxColorNumber]}
              />

              <span className="w-8 text-center text-sm font-bold">{state.maxColorNumber}</span>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
