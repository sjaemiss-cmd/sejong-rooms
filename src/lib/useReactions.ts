import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseReady } from './supabase'
import { getAnonId } from './anonId'

export type ReactionKind = 'good' | 'broken'

export interface ReactionCounts {
  good: number
  broken: number
}

interface State {
  counts: Record<string, ReactionCounts>
  mine: Record<string, ReactionKind | null>
}

export function useReactions() {
  const [state, setState] = useState<State>({ counts: {}, mine: {} })

  const refresh = useCallback(async () => {
    if (!supabase) return
    const anonId = getAnonId()

    const [countsRes, mineRes] = await Promise.all([
      supabase.from('reaction_counts').select('room_code, good_count, broken_count'),
      supabase.from('reactions').select('room_code, kind').eq('anon_id', anonId),
    ])

    const counts: Record<string, ReactionCounts> = {}
    for (const row of countsRes.data ?? []) {
      counts[row.room_code] = { good: row.good_count ?? 0, broken: row.broken_count ?? 0 }
    }
    const mine: Record<string, ReactionKind | null> = {}
    for (const row of mineRes.data ?? []) {
      mine[row.room_code] = row.kind as ReactionKind
    }
    setState({ counts, mine })
  }, [])

  useEffect(() => {
    if (!supabaseReady) return
    refresh()
  }, [refresh])

  const toggle = useCallback(
    async (room: string, kind: ReactionKind) => {
      if (!supabase) return
      const anonId = getAnonId()
      const current = state.mine[room] ?? null

      // Optimistic update
      setState(prev => {
        const nextMine = { ...prev.mine }
        const nextCounts = {
          ...prev.counts,
          [room]: { ...(prev.counts[room] ?? { good: 0, broken: 0 }) },
        }
        if (current === kind) {
          nextMine[room] = null
          nextCounts[room][kind] = Math.max(0, nextCounts[room][kind] - 1)
        } else {
          if (current) nextCounts[room][current] = Math.max(0, nextCounts[room][current] - 1)
          nextMine[room] = kind
          nextCounts[room][kind] = nextCounts[room][kind] + 1
        }
        return { mine: nextMine, counts: nextCounts }
      })

      if (current === kind) {
        await supabase
          .from('reactions')
          .delete()
          .eq('room_code', room)
          .eq('anon_id', anonId)
      } else {
        await supabase.from('reactions').upsert(
          { room_code: room, anon_id: anonId, kind, updated_at: new Date().toISOString() },
          { onConflict: 'room_code,anon_id' }
        )
      }
      await refresh()
    },
    [refresh, state.mine]
  )

  return { ...state, toggle, refresh }
}
