import { useState } from 'react'
import { usePersistedState } from '../lib/usePersistedState'
import { Icon } from './Icon'

export function DonateCard() {
  const [dismissed, setDismissed] = usePersistedState<boolean>('pref:donateDismissed', false)
  const [expanded, setExpanded] = useState(false)

  if (dismissed) return null

  return (
    <section className="relative mt-8 rounded-3xl bg-surface-container-low border border-outline-variant/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="닫기"
        className="absolute top-3 right-3 text-on-surface-variant hover:text-on-surface"
      >
        <Icon name="close" className="text-[18px]" />
      </button>

      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[20px]">☕</span>
          <h3 className="text-body-lg font-bold text-on-surface">혹시 쓸만하셨다면</h3>
        </div>
        <p className="text-body-md text-on-surface-variant leading-relaxed">
          이 앱은 혼자 만든 토이 프로젝트예요. 앞으로도 광고·구독 없이 계속 돌리려고 합니다.
          <br />
          커피값에도 못 미치는 <b className="text-on-surface">1,000원</b>이면 서버비·도메인값에 보탬이 됩니다.
          <br />
          <span className="text-on-surface-variant/70">물론 그냥 쓰셔도 전혀 상관 없어요.</span>
        </p>

        {expanded ? (
          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="rounded-2xl bg-white p-3 shadow-sm">
              <img
                src={`${import.meta.env.BASE_URL}donate-qr.png`}
                alt="카카오페이 1,000원 후원 QR 코드"
                className="w-44 h-44 object-contain"
              />
            </div>
            <p className="text-label-caps text-on-surface-variant">
              카카오페이 QR · 금액은 1,000원으로 고정되어 있어요
            </p>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-label-caps text-on-surface-variant underline underline-offset-2"
            >
              접기
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="flex items-center gap-1.5 rounded-full bg-primary-container/20 border border-primary-container/40 px-4 h-10 text-primary-container text-label-caps font-bold active:scale-95 transition-all"
            >
              <Icon name="favorite" className="text-[16px]" />
              커피 한잔 값 보내기
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-label-caps text-on-surface-variant underline underline-offset-2 px-2"
            >
              다음에
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
