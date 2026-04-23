const KEY = 'anon:id'

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback — 거의 안 탈 것
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getAnonId(): string {
  if (typeof window === 'undefined') return 'ssr'
  try {
    const existing = window.localStorage.getItem(KEY)
    if (existing) return existing
    const fresh = uuid()
    window.localStorage.setItem(KEY, fresh)
    return fresh
  } catch {
    return uuid()
  }
}
