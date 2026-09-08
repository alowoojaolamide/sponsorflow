import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline-dark" | "outline-light" | "aloe" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 rounded-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const sizeStyles = {
      sm: "h-9 px-4 text-sm",
      md: "min-h-[44px] px-6 text-base",
      lg: "min-h-[52px] px-8 text-lg",
    };

    const variantStyles = {
      primary: "bg-primary text-on-primary hover:bg-shade-70 focus-visible:ring-primary",
      "outline-dark":
        "bg-canvas-night text-on-primary border-2 border-on-primary hover:bg-on-primary hover:text-canvas-night focus-visible:ring-on-primary",
      "outline-light":
        "bg-canvas-light text-ink border border-ink hover:bg-slate-100 focus-visible:ring-ink",
      aloe: "bg-aloe-10 text-ink hover:bg-[#a9f5c2] focus-visible:ring-aloe-10",
      ghost: "bg-transparent text-ink hover:bg-slate-100 focus-visible:ring-ink",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
