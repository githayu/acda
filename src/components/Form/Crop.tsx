'use client'

import 'react-image-crop/dist/ReactCrop.css'

import type { Crop as CropType, PercentCrop } from 'react-image-crop'

import React from 'react'
import ReactCrop from 'react-image-crop'

type CropProps = {
  /** 選べる範囲の縦横比 (幅÷高さ)。デザインの大きさに合わせる */
  aspect?: number
  onDragEnd: (crop: PercentCrop) => void
  url?: string
}

export const Crop: React.FC<CropProps> = (props) => {
  const [crop, setCrop] = React.useState<CropType>()

  if (!props.url) {
    return null
  }

  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <ReactCrop
        aspect={props.aspect}
        crop={crop}
        onChange={(newCrop) => setCrop(newCrop)}
        onComplete={(_, percentCrop) => {
          props.onDragEnd(percentCrop)
        }}
      >
        {/* ReactCropは子要素にimgを要求し、画像もblob URLのためnext/imageは使わない */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" className="max-h-[60vh]" src={props.url} />
      </ReactCrop>
    </React.Suspense>
  )
}
