import { useMemo, useState, type FormEvent } from "react"
import { api } from "../lib/api"
import type { Circle, Expense, Member, SplitType } from "../lib/types"
import { formatMoney, initials } from "../lib/format"
import { Modal } from "./Modal"

interface Row {
  userId: string
  included: boolean
  amount: string
}

export function ExpenseModal({
  circle,
  members,
  currentUserId,
  onClose,
  onDone,
}: {
  circle: Circle
  members: Member[]
  currentUserId: string
  onClose: () => void
  onDone: () => void
}) {
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [paidByUserId, setPaidByUserId] = useState(currentUserId)
  const [splitType, setSplitType] = useState<SplitType>("EQUAL")
  const [rows, setRows] = useState<Row[]>(
    members.map((m) => ({ userId: m.userId, included: true, amount: "" })),
  )
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const total = Number(amount) || 0
  const included = rows.filter((r) => r.included)
  const nameById = useMemo(
    () => new Map(members.map((m) => [m.userId, m.fullName])),
    [members],
  )

  // For EQUAL, preview the even split (remainder distributed to the first shares).
  const equalPreview = useMemo(() => {
    if (splitType !== "EQUAL" || included.length === 0 || total <= 0) return null
    const cents = Math.round(total * 100)
    const base = Math.floor(cents / included.length)
    const remainder = cents - base * included.length
    return included.map((_, i) => (base + (i < remainder ? 1 : 0)) / 100)
  }, [splitType, included, total])

  const customSum = included.reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const customBalanced = Math.abs(customSum - total) < 0.005

  function toggle(userId: string) {
    setRows((prev) => prev.map((r) => (r.userId === userId ? { ...r, included: !r.included } : r)))
  }
  function setRowAmount(userId: string, value: string) {
    setRows((prev) => prev.map((r) => (r.userId === userId ? { ...r, amount: value } : r)))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (included.length === 0) {
      setError("Select at least one participant")
      return
    }
    if (splitType === "CUSTOM" && !customBalanced) {
      setError("Custom shares must add up to the expense total")
      return
    }
    setBusy(true)
    setError(null)
    try {
      await api.post<Expense>(`/circles/${circle.id}/expenses`, {
        description,
        amount: total,
        splitType,
        paidByUserId,
        participants: included.map((r) => ({
          userId: r.userId,
          amount: splitType === "CUSTOM" ? Number(r.amount) || 0 : 0,
        })),
      })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add expense")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Add shared expense" onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Description</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            autoFocus
            placeholder="Venue deposit"
          />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Total amount ({circle.currency})</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Paid by</span>
            <select value={paidByUserId} onChange={(e) => setPaidByUserId(e.target.value)}>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.fullName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field">
          <span className="field-label">Split</span>
          <div className="segmented" role="tablist" aria-label="Split type">
            <button
              type="button"
              role="tab"
              aria-selected={splitType === "EQUAL"}
              className={splitType === "EQUAL" ? "active" : ""}
              onClick={() => setSplitType("EQUAL")}
            >
              Equally
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={splitType === "CUSTOM"}
              className={splitType === "CUSTOM" ? "active" : ""}
              onClick={() => setSplitType("CUSTOM")}
            >
              Custom amounts
            </button>
          </div>
        </div>

        <ul className="split-list">
          {rows.map((r) => {
            const includedIndex = included.findIndex((x) => x.userId === r.userId)
            return (
              <li key={r.userId} className={`split-row ${r.included ? "" : "excluded"}`}>
                <label className="split-check">
                  <input type="checkbox" checked={r.included} onChange={() => toggle(r.userId)} />
                  <span className="avatar small" aria-hidden="true">
                    {initials(nameById.get(r.userId) ?? "?")}
                  </span>
                  <span className="split-name">{nameById.get(r.userId)}</span>
                </label>
                {r.included &&
                  (splitType === "CUSTOM" ? (
                    <input
                      className="split-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={r.amount}
                      onChange={(e) => setRowAmount(r.userId, e.target.value)}
                      placeholder="0.00"
                      aria-label={`Amount for ${nameById.get(r.userId)}`}
                    />
                  ) : (
                    <span className="split-preview">
                      {equalPreview && includedIndex >= 0
                        ? formatMoney(equalPreview[includedIndex], circle.currency)
                        : "\u2014"}
                    </span>
                  ))}
              </li>
            )
          })}
        </ul>

        {splitType === "CUSTOM" && total > 0 && (
          <div className={`split-total ${customBalanced ? "ok" : "warn"}`}>
            <span>
              Allocated {formatMoney(customSum, circle.currency)} of {formatMoney(total, circle.currency)}
            </span>
            <span>{customBalanced ? "Balanced" : `Off by ${formatMoney(Math.abs(customSum - total), circle.currency)}`}</span>
          </div>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Adding\u2026" : "Add expense"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
