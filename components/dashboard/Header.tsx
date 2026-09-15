"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Header() {
  const [limit, setLimit] = useState<{ daily_used: number; daily_limit: number } | null>(null);

  useEffect(() => {
    fetch("/api/emails/rate-limit")
      .then((res) => (res.ok ? res.json() : null))
      .then(setLimit)
      .catch(() => {});
  }, []);

  return (
    <header className="h-16 border-b border-hairline-light bg-canvas-light px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight text-ink">
            SPONSOR<span className="text-emerald-600 font-extrabold">FLOW</span>
          </span>
        </Link>
        <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-semibold rounded-pill bg-aloe-10 text-on-aloe">
          UK Visa Pipeline
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center text-xs text-shade-50 font-medium mr-2">
          Daily limit: <span className="text-ink font-semibold ml-1">{limit ? `${limit.daily_used}/${limit.daily_limit}` : "—"} sent</span>
        </div>
        <ThemeToggle />
        <Link href="/profile">
          <Button variant="outline-light" size="sm">
            Profile
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            fetch("/api/auth/logout", { method: "POST" }).then(() => {
              window.location.href = "/login";
            });
          }}
        >
          Log out
        </Button>
      </div>
    </header>
  );
}
