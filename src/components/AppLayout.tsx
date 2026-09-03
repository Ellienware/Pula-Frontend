import { useEffect, useState, type ReactNode } from "react"
import { Link, NavLink, useLocation } from "react-router-dom"
import {
  Home,
  LogOut,
  MessageCircleMore,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Store,
  Car,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useMarket } from "../context/MarketContext"
import { api } from "../lib/api"
import { initials } from "../lib/format"
import type { AppNotification, Page } from "../lib/types"
import { AssistantPanel } from "./AssistantPanel"

// Home doubles as the "Circle" hub (it lists and summarizes the user's circles),
// so it isn't duplicated as its own nav item — these four map 1:1 to real routes.
const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/market", label: "Market", icon: Store },
  { to: "/momoride", label: "Ride", icon: Car },
  { to: "/notifications", label: "Activity", icon: ReceiptText },
]

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const { cartCount } = useMarket()
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const location = useLocation()
  // The assistant needs to know which circle/product (if any) is currently open, so a
  // confirmed CONTRIBUTE/ADD_MEMBER/... or ADD_TO_CART action has a target to act on.
  const circleMatch = location.pathname.match(/^\/circles\/([^/]+)/)
  const currentCircleId = circleMatch ? circleMatch[1] : null
  const productMatch = location.pathname.match(/^\/market\/products\/([^/]+)/)
  const currentProductId = productMatch ? productMatch[1] : null

  useEffect(() => {
    if (!user) return
    api
      .get<Page<AppNotification>>("/notifications?size=20")
      .then((page) => setUnreadCount(page.content.filter((n) => !n.read).length))
      .catch(() => setUnreadCount(0))
  }, [user, location.pathname])

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            ◎
          </span>
          <span className="brand-name">MoMoCircle</span>
        </Link>

        <nav className="primary-nav-desktop" aria-label="Primary">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? "active" : undefined)}>
              <Icon size={16} aria-hidden="true" />
              {label}
              {label === "Activity" && unreadCount > 0 && <span className="nav-dot" aria-hidden="true" />}
            </NavLink>
          ))}
        </nav>

        <div className="topbar-actions">
          <NavLink to="/cart" className="icon-link" aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}>
            <ShoppingCart size={18} aria-hidden="true" />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </NavLink>
          <button className="btn btn-secondary btn-sm assistant-trigger" onClick={() => setAssistantOpen(true)}>
            <MessageCircleMore size={16} aria-hidden="true" />
            <span className="assistant-trigger-label">Ask MoMo</span>
          </button>
          <div className="user-chip" title={user?.email}>
            <span className="avatar avatar-md" aria-hidden="true">
              {initials(user?.fullName ?? "")}
            </span>
            <span className="user-name">{user?.fullName}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout} aria-label="Sign out">
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Secondary utility row — kept for existing deep links (Orders/Sell) that don't fit
          the primary four-item nav without crowding it. */}
      <nav className="secondary-nav" aria-label="More">
        <div className="secondary-nav-inner">
          <NavLink to="/orders" className={({ isActive }) => (isActive ? "active" : undefined)}>
            <ShoppingBag size={14} aria-hidden="true" /> Orders
          </NavLink>
          <NavLink to="/sell" className={({ isActive }) => (isActive ? "active" : undefined)}>
            <Store size={14} aria-hidden="true" /> Sell on Market
          </NavLink>
        </div>
      </nav>

      <main className="content">{children}</main>

      {/* Compact mobile navigation — replaces the desktop nav row under ~640px. */}
      <nav className="mobile-tabbar" aria-label="Primary">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? "active" : undefined)}>
            <span className="mobile-tabbar-icon">
              <Icon size={22} aria-hidden="true" />
              {label === "Activity" && unreadCount > 0 && <span className="nav-dot" aria-hidden="true" />}
            </span>
            {label}
          </NavLink>
        ))}
      </nav>

      <button className="assistant-fab" onClick={() => setAssistantOpen(true)} aria-label="Ask MoMo assistant">
        <MessageCircleMore size={22} aria-hidden="true" />
      </button>

      {assistantOpen && (
        <AssistantPanel
          onClose={() => setAssistantOpen(false)}
          circleId={currentCircleId}
          productId={currentProductId}
        />
      )}
    </div>
  )
}
