import { useState, type FormEvent } from "react"
import { api } from "../../lib/api"
import type { Business } from "../../lib/types"
import { Modal } from "../Modal"

export function CreateBusinessModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.post<Business>("/businesses", {
        name,
        category,
        description: description || null,
        location: location || null,
        contactPhone: contactPhone || null,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create business")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Set up your seller profile" onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Business name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="ABC Catering" />
        </label>
        <label className="field">
          <span>Category</span>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            placeholder="Food & catering"
          />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What do you sell?"
          />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Location / service area</span>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Douala" />
          </label>
          <label className="field">
            <span>Contact phone</span>
            <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+27…" />
          </label>
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
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Creating…" : "Create seller profile"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
