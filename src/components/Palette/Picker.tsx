'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'

import {
  HsvSteps,
  HUE_STEPS,
  SATURATION_STEPS,
  stepsToRgb,
  VALUE_STEPS,
} from '@/utils/myDesign/HSV'

type PickerProps = {
  onChange?: (steps: HsvSteps) => void
  steps?: HsvSteps
}

/** 段階数ぶんの位置 (0始まり) */
const range = (length: number) => Array.from({ length }, (_, i) => i)

/** つまみの位置をCSSの色にする */
const toCssColor = (steps: HsvSteps) => `rgb(${stepsToRgb(steps).join(',')})`

/** 選択中の位置を示す三角形 */
const Marker = () => (
  <span
    className="absolute top-1/2 left-1/2 -translate-1/2"
    style={{
      borderColor: '#fff transparent transparent transparent',
      borderStyle: 'solid',
      borderWidth: '6px 4px 0 4px',
      filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5))',
    }}
  />
)

/**
 * ACNHの色指定 (いろあい・あざやかさ・あかるさ) のつまみを表示する
 * MARK: Picker
 */
export const Picker: React.FC<PickerProps> = (props) => {
  const { t } = useTranslation()
  const [state, setState] = React.useState<HsvSteps>(
    props.steps ?? { hue: 0, saturation: 7, value: 7 }
  )

  const [prevSteps, setPrevSteps] = React.useState(props.steps)

  // 外部から位置が変わったときは表示中の値を追従させる
  if (props.steps !== prevSteps) {
    setPrevSteps(props.steps)

    if (props.steps) setState(props.steps)
  }

  const updateState = (newState: Partial<HsvSteps>) => {
    setState((prev) => {
      const updated = { ...prev, ...newState }

      props.onChange?.(updated)

      return updated
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] whitespace-nowrap text-white">{t('view.いろあい')}</span>

        <div className="flex flex-row">
          {range(HUE_STEPS).map((hue) => (
            <button
              className="relative h-[18px] w-[9px] min-w-0 cursor-pointer border-none p-0 hover:opacity-80"
              key={hue}
              onClick={() => updateState({ hue })}
              style={{ backgroundColor: toCssColor({ hue, saturation: 14, value: 14 }) }}
            >
              {hue === state.hue && <Marker />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] whitespace-nowrap text-white">{t('view.あざやかさ')}</span>

        <div className="flex flex-row">
          {range(SATURATION_STEPS).map((saturation) => (
            <button
              className="relative size-[18px] min-w-0 cursor-pointer border-none p-0 hover:opacity-80"
              key={saturation}
              onClick={() => updateState({ saturation })}
              style={{ backgroundColor: toCssColor({ ...state, saturation }) }}
            >
              {saturation === state.saturation && <Marker />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] whitespace-nowrap text-white">{t('view.あかるさ')}</span>

        <div className="flex flex-row">
          {range(VALUE_STEPS).map((value) => (
            <button
              className="relative size-[18px] min-w-0 cursor-pointer border-none p-0 hover:opacity-80"
              key={value}
              onClick={() => updateState({ value })}
              style={{ backgroundColor: toCssColor({ ...state, value }) }}
            >
              {value === state.value && <Marker />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
