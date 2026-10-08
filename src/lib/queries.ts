import "server-only";
import { and, asc, desc, eq, ilike, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { activities, companies, contacts } from "@/db/schema";
import type { Source } from "./options";

const lastTouch = sql<string | null>`(select max(${activities.occurredOn}) from ${activities} where ${activities.contactId} = ${contacts.id})`;

export async function contactsForPicker() {
  return db
    .select({ id: contacts.id, name: contacts.name, email: contacts.email, company: companies.name })
    .from(contacts)
    .leftJoin(companies, eq(contacts.companyId, companies.id))
    .orderBy(asc(contacts.name));
}

export async function todayData(today: string) {
  const [due, inbound, recent] = await Promise.all([
    db
      .select({
        id: contacts.id,
        name: contacts.name,
        company: companies.name,
        nextStep: contacts.nextStep,
        nextStepDate: contacts.nextStepDate,
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.companyId, companies.id))
      .where(lte(contacts.nextStepDate, today))
      .orderBy(asc(contacts.nextStepDate), asc(contacts.name)),
    db
      .select({ activity: activities, contactName: contacts.name })
      .from(activities)
      .innerJoin(contacts, eq(activities.contactId, contacts.id))
      .where(and(eq(activities.direction, "inbound"), isNull(activities.followedUpAt)))
      .orderBy(asc(activities.occurredOn)),
    db
      .select({ activity: activities, contactName: contacts.name })
      .from(activities)
      .innerJoin(contacts, eq(activities.contactId, contacts.id))
      .orderBy(desc(activities.occurredOn), desc(activities.createdAt))
      .limit(10),
  ]);
  return { due, inbound, recent };
}

export async function listContacts({ q, source }: { q?: string; source?: Source }) {
  const term = q?.trim() ? `%${q.trim()}%` : null;
  return db
    .select({
      id: contacts.id,
      name: contacts.name,
      email: contacts.email,
      role: contacts.role,
      source: contacts.source,
      company: companies.name,
      nextStepDate: contacts.nextStepDate,
      lastTouch,
    })
    .from(contacts)
    .leftJoin(companies, eq(contacts.companyId, companies.id))
    .where(
      and(
        term ? or(ilike(contacts.name, term), ilike(contacts.email, term), ilike(companies.name, term)) : undefined,
        source ? eq(contacts.source, source) : undefined,
      ),
    )
    .orderBy(sql`${lastTouch} desc nulls last`, asc(contacts.name));
}

export async function getContact(id: string) {
  const [row] = await db
    .select({ contact: contacts, company: companies })
    .from(contacts)
    .leftJoin(companies, eq(contacts.companyId, companies.id))
    .where(eq(contacts.id, id));
  if (!row) return null;
  const timeline = await db
    .select()
    .from(activities)
    .where(eq(activities.contactId, id))
    .orderBy(desc(activities.occurredOn), desc(activities.createdAt));
  return { ...row, timeline };
}

export async function listCompanies() {
  return db
    .select({
      id: companies.id,
      name: companies.name,
      type: companies.type,
      website: companies.website,
      contactCount: sql<number>`(select count(*)::int from ${contacts} where ${contacts.companyId} = ${companies.id})`,
    })
    .from(companies)
    .orderBy(asc(companies.name));
}

export async function getCompany(id: string) {
  const [company] = await db.select().from(companies).where(eq(companies.id, id));
  if (!company) return null;
  const people = await db
    .select({ id: contacts.id, name: contacts.name, role: contacts.role, email: contacts.email, lastTouch })
    .from(contacts)
    .where(eq(contacts.companyId, id))
    .orderBy(asc(contacts.name));
  return { company, people };
}

export async function companyNames() {
  return (await db.select({ name: companies.name }).from(companies).orderBy(asc(companies.name))).map((c) => c.name);
}
