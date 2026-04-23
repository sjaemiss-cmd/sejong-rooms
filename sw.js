// Minimal service worker — 설치 가능성 확보용. 캐시 전략은 없음 (언제나 네트워크).
const VERSION = 'v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // pass-through. 데이터/자산이 자주 바뀌므로 캐시 없이 그대로.
  // 이벤트 핸들러 존재 자체가 PWA installability 요건.
})
