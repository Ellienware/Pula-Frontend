import { useState, type FormEvent } from "react"
import { api } from "../../lib/api"
import type { Product, ProductStatus } from "../../lib/types"
import { Modal } from "../Modal"

export function ProductFormModal({
  product,
  onClose,
  onSaved,
}: {
  /** Pass an existing product to edit it; omit to create a new one. */
  product?: Product
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(product?.name ?? "")
  const [category, setCategory] = useState(product?.category ?? "")
  const [description, setDescription] = useState(product?.description ?? "")
  const [price, setPrice] = useState(product ? String(product.price) : "")
  const [isService, setIsService] = useState(product?.isService ?? false)
  const [stock, setStock] = useState(product ? String(product.stock) : "0")
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? "ACTIVE")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (product) {
        await api.put<Product>(`/products/${product.id}`, {
          name,
          category,
          description: description || null,
          price: Number(price),
          stock: isService ? undefined : Number(stock),
          status,
        })
      } else {
        await api.post<Product>("/products", {
          name,
          category,
          description: description || null,
          price: Number(price),
          isService,
          stock: isService ? 0 : Number(stock),
        })
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={product ? "Edit listing" : "New listing"} onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jollof rice (tray)" />
        </label>
        <label className="field">
          <span>Category</span>
          <input value={category} onChange={(e) => setCategory(e.target.value)} required placeholder="Food" />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Price</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </label>
          {!isService && (
            <label className="field">
              <span>Stock</span>
              <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
            </label>
          )}
        </div>
        {!product && (
          <label className="field-check">
            <input type="checkbox" checked={isService} onChange={(e) => setIsService(e.target.checked)} />
            <span>This is a service, not a physical product (no stock tracking)</span>
          </label>
        )}
        {product && (
          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as ProductStatus)}>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
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
            {busy ? "Saving…" : product ? "Save changes" : "Create listing"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
