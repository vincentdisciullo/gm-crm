"use server";

import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { activities, companies, contacts } from "@/db/schema";
import { isoDate } from "./dates";
import type { ImportRow } from "./import";
import { CHANNELS, COMPANY_TYPES, OUTCOMES, SOURCES, type Channel, type Direction } from "./options";
import { inferSource } from "./source";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const optional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullish()
  .transform((v) => v ?? null);
const optionalDate = optional.refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use YYYY-MM-DD");
const enumOf = <T extends Record<string, string>>(o: T) => z.enum(Object.keys(o) as [keyof T & string, ...(keyof T & string)[]]);
const optionalEnum = <T extends Record<string, string>>(o: T) =>
  z.preprocess((v) => (v === "" || v == null ? null : v), enumOf(o).nullable());

const fields = (fd: FormData) => Object.fromEntries([...fd.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]));

export type FormState = { ok: boolean; message: string } | null;

function firstError(e: z.ZodError) {
  const issue = e.issues[0];
  return `${issue.path.join(".") || "Form"}: ${issue.message}`;
}

function refresh() {
  revalidatePath("/", "layout");
}

/** Finds a company by case-insensitive name, creating it when missing. */
async function companyIdFor(tx: Tx | typeof db, name: string | null) {
  if (!name) return null;
  const [existing] = await tx
    .select({ id: companies.id })
    .from(companies)
    .where(sql`lower(${companies.name}) = lower(${name})`)
    .limit(1);
  if (existing) return existing.id;
  const [created] = await tx.insert(companies).values({ name }).returning({ id: companies.id });
  return created.id;
}

// Companies

const companySchema = z.object({
  name: z.string().trim().min(1, "Required"),
  website: optional,
  type: enumOf(COMPANY_TYPES),
  notes: optional,
});

export async function saveCompany(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = companySchema.safeParse(fields(fd));
  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };
  let targetId = id;
  if (id) {
    await db.update(companies).set(parsed.data).where(eq(companies.id, id));
  } else {
    [{ id: targetId }] = await db.insert(companies).values(parsed.data).returning({ id: companies.id });
  }
  refresh();
  if (!id) redirect(`/companies/${targetId}`);
  return { ok: true, message: "Saved" };
}

// Contacts

const contactSchema = z.object({
  name: z.string().trim().min(1, "Required"),
  email: optional.transform((v) => v?.toLowerCase() ?? null),
  linkedinUrl: optional,
  company: optional,
  role: optional,
  source: optionalEnum(SOURCES),
  nextStep: optional,
  nextStepDate: optionalDate,
  notes: optional,
});

export async function saveContact(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse(fields(fd));
  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };
  const { company, ...rest } = parsed.data;
  const companyId = await companyIdFor(db, company);
  let targetId = id;
  if (id) {
    await db.update(contacts).set({ ...rest, companyId, updatedAt: new Date() }).where(eq(contacts.id, id));
  } else {
    [{ id: targetId }] = await db.insert(contacts).values({ ...rest, companyId }).returning({ id: contacts.id });
  }
  refresh();
  if (!id) redirect(`/contacts/${targetId}`);
  return { ok: true, message: "Saved" };
}

export async function deleteContact(id: string) {
  await db.delete(contacts).where(eq(contacts.id, id));
  refresh();
  redirect("/contacts");
}

// Activities

const activitySchema = z
  .object({
    contactId: optional,
    newContactName: optional,
    newContactEmail: optional.transform((v) => v?.toLowerCase() ?? null),
    direction: z.enum(["outbound", "inbound"]),
    channel: enumOf(CHANNELS),
    outcome: optionalEnum(OUTCOMES),
    occurredOn: optionalDate,
    notes: optional,
    nextStep: optional,
    nextStepDate: optionalDate,
  })
  .refine((v) => v.contactId || v.newContactName, { message: "Pick a contact or enter a new name", path: ["contact"] });

export async function logActivity(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = activitySchema.safeParse(fields(fd));
  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };
  const v = parsed.data;
  const direction = v.direction as Direction;
  const channel = v.channel as Channel;

  const name = await db.transaction(async (tx) => {
    let contactId = v.contactId;
    let contactName = v.newContactName;
    if (!contactId) {
      // Reuse an existing contact with the same email rather than creating a duplicate.
      const [match] = v.newContactEmail
        ? await tx.select({ id: contacts.id, name: contacts.name }).from(contacts).where(eq(contacts.email, v.newContactEmail)).limit(1)
        : [];
      if (match) {
        contactId = match.id;
        contactName = match.name;
      } else {
        [{ id: contactId }] = await tx
          .insert(contacts)
          .values({ name: v.newContactName!, email: v.newContactEmail })
          .returning({ id: contacts.id });
      }
    } else {
      const [c] = await tx.select({ name: contacts.name }).from(contacts).where(eq(contacts.id, contactId));
      if (!c) throw new Error("Contact not found");
      contactName = c.name;
    }

    await tx.insert(activities).values({
      contactId,
      direction,
      channel,
      outcome: v.outcome,
      occurredOn: v.occurredOn ?? isoDate(),
      notes: v.notes,
    });

    // Source is set once, from the contact's first logged touch.
    await tx
      .update(contacts)
      .set({ source: inferSource(direction, channel) })
      .where(and(eq(contacts.id, contactId), isNull(contacts.source)));

    if (v.nextStep || v.nextStepDate) {
      await tx
        .update(contacts)
        .set({ nextStep: v.nextStep, nextStepDate: v.nextStepDate, updatedAt: new Date() })
        .where(eq(contacts.id, contactId));
    }

    // Replying to someone counts as following up on their open inbound messages.
    if (direction === "outbound") {
      await tx
        .update(activities)
        .set({ followedUpAt: new Date() })
        .where(and(eq(activities.contactId, contactId), eq(activities.direction, "inbound"), isNull(activities.followedUpAt)));
    }
    return contactName;
  });

  refresh();
  return { ok: true, message: `Logged ${direction} ${CHANNELS[channel].toLowerCase()} with ${name}` };
}

export async function markFollowedUp(id: string) {
  await db.update(activities).set({ followedUpAt: new Date() }).where(eq(activities.id, id));
  refresh();
}

export async function clearNextStep(contactId: string) {
  await db.update(contacts).set({ nextStep: null, nextStepDate: null, updatedAt: new Date() }).where(eq(contacts.id, contactId));
  refresh();
}

export async function deleteActivity(id: string) {
  await db.delete(activities).where(eq(activities.id, id));
  refresh();
}

// Import

const IMPORT_NOTE = "Imported from spreadsheet";

export type ImportResult = { created: number; updated: number; companiesCreated: number; activities: number };

const importRowSchema = z.object({
  name: z.string().min(1),
  email: z.string().nullable(),
  company: z.string().nullable(),
  role: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  source: enumOf(SOURCES).nullable(),
  nextStep: z.string().nullable(),
  nextStepDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  notes: z.string().nullable(),
  lastTouchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  lastTouchChannel: enumOf(CHANNELS).nullable(),
});

/**
 * Inserts new contacts and fills blank fields on existing ones (matched by email), creating
 * companies by name as needed. Existing values are never overwritten.
 */
export async function importContacts(input: ImportRow[]): Promise<ImportResult> {
  const rows = z.array(importRowSchema).max(5000).parse(input);
  const result = await db.transaction(async (tx) => {
    const r: ImportResult = { created: 0, updated: 0, companiesCreated: 0, activities: 0 };

    const companyIds = new Map<string, string>();
    for (const c of await tx.select({ id: companies.id, name: companies.name }).from(companies)) {
      companyIds.set(c.name.toLowerCase(), c.id);
    }
    const emails = rows.map((row) => row.email).filter((e): e is string => !!e);
    const existing = new Map(
      emails.length
        ? (await tx.select().from(contacts).where(inArray(contacts.email, emails))).map((c) => [c.email!, c])
        : [],
    );

    for (const row of rows) {
      let companyId: string | null = null;
      if (row.company) {
        const key = row.company.toLowerCase();
        companyId = companyIds.get(key) ?? null;
        if (!companyId) {
          [{ id: companyId }] = await tx.insert(companies).values({ name: row.company }).returning({ id: companies.id });
          companyIds.set(key, companyId);
          r.companiesCreated++;
        }
      }

      const values = {
        name: row.name,
        email: row.email,
        companyId,
        role: row.role,
        linkedinUrl: row.linkedinUrl,
        source: row.source ?? (row.lastTouchDate ? ("outbound" as const) : null),
        nextStep: row.nextStep,
        nextStepDate: row.nextStepDate,
        notes: row.notes,
      };

      let contactId: string;
      const prior = row.email ? existing.get(row.email) : undefined;
      if (prior) {
        const fill = Object.fromEntries(
          Object.entries(values).filter(([k, val]) => val !== null && prior[k as keyof typeof prior] == null),
        );
        if (Object.keys(fill).length) {
          await tx.update(contacts).set({ ...fill, updatedAt: new Date() }).where(eq(contacts.id, prior.id));
          r.updated++;
        }
        contactId = prior.id;
      } else {
        [{ id: contactId }] = await tx.insert(contacts).values(values).returning({ id: contacts.id });
        r.created++;
      }

      // Re-importing the same file must not log the same touch twice.
      const [dupe] = row.lastTouchDate
        ? await tx
            .select({ id: activities.id })
            .from(activities)
            .where(and(eq(activities.contactId, contactId), eq(activities.occurredOn, row.lastTouchDate), eq(activities.notes, IMPORT_NOTE)))
            .limit(1)
        : [];
      if (row.lastTouchDate && !dupe) {
        await tx.insert(activities).values({
          contactId,
          direction: "outbound",
          channel: row.lastTouchChannel ?? "email",
          occurredOn: row.lastTouchDate,
          notes: IMPORT_NOTE,
        });
        r.activities++;
      }
    }
    return r;
  });
  refresh();
  return result;
}
