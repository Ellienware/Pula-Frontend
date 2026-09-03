import { FormEvent, useState } from "react"
import { Modal } from "../Modal"
import { api } from "../../lib/api"
import type { MoMoRideReport } from "../../lib/types"
import { useToast } from "../../context/ToastContext"

export function ReportDialog({
  taxiId,
  taxiLabel,
  onClose,
}: {
  taxiId: string
  taxiLabel: string
  onClose: () => void
}) {
  const { showToast } = useToast()
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post<MoMoRideReport>("/momoride/reports", {
        targetType: "DRIVER",
        taxiId,
        rideId: null,
        reason,
      })
      showToast("Report submitted — our team will review it.", "success")
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit report")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title={`Report ${taxiLabel}`} onClose={onClose}>
      <form className="modal-form report-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="report-reason">What happened?</label>
          <textarea
            id="report-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe the issue…"
            required
          />
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-danger" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit report"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
