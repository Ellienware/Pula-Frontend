import type { ActivityEvent, ActivityType } from "../../lib/types"
import { timeAgo, initials } from "../../lib/format"

const DOT_CLASS: Partial<Record<ActivityType, string>> = {
  CONTRIBUTION_MADE: "dot-gold",
  GOAL_REACHED: "dot-teal",
  GOAL_CREATED: "dot-teal",
  EXPENSE_ADDED: "dot-ink",
  RECURRING_EXECUTED: "dot-gold",
  MEMBER_JOINED: "dot-teal",
}

export function ActivityTab({ events }: { events: ActivityEvent[] }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Activity</h2>
      </div>
      {events.length === 0 ? (
        <p className="muted">Nothing has happened in this circle yet.</p>
      ) : (
        <ul className="activity-feed">
          {events.map((e) => (
            <li key={e.id} className="activity-item">
              <span className="avatar tiny" aria-hidden="true">
                {e.actorName ? initials(e.actorName) : "\u25ce"}
              </span>
              <span className={`activity-dot ${DOT_CLASS[e.type] ?? "dot-line"}`} aria-hidden="true" />
              <div className="activity-main">
                <p className="activity-message">{e.message}</p>
                <span className="activity-time">{timeAgo(e.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
