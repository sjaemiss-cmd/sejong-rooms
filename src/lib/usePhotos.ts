import { useEffect, useState, useCallback } from 'react'
import { supabase, supabaseReady } from './supabase'
import { getAnonId } from './anonId'
import { compressToWebp } from './imagePipeline'

export interface RoomPhoto {
  id: string
  room_code: string
  storage_path: string
  public_url: string
  created_at: string
}

const BUCKET = 'room-photos'
const UPLOAD_LIMIT_PER_ROOM_24H = 1

function localStorageKey(room: string): string {
  return `upload:${room}`
}

function canUpload(room: string): boolean {
  try {
    const raw = localStorage.getItem(localStorageKey(room))
    if (!raw) return true
    const last = Number(raw)
    if (!Number.isFinite(last)) return true
    const diffHours = (Date.now() - last) / (1000 * 60 * 60)
    return diffHours >= 24 / UPLOAD_LIMIT_PER_ROOM_24H
  } catch {
    return true
  }
}

function markUploaded(room: string) {
  try {
    localStorage.setItem(localStorageKey(room), String(Date.now()))
  } catch {
    // ignore
  }
}

function publicUrl(path: string): string {
  if (!supabase) return ''
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

export function usePhotos() {
  const [byRoom, setByRoom] = useState<Record<string, RoomPhoto>>({})

  const refresh = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('photos')
      .select('id, room_code, storage_path, created_at')
      .eq('hidden', false)
      .order('created_at', { ascending: false })
    if (error || !data) return
    // 방마다 최신 1장만
    const latest: Record<string, RoomPhoto> = {}
    for (const row of data) {
      if (latest[row.room_code]) continue
      latest[row.room_code] = {
        ...row,
        public_url: publicUrl(row.storage_path),
      }
    }
    setByRoom(latest)
  }, [])

  useEffect(() => {
    if (!supabaseReady) return
    refresh()
  }, [refresh])

  const upload = useCallback(
    async (room: string, file: File): Promise<{ ok: true } | { ok: false; error: string }> => {
      if (!supabase) return { ok: false, error: 'Supabase 미설정' }
      if (!canUpload(room)) {
        return { ok: false, error: '이 방에는 24시간 안에 이미 업로드했어요' }
      }
      let blob: Blob
      try {
        blob = await compressToWebp(file)
      } catch (e) {
        return { ok: false, error: `이미지 처리 실패: ${String(e)}` }
      }
      if (blob.size > 1_000_000) {
        return { ok: false, error: '압축 후에도 1MB를 넘습니다' }
      }
      const anonId = getAnonId()
      const path = `${room}/${crypto.randomUUID()}.webp`
      const uploadRes = await supabase.storage.from(BUCKET).upload(path, blob, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false,
      })
      if (uploadRes.error) {
        return { ok: false, error: `업로드 실패: ${uploadRes.error.message}` }
      }
      const insertRes = await supabase.from('photos').insert({
        room_code: room,
        storage_path: path,
        anon_id: anonId,
      })
      if (insertRes.error) {
        return { ok: false, error: `DB 저장 실패: ${insertRes.error.message}` }
      }
      markUploaded(room)
      await refresh()
      return { ok: true }
    },
    [refresh]
  )

  return { byRoom, refresh, upload }
}
