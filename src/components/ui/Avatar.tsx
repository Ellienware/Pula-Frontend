import { initials } from "../../lib/format"

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={`avatar avatar-${size}`} aria-hidden="true" title={name}>
      {initials(name)}
    </span>
  )
}
