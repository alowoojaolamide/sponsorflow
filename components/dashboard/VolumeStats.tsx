"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Building2, Radar, Briefcase, FileEdit } from "lucide-react";

export type VolumeStatsSummary = {
  companies_total: number;
  companies_scanned: number;
  jobs_discovered_total: number;
  pipeline: { drafted: number };
};

export function VolumeStats({ summary: providedSummary }: { summary?: VolumeStatsSummary | null }) {
  const [fetchedSummary, setFetchedSummary] = useState<VolumeStatsSummary | null>(null);

  useEffect(() => {
    if (providedSummary !== undefined) return;
    fetch("/api/analytics")
      .then((res) => (res.ok ? res.json() : null))
      .then(setFetchedSummary)
      .catch(() => {});
  }, [providedSummary]);

  const summary = providedSummary !== undefined ? providedSummary : fetchedSummary;

  const tiles = [
    {
      title: "Companies Uploaded",
      value: summary?.companies_total,
      href: "/companies",
      icon: Building2,
    },
    {
      title: "Companies Scanned",
      value: summary?.companies_scanned,
      sub: summary ? `of ${summary.companies_total.toLocaleString()}` : undefined,
      href: "/companies",
      icon: Radar,
    },
    {
      title: "Jobs Discovered",
      value: summary?.jobs_discovered_total,
      href: "/jobs",
      icon: Briefcase,
    },
    {
      title: "Emails Drafted",
      value: summary?.pipeline.drafted,
      href: "/emails/pending",
      icon: FileEdit,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <Link key={tile.title} href={tile.href}>
            <Card className="p-5 h-full hover:shadow-floating-modal transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-shade-50">{tile.title}</CardTitle>
                <Icon className="w-4 h-4 text-shade-40" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-ink">
                  {tile.value != null ? tile.value.toLocaleString() : "—"}
                </div>
                {tile.sub && <p className="text-xs text-shade-40 mt-1">{tile.sub}</p>}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
