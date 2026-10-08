import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const companyType = pgEnum("company_type", ["prospect", "client", "partner"]);

export const contactSource = pgEnum("contact_source", [
  "outbound",
  "website",
  "email",
  "referral",
  "other",
]);

export const activityDirection = pgEnum("activity_direction", ["outbound", "inbound"]);

export const activityChannel = pgEnum("activity_channel", [
  "email",
  "linkedin",
  "call",
  "meeting",
  "event",
  "website",
  "referral",
]);

export const activityOutcome = pgEnum("activity_outcome", [
  "no_reply",
  "replied",
  "meeting_booked",
  "not_interested",
]);

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  website: text("website"),
  type: companyType("type").notNull().default("prospect"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email"),
    linkedinUrl: text("linkedin_url"),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
    role: text("role"),
    source: contactSource("source"),
    nextStep: text("next_step"),
    nextStepDate: date("next_step_date"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("contacts_email_idx").on(t.email), index("contacts_next_step_idx").on(t.nextStepDate)],
);

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    occurredOn: date("occurred_on").notNull(),
    direction: activityDirection("direction").notNull(),
    channel: activityChannel("channel").notNull(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    outcome: activityOutcome("outcome"),
    notes: text("notes"),
    // Inbound activities show on Today until followed up.
    followedUpAt: timestamp("followed_up_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activities_contact_idx").on(t.contactId), index("activities_occurred_idx").on(t.occurredOn)],
);

export type Company = typeof companies.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Activity = typeof activities.$inferSelect;
