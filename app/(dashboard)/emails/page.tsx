import React from "react";
import { EmailGenerator } from "@/components/emails/EmailGenerator";
import { EmailApprovalUI } from "@/components/emails/EmailApprovalUI";

export default function EmailsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink font-display">Outreach & Email Approvals</h1>
        <p className="text-sm text-shade-50">
          Review every personalized draft before dispatch. Zero autonomous sending ensures strict domain reputation protection.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <EmailGenerator />
        <EmailApprovalUI />
      </div>
    </div>
  );
}
