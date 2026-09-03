import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { api } from "../lib/api"
import type { Cart } from "../lib/types"
import { useAuth } from "./AuthContext"

interface MarketState {
  cart: Cart | null
  cartCount: number
  refreshCart: () => Promise<void>
  addToCart: (productId: string, quantity: number) => Promise<void>
  updateCartItem: (cartItemId: string, quantity: number) => Promise<void>
  removeCartItem: (cartItemId: string) => Promise<void>
}

const MarketContext = createContext<MarketState | null>(null)

export function MarketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [cart, setCart] = useState<Cart | null>(null)

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(null)
      return
    }
    try {
      setCart(await api.get<Cart>("/cart"))
    } catch {
      // Cart failing to load shouldn't break the rest of the app.
    }
  }, [user])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  async function addToCart(productId: string, quantity: number) {
    setCart(await api.post<Cart>("/cart/items", { productId, quantity }))
  }

  async function updateCartItem(cartItemId: string, quantity: number) {
    setCart(await api.put<Cart>(`/cart/items/${cartItemId}`, { quantity }))
  }

  async function removeCartItem(cartItemId: string) {
    setCart(await api.del<Cart>(`/cart/items/${cartItemId}`))
  }

  const cartCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0

  return (
    <MarketContext.Provider value={{ cart, cartCount, refreshCart, addToCart, updateCartItem, removeCartItem }}>
      {children}
    </MarketContext.Provider>
  )
}

export function useMarket() {
  const ctx = useContext(MarketContext)
  if (!ctx) throw new Error("useMarket must be used within MarketProvider")
  return ctx
}
