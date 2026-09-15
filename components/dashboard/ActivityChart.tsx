"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useCssVarColor } from "@/lib/use-css-var-color";
import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type DailyActivity = { date: string; emails_sent: number; jobs_discovered: number };

export function ActivityChart() {
  const [data, setData] = useState<DailyActivity[] | null>(null);
  const gridColor = useCssVarColor("--hairline-light", "#e4e4e7");
  const textColor = useCssVarColor("--shade-40", "#a1a1aa");
  const tooltipBg = useCssVarColor("--canvas-light", "#ffffff");
  const tooltipBorder = useCssVarColor("--hairline-light", "#e4e4e7");
  const inkColor = useCssVarColor("--ink", "#000000");

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setData(d?.daily_activity ?? []))
      .catch(() => {});
  }, []);

  const formatted = (data ?? []).map((d) => ({
    ...d,
    label: new Date(`${d.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));
  const hasActivity = (data ?? []).some((d) => d.emails_sent > 0 || d.jobs_discovered > 0);

  return (
    <Card className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" /> Activity — Last 14 Days
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {!data ? (
          <p className="text-sm text-shade-50 py-16 text-center">Loading...</p>
        ) : !hasActivity ? (
          <p className="text-sm text-shade-50 py-16 text-center">No activity yet in the last 14 days.</p>
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <ComposedChart data={formatted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: textColor }}
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: textColor }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: 8,
                    fontSize: 12,
                    color: inkColor,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="jobs_discovered" name="Jobs Discovered" fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={14} />
                <Line
                  type="monotone"
                  dataKey="emails_sent"
                  name="Emails Sent"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
