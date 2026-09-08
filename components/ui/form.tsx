import React from "react";
import { cn } from "@/lib/utils";

export function FormField({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2 mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function FormMessage({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;
  return (
    <p className={cn("text-xs font-medium text-red-600 mt-1", className)} {...props}>
      {children}
    </p>
  );
}
