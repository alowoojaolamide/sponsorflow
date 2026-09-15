"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useCssVarColor } from "@/lib/use-css-var-color";
import { BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

type IndustryStats = { industry: string; companies: number };

function titleCase(s: string): string {
  const truncated = s.length > 14 ? `${s.slice(0, 13)}…` : s;
  return truncated.charAt(0).toUpperCase() + truncated.slice(1);
}

export function IndustryBreakdownChart() {
  const [industries, setIndustries] = useState<IndustryStats[] | null>(null);
  const gridColor = useCssVarColor("--hairline-light", "#e4e4e7");
  const textColor = useCssVarColor("--shade-50", "#71717a");
  const tooltipBg = useCssVarColor("--canvas-light", "#ffffff");
  const tooltipBorder = useCssVarColor("--hairline-light", "#e4e4e7");
  const inkColor = useCssVarColor("--ink", "#000000");

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setIndustries((d?.by_industry ?? []).slice(0, 6)))
      .catch(() => {});
  }, []);

  return (
    <Card className="p-6 h-full flex flex-col">
      <CardHeader className="px-0 pt-0 flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-600" /> Top Industries
        </CardTitle>
        <Link href="/analytics" className="text-xs text-primary underline underline-offset-4 whitespace-nowrap">
          See full breakdown →
        </Link>
      </CardHeader>
      <CardContent className="px-0 pb-0 flex-1">
        {!industries ? (
          <p className="text-sm text-shade-50 py-12 text-center">Loading...</p>
        ) : industries.length === 0 ? (
          <p className="text-sm text-shade-50 py-12 text-center">No companies yet.</p>
        ) : (
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={industries} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: textColor }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="industry"
                  width={90}
                  tick={{ fontSize: 11, fill: textColor }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={titleCase}
                />
                <Tooltip
                  formatter={(v) => [v, "Companies"]}
                  labelFormatter={(v) => titleCase(String(v ?? ""))}
                  contentStyle={{
                    background: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: 8,
                    fontSize: 12,
                    color: inkColor,
                  }}
                />
                <Bar dataKey="companies" fill="#34d399" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
