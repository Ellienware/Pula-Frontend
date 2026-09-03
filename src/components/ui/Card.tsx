import { HTMLAttributes, ReactNode } from "react"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  interactive?: boolean
  flush?: boolean
}

export function Card({ children, interactive, flush, className, ...rest }: CardProps) {
  const classes = ["card", interactive ? "card-interactive" : "", flush ? "card-flush" : "", className]
    .filter(Boolean)
    .join(" ")
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}
