import type { RankedRoom } from '../lib/ranking'
import type { ReactionCounts, ReactionKind } from '../lib/useReactions'
import { toMinutes } from '../lib/time'
import { Icon } from './Icon'
import { ReactionButtons } from './ReactionButtons'
import { PhotoUpload } from './PhotoUpload'
import { ReportButton } from './ReportButton'

interface Props {
  room: RankedRoom
  referenceMin?: number
  photoUrl?: string
  reactionCounts: ReactionCounts
  myReaction: ReactionKind | null
  onToggleReaction: (room: string, kind: ReactionKind) => void
  onUploadPhoto: (
    room: string,
    file: File
  ) => Promise<{ ok: true } | { ok: false; error: string }>
}

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)}m`
  return `${(m / 1000).toFixed(1)}km`
}

function minutesUntil(start: string, ref: number): number {
  return toMinutes(start) - ref
}

export function RoomCard({
  room,
  referenceMin,
  photoUrl,
  reactionCounts,
  myReaction,
  onToggleReaction,
  onUploadPhoto,
}: Props) {
  const soon =
    room.nextClass && referenceMin !== undefined
      ? minutesUntil(room.nextClass.start, referenceMin) < 30
      : false

  const bubbleIcon =
    room.roomType === 'performance'
      ? 'theater_comedy'
      : room.roomType === 'lab'
        ? 'science'
        : 'meeting_room'

  return (
    <article className="bg-surface-container p-4 rounded-2xl border border-outline-variant/20 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={`${room.room} 사진`}
              loading="lazy"
              className="w-14 h-14 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon name={bubbleIcon} className="text-primary" />
            </div>
          )}
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
                    className={`text-label-caps truncate ${
                      soon ? 'text-error' : 'text-tertiary'
                    }`}
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
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-outline-variant/10">
        <ReactionButtons
          room={room.room}
          counts={reactionCounts}
          mine={myReaction}
          onToggle={onToggleReaction}
        />
        <div className="flex-1" />
        <PhotoUpload room={room.room} onUpload={onUploadPhoto} />
        <ReportButton room={room.room} />
      </div>
    </article>
  )
}
