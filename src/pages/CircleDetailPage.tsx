import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ChevronLeft, Plus, ReceiptText } from "lucide-react"
import { api } from "../lib/api"
import type {
  ActivityEvent,
  Circle,
  Contribution,
  Expense,
  Goal,
  Invitation,
  Member,
  PaymentRequestItem,
  RecurringPlan,
} from "../lib/types"
import { CIRCLE_TYPE_LABELS } from "../lib/types"
import { formatMoney } from "../lib/format"
import { ContributeModal } from "../components/ContributeModal"
import { PaymentRequestModal } from "../components/PaymentRequestModal"
import { GoalModal } from "../components/GoalModal"
import { ExpenseModal } from "../components/ExpenseModal"
import { RecurringModal } from "../components/RecurringModal"
import { InviteModal } from "../components/InviteModal"
import { OverviewTab } from "../components/circle/OverviewTab"
import { GoalsTab } from "../components/circle/GoalsTab"
import { MembersTab } from "../components/circle/MembersTab"
import { ExpensesTab } from "../components/circle/ExpensesTab"
import { ActivityTab } from "../components/circle/ActivityTab"
import { RecurringTab } from "../components/circle/RecurringTab"
import { useAuth } from "../context/AuthContext"
import { ErrorState } from "../components/ui/StatePanel"
import { SkeletonCard } from "../components/ui/Skeleton"
import { ProgressBar } from "../components/ui/ProgressBar"

type Tab = "overview" | "goals" | "members" | "money" | "activity" | "recurring"
const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "goals", label: "Goals" },
  { key: "members", label: "Members" },
  { key: "money", label: "Money" },
  { key: "activity", label: "Activity" },
  { key: "recurring", label: "Recurring" },
]

export function CircleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>("overview")

  const [circle, setCircle] = useState<Circle | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequestItem[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [activity, setActivity] = useState<ActivityEvent[]>([])
  const [recurringPlans, setRecurringPlans] = useState<RecurringPlan[]>([])
  const [error, setError] = useState<string | null>(null)

  const [showContribute, setShowContribute] = useState(false)
  const [contributeFor, setContributeFor] = useState<{ request?: PaymentRequestItem | null; goalId?: string } | null>(
    null,
  )
  const [showRequest, setShowRequest] = useState(false)
  const [showGoal, setShowGoal] = useState(false)
  const [showExpense, setShowExpense] = useState(false)
  const [showRecurring, setShowRecurring] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  const load = useCallback(() => {
    if (!id) return
    api.get<Circle>(`/circles/${id}`).then(setCircle).catch((e) => setError(e.message))
    api.get<Member[]>(`/circles/${id}/members`).then(setMembers).catch(() => setMembers([]))
    api.get<Invitation[]>(`/circles/${id}/invitations`).then(setInvitations).catch(() => setInvitations([]))
    api
      .get<Contribution[]>(`/circles/${id}/contributions`)
      .then(setContributions)
      .catch(() => setContributions([]))
    api
      .get<PaymentRequestItem[]>(`/circles/${id}/payment-requests`)
      .then(setPaymentRequests)
      .catch(() => setPaymentRequests([]))
    api.get<Goal[]>(`/circles/${id}/goals`).then(setGoals).catch(() => setGoals([]))
    api.get<Expense[]>(`/circles/${id}/expenses`).then(setExpenses).catch(() => setExpenses([]))
    api.get<ActivityEvent[]>(`/circles/${id}/activity`).then(setActivity).catch(() => setActivity([]))
    api
      .get<RecurringPlan[]>(`/circles/${id}/recurring`)
      .then(setRecurringPlans)
      .catch(() => setRecurringPlans([]))
  }, [id])

  useEffect(load, [load])

  const openRequests = useMemo(() => paymentRequests.filter((r) => r.status === "OPEN"), [paymentRequests])
  const isAdmin = circle?.viewerRole === "OWNER" || circle?.viewerRole === "ADMIN"

  function openContribute(request?: PaymentRequestItem | null, goalId?: string) {
    setContributeFor({ request: request ?? null, goalId })
    setShowContribute(true)
  }

  function closeContribute() {
    setShowContribute(false)
    setContributeFor(null)
  }

  if (error) {
    return (
      <div className="page">
        <ErrorState title="We couldn't load this circle" description={error} onRetry={load} />
        <Link to="/" className="btn btn-ghost" style={{ marginTop: "var(--space-4)" }}>
          ← Back to circles
        </Link>
      </div>
    )
  }

  if (!circle) {
    return (
      <div className="page">
        <SkeletonCard lines={2} />
        <div style={{ height: "var(--space-4)" }} />
        <SkeletonCard lines={5} />
      </div>
    )
  }

  const progress = circle.progressPercent

  return (
    <div className="page">
      <Link to="/" className="back-link">
        <ChevronLeft size={16} aria-hidden="true" /> All circles
      </Link>

      <div className="detail-header">
        <div>
          <span className={`type-badge type-${circle.type.toLowerCase()}`}>{CIRCLE_TYPE_LABELS[circle.type]}</span>
          <h1>{circle.name}</h1>
          {circle.description && <p className="muted">{circle.description}</p>}
        </div>
        <div className="detail-actions">
          <button className="btn btn-ghost" onClick={() => setShowRequest(true)}>
            <ReceiptText size={16} aria-hidden="true" /> Request payment
          </button>
          <button className="btn btn-primary" onClick={() => openContribute(openRequests[0] ?? null)}>
            <Plus size={16} aria-hidden="true" /> Contribute
          </button>
        </div>
      </div>

      <div className="detail-balance-card">
        <div>
          <span className="summary-label">Circle balance</span>
          <span className="balance-value big">{formatMoney(circle.totalContributed, circle.currency)}</span>
          {circle.goalAmount && (
            <span className="goal-value">Goal {formatMoney(circle.goalAmount, circle.currency)}</span>
          )}
        </div>
        {progress !== null && circle.goalAmount && (
          <div className="progress-block">
            <ProgressBar value={circle.totalContributed} max={circle.goalAmount} />
            <span className="progress-pct">{Math.round(progress)}% funded</span>
          </div>
        )}
      </div>

      <div className="tab-bar" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <OverviewTab
          currency={circle.currency}
          contributions={contributions}
          paymentRequests={paymentRequests}
          onContribute={(req) => openContribute(req)}
        />
      )}

      {tab === "goals" && (
        <GoalsTab
          circleId={circle.id}
          currency={circle.currency}
          goals={goals}
          isAdmin={isAdmin}
          onNewGoal={() => setShowGoal(true)}
          onContribute={(goalId) => openContribute(null, goalId)}
          reload={load}
        />
      )}

      {tab === "members" && (
        <MembersTab
          circleId={circle.id}
          members={members}
          invitations={invitations}
          isAdmin={isAdmin}
          onInvite={() => setShowInvite(true)}
          reload={load}
        />
      )}

      {tab === "money" && user && (
        <ExpensesTab
          circleId={circle.id}
          currency={circle.currency}
          expenses={expenses}
          currentUserId={user.id}
          onNewExpense={() => setShowExpense(true)}
          reload={load}
        />
      )}

      {tab === "activity" && <ActivityTab events={activity} />}

      {tab === "recurring" && user && (
        <RecurringTab
          circleId={circle.id}
          currency={circle.currency}
          plans={recurringPlans}
          currentUserId={user.id}
          isAdmin={isAdmin}
          onNewPlan={() => setShowRecurring(true)}
          reload={load}
        />
      )}

      {showContribute && (
        <ContributeModal
          circle={circle}
          goals={goals}
          paymentRequest={contributeFor?.request ?? null}
          initialGoalId={contributeFor?.goalId ?? null}
          onClose={closeContribute}
          onDone={() => {
            closeContribute()
            load()
          }}
        />
      )}

      {showRequest && (
        <PaymentRequestModal
          circle={circle}
          onClose={() => setShowRequest(false)}
          onDone={() => {
            setShowRequest(false)
            load()
          }}
        />
      )}

      {showGoal && (
        <GoalModal
          circle={circle}
          onClose={() => setShowGoal(false)}
          onDone={() => {
            setShowGoal(false)
            load()
          }}
        />
      )}

      {showExpense && user && (
        <ExpenseModal
          circle={circle}
          members={members}
          currentUserId={user.id}
          onClose={() => setShowExpense(false)}
          onDone={() => {
            setShowExpense(false)
            load()
          }}
        />
      )}

      {showRecurring && (
        <RecurringModal
          circle={circle}
          goals={goals}
          onClose={() => setShowRecurring(false)}
          onDone={() => {
            setShowRecurring(false)
            load()
          }}
        />
      )}

      {showInvite && (
        <InviteModal
          circle={circle}
          onClose={() => setShowInvite(false)}
          onDone={() => {
            setShowInvite(false)
            load()
          }}
        />
      )}
    </div>
  )
}
