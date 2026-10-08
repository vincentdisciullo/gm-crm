import Link from "next/link";
import { COMPANY_TYPES } from "@/lib/options";
import { listCompanies } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const rows = await listCompanies();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="h1">Companies</h1>
        <Link href="/companies/new" className="btn-primary">
          New company
        </Link>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Contacts</th>
              <th>Website</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/companies/${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td>
                  <span className="pill">{COMPANY_TYPES[c.type]}</span>
                </td>
                <td>{c.contactCount}</td>
                <td className="text-stone-500">{c.website}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="text-stone-500">
                  No companies yet. They are also created when you add a contact with a company name.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
