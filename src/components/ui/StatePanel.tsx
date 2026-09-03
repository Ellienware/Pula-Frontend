import { ReactNode } from "react"
import { AlertTriangle, Inbox } from "lucide-react"

interface StatePanelProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

/** Empty state — used whenever a collection genuinely has zero items. Always pair with an action. */
export function EmptyState({ icon, title, description, action }: StatePanelProps) {
  return (
    <div className="state-panel">
      <div className="state-panel-icon">{icon ?? <Inbox size={22} aria-hidden="true" />}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}

/** Error state — used when a request failed. Never shows raw HTTP/stack details. */
export function ErrorState({ title = "Something went wrong", description, onRetry }: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <div className="state-panel is-error" role="alert">
      <div className="state-panel-icon">
        <AlertTriangle size={22} aria-hidden="true" />
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {onRetry && (
        <button className="btn btn-ghost btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
