import { ORDER_STATUS_LABELS, type OrderStatus } from "../../lib/types"

const TONE: Record<OrderStatus, "success" | "pending" | "failed" | ""> = {
  PENDING_PAYMENT: "pending",
  PAYMENT_PROCESSING: "pending",
  PAID: "success",
  PROCESSING: "pending",
  READY: "pending",
  COMPLETED: "success",
  CANCELLED: "failed",
  REFUND_PENDING: "pending",
  REFUNDED: "failed",
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`badge ${TONE[status]}`}>{ORDER_STATUS_LABELS[status]}</span>
}
