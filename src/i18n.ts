import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en/common.json'
import ja from './locales/ja/common.json'

i18n.use(initReactI18next).init({
  fallbackLng: 'ja',
  interpolation: {
    escapeValue: false,
  },
  lng: 'ja',
  resources: {
    en: { translation: en },
    ja: { translation: ja },
  },
})

/** 選んだ言語を保存するlocalStorageのキー */
export const LANGUAGE_STORAGE_KEY = 'language'

export { i18n }
