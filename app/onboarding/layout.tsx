import React from "react";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas-cream flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl">{children}</div>
    </div>
  );
}
