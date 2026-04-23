import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { getAnonId } from '../lib/anonId'
import { Icon } from './Icon'

interface Props {
  room: string
}

const PRESETS = [
  '실제로는 수업 중이었어요',
  '실험실/실습실인데 빈 방으로 표시됨',
  '문이 잠겨 있어요',
  '공사 중이거나 출입 금지',
  '건물이 다른 캠퍼스 같아요',
]

export function ReportButton({ room }: Props) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [err, setErr] = useState('')

  const submit = async () => {
    if (!supabase || !reason.trim()) return
    setStatus('sending')
    const { error } = await supabase.from('reports').insert({
      room_code: room,
      reason: reason.trim(),
      anon_id: getAnonId(),
    })
    if (error) {
      setErr(error.message)
      setStatus('error')
      return
    }
    setStatus('done')
    setTimeout(() => {
      setOpen(false)
      setStatus('idle')
      setReason('')
    }, 1200)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-full bg-surface-container-high hover:bg-surface-container-highest px-3 h-8 text-label-caps text-on-surface-variant active:scale-95 transition-all"
      >
        <Icon name="flag" className="text-[16px]" />
        제보
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-background/70 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          onClick={() => status === 'idle' && setOpen(false)}
        >
          <div
            className="w-full max-w-md bg-surface-container border border-outline-variant/30 rounded-3xl p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-h2 text-on-surface">{room} 제보</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-on-surface-variant"
                aria-label="닫기"
              >
                <Icon name="close" />
              </button>
            </div>
            <p className="text-body-md text-on-surface-variant">
              "빈 강의실"로 나왔는데 실제는 달랐던 이유를 골라주세요.
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setReason(p)}
                  className={`rounded-full h-8 px-3 text-label-caps border ${
                    reason === p
                      ? 'bg-primary-container/20 border-primary-container/40 text-primary-container'
                      : 'bg-surface-container-high border-outline-variant/20 text-on-surface-variant'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="직접 입력 (선택)"
              rows={3}
              maxLength={500}
              className="w-full rounded-2xl bg-surface-container-highest p-3 text-body-md text-on-surface outline-none resize-none"
            />
            {status === 'error' && <p className="text-label-caps text-error">{err}</p>}
            {status === 'done' && (
              <p className="text-label-caps text-secondary">제보 전송 완료 🙏</p>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={!reason.trim() || status === 'sending' || status === 'done'}
              className="w-full h-12 bg-primary-container text-on-primary-container font-bold rounded-2xl disabled:opacity-50"
            >
              {status === 'sending' ? '전송 중…' : '제보하기'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
