import { useEffect, useState } from "react"
import { api } from "./api"

export interface CurrencyConfig {
  defaultCurrency: string
  supportedCurrencies: string[]
}

const FALLBACK: CurrencyConfig = { defaultCurrency: "ZAR", supportedCurrencies: ["ZAR"] }

let cached: CurrencyConfig | null = null
let inflight: Promise<CurrencyConfig> | null = null

function fetchCurrencyConfig(): Promise<CurrencyConfig> {
  if (cached) return Promise.resolve(cached)
  if (!inflight) {
    inflight = api
      .get<CurrencyConfig>("/config/currency")
      .then((cfg) => {
        cached = cfg
        return cfg
      })
      .catch(() => {
        // Backend unreachable — fall back rather than crash every form that uses this.
        cached = FALLBACK
        return FALLBACK
      })
  }
  return inflight
}

/**
 * Single source of truth for which currencies this deployment accepts —
 * pulled from GET /api/config/currency (backed by CurrencyProperties) instead
 * of being hard-coded per-component. Fetched once per page load and cached
 * across every component that calls this.
 */
export function useCurrencyConfig(): CurrencyConfig {
  const [config, setConfig] = useState<CurrencyConfig>(cached ?? FALLBACK)

  useEffect(() => {
    let mounted = true
    fetchCurrencyConfig().then((cfg) => {
      if (mounted) setConfig(cfg)
    })
    return () => {
      mounted = false
    }
  }, [])

  return config
}
