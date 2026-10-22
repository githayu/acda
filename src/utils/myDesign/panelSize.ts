import type { GameType } from '@/store'

import type { PanelSize } from './savedData'

/** とびだせのプロデザインの形 (あつまれでは作れない) */
export const PRO_DESIGN_SIZES = ['16x16', '16x32', '32x48', '52x64']

/** 大きさを選択肢の値 (「幅x高さ」) にする */
export const toSizeValue = ({ height, width }: PanelSize) => `${width}x${height}`

/**
 * そのゲームで作れる大きさか (あつまれではとびだせのプロデザインの形を作れない)
 * MARK: isSizeAvailable
 */
export const isSizeAvailable = (gameType: GameType, size: PanelSize) =>
  gameType === 'acnl' || !PRO_DESIGN_SIZES.includes(toSizeValue(size))
