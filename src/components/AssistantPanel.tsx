import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ImagePlus, Mic, Send, Sparkles, X } from "lucide-react"
import { api } from "../lib/api"
import { useCurrencyConfig } from "../lib/currencyConfig"
import type { AssistantAction, AssistantResponse, Page, Product } from "../lib/types"
import { formatMoney } from "../lib/format"
import { ConfirmDialog, type ConfirmRow } from "./ui/ConfirmDialog"

interface ChatEntry {
  role: "user" | "assistant"
  text: string
  imageName?: string
  action?: AssistantAction | null
  /** Populated once a SEARCH_MARKET action has run — read-only, so it executes immediately. */
  searchResults?: Product[]
  /** True once this entry's action has been confirmed and executed (or search has run). */
  resolved?: boolean
}

// Minimal typing for the (non-standard, vendor-prefixed) Web Speech API — not in lib.dom.d.ts.
type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  const w = window as any
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const SUGGESTIONS = [
  "Find a ride to Umhlanga",
  "Pay my taxi",
  "Check my circle",
  "Find something on Market",
]

export function AssistantPanel({
  onClose,
  circleId,
  productId,
}: {
  onClose: () => void
  circleId: string | null
  productId: string | null
}) {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<ChatEntry[]>([
    {
      role: "assistant",
      text: "Hi! Tell me what you'd like to do — e.g. \"start a savings circle for rent with a 3000 goal\" or upload a receipt to log a contribution. I'll show you exactly what I'll do and you confirm before anything happens.",
    },
  ])
  const [input, setInput] = useState("")
  const [image, setImage] = useState<{ name: string; dataUrl: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState<AssistantAction | null>(null)
  const [listening, setListening] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const voiceSupported = getSpeechRecognition() !== null

  useEffect(() => {
    return () => recognitionRef.current?.stop()
  }, [])

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImage({ name: file.name, dataUrl: reader.result as string })
    reader.readAsDataURL(file)
  }

  function toggleVoice() {
    const Recognition = getSpeechRecognition()
    if (!Recognition) return // graceful no-op — button is hidden entirely when unsupported

    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    const recognition = new Recognition()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.continuous = false
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript
      if (transcript) {
        setInput((prev) => (prev ? prev + " " + transcript : transcript))
      }
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }

  /** Runs a read-only SEARCH_MARKET proposal immediately — no confirmation needed. */
  async function runSearch(action: AssistantAction, entryIndex: number) {
    const params = new URLSearchParams()
    if (action.parameters.q) params.set("q", String(action.parameters.q))
    if (action.parameters.category) params.set("category", String(action.parameters.category))
    if (action.parameters.maxPrice) params.set("maxPrice", String(action.parameters.maxPrice))
    params.set("size", "6")
    try {
      const page = await api.get<Page<Product>>(`/products?${params.toString()}`)
      setEntries((prev) =>
        prev.map((e, i) => (i === entryIndex ? { ...e, searchResults: page.content, resolved: true } : e)),
      )
    } catch (err) {
      setEntries((prev) => [
        ...prev,
        { role: "assistant", text: err instanceof Error ? err.message : "Could not search the market." },
      ])
    }
  }

  async function send(overrideText?: string) {
    const text = overrideText ?? input
    if (!text.trim() && !image) return
    const userEntry: ChatEntry = { role: "user", text, imageName: image?.name }
    setEntries((prev) => [...prev, userEntry])
    setBusy(true)
    const prompt = text
    const img = image
    setInput("")
    setImage(null)
    try {
      const res = await api.post<AssistantResponse>("/assistant/interpret", {
        message: prompt,
        imageDataUrl: img?.dataUrl ?? null,
        circleId,
        productId,
      })
      let entryIndex = -1
      setEntries((prev) => {
        entryIndex = prev.length
        return [...prev, { role: "assistant", text: res.reply, action: res.action }]
      })
      if (res.action?.requiresConfirmation) {
        setPending(res.action)
      } else if (res.action && res.action.intent === "SEARCH_MARKET") {
        // Read-only — run it immediately instead of waiting for a confirm tap.
        await runSearch(res.action, entryIndex)
      }
    } catch (err) {
      setEntries((prev) => [
        ...prev,
        { role: "assistant", text: err instanceof Error ? err.message : "Something went wrong." },
      ])
    } finally {
      setBusy(false)
    }
  }

  async function confirmAction(action: AssistantAction) {
    if (!action.proposalId) return // defensive — every confirmable action always has one
    setBusy(true)
    setPending(null)
    try {
      const res = await api.post<{ message: string; redirectCircleId?: string }>("/assistant/execute", {
        proposalId: action.proposalId,
        currentCircleId: circleId,
      })
      setEntries((prev) => {
        const next = [...prev]
        // Mark the entry that proposed this action as resolved so its ActionCard shows "Done".
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].action?.proposalId === action.proposalId) {
            next[i] = { ...next[i], resolved: true }
            break
          }
        }
        return [...next, { role: "assistant", text: res.message }]
      })
      if (res.redirectCircleId) {
        navigate(`/circles/${res.redirectCircleId}`)
        onClose()
      }
    } catch (err) {
      setEntries((prev) => [
        ...prev,
        { role: "assistant", text: err instanceof Error ? err.message : "Could not complete the action." },
      ])
    } finally {
      setBusy(false)
    }
  }

  function discardPending() {
    setEntries((prev) => {
      const next = [...prev]
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].action?.proposalId === pending?.proposalId) {
          next[i] = { ...next[i], resolved: true } // hides the Confirm/Cancel row, keeps the card visible
          break
        }
      }
      return next
    })
    setPending(null)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return
      e.preventDefault()
      send()
    }
  }

  const pendingIsFinancial = pending != null && typeof pending.parameters.amount === "number"

  return (
    <div className="assistant-overlay" onClick={onClose}>
      <aside
        className="assistant"
        role="dialog"
        aria-modal="true"
        aria-label="AI assistant"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="assistant-head">
          <div className="row" style={{ gap: 8 }}>
            <span className="assistant-mark" aria-hidden="true">
              <Sparkles size={16} aria-hidden="true" />
            </span>
            <div>
              <h2>Ask MoMo</h2>
              <span className="assistant-sub">Drafts actions — you always confirm</span>
            </div>
          </div>
          <button className="icon-btn" aria-label="Close assistant" onClick={onClose}>
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="assistant-log">
          {entries.map((entry, i) => (
            <div key={i} className={`bubble bubble-${entry.role}`}>
              {entry.imageName && <span className="bubble-image">🖼 {entry.imageName}</span>}
              {entry.text && <p>{entry.text}</p>}
              {entry.action && entry.action.requiresConfirmation && (
                <ActionCard action={entry.action} done={Boolean(entry.resolved)} />
              )}
              {entry.searchResults && <SearchResultsCard products={entry.searchResults} onNavigate={onClose} />}
            </div>
          ))}
          {busy && (
            <div className="bubble bubble-assistant">
              <span className="typing" aria-label="Assistant is thinking">
                <i /> <i /> <i />
              </span>
            </div>
          )}
          {entries.length === 1 && !busy && (
            <div className="assistant-suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="assistant-suggestion-chip" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Non-financial confirmable actions (e.g. creating a circle, adding a member) get this
            lightweight inline bar right under the proposal. Financial actions get the heavier,
            focused ConfirmDialog below instead — see pendingIsFinancial. */}
        {pending && !pendingIsFinancial && (
          <div className="assistant-confirm">
            <p>Run this action?</p>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={discardPending} disabled={busy}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={() => confirmAction(pending)} disabled={busy}>
                Confirm
              </button>
            </div>
          </div>
        )}

        <div className="assistant-input">
          {image && (
            <div className="attach-chip">
              🖼 {image.name}
              <button className="icon-btn tiny" aria-label="Remove image" onClick={() => setImage(null)}>
                <X size={13} aria-hidden="true" />
              </button>
            </div>
          )}
          {listening && <div className="assistant-listening">🎤 Listening…</div>}
          <div className="assistant-input-row">
            <button
              className="icon-btn"
              aria-label="Attach image"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              <ImagePlus size={16} aria-hidden="true" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
            {voiceSupported && (
              <button
                className={`icon-btn ${listening ? "active" : ""}`}
                aria-label={listening ? "Stop voice input" : "Speak your request"}
                onClick={toggleVoice}
                disabled={busy}
                type="button"
              >
                <Mic size={16} aria-hidden="true" />
              </button>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Ask the assistant…"
              disabled={busy}
            />
            <button className="btn btn-primary" onClick={() => send()} disabled={busy || (!input.trim() && !image)} aria-label="Send">
              <Send size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      {pending && pendingIsFinancial && (
        <FinancialConfirm action={pending} busy={busy} onCancel={discardPending} onConfirm={() => confirmAction(pending)} />
      )}
    </div>
  )
}

/** Focused confirmation for money-moving assistant actions — Pay Taxi, Contribute, etc. */
function FinancialConfirm({
  action,
  busy,
  onCancel,
  onConfirm,
}: {
  action: AssistantAction
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const { defaultCurrency } = useCurrencyConfig()
  const amount = action.parameters.amount as number
  const currency = (action.parameters.currency as string) || defaultCurrency

  const rows: ConfirmRow[] = [
    { label: "Amount", value: formatMoney(amount, currency) },
    ...Object.entries(action.parameters)
      .filter(([k]) => k !== "amount" && k !== "currency")
      .map(([k, v]) => ({ label: k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()), value: String(v) })),
  ]

  return (
    <ConfirmDialog
      title={action.summary}
      rows={rows}
      confirmLabel={`Confirm — ${formatMoney(amount, currency)}`}
      loading={busy}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

function ActionCard({ action, done }: { action: AssistantAction; done: boolean }) {
  const { defaultCurrency } = useCurrencyConfig()
  const amount = action.parameters.amount as number | undefined
  const currency = (action.parameters.currency as string) || defaultCurrency
  return (
    <div className={`action-card ${done ? "action-card-done" : ""}`}>
      <div className="action-card-head">
        <span className="action-intent">{done ? "Done" : "I'll do this"}</span>
        {!done && <span className="action-confidence">{Math.round(action.confidence * 100)}% sure</span>}
      </div>
      <p className="action-summary">{action.summary}</p>
      {!done && (
        <dl className="action-params">
          {Object.entries(action.parameters).map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{k === "amount" && amount != null ? formatMoney(amount, currency) : String(v)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

function SearchResultsCard({ products, onNavigate }: { products: Product[]; onNavigate: () => void }) {
  if (products.length === 0) {
    return <p className="muted">No matching products found.</p>
  }
  return (
    <div className="assistant-search-results">
      {products.map((p) => (
        <Link key={p.id} to={`/market/products/${p.id}`} className="assistant-search-result" onClick={onNavigate}>
          <span>{p.name}</span>
          <span className="assistant-search-price">{formatMoney(p.price, p.currency)}</span>
        </Link>
      ))}
    </div>
  )
}
