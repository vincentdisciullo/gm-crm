import Link from "next/link";
import { formatDay } from "@/lib/dates";
import { SOURCES, isKey } from "@/lib/options";
import { listContacts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ q?: string; source?: string }> }) {
  const { q, source } = await searchParams;
  const rows = await listContacts({ q, source: isKey(SOURCES, source) ? source : undefined });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="h1">Contacts</h1>
        <Link href="/contacts/new" className="btn-primary">
          New contact
        </Link>
      </div>
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search name, email, or company" className="input max-w-xs" />
        <select name="source" defaultValue={source ?? ""} className="input max-w-[12rem]">
          <option value="">All sources</option>
          {Object.entries(SOURCES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button className="btn">Filter</button>
      </form>
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Source</th>
              <th>Last touch</th>
              <th>Next step</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/contacts/${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                  {c.email && <div className="text-xs text-stone-500">{c.email}</div>}
                </td>
                <td>{c.company}</td>
                <td>{c.source && <span className="pill">{SOURCES[c.source]}</span>}</td>
                <td className="whitespace-nowrap">{c.lastTouch ? formatDay(c.lastTouch) : "Never"}</td>
                <td className="whitespace-nowrap">{c.nextStepDate ? formatDay(c.nextStepDate) : ""}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-stone-500">
                  No contacts match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
