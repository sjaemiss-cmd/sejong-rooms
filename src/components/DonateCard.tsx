import { usePersistedState } from '../lib/usePersistedState'
import { Icon } from './Icon'

const DONATE_URL = 'https://qr.kakaopay.com/2810060111503805020087581f400129'

export function DonateCard() {
  const [dismissed, setDismissed] = usePersistedState<boolean>('pref:donateDismissed', false)

  if (dismissed) return null

  return (
    <section className="relative rounded-2xl bg-surface-container-low border border-outline-variant/30 px-4 py-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0">
        <span className="text-[20px]">☕</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body-md text-on-surface leading-tight">
          쓸만하셨다면 <b>1,000원</b> 후원 부탁해요 🙏
        </p>
        <p className="text-label-caps text-on-surface-variant mt-0.5">
          서버비에 보탬이 됩니다 · 광고·구독 없이 운영 중
        </p>
      </div>
      <a
        href={DONATE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-full bg-primary-container text-on-primary-container font-bold h-9 px-4 text-label-caps flex items-center active:scale-95 transition-all"
      >
        후원
      </a>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="닫기"
        className="shrink-0 -mr-1 w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-on-surface"
      >
        <Icon name="close" className="text-[18px]" />
      </button>
    </section>
  )
}
