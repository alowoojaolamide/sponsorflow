"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EmailGenerator, type GenerateParams } from "@/components/emails/EmailGenerator";
import { EmailApprovalUI, type EmailDraftView } from "@/components/emails/EmailApprovalUI";
import { LinkedInMessageCard, type LinkedInDraftView } from "@/components/emails/LinkedInMessageCard";
import { PendingRecipientCard, type PendingDraft } from "@/components/emails/PendingRecipientCard";
import { Button } from "@/components/ui/button";

function EmailsPageInner() {
  const searchParams = useSearchParams();
  const initialCompanyId = searchParams.get("company_id") ?? undefined;
  const initialJobTitle = searchParams.get("job_title") ?? undefined;
  const initialJobUrl = searchParams.get("job_url") ?? undefined;

  const [draft, setDraft] = useState<EmailDraftView | null>(null);
  const [pendingDraft, setPendingDraft] = useState<PendingDraft | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCompanyId, setLastCompanyId] = useState<string | undefined>(initialCompanyId);
  const [lastJobParams, setLastJobParams] = useState<{ job_title?: string; job_url?: string; job_description?: string }>({});

  const [linkedinDraft, setLinkedinDraft] = useState<LinkedInDraftView | null>(null);
  const [isGeneratingLinkedIn, setIsGeneratingLinkedIn] = useState(false);
  const [linkedinError, setLinkedinError] = useState<string | null>(null);

  async function generateLinkedIn(params: GenerateParams) {
    if (!params.companyId) return;
    setLinkedinError(null);
    setIsGeneratingLinkedIn(true);
    try {
      const res = await fetch("/api/linkedin/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: params.companyId,
          job_title: params.jobTitle,
          job_url: params.jobUrl,
          job_description: params.jobDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate LinkedIn message");
      setLinkedinDraft(data);
    } catch (err: unknown) {
      setLinkedinError(err instanceof Error ? err.message : "Failed to generate LinkedIn message");
    } finally {
      setIsGeneratingLinkedIn(false);
    }
  }

  async function generate(params: GenerateParams) {
    if (!params.companyId) return;
    setError(null);
    setIsGenerating(true);
    setPendingDraft(null);
    setLastCompanyId(params.companyId);
    const jobParams = { job_title: params.jobTitle, job_url: params.jobUrl, job_description: params.jobDescription };
    setLastJobParams(jobParams);

    try {
      const draftRes = await fetch("/api/emails/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: params.companyId, ...jobParams }),
      });
      const draftData = await draftRes.json();
      if (!draftRes.ok) throw new Error(draftData.error || "Failed to generate draft");

      if (!draftData.to_email) {
        // No website or contact on file to derive a recipient from — hold the
        // generated content and ask for one instead of failing the save.
        setDraft(null);
        setPendingDraft({
          company_id: draftData.company_id,
          company_name: draftData.company_name,
          contact_id: draftData.contact_id,
          subject: draftData.subject,
          body: draftData.body,
          positioning_angle: draftData.positioning_angle,
          confidence: draftData.confidence,
          job_title: draftData.job_title,
          job_url: draftData.job_url,
        });
        return;
      }

      const saveData = await savePersonalizedDraft(draftData, draftData.to_email, draftData.to_name);
      setDraft({
        id: saveData.email.id,
        company_name: draftData.company_name,
        to_name: draftData.to_name,
        to_email: draftData.to_email,
        ai_positioning_angle: draftData.positioning_angle,
        subject: saveData.email.subject,
        body: saveData.email.body,
        status: saveData.email.status,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate draft");
    } finally {
      setIsGenerating(false);
    }
  }

  async function savePersonalizedDraft(
    draftData: { company_id: string; contact_id: string | null; subject: string; body: string; positioning_angle: string; confidence: number; job_title: string | null; job_url: string | null },
    toEmail: string,
    toName: string | null
  ) {
    const saveRes = await fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_id: draftData.company_id,
        contact_id: draftData.contact_id,
        to_email: toEmail,
        to_name: toName,
        subject: draftData.subject,
        body: draftData.body,
        positioning_angle: draftData.positioning_angle,
        confidence: draftData.confidence,
        job_title: draftData.job_title,
        job_url: draftData.job_url,
      }),
    });
    const saveData = await saveRes.json();
    if (!saveRes.ok) throw new Error(saveData.error || "Failed to save draft");
    return saveData;
  }

  async function handleSavePending(toEmail: string) {
    if (!pendingDraft) return;
    setIsBusy(true);
    setError(null);
    try {
      const saveData = await savePersonalizedDraft(pendingDraft, toEmail, null);
      setDraft({
        id: saveData.email.id,
        company_name: pendingDraft.company_name,
        to_name: null,
        to_email: toEmail,
        ai_positioning_angle: pendingDraft.positioning_angle,
        subject: saveData.email.subject,
        body: saveData.email.body,
        status: saveData.email.status,
      });
      setPendingDraft(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRegenerate() {
    if (!lastCompanyId || !draft) return;
    setIsBusy(true);
    setError(null);
    try {
      const draftRes = await fetch("/api/emails/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: lastCompanyId, ...lastJobParams }),
      });
      const draftData = await draftRes.json();
      if (!draftRes.ok) throw new Error(draftData.error || "Failed to regenerate");

      const putRes = await fetch(`/api/emails/${draft.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: draftData.subject, body: draftData.body }),
      });
      const putData = await putRes.json();
      if (!putRes.ok) throw new Error(putData.error || "Failed to save regenerated draft");

      setDraft((d) => (d ? { ...d, subject: putData.email.subject, body: putData.email.body } : d));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to regenerate");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleApprove() {
    if (!draft) return;
    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/emails/${draft.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ready_to_send" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve");
      setDraft((d) => (d ? { ...d, status: "ready_to_send" } : d));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleReject() {
    if (!draft) return;
    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/emails/${draft.id}/reject`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject");
      setDraft(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSaveEdit(subject: string, body: string, toEmail: string) {
    if (!draft) return;
    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/emails/${draft.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, to_email: toEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setDraft((d) =>
        d ? { ...d, subject: data.email.subject, body: data.email.body, to_email: data.email.to_email } : d
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink font-display">Outreach & Email Approvals</h1>
          <p className="text-sm text-shade-50">
            Review every personalized draft before dispatch. Zero autonomous sending ensures strict domain reputation protection.
          </p>
        </div>
        <Link href="/emails/pending">
          <Button variant="outline-light" size="sm">Pending Approvals</Button>
        </Link>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700 dark:bg-red-950/40 dark:border-red-800/60 dark:text-red-300 max-w-2xl">
          {error}
        </div>
      )}
      {linkedinError && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700 dark:bg-red-950/40 dark:border-red-800/60 dark:text-red-300 max-w-2xl">
          {linkedinError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <EmailGenerator
          onGenerate={generate}
          onGenerateLinkedIn={generateLinkedIn}
          isGenerating={isGenerating}
          isGeneratingLinkedIn={isGeneratingLinkedIn}
          initialCompanyId={initialCompanyId}
          initialJobTitle={initialJobTitle}
          initialJobUrl={initialJobUrl}
        />
        {pendingDraft ? (
          <PendingRecipientCard pending={pendingDraft} isBusy={isBusy} onSave={handleSavePending} />
        ) : (
          <EmailApprovalUI
            draft={draft}
            onApprove={handleApprove}
            onReject={handleReject}
            onRegenerate={handleRegenerate}
            onSaveEdit={handleSaveEdit}
            isBusy={isBusy}
          />
        )}
      </div>

      {linkedinDraft && (
        <div className="pt-2">
          <LinkedInMessageCard draft={linkedinDraft} />
        </div>
      )}
    </div>
  );
}

export default function EmailsPage() {
  return (
    <Suspense fallback={<div className="text-sm text-shade-50">Loading...</div>}>
      <EmailsPageInner />
    </Suspense>
  );
}
