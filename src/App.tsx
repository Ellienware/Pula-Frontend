import { Navigate, Route, Routes } from "react-router-dom"
import { useAuth } from "./context/AuthContext"
import { AuthPage } from "./pages/AuthPage"
import { DashboardPage } from "./pages/DashboardPage"
import { CircleDetailPage } from "./pages/CircleDetailPage"
import { NotificationsPage } from "./pages/NotificationsPage"
import { MarketHomePage } from "./pages/market/MarketHomePage"
import { BusinessProfilePage } from "./pages/market/BusinessProfilePage"
import { ProductDetailPage } from "./pages/market/ProductDetailPage"
import { CartPage } from "./pages/market/CartPage"
import { OrdersPage } from "./pages/market/OrdersPage"
import { OrderDetailPage } from "./pages/market/OrderDetailPage"
import { SellerDashboardPage } from "./pages/market/SellerDashboardPage"
import { AppLayout } from "./components/AppLayout"
import { MoMoRidePage } from "./pages/momoride/MoMoRidePage"

export function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-loading" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <span>Loading MoMoCircle…</span>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    )
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/circles/:id" element={<CircleDetailPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/momoride" element={<MoMoRidePage />} />
        <Route path="/market" element={<MarketHomePage />} />
        <Route path="/market/businesses/:id" element={<BusinessProfilePage />} />
        <Route path="/market/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/sell" element={<SellerDashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}
