import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { QuickLog } from "@/components/quick-log";
import { logout } from "@/app/login/actions";
import { contactsForPicker } from "@/lib/queries";
import { isoDate } from "@/lib/dates";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "Generative Mind CRM",
};

const NAV = [
  { href: "/", label: "Today" },
  { href: "/contacts", label: "Contacts" },
  { href: "/companies", label: "Companies" },
  { href: "/import", label: "Import" },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const signedIn = await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!signedIn) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  const people = await contactsForPicker();
  return (
    <html lang="en">
      <body>
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="font-semibold">
              GM CRM
            </Link>
            <nav className="flex gap-4 text-sm">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="text-stone-600 hover:text-stone-900">
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <QuickLog contacts={people} today={isoDate()} />
              <form action={logout}>
                <button className="text-sm text-stone-500 hover:text-stone-900">Sign out</button>
              </form>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
