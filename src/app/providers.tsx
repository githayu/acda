'use client'

import { createStore, Provider } from 'jotai'
import { ReactNode, useEffect } from 'react'

import { i18n, LANGUAGE_STORAGE_KEY } from '@/i18n'

const store = createStore()

type ProvidersProps = {
  children: ReactNode
}

export const Providers = ({ children }: ProvidersProps) => {
  /** 保存された言語に切り替える (静的書き出しのため、ブラウザでマウントしてから読む) */
  useEffect(() => {
    const language = localStorage.getItem(LANGUAGE_STORAGE_KEY)

    if (language && language !== i18n.language && i18n.hasResourceBundle(language, 'translation')) {
      i18n.changeLanguage(language)
    }
  }, [])

  return <Provider store={store}>{children}</Provider>
}
