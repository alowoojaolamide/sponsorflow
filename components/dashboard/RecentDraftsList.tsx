"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileEdit } from "lucide-react";

type RecentDraft = {
  id: string;
  subject: string;
  company_name: string;
  status: string;
  created_at: string;
};

export function RecentDraftsList() {
  const [drafts, setDrafts] = useState<RecentDraft[] | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setDrafts(d?.recent_drafts ?? []))
      .catch(() => {});
  }, []);

  return (
    <Card className="p-6 h-full flex flex-col">
      <CardHeader className="px-0 pt-0 flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <FileEdit className="w-4 h-4 text-emerald-600" /> Drafts Awaiting Review
        </CardTitle>
        <Link href="/emails/pending" className="text-xs text-primary underline underline-offset-4 whitespace-nowrap">
          See all →
        </Link>
      </CardHeader>
      <CardContent className="px-0 pb-0 flex-1">
        {!drafts ? (
          <p className="text-sm text-shade-50 py-8 text-center">Loading...</p>
        ) : drafts.length === 0 ? (
          <p className="text-sm text-shade-50 py-8 text-center">
            No pending drafts. Go to{" "}
            <Link href="/emails" className="text-primary underline">
              Outreach &amp; Review
            </Link>{" "}
            to generate one.
          </p>
        ) : (
          <div>
            {drafts.map((d) => (
              <Link key={d.id} href="/emails/pending" className="block py-2.5 border-b border-hairline-light last:border-0 hover:bg-canvas-cream/50 -mx-1 px-1 rounded transition-colors">
                <p className="text-sm font-medium text-ink truncate">{d.subject}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-shade-50">
                  <span>{d.company_name}</span>
                  <span>{new Date(d.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
