import { useEffect, useState } from "react"
import {
  AlertCircle,
  Bell,
  Check,
  CircleDollarSign,
  Gift,
  Package,
  PartyPopper,
  UserPlus,
} from "lucide-react"
import { api } from "../lib/api"
import type { AppNotification, NotificationType, Page } from "../lib/types"
import { timeAgo } from "../lib/format"
import { PageHeader } from "../components/ui/PageHeader"
import { EmptyState, ErrorState } from "../components/ui/StatePanel"
import { SkeletonCard } from "../components/ui/Skeleton"

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  PAYMENT_REQUEST: CircleDollarSign,
  PAYMENT_SUCCESS: Check,
  PAYMENT_FAILED: AlertCircle,
  CONTRIBUTION_REMINDER: CircleDollarSign,
  GOAL_COMPLETED: PartyPopper,
  CIRCLE_INVITATION: UserPlus,
  ORDER_RECEIVED: Package,
  ORDER_PAID: Package,
  ORDER_PROCESSING: Package,
  ORDER_COMPLETED: Package,
  REFUND: Gift,
  SYSTEM: Bell,
}

const TYPE_TONE: Partial<Record<NotificationType, string>> = {
  PAYMENT_SUCCESS: "dot-teal",
  GOAL_COMPLETED: "dot-gold",
  PAYMENT_FAILED: "dot-danger",
}

export function NotificationsPage() {
  const [page, setPage] = useState<Page<AppNotification> | null>(null)
  const [error, setError] = useState<string | null>(null)

  function load() {
    setError(null)
    api
      .get<Page<AppNotification>>("/notifications?size=50")
      .then(setPage)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load notifications"))
  }

  useEffect(load, [])

  async function markRead(id: string) {
    try {
      await api.post(`/notifications/${id}/read`)
      load()
    } catch {
      // Non-critical — the item just stays marked unread until next refresh.
    }
  }

  return (
    <div className="page">
      <PageHeader title="Activity" subtitle="Payment updates, order events, and circle activity." />

      {error && <ErrorState description={error} onRetry={load} />}

      {page === null ? (
        <div className="stack">
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
        </div>
      ) : page.content.length === 0 ? (
        <EmptyState
          icon={<Bell size={22} aria-hidden="true" />}
          title="Nothing yet"
          description="Payment updates, order events, and circle activity will show up here."
        />
      ) : (
        <ul className="notification-list">
          {page.content.map((n) => {
            const Icon = TYPE_ICON[n.type] ?? Bell
            return (
              <li key={n.id} className={`notification-item ${n.read ? "" : "unread"}`}>
                <span className={`notification-icon ${TYPE_TONE[n.type] ?? ""}`} aria-hidden="true">
                  <Icon size={16} aria-hidden="true" />
                </span>
                <div className="notification-item-body">
                  <p>{n.message}</p>
                  <span className="muted">{timeAgo(n.createdAt)}</span>
                </div>
                {!n.read && (
                  <button className="btn btn-ghost btn-sm" onClick={() => markRead(n.id)}>
                    Mark read
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
