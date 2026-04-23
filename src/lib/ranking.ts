import type { EmptyRoom, NextClass } from './schedule'
import type { BuildingsMap, RoomsMeta, RoomType } from './data'
import { haversine } from './distance'

export interface RankedRoom {
  room: string
  building: string
  buildingName: string
  nextClass: NextClass | null
  distanceM: number | null
  roomType: RoomType
}

export interface UserPos {
  lat: number
  lng: number
}

export function rankRooms(
  empty: EmptyRoom[],
  buildings: BuildingsMap,
  rooms: RoomsMeta,
  userPos: UserPos | null
): RankedRoom[] {
  const ranked: RankedRoom[] = empty.map(r => {
    const b = buildings[r.building]
    const distanceM = b && userPos ? haversine(userPos.lat, userPos.lng, b.lat, b.lng) : null
    return {
      room: r.room,
      building: r.building,
      buildingName: b?.name ?? r.building,
      nextClass: r.nextClass,
      distanceM,
      roomType: rooms[r.room]?.type ?? 'classroom',
    }
  })

  if (userPos) {
    return ranked.sort((a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity))
  }
  return ranked.sort(
    (a, b) =>
      a.buildingName.localeCompare(b.buildingName, 'ko') ||
      a.room.localeCompare(b.room, 'ko')
  )
}
