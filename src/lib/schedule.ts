import { toMinutes, overlaps } from './time'

export interface ClassSlot {
  room: string
  building: string
  day: string
  start: string
  end: string
  course: string
  courseId: string
}

export interface NextClass {
  start: string
  course: string
}

export interface EmptyRoom {
  room: string
  building: string
  nextClass: NextClass | null
}

export function findEmptyRooms(
  schedule: ClassSlot[],
  day: string,
  startMin: number,
  endMin: number
): EmptyRoom[] {
  const byRoom = new Map<string, { building: string; slots: ClassSlot[] }>()
  for (const slot of schedule) {
    const entry = byRoom.get(slot.room) ?? { building: slot.building, slots: [] }
    entry.slots.push(slot)
    byRoom.set(slot.room, entry)
  }

  const result: EmptyRoom[] = []
  for (const [room, { building, slots }] of byRoom) {
    const daySlots = slots.filter(s => s.day === day)
    const occupied = daySlots.some(s =>
      overlaps(toMinutes(s.start), toMinutes(s.end), startMin, endMin)
    )
    if (occupied) continue

    const upcoming = daySlots
      .filter(s => toMinutes(s.start) >= endMin)
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))

    result.push({
      room,
      building,
      nextClass: upcoming[0] ? { start: upcoming[0].start, course: upcoming[0].course } : null,
    })
  }
  return result
}
