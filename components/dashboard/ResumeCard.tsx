"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, X } from "lucide-react";

type ResumeState = { resume_filename: string | null; resume_uploaded_at: string | null };

export function ResumeCard() {
  const [resume, setResume] = useState<ResumeState | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function refresh() {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) =>
        setResume({
          resume_filename: data.profile?.resume_filename ?? null,
          resume_uploaded_at: data.profile?.resume_uploaded_at ?? null,
        })
      )
      .catch(() => {});
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await fetch("/api/profile/resume", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setUploading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/resume", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove");
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600" /> Resume / CV
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        {!resume ? (
          <p className="text-sm text-shade-50">Checking...</p>
        ) : resume.resume_filename ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <span className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="truncate">{resume.resume_filename}</span>
              </span>
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="text-shade-40 hover:text-red-600 shrink-0"
                title="Remove resume"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-shade-50">
              Attached automatically to every outreach email you send.
            </p>
            <Button
              variant="outline-light"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "Uploading..." : "Replace"}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-shade-50">
              Upload your CV so it&apos;s attached automatically to every outreach email you send.
            </p>
            <Button
              variant="outline-light"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "Uploading..." : "Upload Resume"}
            </Button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />
      </CardContent>
    </Card>
  );
}
