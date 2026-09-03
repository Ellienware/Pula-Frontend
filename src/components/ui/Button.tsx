import { ButtonHTMLAttributes, forwardRef } from "react"

type Variant = "primary" | "secondary" | "ghost" | "danger"
type Size = "sm" | "md" | "lg"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  block?: boolean
}

const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
}

const sizeClass: Record<Size, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
}

/**
 * Standard button. Reuses the existing .btn* classes from index.css so it's a
 * drop-in for any page still using raw <button className="btn btn-primary">.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, block, disabled, children, className, ...rest }, ref) => {
    const classes = ["btn", variantClass[variant], sizeClass[size], block ? "btn-block" : "", className]
      .filter(Boolean)
      .join(" ")

    return (
      <button ref={ref} className={classes} disabled={disabled || loading} {...rest}>
        {loading && <span className="btn-spinner" aria-hidden="true" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"
