"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

type Reply = {
  id: string;
  from_email: string;
  from_name: string | null;
  subject: string | null;
  body: string;
  received_at: string;
  ai_classification: string | null;
  ai_summary: string | null;
};

const BADGES: Record<string, string> = {
  positive: "🟢 Positive",
  interested: "🟡 Interested",
  rejection: "🔴 Not now",
  question: "🔵 Question",
  other: "⚪ Other",
};

export default function RepliesPage() {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/emails/replies")
      .then((res) => res.json())
      .then((data) => setReplies(data.replies ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink font-display">Replies ({replies.length})</h1>
        <p className="text-sm text-shade-50">Inbound replies, auto-classified by sentiment.</p>
      </div>

      {loading ? (
        <p className="text-sm text-shade-50">Loading...</p>
      ) : replies.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-shade-50">
            No replies yet. Once Gmail reply monitoring is connected, they&apos;ll show up here automatically.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {replies.map((r) => (
            <Card key={r.id}>
              <CardContent className="py-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink text-sm">{r.from_name ?? r.from_email}</p>
                  <span className="text-xs">{BADGES[r.ai_classification ?? "other"] ?? BADGES.other}</span>
                </div>
                <p className="text-xs text-shade-50">{r.subject}</p>
                {r.ai_summary && <p className="text-xs text-shade-40 italic">{r.ai_summary}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
