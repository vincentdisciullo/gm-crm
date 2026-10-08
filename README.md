# Generative Mind CRM

A small single-user CRM for logging outbound and inbound activity, built in phases from the
[CRM plan](https://claude.ai/code/artifact/435cf43a-f8f6-4558-86da-fdc0c7c4e8a4). This repo covers
Phase 1 (foundation and spreadsheet import) and Phase 2 (daily logging).

## What's here

- **Today**: next steps due or overdue, inbound activity waiting on a follow-up, recent activity.
- **Quick log**: press `L` anywhere (or the Log activity button) to record a touch. Typing a name that
  doesn't exist creates the contact. Logging an outbound touch clears that contact's open inbound items.
- **Contacts and companies**: search, filter by source, edit details, full activity timeline per contact.
  A contact's source is set automatically from its first logged touch.
- **Import**: upload a CSV exported from the spreadsheets, match columns, preview, import. Contacts are
  matched by email and only blank fields are filled, so re-importing is safe.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind · Postgres via Drizzle ORM · single-password sign-in
with a signed session cookie.

## Run locally

```sh
cp .env.example .env.local   # then fill in the values
npm install
npm run db:migrate
npm run dev
```

`npm test` runs the unit tests; `npm run build` checks types and builds.

## Deploy (Vercel + Supabase)

1. Create a Supabase project and copy its Postgres connection string (the transaction pooler URL works).
2. Import this repo in Vercel and set `DATABASE_URL`, `APP_PASSWORD`, `AUTH_SECRET`
   (`openssl rand -base64 32`), and optionally `APP_TIMEZONE` (defaults to `America/New_York`).
3. Run `DATABASE_URL=... npm run db:migrate` once from your machine to create the tables.

## Schema changes

Edit `src/db/schema.ts`, run `npm run db:generate` to write a migration into `drizzle/`, then
`npm run db:migrate`.
