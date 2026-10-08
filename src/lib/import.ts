import { parseLooseDate } from "./dates";
import { CHANNELS, OUTBOUND_CHANNELS, SOURCES, type Channel, type Source } from "./options";

// Pure helpers for turning spreadsheet rows into contacts. The server action does the writes.

export const IMPORT_FIELDS = {
  name: "Full name",
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  company: "Company",
  role: "Role / title",
  linkedinUrl: "LinkedIn URL",
  source: "Source",
  nextStep: "Next step",
  nextStepDate: "Next step date",
  notes: "Notes",
  lastTouchDate: "Last contacted date",
  lastTouchChannel: "Last contacted via",
} as const;

export type ImportField = keyof typeof IMPORT_FIELDS;
/** Spreadsheet column header for each field, or undefined when not mapped. */
export type ColumnMapping = Partial<Record<ImportField, string>>;

export type ImportRow = {
  name: string;
  email: string | null;
  company: string | null;
  role: string | null;
  linkedinUrl: string | null;
  source: Source | null;
  nextStep: string | null;
  nextStepDate: string | null;
  notes: string | null;
  lastTouchDate: string | null;
  lastTouchChannel: Channel | null;
};

export type SkippedRow = { line: number; reason: string };

const ALIASES: Record<ImportField, string[]> = {
  name: ["name", "full name", "contact", "contact name", "person"],
  firstName: ["first name", "first", "given name"],
  lastName: ["last name", "last", "surname", "family name"],
  email: ["email", "email address", "e-mail", "work email"],
  company: ["company", "organization", "organisation", "account", "company name", "org"],
  role: ["role", "title", "job title", "position"],
  linkedinUrl: ["linkedin", "linkedin url", "linkedin profile", "li"],
  source: ["source", "lead source", "channel source", "origin"],
  nextStep: ["next step", "next action", "follow up", "follow-up", "todo"],
  nextStepDate: ["next step date", "follow up date", "follow-up date", "due", "due date", "next date"],
  notes: ["notes", "note", "comments", "comment", "details"],
  lastTouchDate: ["last contacted", "last contacted date", "last contact", "last touch", "date contacted", "contacted on", "last outreach"],
  lastTouchChannel: ["last contacted via", "contacted via", "outreach channel", "channel", "method"],
};

const normalize = (s: string) => s.toLowerCase().replace(/[_\s]+/g, " ").replace(/[^a-z0-9 -]/g, "").trim();

/** Best-guess mapping from the spreadsheet's headers; each header is used at most once. */
export function guessMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<string>();
  for (const field of Object.keys(ALIASES) as ImportField[]) {
    const header = headers.find((h) => !used.has(h) && ALIASES[field].includes(normalize(h)));
    if (header) {
      mapping[field] = header;
      used.add(header);
    }
  }
  return mapping;
}

function parseSource(v: string): Source | null {
  const n = normalize(v);
  if (!n) return null;
  if (n in SOURCES) return n as Source;
  if (n.includes("web") || n.includes("form") || n.includes("site")) return "website";
  if (n.includes("refer") || n.includes("intro")) return "referral";
  if (n.includes("mail")) return "email";
  if (n.includes("outbound") || n.includes("cold") || n.includes("prospect")) return "outbound";
  return "other";
}

function parseChannel(v: string): Channel | null {
  const n = normalize(v);
  if (!n) return null;
  if (n.includes("linkedin")) return "linkedin";
  if (n.includes("mail")) return "email";
  if (n.includes("call") || n.includes("phone")) return "call";
  if (n.includes("meet") || n.includes("zoom") || n.includes("coffee")) return "meeting";
  if (n.includes("event") || n.includes("conference")) return "event";
  return (Object.keys(CHANNELS) as Channel[]).find((c) => c === n) ?? null;
}

/**
 * Converts parsed CSV records into import rows. Rows with neither a name nor an email are skipped,
 * and a repeated email keeps only its first row. `line` numbers count the header as line 1.
 */
export function buildRows(records: Record<string, string>[], mapping: ColumnMapping) {
  const get = (r: Record<string, string>, f: ImportField) => {
    const h = mapping[f];
    const v = h ? r[h] : undefined;
    const t = (v ?? "").toString().trim();
    return t === "" ? null : t;
  };

  const rows: ImportRow[] = [];
  const skipped: SkippedRow[] = [];
  const seenEmails = new Set<string>();

  records.forEach((r, i) => {
    const line = i + 2;
    const email = get(r, "email")?.toLowerCase() ?? null;
    const joined = [get(r, "firstName"), get(r, "lastName")].filter(Boolean).join(" ");
    const name = get(r, "name") ?? (joined || null) ?? email;

    if (!name) {
      if (Object.values(r).some((v) => (v ?? "").toString().trim() !== "")) {
        skipped.push({ line, reason: "No name or email" });
      }
      return;
    }
    if (email && seenEmails.has(email)) {
      skipped.push({ line, reason: `Duplicate email ${email}` });
      return;
    }
    if (email) seenEmails.add(email);

    const lastTouchDate = parseLooseDate(get(r, "lastTouchDate"));
    const channel = parseChannel(get(r, "lastTouchChannel") ?? "");
    rows.push({
      name,
      email,
      company: get(r, "company"),
      role: get(r, "role"),
      linkedinUrl: get(r, "linkedinUrl"),
      source: parseSource(get(r, "source") ?? ""),
      nextStep: get(r, "nextStep"),
      nextStepDate: parseLooseDate(get(r, "nextStepDate")),
      notes: get(r, "notes"),
      lastTouchDate,
      // A past touch from the spreadsheet is recorded as outbound, so only outbound channels apply.
      lastTouchChannel: lastTouchDate
        ? channel && (OUTBOUND_CHANNELS as readonly string[]).includes(channel)
          ? channel
          : "email"
        : null,
    });
  });

  return { rows, skipped };
}
