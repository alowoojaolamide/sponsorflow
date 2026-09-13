// Flexible CSV parsing + column auto-detection for company imports.
// Pure functions — safe to import from both client and server code.

export type ParsedCompany = {
  company_name: string;
  website: string | null;
  industry: string | null;
  career_page: string | null;
  personalization_hook: string | null;
  sponsor_status: string | null;
  normalized_name: string;
};

export type ParseResult = {
  companies: ParsedCompany[];
  headers: string[];
  unrecognized_columns: string[];
};

const COLUMN_MAP: Record<string, keyof Omit<ParsedCompany, "normalized_name">> = {
  "company name": "company_name",
  "company": "company_name",
  "companies": "company_name",
  "employer": "company_name",
  "employer name": "company_name",
  "organisation name": "company_name",
  "organization name": "company_name",
  "org name": "company_name",
  "org": "company_name",
  "name": "company_name",
  "business name": "company_name",
  "firm": "company_name",
  "firm name": "company_name",
  "sponsor": "company_name",
  "sponsor name": "company_name",
  "website": "website",
  "url": "website",
  "site": "website",
  "web": "website",
  "domain": "website",
  "industry": "industry",
  "sector": "industry",
  "category": "industry",
  "career page": "career_page",
  "careers page": "career_page",
  "careers url": "career_page",
  "careers": "career_page",
  "personalization hook": "personalization_hook",
  "hook": "personalization_hook",
  "notes": "personalization_hook",
  "note": "personalization_hook",
  "description": "personalization_hook",
  "type & rating": "sponsor_status",
  "sponsor status": "sponsor_status",
  "status": "sponsor_status",
  "rating": "sponsor_status",
  "type": "sponsor_status",
};

/** Mirrors the Postgres normalize_company_name() function for client/server preview. */
export function normalizeCompanyName(raw: string | null | undefined): string {
  if (!raw) return "";
  let cleaned = raw.trim().toLowerCase();
  cleaned = cleaned.replace(
    /\b(limited|ltd|llc|inc|plc|corp|corporation|group|technologies|tech|solutions|uk)\b/gi,
    ""
  );
  cleaned = cleaned.replace(/[^a-z0-9\s]/g, "");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

export function mapColumn(headerName: string): keyof Omit<ParsedCompany, "normalized_name"> | null {
  return COLUMN_MAP[headerName.trim().toLowerCase()] ?? null;
}

/** Minimal RFC4180-ish CSV line splitter: handles quoted fields with embedded commas/quotes. */
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export function parseCSV(text: string): ParseResult {
  const rows = parseCsvRows(text);
  if (rows.length === 0) {
    return { companies: [], headers: [], unrecognized_columns: [] };
  }

  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);

  const columnAssignments = headers.map((h) => mapColumn(h));

  // If nothing matched company_name, fall back to treating the first column
  // as the company name — most simple CSVs list it first even under an
  // unrecognized header (e.g. "Business", "Client", a bare "1").
  if (columnAssignments.length > 0 && !columnAssignments.includes("company_name")) {
    columnAssignments[0] = "company_name";
  }

  const unrecognized_columns = headers.filter((h, i) => !columnAssignments[i]);

  const companies: ParsedCompany[] = dataRows
    .map((row) => {
      const record: Partial<Omit<ParsedCompany, "normalized_name">> = {};
      headers.forEach((_, i) => {
        const field = columnAssignments[i];
        const value = (row[i] ?? "").trim();
        if (field && value) {
          record[field] = value;
        }
      });

      if (!record.company_name) return null;

      return {
        company_name: record.company_name,
        website: record.website ?? null,
        industry: record.industry ?? null,
        career_page: record.career_page ?? null,
        personalization_hook: record.personalization_hook ?? null,
        sponsor_status: record.sponsor_status ?? null,
        normalized_name: normalizeCompanyName(record.company_name),
      };
    })
    .filter((c): c is ParsedCompany => c !== null);

  return { companies, headers, unrecognized_columns };
}
