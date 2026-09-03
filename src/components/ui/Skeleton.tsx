export function Skeleton({ width, height = 12, radius }: { width?: number | string; height?: number; radius?: number }) {
  return (
    <div
      className="skeleton"
      style={{ width: width ?? "100%", height, borderRadius: radius }}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({ lines = 2 }: { lines?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton skeleton-text" />
      ))}
    </div>
  )
}

/** Generic skeleton card — matches the real .card padding/radius so layout doesn't jump on load. */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <Skeleton width="40%" height={14} />
      <div style={{ height: 12 }} />
      <SkeletonText lines={lines} />
    </div>
  )
}

export function SkeletonGrid({ count = 3, columns = "grid-3" }: { count?: number; columns?: string }) {
  return (
    <div className={`grid ${columns}`} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
