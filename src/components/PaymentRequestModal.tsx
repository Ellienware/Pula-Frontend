import { useState, type FormEvent } from "react"
import { api } from "../lib/api"
import type { Circle, PaymentRequestItem } from "../lib/types"
import { Modal } from "./Modal"

export function PaymentRequestModal({
  circle,
  onClose,
  onDone,
}: {
  circle: Circle
  onClose: () => void
  onDone: () => void
}) {
  const [amountPerMember, setAmountPerMember] = useState("")
  const [note, setNote] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.post<PaymentRequestItem>(`/circles/${circle.id}/payment-requests`, {
        amountPerMember: Number(amountPerMember),
        note: note || null,
        dueDate: dueDate || null,
      })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create request")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Request payment from members" onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Amount per member ({circle.currency})</span>
          <input
            type="number"
            min="1"
            step="0.01"
            value={amountPerMember}
            onChange={(e) => setAmountPerMember(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label className="field">
          <span>Note</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Monthly contribution" />
        </label>
        <label className="field">
          <span>Due date (optional)</span>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
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
            {busy ? "Sending\u2026" : "Send request"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
