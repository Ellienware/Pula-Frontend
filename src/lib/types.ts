// Frontend mirror of the Spring Boot DTOs in com.momocircle.dto.*
// Keep these field names in exact sync with the backend records.

export interface User {
  id: string
  email: string
  fullName: string
  phoneNumber: string | null
}

export interface AuthResponse {
  token: string
  user: User
}

export type CircleType = "SAVINGS_GOAL" | "ROTATING" | "EXPENSE_POOL"
export type CircleRole = "OWNER" | "ADMIN" | "MEMBER"

export const CIRCLE_TYPE_LABELS: Record<CircleType, string> = {
  SAVINGS_GOAL: "Savings goal",
  ROTATING: "Rotating (susu)",
  EXPENSE_POOL: "Expense pool",
}

/** GET /api/circles and GET /api/circles/{id} — CircleResponse. */
export interface Circle {
  id: string
  name: string
  description: string | null
  type: CircleType
  currency: string
  goalAmount: number | null
  totalContributed: number
  progressPercent: number | null
  memberCount: number
  ownerId: string
  viewerRole: CircleRole | null
}

/** MemberResponse. */
export interface Member {
  membershipId: string
  userId: string
  fullName: string
  email: string
  role: CircleRole
}

export type PaymentStatus = "PENDING" | "PROCESSING" | "SUCCESSFUL" | "FAILED" | "REFUNDED"

/** ContributionResponse. */
export interface Contribution {
  id: string
  circleId: string
  contributorId: string
  contributorName: string
  amount: number
  currency: string
  status: PaymentStatus
  providerReference: string | null
  goalId: string | null
  goalTitle: string | null
  createdAt: string
}

/** ContributeRequest. */
export interface ContributeRequest {
  amount: number
  paymentRequestId?: string | null
  goalId?: string | null
  idempotencyKey?: string
}

export type PaymentRequestStatus = "OPEN" | "FULFILLED" | "CANCELLED" | "EXPIRED"

/** PaymentRequestResponse. */
export interface PaymentRequestItem {
  id: string
  circleId: string
  requestedByName: string
  amountPerMember: number
  note: string | null
  dueDate: string | null
  status: PaymentRequestStatus
  createdAt: string
}

export type GoalStatus = "ACTIVE" | "REACHED" | "CLOSED"

/** GoalResponse. */
export interface Goal {
  id: string
  circleId: string
  title: string
  description: string | null
  targetAmount: number
  raisedAmount: number
  progressPercent: number | null
  deadline: string | null
  status: GoalStatus
  createdByName: string
  createdAt: string
}

export type SplitType = "EQUAL" | "CUSTOM"

/** ExpenseShareResponse. */
export interface ExpenseShare {
  id: string
  debtorId: string
  debtorName: string
  amount: number
  settled: boolean
  settledAt: string | null
}

/** ExpenseResponse. */
export interface Expense {
  id: string
  circleId: string
  paidById: string
  paidByName: string
  description: string
  amount: number
  currency: string
  splitType: SplitType
  settledAmount: number
  outstandingAmount: number
  shares: ExpenseShare[]
  createdAt: string
}

export type RecurringFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY"
export type RecurringStatus = "ACTIVE" | "PAUSED" | "CANCELLED" | "COMPLETED"
export type RecurringDueStatus = "PENDING" | "PAID" | "MISSED"

/** RecurringDueResponse. */
export interface RecurringDue {
  id: string
  memberId: string
  memberName: string
  amount: number
  status: RecurringDueStatus
  paidAt: string | null
}

/** RecurringPeriodResponse. */
export interface RecurringPeriod {
  id: string
  label: string
  dueDate: string
  expectedCount: number
  paidCount: number
  dues: RecurringDue[]
}

/** RecurringPlanResponse. */
export interface RecurringPlan {
  id: string
  circleId: string
  title: string
  amountPerMember: number
  currency: string
  frequency: RecurringFrequency
  status: RecurringStatus
  nextDueDate: string | null
  goalId: string | null
  goalTitle: string | null
  note: string | null
  createdByName: string
  totalCollected: number
  periods: RecurringPeriod[]
  createdAt: string
}

export type ActivityType =
  | "CIRCLE_CREATED"
  | "MEMBER_JOINED"
  | "MEMBER_INVITED"
  | "INVITATION_ACCEPTED"
  | "INVITATION_DECLINED"
  | "CONTRIBUTION_MADE"
  | "PAYMENT_REQUEST_CREATED"
  | "PAYMENT_REQUEST_REMINDED"
  | "PAYMENT_REQUEST_CANCELLED"
  | "PAYMENT_REQUEST_EXPIRED"
  | "MEMBER_REMOVED"
  | "MEMBER_LEFT"
  | "MEMBER_ROLE_CHANGED"
  | "GOAL_CREATED"
  | "GOAL_REACHED"
  | "GOAL_CLOSED"
  | "EXPENSE_ADDED"
  | "EXPENSE_SHARE_SETTLED"
  | "RECURRING_CREATED"
  | "RECURRING_CANCELLED"
  | "RECURRING_EXECUTED"

/** ActivityResponse. */
export interface ActivityEvent {
  id: string
  circleId: string
  actorId: string | null
  actorName: string | null
  type: ActivityType
  message: string
  createdAt: string
}

export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "EXPIRED"

/** InvitationResponse. */
export interface Invitation {
  id: string
  circleId: string
  circleName: string
  invitedEmail: string
  invitedByName: string
  role: CircleRole
  token: string
  status: InvitationStatus
  expiresAt: string | null
  createdAt: string
}

export interface AssistantAction {
  /** Null for read-only actions (SEARCH_MARKET) that never go through /assistant/execute. */
  proposalId: string | null
  intent: string
  summary: string
  confidence: number
  /** Display only — the server re-derives everything from the stored proposal on confirm, not this. */
  parameters: Record<string, unknown>
  requiresConfirmation: boolean
}

export interface AssistantResponse {
  reply: string
  action: AssistantAction | null
  source?: string
}

// ============================================================
// MoMoMarket
// ============================================================

/** Generic shape of a Spring Data Page<T> JSON response. */
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

/** BusinessResponse. */
export interface Business {
  id: string
  ownerId: string
  ownerName: string
  name: string
  description: string | null
  logoUrl: string | null
  category: string
  location: string | null
  contactPhone: string | null
  contactEmail: string | null
  operatingHours: string[]
  active: boolean
  ratingAverage: number
  ratingCount: number
  createdAt: string
}

export interface CreateBusinessRequest {
  name: string
  description?: string | null
  logoUrl?: string | null
  category: string
  location?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
  operatingHours?: string[]
}

export type ProductStatus = "DRAFT" | "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED"

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  OUT_OF_STOCK: "Out of stock",
  ARCHIVED: "Archived",
}

/** ProductResponse. */
export interface Product {
  id: string
  businessId: string
  businessName: string
  name: string
  description: string | null
  imageUrls: string[]
  category: string
  price: number
  currency: string
  isService: boolean
  stock: number
  status: ProductStatus
  ratingAverage: number
  ratingCount: number
  createdAt: string
}

export interface CreateProductRequest {
  name: string
  description?: string | null
  imageUrls?: string[]
  category: string
  price: number
  currency?: string
  isService: boolean
  stock: number
}

export interface UpdateProductRequest {
  name?: string
  description?: string | null
  imageUrls?: string[]
  category?: string
  price?: number
  stock?: number
  status?: ProductStatus
}

/** CartItemResponse. */
export interface CartLine {
  id: string
  product: Product
  quantity: number
  lineTotal: number
}

/** CartResponse. */
export interface Cart {
  items: CartLine[]
  total: number
  currency: string | null
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_PROCESSING"
  | "PAID"
  | "PROCESSING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUND_PENDING"
  | "REFUNDED"

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAYMENT_PROCESSING: "Processing payment",
  PAID: "Paid",
  PROCESSING: "Preparing",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUND_PENDING: "Refund pending",
  REFUNDED: "Refunded",
}

/** Next legal status hops a seller can move an order to, mirroring OrderStatus.canTransitionTo on the backend. */
export const NEXT_ORDER_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: [],
  PAYMENT_PROCESSING: [],
  PAID: ["PROCESSING", "REFUND_PENDING"],
  PROCESSING: ["READY", "REFUND_PENDING"],
  READY: ["COMPLETED", "REFUND_PENDING"],
  COMPLETED: ["REFUND_PENDING"],
  REFUND_PENDING: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
}

/** OrderItemResponse. */
export interface OrderLine {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

/** OrderResponse. */
export interface Order {
  id: string
  buyerId: string
  buyerName: string
  businessId: string
  businessName: string
  items: OrderLine[]
  subtotal: number
  total: number
  currency: string
  status: OrderStatus
  createdAt: string
}

export type NotificationType =
  | "PAYMENT_REQUEST"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "CONTRIBUTION_REMINDER"
  | "GOAL_COMPLETED"
  | "CIRCLE_INVITATION"
  | "ORDER_RECEIVED"
  | "ORDER_PAID"
  | "ORDER_PROCESSING"
  | "ORDER_COMPLETED"
  | "REFUND"
  | "SYSTEM"

/** NotificationResponse. */
export interface AppNotification {
  id: string
  type: NotificationType
  message: string
  referenceId: string | null
  read: boolean
  createdAt: string
}

export type ReviewTargetType = "BUSINESS" | "PRODUCT"

/** ReviewResponse. */
export interface Review {
  id: string
  authorName: string
  targetType: ReviewTargetType
  targetId: string
  rating: number
  text: string | null
  createdAt: string
}

export interface CreateReviewRequest {
  targetType: ReviewTargetType
  targetId: string
  orderId: string
  rating: number
  text?: string | null
}

/** ReceiptResponse. */
export interface Receipt {
  id: string
  receiptNumber: string
  payerName: string
  payeeLabel: string
  description: string
  amount: number
  currency: string
  status: PaymentStatus
  providerReference: string | null
  createdAt: string
}

/** SellerDashboardResponse. */
export interface SellerDashboard {
  totalSales: number
  todaySales: number
  weekSales: number
  monthSales: number
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  cancelledOrders: number
  topProducts: Product[]
  currency: string | null
}

export interface Taxi { id:string; publicTaxiId:string; registrationNumber:string; paymentCode:string; qrPayload:string; makeModel:string|null; status:string; driverName:string }
export interface DriverResponse { id:string; userId:string; driverName:string; status:string; hasPin:boolean; taxi:Taxi|null }
export interface TaxiPayment { paymentId:string; taxiId:string; publicTaxiId:string; driverName:string; amount:number; currency:string; status:string; providerReference:string|null }
export interface TaxiPaymentRequestItem { id:string; taxiId:string; publicTaxiId:string; driverName:string; amount:number; currency:string; status:string; paymentId:string|null; expiresAt:string|null }
export interface Ride { id:string; driverId:string; driverName:string; origin:string; destination:string; departureTime:string; availableSeats:number; pricePerPassenger:number; currency:string; status:string }
export interface RideBooking { id:string; rideId:string; passengerName:string; status:string; paymentId:string|null; paymentStatus:string }
export interface RideRating { id:string; rideId:string; raterName:string; rating:number; comment:string|null; createdAt:string }
export interface MoMoRideReport { id:string; targetType:string; rideId:string|null; taxiId:string|null; paymentId:string|null; status:string; createdAt:string }
