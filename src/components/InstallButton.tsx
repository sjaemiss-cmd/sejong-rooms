import { useEffect, useState } from 'react'
import { Icon } from './Icon'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent)
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  // iOS Safari exposes navigator.standalone
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true
}

export function InstallButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => isStandalone())
  const [showIOSHelp, setShowIOSHelp] = useState(false)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPromptEvent(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null
  const ios = isIOSDevice()
  if (!promptEvent && !ios) return null

  const handleClick = async () => {
    if (promptEvent) {
      await promptEvent.prompt()
      setPromptEvent(null)
    } else if (ios) {
      setShowIOSHelp(true)
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
      {showIOSHelp && <IOSHelp onClose={() => setShowIOSHelp(false)} />}
    </>
  )
}

function IOSHelp({ onClose }: { onClose: () => void }) {
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
          <button onClick={onClose} className="text-on-surface-variant">
            <Icon name="close" />
          </button>
        </div>
        <ol className="space-y-3 text-body-md text-on-surface-variant">
          <li className="flex items-start gap-2">
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary-container/20 text-primary-container flex items-center justify-center text-label-caps font-bold">
              1
            </span>
            <span>
              Safari 하단의 <Icon name="ios_share" className="text-[16px] mx-0.5" /> 공유 버튼을 누르세요.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary-container/20 text-primary-container flex items-center justify-center text-label-caps font-bold">
              2
            </span>
            <span>
              목록에서 <b className="text-on-surface">"홈 화면에 추가"</b>를 선택하세요.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary-container/20 text-primary-container flex items-center justify-center text-label-caps font-bold">
              3
            </span>
            <span>우측 상단의 "추가"를 누르면 앱처럼 쓸 수 있어요.</span>
          </li>
        </ol>
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
