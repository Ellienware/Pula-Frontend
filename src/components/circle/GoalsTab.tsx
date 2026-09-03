import { useState } from "react"
import { api } from "../../lib/api"
import type { Goal } from "../../lib/types"
import { formatDate, formatMoney } from "../../lib/format"

export function GoalsTab({
  circleId,
  currency,
  goals,
  isAdmin,
  onNewGoal,
  onContribute,
  reload,
}: {
  circleId: string
  currency: string
  goals: Goal[]
  isAdmin: boolean
  onNewGoal: () => void
  onContribute: (goalId: string) => void
  reload: () => void
}) {
  const [busyId, setBusyId] = useState<string | null>(null)

  async function close(goalId: string) {
    setBusyId(goalId)
    try {
      await api.post(`/circles/${circleId}/goals/${goalId}/close`)
      reload()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Savings goals</h2>
        {isAdmin && (
          <button className="btn btn-ghost btn-sm" onClick={onNewGoal}>
            + New goal
          </button>
        )}
      </div>

      {goals.length === 0 ? (
        <p className="muted">No goals yet. Break your target into milestones the circle can rally behind.</p>
      ) : (
        <ul className="goal-list">
          {goals.map((g) => {
            const progress = g.progressPercent ?? 0
            return (
              <li key={g.id} className="goal-card">
                <div className="goal-card-head">
                  <div>
                    <h3>{g.title}</h3>
                    {g.description && <p className="muted">{g.description}</p>}
                  </div>
                  <span className={`status-pill status-${g.status.toLowerCase()}`}>{g.status}</span>
                </div>
                <div className="goal-amounts">
                  <span className="money">{formatMoney(g.raisedAmount, currency)}</span>
                  <span className="muted">of {formatMoney(g.targetAmount, currency)}</span>
                </div>
                <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                  <span style={{ width: `${progress}%` }} />
                </div>
                <div className="goal-foot">
                  <span className="muted">
                    {progress}% funded{g.deadline ? ` \u00b7 by ${formatDate(g.deadline)}` : ""}
                  </span>
                  <div className="row">
                    {g.status === "ACTIVE" && (
                      <button className="btn btn-primary btn-sm" onClick={() => onContribute(g.id)}>
                        Contribute
                      </button>
                    )}
                    {isAdmin && g.status !== "CLOSED" && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => close(g.id)}
                        disabled={busyId === g.id}
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
