import type { Contribution, PaymentRequestItem } from "../../lib/types"
import { formatDate, formatMoney, initials } from "../../lib/format"

export function OverviewTab({
  currency,
  contributions,
  paymentRequests,
  onContribute,
}: {
  currency: string
  contributions: Contribution[]
  paymentRequests: PaymentRequestItem[]
  onContribute: (req: PaymentRequestItem | null) => void
}) {
  const openRequests = paymentRequests.filter((r) => r.status === "OPEN")

  return (
    <div className="detail-grid">
      <section className="panel">
        <div className="panel-head">
          <h2>Recent contributions</h2>
        </div>
        {contributions.length === 0 ? (
          <p className="muted">No contributions yet. Be the first to add funds.</p>
        ) : (
          <ul className="txn-list">
            {contributions.map((c) => (
              <li key={c.id} className="txn-item">
                <span className="avatar small" aria-hidden="true">
                  {initials(c.contributorName)}
                </span>
                <div className="txn-main">
                  <span className="txn-name">{c.contributorName}</span>
                  {c.goalTitle && <span className="txn-note">to {c.goalTitle}</span>}
                  <span className="txn-date">{formatDate(c.createdAt)}</span>
                </div>
                <div className="txn-right">
                  <span className="txn-amount">{formatMoney(c.amount, c.currency)}</span>
                  <span className={`status-pill status-${c.status.toLowerCase()}`}>{c.status}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="side-stack">
        <section className="panel">
          <div className="panel-head">
            <h2>Open requests</h2>
          </div>
          {openRequests.length === 0 ? (
            <p className="muted">No open payment requests.</p>
          ) : (
            <ul className="request-list">
              {openRequests.map((r) => (
                <li key={r.id} className="request-item">
                  <div>
                    <span className="request-amount">{formatMoney(r.amountPerMember, currency)}</span>
                    {r.note && <span className="request-reason">{r.note}</span>}
                    {r.dueDate && <span className="request-due">Due {formatDate(r.dueDate)}</span>}
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => onContribute(r)}>
                    Pay
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  )
}
