'use client'

import { useAtom } from 'jotai'
import { chunk } from 'lodash-es'
import { Pipette } from 'lucide-react'
import React from 'react'

import {
  canvasState,
  defaultColors,
  defaultPalettes,
  paletteState,
  paletteViewState,
  selectIndexState,
} from '@/store'

/** パレットの色の1マス */
type ColorCellProps = {
  className: string
  color: [number, number, number]
  isSelected: boolean
  /** パレットの番号 (1始まり、パレットにない色はundefined) */
  number?: number
  onClick?: () => void
}

/**
 * パレットの色の1マス (選んだ色には、旧版と同じく右上にスポイトを表示する)
 * MARK: ColorCell
 */
const ColorCell = ({
  className,
  color: [r, g, b],
  isSelected,
  number,
  onClick,
}: ColorCellProps) => (
  <button
    aria-pressed={number === undefined ? undefined : isSelected}
    // 選んだマスは前面に出し、枠とスポイトが隣のマスに隠れないようにする (hover時の不透明度で重なりが閉じても見える)
    className={`relative flex cursor-pointer items-center justify-center border-none font-bold text-white hover:opacity-80 ${isSelected ? 'z-10' : ''} ${className}`}
    onClick={onClick}
    style={{
      backgroundColor: `rgb(${r},${g},${b})`,
      boxShadow: isSelected ? '0 0 0 2px #fff, 0 0 0 4px #000' : 'none',
      cursor: number === undefined ? 'default' : 'pointer',
      textShadow: '0 0 2px #000, 0 0 4px #000',
    }}
  >
    {number}

    {isSelected && (
      <Pipette
        aria-hidden
        className="pointer-events-none absolute -top-4 -right-4 size-5 text-black filter-[drop-shadow(0_0_1px_#fff)_drop-shadow(0_0_1px_#fff)]"
      />
    )}
  </button>
)

export const Palette = () => {
  const [palette] = useAtom(paletteState)
  const [canvas] = useAtom(canvasState)
  const [selectIndex, setSelectIndex] = useAtom(selectIndexState)
  const [paletteView] = useAtom(paletteViewState)

  /** paletteのRGB配列をHEX値のMapに変換 (HEX -> インデックス) */
  const paletteHexMap = new Map<number, number>()

  palette.forEach(([r, g, b], index) => {
    const hex = (r << 16) | (g << 8) | b
    paletteHexMap.set(hex, index)
  })

  const colors = React.useMemo(() => {
    const mainColors = chunk(defaultColors, 16).map((values) => {
      return values.slice(0, 9).map((hex) => {
        const r = hex >> 16
        const g = (hex >> 8) & 0xff
        const b = hex & 0xff

        return { b, g, hex, r }
      })
    })

    const darkColors = defaultPalettes[defaultPalettes.length - 1].map((index) => {
      const hex = defaultColors[index]
      const r = hex >> 16
      const g = (hex >> 8) & 0xff
      const b = hex & 0xff

      return { b, g, hex, r }
    })

    return { dark: darkColors, main: mainColors }
  }, [])

  const handleClick = (paletteIndex: number) => {
    const newIndex = selectIndex === paletteIndex ? undefined : paletteIndex

    setSelectIndex(newIndex)
    canvas?.selectColor(newIndex)
    canvas?.app?.render()
  }

  // 選択15色モード (ゲームのデザイン画面と同じく3列×5行で、番号は左上から横に並べる)
  if (paletteView === 'selected') {
    return (
      <div className="grid w-fit grid-cols-3 justify-center gap-0.5">
        {palette.map(([r, g, b], index) => {
          const isSelected = selectIndex === index

          return (
            <ColorCell
              className="size-9 rounded-md text-xs"
              color={[r, g, b]}
              isSelected={isSelected}
              // パレットは位置で色を識別し同じ色が重複し得るため、インデックスをkeyにする
              // eslint-disable-next-line @eslint-react/no-array-index-key
              key={index}
              number={index + 1}
              onClick={() => handleClick(index)}
            />
          )
        })}
      </div>
    )
  }

  // 256色固定パレットモード
  return (
    <div className="grid w-70 grid-cols-4 gap-1">
      {colors.main.map((groups) => {
        const centerColor = groups[4]
        const backgroundColor = `rgb(${centerColor.r}, ${centerColor.g}, ${centerColor.b})`

        return (
          <div
            className="grid grid-cols-3 rounded-md p-0.5"
            key={centerColor.hex}
            style={{ backgroundColor }}
          >
            {groups.map((color) => {
              const paletteIndex = paletteHexMap.get(color.hex)
              const hasPaletteIndex = paletteIndex !== undefined
              const isSelected = hasPaletteIndex && selectIndex === paletteIndex

              return (
                <ColorCell
                  className="aspect-square w-full text-[10px]"
                  color={[color.r, color.g, color.b]}
                  isSelected={isSelected}
                  key={color.hex}
                  number={hasPaletteIndex ? paletteIndex + 1 : undefined}
                  onClick={() => hasPaletteIndex && handleClick(paletteIndex)}
                />
              )
            })}
          </div>
        )
      })}

      <div
        className="col-span-4 grid grid-cols-[repeat(15,1fr)] rounded-md p-0.5"
        style={{
          backgroundColor: `rgb(${colors.dark[4].r}, ${colors.dark[4].g}, ${colors.dark[4].b})`,
        }}
      >
        {colors.dark.map((color) => {
          const paletteIndex = paletteHexMap.get(color.hex)
          const hasPaletteIndex = paletteIndex !== undefined
          const isSelected = hasPaletteIndex && selectIndex === paletteIndex

          return (
            <ColorCell
              className="aspect-square w-full text-[10px]"
              color={[color.r, color.g, color.b]}
              isSelected={isSelected}
              key={color.hex}
              number={hasPaletteIndex ? paletteIndex + 1 : undefined}
              onClick={() => hasPaletteIndex && handleClick(paletteIndex)}
            />
          )
        })}
      </div>
    </div>
  )
}
