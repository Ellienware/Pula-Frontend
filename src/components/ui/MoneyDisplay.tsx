import { formatMoney } from "../../lib/format"

type Size = "sm" | "md" | "lg"

interface MoneyDisplayProps {
  amount: number
  currency: string
  size?: Size
  /** Show a leading +/- and tint the number green/red. Useful for activity/transaction rows. */
  signed?: boolean
  label?: string
}

/**
 * Renders a money amount with the whole/decimal split so the significant digits
 * read first and the cents recede — matches how Revolut/Monzo-style products
 * make balances scannable at a glance.
 */
export function MoneyDisplay({ amount, currency, size = "md", signed, label }: MoneyDisplayProps) {
  const formatted = formatMoney(Math.abs(amount), currency)
  // Split "R5,000.00" into "R5,000" and ".00" so decimals can be visually muted.
  const match = formatted.match(/^(.*)([.,](?=\d{2}$)\d{2})$/)
  const whole = match ? match[1] : formatted
  const decimals = match ? match[2] : ""
  const sign = signed ? (amount < 0 ? "-" : amount > 0 ? "+" : "") : ""
  const toneClass = signed ? (amount < 0 ? "money-display-negative" : amount > 0 ? "money-display-positive" : "") : ""

  return (
    <span>
      <span className={`money-display money-display-${size} ${toneClass}`} aria-label={`${label ? label + ": " : ""}${sign}${formatted}`}>
        {sign}
        {whole}
        <span className="money-decimals">{decimals}</span>
      </span>
    </span>
  )
}
