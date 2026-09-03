import { useState, type FormEvent } from "react"
import { Check, Eye, EyeOff } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { ApiError } from "../lib/api"
import { Button } from "../components/ui/Button"

const VALUE_PROPS = [
  "Create savings circles with shared goals",
  "Track every contribution transparently",
  "Request payments and settle up in seconds",
]

export function AuthPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === "login") {
        await login(email, password)
      } else {
        await register(fullName, email, phone, password)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-hero" aria-hidden="true">
        <div className="auth-hero-inner">
          <span className="brand-mark large">◎</span>
          <h1>MoMoCircle</h1>
          <p>One MoMo account to save together, shop the market, and move around your city.</p>
          <ul className="auth-points">
            {VALUE_PROPS.map((point) => (
              <li key={point}>
                <Check size={16} aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="auth-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              className={mode === "register" ? "active" : ""}
              onClick={() => setMode("register")}
            >
              Create account
            </button>
          </div>

          {mode === "register" && (
            <div className="field">
              <label htmlFor="auth-name">Full name</label>
              <input
                id="auth-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {mode === "register" && (
            <div className="field">
              <label htmlFor="auth-phone">Phone (mobile money)</label>
              <input
                id="auth-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="+27 76 587 1002"
                autoComplete="tel"
              />
              <span className="field-hint">
                Sandbox: numbers ending <code>0000</code> fail, <code>0001</code> stay processing, any other
                succeeds.
              </span>
            </div>
          )}

          <div className="field">
            <label htmlFor="auth-password">Password</label>
            <div className="password-field">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" block loading={busy} size="lg">
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>
      </div>
    </div>
  )
}
