"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserCheck, Building2, Mail, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Profile & Setup", href: "/profile", icon: UserCheck },
  { name: "Target Companies", href: "/companies", icon: Building2 },
  { name: "Outreach & Review", href: "/emails", icon: Mail },
  { name: "Analytics & Pipeline", href: "/analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-hairline-light bg-canvas-light min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <nav className="space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-on-primary"
                  : "text-shade-60 hover:bg-slate-100 hover:text-ink"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 rounded-lg bg-canvas-cream border border-hairline-light text-xs text-shade-60 space-y-1">
        <p className="font-semibold text-ink">Phase 1: Validation</p>
        <p>Goal: 5–10 interviews from 54 curated UK Tech Sponsors in 6–8 weeks.</p>
      </div>
    </aside>
  );
}
