import { useSyncExternalStore } from 'react'

/**
 * メディアクエリに一致しているかを返す (静的書き出しのHTMLでは一致しない扱い)
 * MARK: useMediaQuery
 */
export const useMediaQuery = (query: string) =>
  useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)

      media.addEventListener('change', onChange)

      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
