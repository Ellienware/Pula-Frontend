import { useState, type FormEvent } from "react"
import { api } from "../lib/api"
import type { Circle, CircleRole, Invitation } from "../lib/types"
import { Modal } from "./Modal"

const ROLES: CircleRole[] = ["MEMBER", "ADMIN"]

export function InviteModal({
  circle,
  onClose,
  onDone,
}: {
  circle: Circle
  onClose: () => void
  onDone: () => void
}) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<CircleRole>("MEMBER")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState<Invitation | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await api.post<Invitation>(`/circles/${circle.id}/invitations`, { email, role })
      setCreated(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation")
    } finally {
      setBusy(false)
    }
  }

  if (created) {
    return (
      <Modal title="Invitation sent" onClose={onDone}>
        <div className="result-block ok">
          <span className="result-icon" aria-hidden="true">
            {"\u2713"}
          </span>
          <h3>Invite ready for {created.invitedEmail}</h3>
          <p className="muted">Share this token so they can join as {created.role.toLowerCase()}:</p>
          <code className="token-box">{created.token}</code>
          <button className="btn btn-primary btn-block" onClick={onDone}>
            Done
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={`Invite to ${circle.name}`} onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Email address</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            placeholder="friend@example.com"
          />
        </label>
        <label className="field">
          <span>Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value as CircleRole)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0) + r.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
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
            {busy ? "Sending\u2026" : "Send invitation"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
