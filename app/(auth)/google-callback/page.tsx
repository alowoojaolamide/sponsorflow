"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      fetch("/api/auth/google-callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            router.push("/");
          } else {
            router.push("/login?error=" + encodeURIComponent(data.error || "Authentication failed"));
          }
        })
        .catch(() => {
          router.push("/login?error=oauth_error");
        });
    } else {
      router.push("/login");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-canvas-cream flex flex-col items-center justify-center p-4">
      <div className="p-8 rounded-lg bg-canvas-light border border-hairline-light shadow-paper-halo text-center max-w-sm w-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-lg font-bold text-ink">Verifying Google Authentication</h2>
        <p className="text-xs text-shade-50 mt-1">Connecting to your SponsorFlow dashboard...</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas-cream" />}>
      <CallbackHandler />
    </Suspense>
  );
}
