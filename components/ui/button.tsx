import * as React from "react"
import { cn } from "@/utils/cn"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default: "bg-white/10 text-white border border-white/10 hover:bg-white/15 shadow-[0_16px_45px_-30px_rgba(255,255,255,0.35)]",
      destructive: "bg-danger/10 text-danger hover:bg-danger/20 border border-danger/10",
      outline: "border border-white/10 bg-transparent text-white hover:bg-white/5",
      secondary: "bg-white/5 text-white hover:bg-white/10 border border-white/10",
      ghost: "text-slate-300 hover:bg-white/5",
      link: "text-primary underline-offset-4 hover:text-white",
    }
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    }
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
