import { useCallback, useEffect, useState } from "react"
import { api } from "../../lib/api"
import type { Page, Review, ReviewTargetType } from "../../lib/types"
import { timeAgo } from "../../lib/format"
import { StarRating } from "./StarRating"

export function ReviewSection({
  targetType,
  targetId,
  /** Order id the current viewer completed against this target, if any — enables the "write a review" form. */
  eligibleOrderId,
}: {
  targetType: ReviewTargetType
  targetId: string
  eligibleOrderId?: string | null
}) {
  const [reviews, setReviews] = useState<Review[] | null>(null)
  const [rating, setRating] = useState(5)
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const load = useCallback(() => {
    api
      .get<Page<Review>>(`/reviews?targetType=${targetType}&targetId=${targetId}`)
      .then((page) => setReviews(page.content))
      .catch(() => setReviews([]))
  }, [targetType, targetId])

  useEffect(load, [load])

  async function submitReview() {
    if (!eligibleOrderId) return
    setBusy(true)
    setError(null)
    try {
      await api.post("/reviews", { targetType, targetId, orderId: eligibleOrderId, rating, text: text || null })
      setSubmitted(true)
      setText("")
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit review")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="stack">
      <h2>Reviews</h2>

      {eligibleOrderId && !submitted && (
        <div className="card stack">
          <strong>Rate your purchase</strong>
          <StarRating value={rating} onChange={setRating} />
          <textarea
            className="review-textarea"
            rows={2}
            placeholder="Optional: share a few words about your experience"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <div>
            <button className="btn btn-primary btn-sm" onClick={submitReview} disabled={busy}>
              {busy ? "Submitting…" : "Submit review"}
            </button>
          </div>
        </div>
      )}
      {submitted && <p className="muted">Thanks — your review is posted below.</p>}

      {reviews === null ? (
        <p className="muted">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="muted">No reviews yet.</p>
      ) : (
        <ul className="review-list">
          {reviews.map((r) => (
            <li key={r.id} className="review-item">
              <div className="row between">
                <strong>{r.authorName}</strong>
                <span className="muted">{timeAgo(r.createdAt)}</span>
              </div>
              <StarRating value={r.rating} />
              {r.text && <p>{r.text}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
