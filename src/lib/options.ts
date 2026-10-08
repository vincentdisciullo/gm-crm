// Display labels for the enum values in the schema, in the order forms show them.

export const CHANNELS = {
  email: "Email",
  linkedin: "LinkedIn",
  call: "Call",
  meeting: "Meeting",
  event: "Event",
  website: "Website",
  referral: "Referral",
} as const;

export const OUTBOUND_CHANNELS = ["email", "linkedin", "call", "meeting", "event"] as const;
export const INBOUND_CHANNELS = ["email", "website", "referral", "linkedin", "call", "meeting", "event"] as const;

export const OUTCOMES = {
  no_reply: "No reply",
  replied: "Replied",
  meeting_booked: "Meeting booked",
  not_interested: "Not interested",
} as const;

export const SOURCES = {
  outbound: "Outbound",
  website: "Website",
  email: "Email",
  referral: "Referral",
  other: "Other",
} as const;

export const COMPANY_TYPES = {
  prospect: "Prospect",
  client: "Client",
  partner: "Partner",
} as const;

export type Channel = keyof typeof CHANNELS;
export type Outcome = keyof typeof OUTCOMES;
export type Source = keyof typeof SOURCES;
export type CompanyType = keyof typeof COMPANY_TYPES;
export type Direction = "outbound" | "inbound";

export function isKey<T extends object>(obj: T, key: unknown): key is keyof T {
  return typeof key === "string" && Object.prototype.hasOwnProperty.call(obj, key);
}
