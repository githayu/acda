'use client'

import { DropzoneProps, ErrorCode, FileRejection, useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'

type FileProps = DropzoneProps

/** 受け付けるファイルの大きさの上限 (明らかに巨大で、読み込むとブラウザが重くなるものだけを弾く) */
const MAX_FILE_SIZE = 50 * 1024 * 1024

export const File = (props: FileProps) => {
  const { t } = useTranslation()

  /** 大きすぎるファイルは、受け付けなかったことを知らせる */
  const handleDropRejected = (rejections: FileRejection[]) => {
    const isTooLarge = rejections.some(({ errors }) =>
      errors.some(({ code }) => code === ErrorCode.FileTooLarge)
    )

    if (isTooLarge) alert(t('alert.ファイルサイズ制限を超えています。'))
  }

  const { getInputProps, getRootProps } = useDropzone({
    onDropRejected: handleDropRejected,
    ...props,
    accept: {
      'image/gif': ['.gif'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/svg+xml': ['.svg'],
      'image/webp': ['.webp'],
    },
    autoFocus: true,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  })

  return (
    <div
      {...getRootProps()}
      className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 transition-colors hover:border-muted-foreground/60 hover:bg-muted/20"
    >
      <input {...getInputProps()} />

      <span className="px-4 text-center text-muted-foreground">
        {t('dialog.ここに画像をドラッグまたはクリック！')}
      </span>
    </div>
  )
}
