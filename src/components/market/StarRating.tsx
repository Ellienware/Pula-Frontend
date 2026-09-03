export function StarRating({
  value,
  count,
  onChange,
}: {
  value: number
  count?: number
  onChange?: (rating: number) => void
}) {
  const interactive = Boolean(onChange)
  const stars = [1, 2, 3, 4, 5]

  return (
    <span className="star-rating" role={interactive ? "radiogroup" : undefined} aria-label="Rating">
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          className={`star ${n <= Math.round(value) ? "filled" : ""}`}
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          aria-pressed={interactive ? n <= value : undefined}
        >
          ★
        </button>
      ))}
      {count !== undefined && <span className="star-count">({count})</span>}
    </span>
  )
}
