import { Link } from "react-router-dom"
import { Users } from "lucide-react"
import type { Circle } from "../../lib/types"
import { CIRCLE_TYPE_LABELS } from "../../lib/types"
import { formatMoney } from "../../lib/format"
import { ProgressBar } from "../ui/ProgressBar"

export function CircleCard({ circle }: { circle: Circle }) {
  const progress = circle.progressPercent

  return (
    <Link to={`/circles/${circle.id}`} className="card card-interactive circle-card">
      <div className="circle-card-top">
        <span className={`badge type-${circle.type.toLowerCase()}`}>{CIRCLE_TYPE_LABELS[circle.type]}</span>
        <span className="member-count muted">
          <Users size={13} aria-hidden="true" /> {circle.memberCount}
        </span>
      </div>
      <h3 className="circle-card-name">{circle.name}</h3>
      {circle.description && <p className="circle-desc">{circle.description}</p>}
      <div className="circle-balance">
        <span className="balance-value money">{formatMoney(circle.totalContributed, circle.currency)}</span>
        {circle.goalAmount && <span className="goal-value muted">of {formatMoney(circle.goalAmount, circle.currency)}</span>}
      </div>
      {progress !== null && (
        <>
          <ProgressBar value={circle.totalContributed} max={circle.goalAmount ?? circle.totalContributed} />
          <span className="circle-progress-label muted">{progress}% funded</span>
        </>
      )}
    </Link>
  )
}
