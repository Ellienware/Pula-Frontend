import { useState } from "react"
import { api } from "../../lib/api"
import type { Invitation, Member } from "../../lib/types"
import { formatDate, initials } from "../../lib/format"

export function MembersTab({
  circleId,
  members,
  invitations,
  isAdmin,
  onInvite,
  reload,
}: {
  circleId: string
  members: Member[]
  invitations: Invitation[]
  isAdmin: boolean
  onInvite: () => void
  reload: () => void
}) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const pending = invitations.filter((i) => i.status === "PENDING")

  async function cancel(invitationId: string) {
    setBusyId(invitationId)
    try {
      await api.post(`/circles/${circleId}/invitations/${invitationId}/cancel`)
      reload()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="detail-grid">
      <section className="panel">
        <div className="panel-head">
          <h2>Members</h2>
          {isAdmin && (
            <button className="btn btn-ghost btn-sm" onClick={onInvite}>
              + Invite
            </button>
          )}
        </div>
        <ul className="member-list">
          {members.map((m) => (
            <li key={m.membershipId} className="member-item">
              <span className="avatar small" aria-hidden="true">
                {initials(m.fullName)}
              </span>
              <div className="member-main">
                <span className="member-name">{m.fullName}</span>
                <span className="member-email">{m.email}</span>
              </div>
              <span className={`role-pill role-${m.role.toLowerCase()}`}>{m.role}</span>
            </li>
          ))}
        </ul>
      </section>

      {isAdmin && (
        <aside className="side-stack">
          <section className="panel">
            <div className="panel-head">
              <h2>Pending invites</h2>
            </div>
            {pending.length === 0 ? (
              <p className="muted">No pending invitations.</p>
            ) : (
              <ul className="invite-list">
                {pending.map((inv) => (
                  <li key={inv.id} className="invite-item">
                    <div className="invite-main">
                      <span className="invite-email">{inv.invitedEmail}</span>
                      <span className="muted">
                        {`${inv.role.toLowerCase()} \u00b7 sent ${formatDate(inv.createdAt)}`}
                      </span>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => cancel(inv.id)}
                      disabled={busyId === inv.id}
                    >
                      Cancel
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      )}
    </div>
  )
}
