-- Supabase exposes tables in the public schema through its Data API. The app connects as the
-- table owner, which bypasses RLS, so enabling RLS with no policies closes that API without
-- affecting the app.
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;
