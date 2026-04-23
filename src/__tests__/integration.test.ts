import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { findEmptyRooms, type ClassSlot } from '../lib/schedule'
import { rankRooms } from '../lib/ranking'
import type { BuildingsMap, RoomsMeta } from '../lib/data'

const root = process.cwd()
const schedule = JSON.parse(
  fs.readFileSync(path.join(root, 'public/data/schedule.json'), 'utf8')
) as ClassSlot[]
const buildingsRaw = JSON.parse(
  fs.readFileSync(path.join(root, 'public/data/buildings.json'), 'utf8')
) as Record<string, unknown>
const buildings: BuildingsMap = {}
for (const [k, v] of Object.entries(buildingsRaw)) {
  if (!k.startsWith('_')) buildings[k] = v as BuildingsMap[string]
}
const rooms = JSON.parse(
  fs.readFileSync(path.join(root, 'public/data/rooms.json'), 'utf8')
) as RoomsMeta

describe('실데이터 통합', () => {
  it('스케줄이 충분히 로드된다', () => {
    expect(schedule.length).toBeGreaterThan(3000)
  })

  it('화 09:00-10:30은 일부 방이 점유됨', () => {
    const empty = findEmptyRooms(schedule, '화', 9 * 60, 10 * 60 + 30)
    const allRooms = new Set(schedule.map(s => s.room)).size
    expect(empty.length).toBeLessThan(allRooms)
    expect(empty.length).toBeGreaterThan(0)
  })

  it('수 07:00-07:30은 거의 모든 방이 비어있음', () => {
    const empty = findEmptyRooms(schedule, '수', 7 * 60, 7 * 60 + 30)
    const allRooms = new Set(schedule.map(s => s.room)).size
    expect(empty.length).toBeGreaterThanOrEqual(allRooms - 5)
  })

  it('영108/영613은 실습실로 분류됨', () => {
    expect(rooms['영108']?.type).toBe('lab')
    expect(rooms['영613']?.type).toBe('lab')
  })

  it('공연장/강당은 performance', () => {
    expect(rooms['학대공연장']?.type).toBe('performance')
    expect(rooms['대양홀강당']?.type).toBe('performance')
  })

  it('캠퍼스 중심 기준 거리순 정렬 동작', () => {
    const empty = findEmptyRooms(schedule, '월', 10 * 60, 11 * 60)
    const userPos = { lat: 37.5506, lng: 127.0744 }
    const ranked = rankRooms(empty, buildings, rooms, userPos)
    for (let i = 1; i < Math.min(ranked.length, 10); i++) {
      const prev = ranked[i - 1].distanceM ?? Infinity
      const curr = ranked[i].distanceM ?? Infinity
      expect(curr).toBeGreaterThanOrEqual(prev)
    }
  })
})
