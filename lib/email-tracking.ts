function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function trackedClickUrl(emailId: string, destinationUrl: string): string {
  return `${appUrl()}/api/emails/track/click/${emailId}?url=${encodeURIComponent(destinationUrl)}`;
}

export function trackingPixelUrl(emailId: string): string {
  return `${appUrl()}/api/emails/track/open/${emailId}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Converts the AI-drafted plain-text body (which ends with a literal
 * "[Portfolio] [LinkedIn] [CV]" line per the generation prompt) into an
 * HTML version with real, click-tracked links, plus an invisible open-
 * tracking pixel. Any placeholder with no corresponding URL is dropped
 * rather than left as dead bracketed text.
 */
export function buildTrackedHtmlBody(
  plainBody: string,
  emailId: string,
  links: { portfolioUrl?: string | null; linkedinUrl?: string | null }
): string {
  let html = escapeHtml(plainBody).replace(/\n/g, "<br>\n");

  const replacements: [RegExp, string | null][] = [
    [/\[Portfolio\]/gi, links.portfolioUrl ? `<a href="${trackedClickUrl(emailId, links.portfolioUrl)}">Portfolio</a>` : null],
    [/\[LinkedIn\]/gi, links.linkedinUrl ? `<a href="${trackedClickUrl(emailId, links.linkedinUrl)}">LinkedIn</a>` : null],
    [/\[CV\]/gi, null], // no document storage/upload yet — drop rather than show a dead link
  ];

  for (const [pattern, replacement] of replacements) {
    html = html.replace(pattern, replacement ?? "");
  }
  // Clean up any leftover separator artifacts from a fully-dropped link line, e.g. " |  | "
  html = html.replace(/(<br>\n)?\s*\|\s*(\|\s*)*(<br>\n)?/g, (m) => (m.includes("<br>") ? "<br>\n" : ""));

  const pixel = `<img src="${trackingPixelUrl(emailId)}" width="1" height="1" alt="" style="display:none" />`;

  return `<div>${html}</div>${pixel}`;
}
