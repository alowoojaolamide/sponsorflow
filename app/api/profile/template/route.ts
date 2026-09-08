import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import { getCurrentUser } from "@/lib/auth";

function section(title: string, prompts: string[]) {
  return [
    new Paragraph({ text: title, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }),
    ...prompts.flatMap((p) => [
      new Paragraph({ children: [new TextRun({ text: p, bold: true })] }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: "" }),
    ]),
  ];
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "SponsorFlow Personalization Template",
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph({ text: `Candidate Email: ${user.email ?? ""}` }),
          new Paragraph({ text: `Date: ${new Date().toLocaleDateString("en-GB")}` }),
          new Paragraph({ text: "" }),
          ...section("Section 1: Fintech Positioning", [
            "Your fintech experience (2-3 sentences):",
            "Problems you've solved (1-2 concrete achievements with metrics):",
            "What draws you to fintech:",
          ]),
          ...section("Section 2: Healthcare Positioning", [
            "Your healthcare experience (2-3 sentences):",
            "Problems you've solved (1-2 concrete achievements with metrics):",
            "What draws you to healthcare:",
          ]),
          ...section("Section 3: SaaS Positioning", [
            "Your SaaS experience (2-3 sentences):",
            "Problems you've solved (1-2 concrete achievements with metrics):",
            "What draws you to SaaS:",
          ]),
          ...section("Section 4: Your Professional Story", [
            "Tell us about yourself (1-2 paragraphs):",
            "One thing not on your resume:",
          ]),
          new Paragraph({
            text: "Notes: Be specific and genuine, not generic. Include metrics where possible. Avoid clichés (\"passionate\", \"dynamic\", \"innovative\"). Your voice should come through.",
            spacing: { before: 300 },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": "attachment; filename=Personalization_Template.docx",
    },
  });
}
