import { useEffect, useState } from 'react'
import { Icon } from './Icon'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// ── 모듈 최상단에서 등록 → 컴포넌트 마운트 전에 이벤트 발생해도 잡음 ──
let cachedPromptEvent: BeforeInstallPromptEvent | null = null
const EVT_READY = 'install-prompt-ready'
const EVT_INSTALLED = 'install-installed'

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault()
    cachedPromptEvent = e as BeforeInstallPromptEvent
    window.dispatchEvent(new Event(EVT_READY))
  })
  window.addEventListener('appinstalled', () => {
    cachedPromptEvent = null
    window.dispatchEvent(new Event(EVT_INSTALLED))
  })
}

type Device = 'ios' | 'android' | 'desktop' | 'other'

function detectDevice(): Device {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'
  if (/windows|macintosh|linux/.test(ua)) return 'desktop'
  return 'other'
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return true
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true
}

export function InstallButton() {
  const [promptReady, setPromptReady] = useState<boolean>(!!cachedPromptEvent)
  const [installed, setInstalled] = useState<boolean>(() => isStandalone())
  const [showHelp, setShowHelp] = useState(false)
  const device = detectDevice()

  useEffect(() => {
    const onReady = () => setPromptReady(true)
    const onInstalled = () => {
      setPromptReady(false)
      setInstalled(true)
    }
    window.addEventListener(EVT_READY, onReady)
    window.addEventListener(EVT_INSTALLED, onInstalled)
    return () => {
      window.removeEventListener(EVT_READY, onReady)
      window.removeEventListener(EVT_INSTALLED, onInstalled)
    }
  }, [])

  if (installed) return null
  // 데스크톱은 promptEvent 떠야만 보여줌 (브라우저 UI로 충분)
  if (device === 'desktop' && !promptReady) return null
  // 모바일은 promptEvent 없어도 수동 안내로 보여줌

  const handleClick = async () => {
    if (cachedPromptEvent) {
      try {
        await cachedPromptEvent.prompt()
        await cachedPromptEvent.userChoice
        cachedPromptEvent = null
        setPromptReady(false)
      } catch {
        setShowHelp(true)
      }
    } else {
      setShowHelp(true)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 rounded-full bg-primary-container/20 border border-primary-container/40 px-3 h-9 text-primary-container text-label-caps font-bold active:scale-95 transition-all"
      >
        <Icon name="add_to_home_screen" className="text-[16px]" />
        앱 설치
      </button>
      {showHelp && <InstallHelp device={device} onClose={() => setShowHelp(false)} />}
    </>
  )
}

function InstallHelp({ device, onClose }: { device: Device; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-background/70 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface-container border border-outline-variant/30 rounded-3xl p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-h2 text-on-surface">홈 화면에 추가</h2>
          <button onClick={onClose} className="text-on-surface-variant" aria-label="닫기">
            <Icon name="close" />
          </button>
        </div>
        {device === 'ios' ? <IOSSteps /> : device === 'android' ? <AndroidSteps /> : <GenericSteps />}
        <button
          onClick={onClose}
          className="w-full h-12 bg-primary-container text-on-primary-container font-bold rounded-2xl"
        >
          알겠어요
        </button>
      </div>
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="shrink-0 w-6 h-6 rounded-full bg-primary-container/20 text-primary-container flex items-center justify-center text-label-caps font-bold">
        {n}
      </span>
      <span>{children}</span>
    </li>
  )
}

function IOSSteps() {
  return (
    <ol className="space-y-3 text-body-md text-on-surface-variant">
      <Step n={1}>
        Safari 하단의{' '}
        <Icon name="ios_share" className="text-[16px] mx-0.5" /> 공유 버튼을 누르세요.
      </Step>
      <Step n={2}>
        목록에서 <b className="text-on-surface">"홈 화면에 추가"</b> 선택.
      </Step>
      <Step n={3}>우측 상단 "추가"를 누르면 끝.</Step>
    </ol>
  )
}

function AndroidSteps() {
  return (
    <ol className="space-y-3 text-body-md text-on-surface-variant">
      <Step n={1}>
        Chrome 주소창 옆의{' '}
        <Icon name="more_vert" className="text-[16px] mx-0.5" /> 메뉴(점 3개)를 누르세요.
      </Step>
      <Step n={2}>
        <b className="text-on-surface">"앱 설치"</b> 또는{' '}
        <b className="text-on-surface">"홈 화면에 추가"</b>를 선택.
      </Step>
      <Step n={3}>
        삼성 인터넷: 메뉴(≡) → "페이지 추가" → <b className="text-on-surface">"홈 화면"</b>.
      </Step>
    </ol>
  )
}

function GenericSteps() {
  return (
    <ol className="space-y-3 text-body-md text-on-surface-variant">
      <Step n={1}>브라우저 메뉴를 여세요.</Step>
      <Step n={2}>"홈 화면에 추가" 또는 "앱 설치" 항목을 선택하세요.</Step>
    </ol>
  )
}
