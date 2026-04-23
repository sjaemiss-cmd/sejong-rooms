import { useEffect, useState } from 'react'
import { loadData, type BuildingsMap, type RoomsMeta } from './data'
import type { ClassSlot } from './schedule'

interface DataState {
  schedule: ClassSlot[] | null
  buildings: BuildingsMap | null
  rooms: RoomsMeta | null
  error: string | null
}

export function useScheduleData(): DataState {
  const [state, setState] = useState<DataState>({
    schedule: null,
    buildings: null,
    rooms: null,
    error: null,
  })

  useEffect(() => {
    loadData()
      .then(d =>
        setState({ schedule: d.schedule, buildings: d.buildings, rooms: d.rooms, error: null })
      )
      .catch(e =>
        setState({
          schedule: null,
          buildings: null,
          rooms: null,
          error: e instanceof Error ? e.message : String(e),
        })
      )
  }, [])

  return state
}
