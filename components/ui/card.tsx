import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "light" | "cinematic" | "featured-aloe" | "pistachio-band";
}

export function Card({
  className,
  variant = "light",
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    light: "bg-canvas-light text-ink border border-hairline-light rounded-lg shadow-paper-halo",
    cinematic: "bg-canvas-night-elevated text-on-primary border border-hairline-dark rounded-lg shadow-cinematic-inset",
    "featured-aloe": "bg-aloe-10 text-ink border border-emerald-300 rounded-lg shadow-paper-halo",
    "pistachio-band": "bg-pistachio-10 text-ink border border-green-200 rounded-lg p-8",
  };

  return (
    <div
      className={cn("p-6 transition-all duration-200", variantStyles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1.5 pb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-xl font-semibold leading-none tracking-tight", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-shade-50 mt-1", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("pt-0", className)} {...props}>{children}</div>;
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center pt-4", className)} {...props}>
      {children}
    </div>
  );
}
