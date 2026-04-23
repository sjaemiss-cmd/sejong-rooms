import { useRef, useState } from 'react'
import { Icon } from './Icon'

interface Props {
  room: string
  onUpload: (room: string, file: File) => Promise<{ ok: true } | { ok: false; error: string }>
}

export function PhotoUpload({ room, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')

  const handlePick = () => inputRef.current?.click()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setStatus('uploading')
    setMessage('')
    const result = await onUpload(room, file)
    if (result.ok) {
      setStatus('done')
      setMessage('업로드 완료')
      setTimeout(() => setStatus('idle'), 1600)
    } else {
      setStatus('error')
      setMessage(result.error)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handlePick}
        disabled={status === 'uploading'}
        className="flex items-center gap-1 rounded-full bg-surface-container-high hover:bg-surface-container-highest px-3 h-8 text-label-caps text-on-surface-variant active:scale-95 transition-all disabled:opacity-50"
      >
        <Icon name="photo_camera" className="text-[16px]" />
        {status === 'uploading' ? '업로드 중…' : '사진'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      {(status === 'done' || status === 'error') && (
        <span
          className={`text-label-caps ${status === 'done' ? 'text-secondary' : 'text-error'}`}
        >
          {message}
        </span>
      )}
    </>
  )
}
