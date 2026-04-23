import { describe, it, expect } from 'vitest'
import { findEmptyRooms } from '../lib/schedule'
import type { ClassSlot } from '../lib/schedule'
import { toMinutes } from '../lib/time'

const fixture: ClassSlot[] = [
  { room: '광207', building: '광', day: '월', start: '09:00', end: '10:30', course: 'A', courseId: 'A-1' },
  { room: '광207', building: '광', day: '월', start: '13:00', end: '14:30', course: 'B', courseId: 'B-1' },
  { room: '광208', building: '광', day: '월', start: '09:00', end: '10:30', course: 'C', courseId: 'C-1' },
  { room: '집301', building: '집', day: '화', start: '09:00', end: '10:30', course: 'D', courseId: 'D-1' },
]

describe('findEmptyRooms', () => {
  it('수업 중 시간대 — 해당 방만 점유', () => {
    const result = findEmptyRooms(fixture, '월', toMinutes('09:00'), toMinutes('10:30'))
    const rooms = result.map(r => r.room).sort()
    expect(rooms).toEqual(['집301'])
  })

  it('수업 사이 공백 — 모두 비어 있음', () => {
    const result = findEmptyRooms(fixture, '월', toMinutes('11:00'), toMinutes('12:00'))
    const rooms = result.map(r => r.room).sort()
    expect(rooms).toEqual(['광207', '광208', '집301'])
  })

  it('맞닿은 경계는 점유 아님', () => {
    const result = findEmptyRooms(fixture, '월', toMinutes('10:30'), toMinutes('11:00'))
    expect(result.map(r => r.room)).toContain('광207')
  })

  it('다음 수업 정보 포함', () => {
    const result = findEmptyRooms(fixture, '월', toMinutes('11:00'), toMinutes('12:00'))
    const gwang207 = result.find(r => r.room === '광207')
    expect(gwang207?.nextClass).toEqual({ start: '13:00', course: 'B' })
  })

  it('남은 수업 없는 방은 nextClass=null', () => {
    const result = findEmptyRooms(fixture, '월', toMinutes('15:00'), toMinutes('16:00'))
    const gwang208 = result.find(r => r.room === '광208')
    expect(gwang208?.nextClass).toBeNull()
  })

  it('다른 요일 수업은 점유에 영향 없음', () => {
    const result = findEmptyRooms(fixture, '화', toMinutes('09:00'), toMinutes('10:30'))
    const rooms = result.map(r => r.room).sort()
    expect(rooms).toEqual(['광207', '광208'])
  })

  it('빈 스케줄은 빈 배열', () => {
    expect(findEmptyRooms([], '월', 540, 600)).toEqual([])
  })

  it('같은 방이 중복되지 않음', () => {
    const result = findEmptyRooms(fixture, '월', toMinutes('11:00'), toMinutes('12:00'))
    const rooms = result.map(r => r.room)
    expect(new Set(rooms).size).toBe(rooms.length)
  })
})
