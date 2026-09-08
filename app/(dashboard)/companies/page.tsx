import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Upload, Building2, ExternalLink, ShieldCheck } from "lucide-react";

export default function CompaniesPage() {
  const sampleSponsors = [
    { name: "ClearBank", website: "clear.bank", industry: "Fintech / Cloud Banking", hook: "Next-gen clearing banking infrastructure" },
    { name: "Monzo", website: "monzo.com", industry: "Digital Banking", hook: "Consumer financial transparency & money management" },
    { name: "Canva", website: "canva.com", industry: "Design SaaS", hook: "Democratizing visual communication for teams" },
    { name: "Airbnb", website: "airbnb.com", industry: "Marketplace / Travel", hook: "Community trust and design-first platform expansion" },
    { name: "Cleo", website: "web.meetcleo.com", industry: "Fintech / AI Assistant", hook: "Conversational financial budgeting for Gen-Z" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink font-display">Target UK Tech Sponsors</h1>
          <p className="text-sm text-shade-50">
            54 curated London sponsors pre-loaded + support for custom CSV imports with deduplication.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline-light" size="sm" className="gap-2">
            <Upload className="w-4 h-4" /> Import CSV
          </Button>
          <Button variant="primary" size="sm">
            Add Company
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" /> Curated Sponsors ({sampleSponsors.length} shown of 54)
            </CardTitle>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-pill bg-aloe-10 text-ink flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Licensed UK Sponsors
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-hairline-light text-xs font-semibold text-shade-40 uppercase">
                <tr>
                  <th className="pb-3">Company</th>
                  <th className="pb-3">Industry</th>
                  <th className="pb-3">Personalization Hook</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-light text-ink">
                {sampleSponsors.map((c) => (
                  <tr key={c.name} className="hover:bg-canvas-cream/50 transition-colors">
                    <td className="py-3.5 font-medium">
                      <div className="flex items-center gap-1.5">
                        {c.name}
                        <a href={`https://${c.website}`} target="_blank" rel="noreferrer" className="text-shade-40 hover:text-ink">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3.5 text-shade-60">{c.industry}</td>
                    <td className="py-3.5 text-shade-50 text-xs">{c.hook}</td>
                    <td className="py-3.5 text-right">
                      <Button variant="ghost" size="sm" className="text-xs">
                        Draft Email
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
