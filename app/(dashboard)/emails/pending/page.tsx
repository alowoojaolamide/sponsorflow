"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmailApprovalUI, type EmailDraftView } from "@/components/emails/EmailApprovalUI";

type PendingEmail = {
  id: string;
  company_id: string;
  subject: string;
  body: string;
  to_name: string | null;
  to_email: string;
  status: string;
  ai_positioning_angle: string | null;
};

export default function PendingEmailsPage() {
  const [drafts, setDrafts] = useState<PendingEmail[]>([]);
  const [readyToSend, setReadyToSend] = useState<PendingEmail[]>([]);
  const [companyNames, setCompanyNames] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [sendMessage, setSendMessage] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    const [draftsRes, readyRes, companiesRes] = await Promise.all([
      fetch("/api/emails?status=draft").then((r) => r.json()),
      fetch("/api/emails?status=ready_to_send").then((r) => r.json()),
      fetch("/api/companies?limit=2000").then((r) => r.json()),
    ]);
    setDrafts(draftsRes.emails ?? []);
    setReadyToSend(readyRes.emails ?? []);
    setCompanyNames(
      Object.fromEntries(
        (companiesRes.companies ?? []).map((c: { id: string; company_name: string }) => [c.id, c.company_name])
      )
    );
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const allEmails = [...drafts, ...readyToSend];
  const selected = allEmails.find((e) => e.id === selectedId) ?? null;
  const selectedDraft: EmailDraftView | null = selected
    ? {
        id: selected.id,
        company_name: companyNames[selected.company_id] ?? "Unknown company",
        to_name: selected.to_name,
        to_email: selected.to_email,
        ai_positioning_angle: selected.ai_positioning_angle,
        subject: selected.subject,
        body: selected.body,
        status: selected.status,
      }
    : null;

  async function withRefresh(action: () => Promise<Response>) {
    setIsBusy(true);
    try {
      await action();
      await refresh();
      setSelectedId(null);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSend(id: string) {
    setIsBusy(true);
    setSendMessage(null);
    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outreach_email_id: id }),
      });
      const data = await res.json();
      setSendMessage(res.ok ? "Sent!" : data.error);
      await refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSendAll() {
    setIsBusy(true);
    setSendMessage(null);
    try {
      const res = await fetch("/api/emails/batch-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_ids: readyToSend.map((e) => e.id) }),
      });
      const data = await res.json();
      setSendMessage(
        res.ok
          ? `Sent ${data.sent}/${data.total}.${data.rate_limit_warning ? ` ${data.rate_limit_warning}` : ""}`
          : data.error
      );
      await refresh();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink font-display">Email Queue</h1>
        <p className="text-sm text-shade-50">Draft review, then send approved emails (respects your daily/hourly rate limit).</p>
      </div>

      {sendMessage && (
        <div className="p-3 rounded-md bg-canvas-cream border border-hairline-light text-sm text-ink">
          {sendMessage}
        </div>
      )}

      {selectedDraft ? (
        <div className="space-y-3">
          <button className="text-sm text-primary underline underline-offset-4" onClick={() => setSelectedId(null)}>
            ← Back to list
          </button>
          <EmailApprovalUI
            draft={selectedDraft}
            isBusy={isBusy}
            onApprove={() =>
              withRefresh(() =>
                fetch(`/api/emails/${selectedDraft.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "ready_to_send" }),
                })
              )
            }
            onReject={() => withRefresh(() => fetch(`/api/emails/${selectedDraft.id}/reject`, { method: "POST" }))}
            onSaveEdit={(subject, body) =>
              withRefresh(() =>
                fetch(`/api/emails/${selectedDraft.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ subject, body }),
                })
              )
            }
          />
        </div>
      ) : loading ? (
        <p className="text-sm text-shade-50">Loading...</p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-shade-50 uppercase tracking-wide">
              Pending Approval ({drafts.length})
            </h2>
            {drafts.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-sm text-shade-50">Nothing to review.</CardContent></Card>
            ) : (
              drafts.map((e) => (
                <Card key={e.id}>
                  <CardContent className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-ink text-sm">
                        {companyNames[e.company_id] ?? "Unknown company"} — {e.to_name ?? e.to_email}
                      </p>
                      <p className="text-xs text-shade-50 mt-0.5">Subject: {e.subject}</p>
                    </div>
                    <button className="text-sm font-medium text-primary underline underline-offset-4" onClick={() => setSelectedId(e.id)}>
                      Review
                    </button>
                  </CardContent>
                </Card>
              ))
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-shade-50 uppercase tracking-wide">
                Ready to Send ({readyToSend.length})
              </h2>
              {readyToSend.length > 0 && (
                <Button variant="primary" size="sm" disabled={isBusy} onClick={handleSendAll}>
                  Send All
                </Button>
              )}
            </div>
            {readyToSend.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-sm text-shade-50">Nothing approved yet.</CardContent></Card>
            ) : (
              readyToSend.map((e) => (
                <Card key={e.id}>
                  <CardContent className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-ink text-sm">
                        {companyNames[e.company_id] ?? "Unknown company"} — {e.to_name ?? e.to_email}
                      </p>
                      <p className="text-xs text-shade-50 mt-0.5">Subject: {e.subject}</p>
                    </div>
                    <Button variant="outline-light" size="sm" disabled={isBusy} onClick={() => handleSend(e.id)}>
                      Send
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}
