import type { RankedRoom } from '../lib/ranking'
import { toMinutes } from '../lib/time'
import { Icon } from './Icon'

interface Props {
  room: RankedRoom
  referenceMin?: number
}

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)}m`
  return `${(m / 1000).toFixed(1)}km`
}

function minutesUntil(start: string, ref: number): number {
  return toMinutes(start) - ref
}

export function RoomCard({ room, referenceMin }: Props) {
  const soon =
    room.nextClass && referenceMin !== undefined
      ? minutesUntil(room.nextClass.start, referenceMin) < 30
      : false

  const bubbleIcon =
    room.roomType === 'performance' ? 'theater_comedy' : room.roomType === 'lab' ? 'science' : 'meeting_room'

  return (
    <article className="flex items-center justify-between bg-surface-container p-4 rounded-2xl border border-outline-variant/20 active:scale-[0.98] transition-all">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon name={bubbleIcon} className="text-primary" />
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-body-lg font-bold text-on-surface truncate">{room.room}</h3>
            <span className="text-label-caps text-on-surface-variant">{room.buildingName}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5 min-w-0">
            {room.nextClass ? (
              <>
                <Icon
                  name="schedule"
                  className={`text-[14px] ${soon ? 'text-error' : 'text-tertiary'}`}
                />
                <p
                  className={`text-label-caps truncate ${soon ? 'text-error' : 'text-tertiary'}`}
                >
                  다음 {room.nextClass.start} · {room.nextClass.course}
                </p>
              </>
            ) : (
              <>
                <Icon name="event_available" className="text-[14px] text-secondary" />
                <p className="text-label-caps text-secondary">오늘 수업 없음</p>
              </>
            )}
          </div>
        </div>
      </div>
      {room.distanceM !== null && (
        <div className="bg-secondary-container/20 px-3 py-1.5 rounded-full border border-secondary/30 shrink-0">
          <span className="text-numeric text-secondary text-[13px]">
            {formatDistance(room.distanceM)}
          </span>
        </div>
      )}
    </article>
  )
}
