import { ReactNode } from "react"
import { Card } from "./Card"

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
}) {
  return (
    <Card className="stat-card">
      <div className="row between">
        <span className="stat-card-label">{label}</span>
        {icon && <span aria-hidden="true">{icon}</span>}
      </div>
      <div>{value}</div>
      {hint && <span className="muted" style={{ fontSize: "var(--text-xs)" }}>{hint}</span>}
    </Card>
  )
}
