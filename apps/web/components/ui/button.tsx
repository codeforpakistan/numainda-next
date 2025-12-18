import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-base font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary Coral button - solid coral background
        default: "bg-accent text-accent-foreground hover:bg-coral-600 active:scale-[0.98]",
        // Secondary Indigo outline
        outline:
          "border-2 border-primary bg-background text-primary hover:bg-indigo-50",
        // Indigo solid button
        primary: "bg-primary text-primary-foreground hover:bg-indigo-700 active:scale-[0.98]",
        // Ghost buttons with coral or indigo text
        ghost: "text-accent hover:bg-coral-50",
        ghostIndigo: "text-primary hover:bg-indigo-50",
        // Link style
        link: "text-accent underline-offset-4 hover:underline",
        linkIndigo: "text-primary underline-offset-4 hover:underline",
        // Destructive
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Success
        success: "bg-success text-success-foreground hover:bg-success/90",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-sm",
        lg: "h-12 rounded-lg px-8 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
