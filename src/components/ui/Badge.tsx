import { ReactNode } from "react"

type Tone = "neutral" | "success" | "pending" | "failed" | "info"

const toneClass: Record<Tone, string> = {
  neutral: "",
  success: "success",
  pending: "pending",
  failed: "failed",
  info: "info",
}

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge ${toneClass[tone]}`}>{children}</span>
}

/** Maps common backend status strings to a badge tone so callers don't repeat this switch. */
export function statusTone(status: string): Tone {
  const s = status.toUpperCase()
  if (["COMPLETED", "CONFIRMED", "ACTIVE", "SUCCESS", "PAID", "APPROVED"].includes(s)) return "success"
  if (["PENDING", "PROCESSING", "AWAITING", "IN_PROGRESS"].includes(s)) return "pending"
  if (["FAILED", "CANCELLED", "REJECTED", "EXPIRED", "ERROR"].includes(s)) return "failed"
  return "neutral"
}
