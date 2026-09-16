"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, MailOpen, MessageSquare, Calendar } from "lucide-react";

export type DashboardStatsSummary = {
  emails_sent_today: number;
  daily_limit: number;
  open_rate: number;
  reply_rate: number;
  interviews_scheduled: number;
};

/**
 * Accepts an already-fetched `summary` (so a page rendering several of
 * these analytics widgets together can fetch /api/analytics once and pass
 * it down) — falls back to fetching its own copy when used standalone.
 */
export function DashboardStats({ summary: providedSummary }: { summary?: DashboardStatsSummary | null }) {
  const [fetchedSummary, setFetchedSummary] = useState<DashboardStatsSummary | null>(null);

  useEffect(() => {
    if (providedSummary !== undefined) return;
    fetch("/api/analytics")
      .then((res) => (res.ok ? res.json() : null))
      .then(setFetchedSummary)
      .catch(() => {});
  }, [providedSummary]);

  const summary = providedSummary !== undefined ? providedSummary : fetchedSummary;

  const stats = [
    {
      title: "Emails Sent",
      value: summary ? summary.emails_sent_today : "—",
      change: `Daily cap: ${summary?.daily_limit ?? 20}`,
      icon: Send,
    },
    { title: "Open Rate", value: summary ? `${summary.open_rate}%` : "—", change: "Target: >40%", icon: MailOpen },
    {
      title: "Replies Received",
      value: summary ? `${summary.reply_rate}%` : "—",
      change: "Target: 10–20%",
      icon: MessageSquare,
    },
    {
      title: "Interviews Booked",
      value: summary ? summary.interviews_scheduled : "—",
      change: "Goal: 5–10",
      icon: Calendar,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="p-5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-shade-50">
                {stat.title}
              </CardTitle>
              <Icon className="w-4 h-4 text-shade-40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-ink">{stat.value}</div>
              <p className="text-xs text-shade-40 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
