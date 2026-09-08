import React from "react";
import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-canvas-cream flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link href="/" className="inline-block">
          <span className="font-display text-2xl font-bold tracking-tight text-ink">
            SPONSOR<span className="text-emerald-600 font-extrabold">FLOW</span>
          </span>
        </Link>
      </div>
      <SignupForm />
    </div>
  );
}
