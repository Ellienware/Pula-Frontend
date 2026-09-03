import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react"
import { CheckCircle2, XCircle, Info } from "lucide-react"

type ToastTone = "default" | "success" | "error"
interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const icon: Record<ToastTone, ReactNode> = {
  default: <Info size={16} aria-hidden="true" />,
  success: <CheckCircle2 size={16} aria-hidden="true" />,
  error: <XCircle size={16} aria-hidden="true" />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const showToast = useCallback((message: string, tone: ToastTone = "default") => {
    const id = nextId.current++
    setToasts((prev) => [...prev, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone !== "default" ? t.tone : ""}`} role="status">
            {icon[t.tone]}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within a ToastProvider")
  return ctx
}
