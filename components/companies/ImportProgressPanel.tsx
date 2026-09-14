"use client";

import React from "react";
import { CheckCircle2, Building2 } from "lucide-react";

export function ImportProgressPanel({
  total,
  processed,
  imported,
  duplicates,
  recentNames,
  done,
}: {
  total: number;
  processed: number;
  imported: number;
  duplicates: number;
  recentNames: string[];
  done: boolean;
}) {
  const percent = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-6 rounded-xl border border-hairline-light bg-gradient-to-b from-canvas-cream to-canvas-light overflow-hidden relative">
      <div className={`absolute inset-0 ${done ? "" : "animate-pulse"} bg-aloe-10/5`} />

      <div className="relative w-44 h-44">
        <svg className="w-44 h-44 -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="10" className="text-hairline-light" />
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={done ? "text-emerald-500" : "text-primary"}
            style={{ transition: "stroke-dashoffset 0.4s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {done ? (
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          ) : (
            <span className="text-3xl font-bold text-ink font-display">{percent}%</span>
          )}
        </div>
      </div>

      <div className="relative mt-6 text-center">
        <p className="text-sm font-semibold text-ink">
          {processed.toLocaleString()} / {total.toLocaleString()} processed
        </p>
        <p className="text-xs text-shade-50 mt-1">
          {imported.toLocaleString()} imported · {duplicates.toLocaleString()} duplicates
        </p>
      </div>

      <div className="relative mt-8 w-full max-w-xs space-y-1.5 min-h-[140px]">
        {recentNames.map((name, i) => (
          <div
            key={`${name}-${i}`}
            className="flex items-center gap-2 text-xs text-shade-60 bg-canvas-light/80 rounded-md px-3 py-2 border border-hairline-light"
            style={{ opacity: 1 - i * 0.15 }}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
