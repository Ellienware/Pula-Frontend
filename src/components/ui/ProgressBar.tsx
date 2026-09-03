type Status = "on-track" | "behind" | "complete"

function statusFor(pct: number): Status {
  if (pct >= 100) return "complete"
  if (pct < 40) return "behind"
  return "on-track"
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div
      className={`progress ${statusFor(pct)}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Circular ring variant — the recurring "circle" motif used for savings goals. */
export function ProgressRing({
  value,
  max,
  size = 56,
  strokeWidth = 6,
  children,
}: {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  children?: React.ReactNode
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - pct / 100)

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg
        className="progress-ring"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <circle className="progress-ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
        <circle
          className="progress-ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {children && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
