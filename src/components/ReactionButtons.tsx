import type { ReactionKind, ReactionCounts } from '../lib/useReactions'

interface Props {
  room: string
  counts: ReactionCounts
  mine: ReactionKind | null
  onToggle: (room: string, kind: ReactionKind) => void
}

export function ReactionButtons({ room, counts, mine, onToggle }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <ReactionChip
        active={mine === 'good'}
        count={counts.good}
        label="좋은 강의실"
        emoji="👍"
        activeClass="bg-secondary/20 border-secondary/40 text-secondary"
        onClick={() => onToggle(room, 'good')}
      />
      <ReactionChip
        active={mine === 'broken'}
        count={counts.broken}
        label="사용 불가"
        emoji="🚫"
        activeClass="bg-error/15 border-error/40 text-error"
        onClick={() => onToggle(room, 'broken')}
      />
    </div>
  )
}

interface ChipProps {
  active: boolean
  count: number
  label: string
  emoji: string
  activeClass: string
  onClick: () => void
}

function ReactionChip({ active, count, label, emoji, activeClass, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`flex items-center gap-1 rounded-full border h-8 px-2.5 text-label-caps active:scale-95 transition-all ${
        active
          ? activeClass
          : 'bg-surface-container-high border-outline-variant/30 text-on-surface-variant'
      }`}
    >
      <span className="text-[13px]">{emoji}</span>
      <span className="text-numeric">{count}</span>
    </button>
  )
}
