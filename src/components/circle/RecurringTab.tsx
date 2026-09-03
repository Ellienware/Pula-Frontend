import { useState } from "react"
import { api } from "../../lib/api"
import type { RecurringPlan } from "../../lib/types"
import { formatDate, formatMoney, humanize } from "../../lib/format"

export function RecurringTab({
  circleId,
  currency,
  plans,
  currentUserId,
  isAdmin,
  onNewPlan,
  reload,
}: {
  circleId: string
  currency: string
  plans: RecurringPlan[]
  currentUserId: string
  isAdmin: boolean
  onNewPlan: () => void
  reload: () => void
}) {
  const [busy, setBusy] = useState<string | null>(null)

  async function act(key: string, path: string) {
    setBusy(key)
    try {
      await api.post(path)
      reload()
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Recurring contributions</h2>
        {isAdmin && (
          <button className="btn btn-ghost btn-sm" onClick={onNewPlan}>
            + New plan
          </button>
        )}
      </div>

      {plans.length === 0 ? (
        <p className="muted">No recurring plans. Automate dues so members are collected on schedule.</p>
      ) : (
        <ul className="plan-list">
          {plans.map((p) => (
            <li key={p.id} className="plan-card">
              <div className="plan-head">
                <div>
                  <h3>{p.title}</h3>
                  <span className="muted">
                    {`${formatMoney(p.amountPerMember, currency)} \u00b7 ${humanize(p.frequency)}`}
                    {p.goalTitle ? ` \u00b7 ${p.goalTitle}` : ""}
                  </span>
                </div>
                <span className={`status-pill status-${p.status.toLowerCase()}`}>{p.status}</span>
              </div>

              <div className="plan-meta">
                <span className="muted">Collected {formatMoney(p.totalCollected, currency)}</span>
                {p.nextDueDate && <span className="muted">Next due {formatDate(p.nextDueDate)}</span>}
              </div>

              {isAdmin && (
                <div className="plan-actions">
                  {p.status === "ACTIVE" && (
                    <>
                      <button
                        className="btn btn-ghost btn-xs"
                        disabled={busy === p.id}
                        onClick={() => act(p.id, `/circles/${circleId}/recurring/${p.id}/generate`)}
                      >
                        Generate period
                      </button>
                      <button
                        className="btn btn-ghost btn-xs"
                        disabled={busy === p.id}
                        onClick={() => act(p.id, `/circles/${circleId}/recurring/${p.id}/pause`)}
                      >
                        Pause
                      </button>
                    </>
                  )}
                  {p.status === "PAUSED" && (
                    <button
                      className="btn btn-ghost btn-xs"
                      disabled={busy === p.id}
                      onClick={() => act(p.id, `/circles/${circleId}/recurring/${p.id}/resume`)}
                    >
                      Resume
                    </button>
                  )}
                  {(p.status === "ACTIVE" || p.status === "PAUSED") && (
                    <button
                      className="btn btn-ghost btn-xs danger"
                      disabled={busy === p.id}
                      onClick={() => act(p.id, `/circles/${circleId}/recurring/${p.id}/cancel`)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}

              {p.periods.map((period) => (
                <div key={period.id} className="period-block">
                  <div className="period-head">
                    <span className="period-label">{period.label}</span>
                    <span className="muted">
                      {`${period.paidCount}/${period.expectedCount} paid \u00b7 due ${formatDate(period.dueDate)}`}
                    </span>
                  </div>
                  <ul className="due-list">
                    {period.dues.map((d) => (
                      <li key={d.id} className="due-row">
                        <span className="due-name">{d.memberName}</span>
                        <span className="due-amount">{formatMoney(d.amount, currency)}</span>
                        {d.status === "PAID" ? (
                          <span className="status-pill status-successful">Paid</span>
                        ) : d.memberId === currentUserId ? (
                          <button
                            className="btn btn-primary btn-xs"
                            disabled={busy === d.id}
                            onClick={() => act(d.id, `/circles/${circleId}/recurring/dues/${d.id}/pay`)}
                          >
                            Pay now
                          </button>
                        ) : (
                          <span className={`status-pill status-${d.status.toLowerCase()}`}>{d.status}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
