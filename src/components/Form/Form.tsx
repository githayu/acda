'use client'

import type { PercentCrop } from 'react-image-crop'

import { useAtom, useAtomValue, useSetAtom, useStore } from 'jotai'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { Crop, File, formSettingState, Settings } from '@/components/Form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  canvasState,
  gameTypeState,
  isFormOpenState,
  paletteState,
  selectIndexState,
  showGridState,
  showNumberState,
} from '@/store'
import { Canvas, clearSavedData, getSavedData } from '@/utils'

export const Form = () => {
  const { t } = useTranslation()
  const [canvas, setCanvas] = useAtom(canvasState)
  const [, setPalette] = useAtom(paletteState)
  const [settingState, setSettingState] = useAtom(formSettingState)
  const setGameType = useSetAtom(gameTypeState)
  const setSelectIndex = useSetAtom(selectIndexState)
  const [isOpen, setIsOpen] = useAtom(isFormOpenState)
  const showGrid = useAtomValue(showGridState)
  const showNumber = useAtomValue(showNumberState)
  const store = useStore()

  const [crop, setCrop] = React.useState<PercentCrop>()
  const [file, setFile] = React.useState<File>()
  const [fileUrl, setFileUrl] = React.useState<string>()

  // 切り抜きの表示に使った画像のURLは、差し替えたときと画面を離れるときに解放する
  React.useEffect(
    () => () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl)
    },
    [fileUrl]
  )
  const [tabValue, setTabValue] = React.useState('file')
  const [wasOpen, setWasOpen] = React.useState(isOpen)

  // ダイアログを開いたときは、画像を選ぶ画面から始める (変換設定は残す)
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen)

    if (isOpen) setTabValue('file')
  }

  /** マウント時に保存データがあれば自動復元 */
  React.useEffect(() => {
    const savedData = getSavedData()

    if (!savedData) {
      setIsOpen(true)
      return
    }

    const c = new Canvas({
      savedData,
      showGrid: store.get(showGridState),
      showNumber: store.get(showNumberState),
    })

    /** 変換完了時にパレットと使用色を反映 */
    const handleDone = () => {
      setPalette([...c.core.palette])
    }

    setCanvas(c)
    setGameType(savedData.gameType)
    setSettingState((prev) => ({ ...prev, gameType: savedData.gameType }))

    /** 保存データの画像が読めなければ、保存データを消して変換からやり直す */
    const handleFail = () => {
      clearSavedData()
      setCanvas(undefined)
      setIsOpen(true)
    }

    c.core.addEventListener('done', handleDone)
    c.core.addEventListener('fail', handleFail)

    c.render('.test')
    c.minimap.render('.minimap')

    return () => {
      c.core.removeEventListener('done', handleDone)
      c.core.removeEventListener('fail', handleFail)

      c.destroy()
    }
  }, [setCanvas, setGameType, setIsOpen, setPalette, setSettingState, store])

  /** トップから離れるときは、表示中のキャンバスを破棄して共有状態からも外す */
  React.useEffect(
    () => () => {
      store.get(canvasState)?.destroy()
      store.set(canvasState, undefined)
    },
    [store]
  )

  const tabItems = React.useMemo(
    () => [
      { label: t('dialog.画像ファイルから'), path: 'file' },
      { label: t('dialog.変換設定'), path: 'settings' },
    ],
    [t]
  )

  const isCrop = React.useMemo(() => tabValue === 'crop', [tabValue])

  /** 選んだ範囲で変換設定へ進む (範囲が未選択なら知らせる) */
  const handleCropDecide = () => {
    if (!crop?.width || !crop.height) {
      alert(t('alert.範囲を選択して下さい'))
      return
    }

    setTabValue('settings')
  }

  /** 範囲を選ばずに、画像全体をデザインの大きさに合わせて変換設定へ進む */
  const handleAutoResize = () => {
    setCrop(undefined)
    setTabValue('settings')
  }

  /** 選んだ画像と設定で変換する */
  const handleConvert = async () => {
    if (!file) return

    setIsOpen(false)

    canvas?.destroy()
    setSelectIndex(undefined)
    setGameType(settingState.gameType)

    const c = new Canvas({
      crop,
      file,
      gameType: settingState.gameType,
      maxColorNumber: settingState.maxColorNumber,
      paletteIndex: settingState.paletteIndex,
      panelSize: settingState.panelSize,
      showGrid,
      showNumber,
    })

    setCanvas(c)

    c.core.addEventListener('done', () => {
      setPalette([...c.core.palette])
    })

    c.core.addEventListener('fail', () => {
      alert(t('alert.指定された画像の変換はできません'))
      setIsOpen(true)
    })

    await c.render('.test')
    await c.minimap.render('.minimap')
  }

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogContent
        // 説明文はcrop時のみ表示するため、それ以外ではaria-describedbyを外す
        {...(isCrop ? {} : { 'aria-describedby': undefined })}
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
      >
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{t('dialog.変換する画像を選択')}</DialogTitle>

          {isCrop && <DialogDescription>{file?.name}</DialogDescription>}
        </DialogHeader>

        <div className="flex min-h-80 flex-1 flex-col overflow-hidden sm:flex-row">
          {/* タブ (狭い画面では上に横並び、広い画面では左に縦並び) */}
          <nav className="flex shrink-0 border-b bg-muted/30 sm:w-40 sm:flex-col sm:border-r sm:border-b-0">
            {tabItems.map(({ label, path }) => (
              <button
                className={`-mb-px flex-1 border-b-2 px-4 py-3 text-sm transition-colors sm:-mr-px sm:mb-0 sm:flex-none sm:border-r-2 sm:border-b-0 sm:text-left ${
                  tabValue === path
                    ? 'border-primary bg-background font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:bg-muted/50'
                }`}
                key={path}
                onClick={() => setTabValue(path)}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* コンテンツ */}
          <div className="flex flex-1 flex-col overflow-y-auto p-4">
            {tabValue === 'file' && (
              <File
                // 受け付けた画像があるときだけ呼ばれる (画像以外を落としても、選んでいた画像は残す)
                onDropAccepted={([file]) => {
                  setCrop(undefined)
                  setFile(file)
                  setFileUrl(URL.createObjectURL(file))
                  setTabValue('crop')
                }}
              />
            )}

            {tabValue === 'crop' && (
              <div className="flex flex-col items-center">
                <Crop
                  aspect={settingState.panelSize.width / settingState.panelSize.height}
                  onDragEnd={(crop) => setCrop(crop)}
                  url={fileUrl}
                />
              </div>
            )}

            {tabValue === 'settings' && <Settings />}
          </div>
        </div>

        <DialogFooter className="border-t bg-muted/30 px-6 py-4">
          {isCrop && (
            <>
              <Button onClick={() => setTabValue('file')} variant="ghost">
                {t('dialog.キャンセル')}
              </Button>

              <Button onClick={handleAutoResize} variant="outline">
                {t('dialog.自動リサイズ')}
              </Button>

              <Button onClick={handleCropDecide}>{t('dialog.決定')}</Button>
            </>
          )}

          {!isCrop && (
            <Button
              className="bg-primary hover:bg-primary/90"
              disabled={!file}
              onClick={handleConvert}
            >
              {t('dialog.変換')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
