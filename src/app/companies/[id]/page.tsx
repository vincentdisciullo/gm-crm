import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanyForm } from "@/components/company-form";
import { formatDay } from "@/lib/dates";
import { getCompany } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const data = await getCompany(id);
  if (!data) notFound();
  const { company, people } = data;

  return (
    <div className="space-y-6">
      <h1 className="h1">{company.name}</h1>
      <section className="space-y-2">
        <h2 className="h2">People ({people.length})</h2>
        <ul className="card divide-y divide-stone-100 py-1">
          {people.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2 text-sm">
              <Link href={`/contacts/${p.id}`} className="font-medium hover:underline">
                {p.name}
              </Link>
              <span className="text-stone-500">{p.role}</span>
              <span className="ml-auto text-xs text-stone-500">{p.lastTouch ? `Last touch ${formatDay(p.lastTouch)}` : "No activity"}</span>
            </li>
          ))}
          {people.length === 0 && <li className="py-2 text-sm text-stone-500">No contacts at this company yet.</li>}
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="h2">Details</h2>
        <div className="card">
          <CompanyForm company={company} />
        </div>
      </section>
    </div>
  );
}
