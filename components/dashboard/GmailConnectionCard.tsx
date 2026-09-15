"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2 } from "lucide-react";

export function GmailConnectionCard() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<{ configured: boolean; connected: boolean; gmail_email: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/gmail/status")
      .then((res) => res.json())
      .then(setStatus);
  }, [searchParams]);

  const error = searchParams.get("gmail_error");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="w-4 h-4 text-emerald-600" /> Gmail Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">
            Gmail connection failed: {decodeURIComponent(error)}
          </p>
        )}
        {!status ? (
          <p className="text-sm text-shade-50">Checking...</p>
        ) : !status.configured ? (
          <p className="text-sm text-shade-50">
            Gmail sending isn&apos;t configured yet — a Google Cloud OAuth client needs to be set up first.
          </p>
        ) : status.connected ? (
          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Connected as {status.gmail_email}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-shade-50">
              Connect Gmail to send approved emails directly from your account.
            </p>
            <a href="/api/gmail/connect">
              <Button variant="outline-light" size="sm">Connect Gmail</Button>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
