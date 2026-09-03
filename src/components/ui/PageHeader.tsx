import { ReactNode } from "react"

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <div className="page-header-eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p className="page-header-sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  )
}
