import { useEffect, useState } from 'react'

export function usePersistedState<T>(
  key: string,
  initial: T
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initial
    try {
      const raw = window.localStorage.getItem(key)
      if (raw !== null) return JSON.parse(raw) as T
    } catch {
      // ignore parse errors, fall through to initial
    }
    return initial
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage disabled (private browsing etc.) — ignore
    }
  }, [key, value])

  return [value, setValue]
}
