interface Props {
  name: string
  filled?: boolean
  weight?: number
  className?: string
}

export function Icon({ name, filled = false, weight = 400, className = '' }: Props) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}` }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}
