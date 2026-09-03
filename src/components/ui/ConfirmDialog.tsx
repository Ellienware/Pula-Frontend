import { useEffect } from "react"
import { Button } from "./Button"

export interface ConfirmRow {
  label: string
  value: string
}

/**
 * Focused confirmation dialog for money-moving or destructive actions
 * (pay taxi, contribute, confirm an AI-proposed payment). Always shows
 * exactly what will happen and requires an explicit Confirm/Cancel choice —
 * never dismissible by clicking outside, unlike a regular Modal.
 */
export function ConfirmDialog({
  title,
  summary,
  rows,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger,
  loading,
  onConfirm,
  onCancel,
}: {
  title: string
  summary?: string
  rows: ConfirmRow[]
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel()
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onCancel])

  return (
    <div className="modal-overlay">
      <div className={`modal confirm-dialog ${danger ? "is-danger" : ""}`} role="alertdialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
        </div>
        <div className="modal-body">
          {summary && <div className="confirm-dialog-summary">{summary}</div>}
          <dl className="confirm-dialog-rows">
            {rows.map((r) => (
              <div className="confirm-dialog-row" key={r.label}>
                <dt>{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="modal-footer confirm-actions">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
