import { useState } from "react"
import { api } from "../../lib/api"
import type { Expense } from "../../lib/types"
import { formatDate, formatMoney } from "../../lib/format"

export function ExpensesTab({
  circleId,
  currency,
  expenses,
  currentUserId,
  onNewExpense,
  reload,
}: {
  circleId: string
  currency: string
  expenses: Expense[]
  currentUserId: string
  onNewExpense: () => void
  reload: () => void
}) {
  const [busyId, setBusyId] = useState<string | null>(null)

  async function settle(expenseId: string, shareId: string) {
    setBusyId(shareId)
    try {
      await api.post(`/circles/${circleId}/expenses/${expenseId}/shares/${shareId}/settle`)
      reload()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Shared expenses</h2>
        <button className="btn btn-ghost btn-sm" onClick={onNewExpense}>
          + Add expense
        </button>
      </div>

      {expenses.length === 0 ? (
        <p className="muted">No expenses split yet. Add one to track who owes what.</p>
      ) : (
        <ul className="expense-list">
          {expenses.map((e) => (
            <li key={e.id} className="expense-card">
              <div className="expense-head">
                <div>
                  <h3>{e.description}</h3>
                  <span className="muted">
                    {`Paid by ${e.paidByName} \u00b7 ${formatDate(e.createdAt)}`}
                  </span>
                </div>
                <div className="expense-amounts">
                  <span className="money">{formatMoney(e.amount, currency)}</span>
                  <span className={`status-pill ${e.outstandingAmount <= 0 ? "status-successful" : "status-pending"}`}>
                    {e.outstandingAmount <= 0
                      ? "Settled"
                      : `${formatMoney(e.outstandingAmount, currency)} owed`}
                  </span>
                </div>
              </div>
              <ul className="share-list">
                {e.shares.map((s) => (
                  <li key={s.id} className="share-row">
                    <span className="share-name">{s.debtorName}</span>
                    <span className="share-amount">{formatMoney(s.amount, currency)}</span>
                    {s.settled ? (
                      <span className="status-pill status-successful">Paid</span>
                    ) : s.debtorId === currentUserId || s.debtorId === e.paidById ? (
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => settle(e.id, s.id)}
                        disabled={busyId === s.id}
                      >
                        Mark paid
                      </button>
                    ) : (
                      <span className="status-pill status-pending">Owing</span>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
