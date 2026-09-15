"use client";

import { useEffect, useState } from "react";

/**
 * Resolves a globals.css RGB-triple custom property (e.g. "--shade-40") into
 * a concrete `rgb(...)` string, reactively updating when the `dark` class
 * toggles on <html>. Chart libraries (recharts) need literal color values —
 * they can't consume Tailwind classes or CSS vars directly.
 */
export function useCssVarColor(varName: string, fallback: string): string {
  const [color, setColor] = useState(fallback);

  useEffect(() => {
    function read() {
      const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      if (val) setColor(`rgb(${val})`);
    }
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [varName]);

  return color;
}
