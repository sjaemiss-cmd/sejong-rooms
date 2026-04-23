import type { ClassSlot } from './schedule'

export interface Building {
  name: string
  lat: number
  lng: number
}

export type BuildingsMap = Record<string, Building>

export type RoomType = 'classroom' | 'lab' | 'performance'

export interface RoomMeta {
  building: string
  type: RoomType
  reason?: string
}

export type RoomsMeta = Record<string, RoomMeta>

export interface AppData {
  schedule: ClassSlot[]
  buildings: BuildingsMap
  rooms: RoomsMeta
}

let cache: AppData | null = null

export async function loadData(): Promise<AppData> {
  if (cache) return cache
  const base = import.meta.env.BASE_URL
  const [scheduleRes, buildingsRes, roomsRes] = await Promise.all([
    fetch(`${base}data/schedule.json`),
    fetch(`${base}data/buildings.json`),
    fetch(`${base}data/rooms.json`),
  ])
  if (!scheduleRes.ok) throw new Error(`schedule.json: ${scheduleRes.status}`)
  if (!buildingsRes.ok) throw new Error(`buildings.json: ${buildingsRes.status}`)
  if (!roomsRes.ok) throw new Error(`rooms.json: ${roomsRes.status}`)

  const schedule: ClassSlot[] = await scheduleRes.json()
  const buildingsRaw: Record<string, unknown> = await buildingsRes.json()
  const buildings: BuildingsMap = {}
  for (const [key, value] of Object.entries(buildingsRaw)) {
    if (key.startsWith('_')) continue
    buildings[key] = value as Building
  }
  const rooms: RoomsMeta = await roomsRes.json()

  cache = { schedule, buildings, rooms }
  return cache
}
