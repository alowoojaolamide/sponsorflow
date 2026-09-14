"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem("sponsorflow-theme", dark ? "dark" : "light");
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  if (isDark === null) {
    // Avoid a flash of the wrong icon before we know the current theme.
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => {
        const next = !isDark;
        setIsDark(next);
        applyTheme(next);
      }}
      className="w-9 h-9 flex items-center justify-center rounded-full border border-hairline-light text-ink hover:bg-hairline-light/60 transition-colors"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
