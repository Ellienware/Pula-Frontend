import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Car, PiggyBank, Store, Wallet } from "lucide-react"
import { api } from "../lib/api"
import type { AppNotification, Circle, Invitation, Page } from "../lib/types"
import { timeAgo } from "../lib/format"
import { useAuth } from "../context/AuthContext"
import { CreateCircleModal } from "../components/CreateCircleModal"
import { CircleCard } from "../components/circle/CircleCard"
import { PageHeader } from "../components/ui/PageHeader"
import { Card } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { StatCard } from "../components/ui/StatCard"
import { MoneyDisplay } from "../components/ui/MoneyDisplay"
import { EmptyState, ErrorState } from "../components/ui/StatePanel"
import { SkeletonCard, SkeletonGrid } from "../components/ui/Skeleton"

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export function DashboardPage() {
  const { user } = useAuth()
  const [circles, setCircles] = useState<Circle[] | null>(null)
  const [invites, setInvites] = useState<Invitation[]>([])
  const [activity, setActivity] = useState<AppNotification[] | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setError(null)
    api.get<Circle[]>("/circles").then(setCircles).catch((e) => setError(e.message))
    api.get<Invitation[]>("/invitations").then(setInvites).catch(() => setInvites([]))
    api
      .get<Page<AppNotification>>("/notifications?size=5")
      .then((page) => setActivity(page.content))
      .catch(() => setActivity([]))
  }, [])

  useEffect(load, [load])

  async function respondInvite(token: string, accept: boolean) {
    try {
      await api.post(`/invitations/${accept ? "accept" : "decline"}`, { token })
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update invitation")
    }
  }

  // Circles can be in different currencies — summing them into one number would silently mix
  // e.g. XAF and GHS together. Group by currency instead; almost every user has just one, so
  // this reads identically to a single total in the common case.
  const savedByCurrency = (circles ?? []).reduce<Record<string, number>>((acc, c) => {
    acc[c.currency] = (acc[c.currency] ?? 0) + c.totalContributed
    return acc
  }, {})
  const currencyTotals = Object.entries(savedByCurrency)
  const firstName = user?.fullName?.split(" ")[0] ?? "there"

  return (
    <div className="page">
      <PageHeader
        eyebrow={`${greeting()}, ${firstName}`}
        title="Your MoMo overview"
        subtitle="Save together, shop the market, and move around the city — all from one account."
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            + New circle
          </Button>
        }
      />

      {invites.length > 0 && (
        <Card className="invite-banner">
          <h2 className="invite-banner-title">Pending invitations</h2>
          <ul className="invite-banner-list">
            {invites.map((inv) => (
              <li key={inv.id} className="invite-banner-item">
                <div>
                  <strong>{inv.circleName}</strong>
                  <span className="muted"> — invited by {inv.invitedByName} as {inv.role.toLowerCase()}</span>
                </div>
                <div className="row">
                  <Button variant="ghost" size="sm" onClick={() => respondInvite(inv.token, false)}>
                    Decline
                  </Button>
                  <Button size="sm" onClick={() => respondInvite(inv.token, true)}>
                    Accept
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {error && <ErrorState description={error} onRetry={load} />}

      {/* --- Financial summary --- */}
      {circles === null ? (
        <div className="grid grid-2" style={{ marginBottom: "var(--space-6)" }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        circles.length > 0 && (
          <div className="grid grid-2 dashboard-summary">
            <StatCard
              icon={<Wallet size={16} aria-hidden="true" />}
              label="Total saved"
              value={
                <div className="row wrap" style={{ gap: 6 }}>
                  {currencyTotals.map(([currency, amount]) => (
                    <MoneyDisplay key={currency} amount={amount} currency={currency} size="lg" />
                  ))}
                </div>
              }
            />
            <StatCard
              icon={<PiggyBank size={16} aria-hidden="true" />}
              label="Active circles"
              value={<span className="money-display money-display-lg">{circles.length}</span>}
              hint={invites.length > 0 ? `${invites.length} pending invite${invites.length === 1 ? "" : "s"}` : undefined}
            />
          </div>
        )
      )}

      {/* --- Quick actions --- */}
      <section className="quick-actions" aria-label="Quick actions">
        <Link to="/momoride" className="quick-action">
          <span className="quick-action-icon quick-action-teal">
            <Car size={18} aria-hidden="true" />
          </span>
          Pay taxi
        </Link>
        <Link to="/market" className="quick-action">
          <span className="quick-action-icon quick-action-gold">
            <Store size={18} aria-hidden="true" />
          </span>
          Shop market
        </Link>
        <button className="quick-action" onClick={() => setShowCreate(true)}>
          <span className="quick-action-icon quick-action-teal">
            <PiggyBank size={18} aria-hidden="true" />
          </span>
          Create circle
        </button>
      </section>

      {/* --- Circles --- */}
      <div className="section-head">
        <h2>Your circles</h2>
      </div>
      {circles === null ? (
        <SkeletonGrid count={3} />
      ) : circles.length === 0 ? (
        <EmptyState
          title="You haven't joined a circle yet"
          description="Create your first circle to start saving with friends, family, or your community."
          action={<Button onClick={() => setShowCreate(true)}>Create a circle</Button>}
        />
      ) : (
        <div className="grid grid-3 circle-grid">
          {circles.map((c) => (
            <CircleCard key={c.id} circle={c} />
          ))}
        </div>
      )}

      {/* --- Recent activity --- */}
      <div className="section-head" style={{ marginTop: "var(--space-8)" }}>
        <h2>Recent activity</h2>
        <Link to="/notifications" className="section-head-link">
          View all <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
      {activity === null ? (
        <SkeletonCard lines={4} />
      ) : activity.length === 0 ? (
        <EmptyState title="Nothing yet" description="Your recent activity will appear here." />
      ) : (
        <Card flush>
          <ul className="notification-list notification-list-flush">
            {activity.map((n) => (
              <li key={n.id} className={`notification-item ${n.read ? "" : "unread"}`}>
                <div>
                  <p>{n.message}</p>
                  <span className="muted">{timeAgo(n.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* --- Explore --- */}
      <div className="section-head" style={{ marginTop: "var(--space-8)" }}>
        <h2>Explore MoMo</h2>
      </div>
      <div className="grid grid-2 explore-grid">
        <Link to="/market" className="explore-card explore-card-gold">
          <Store size={22} aria-hidden="true" />
          <div>
            <h3>MoMoMarket</h3>
            <p>Buy and sell with your community.</p>
          </div>
          <ArrowRight size={18} aria-hidden="true" className="explore-card-arrow" />
        </Link>
        <Link to="/momoride" className="explore-card explore-card-teal">
          <Car size={22} aria-hidden="true" />
          <div>
            <h3>MoMoRide</h3>
            <p>Pay taxis and find rides around your city.</p>
          </div>
          <ArrowRight size={18} aria-hidden="true" className="explore-card-arrow" />
        </Link>
      </div>

      {showCreate && (
        <CreateCircleModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            load()
          }}
        />
      )}
    </div>
  )
}
