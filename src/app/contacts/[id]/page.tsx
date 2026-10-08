import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityItem } from "@/components/activity-item";
import { ContactForm } from "@/components/contact-form";
import { LogButton } from "@/components/log-button";
import { deleteActivity, deleteContact } from "@/lib/actions";
import { SOURCES } from "@/lib/options";
import { companyNames, getContact } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const data = await getContact(id);
  if (!data) notFound();
  const { contact, company, timeline } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="h1">{contact.name}</h1>
          <p className="text-sm text-stone-600">
            {[contact.role, company && <Link key="c" href={`/companies/${company.id}`} className="hover:underline">{company.name}</Link>]
              .filter(Boolean)
              .map((x, i) => (
                <span key={i}>
                  {i > 0 && " at "}
                  {x}
                </span>
              ))}
            {contact.source && <span className="pill ml-2">{SOURCES[contact.source]}</span>}
          </p>
        </div>
        <LogButton contactId={contact.id} />
      </div>

      <section className="space-y-2">
        <h2 className="h2">Timeline ({timeline.length})</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-stone-500">No activity yet.</p>
        ) : (
          <ul className="card divide-y divide-stone-100 py-1">
            {timeline.map((a) => (
              <ActivityItem
                key={a.id}
                activity={a}
                actions={
                  <form action={deleteActivity.bind(null, a.id)}>
                    <button className="text-xs text-stone-400 hover:text-red-600" title="Delete this activity">
                      Delete
                    </button>
                  </form>
                }
              />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="h2">Details</h2>
        <div className="card">
          <ContactForm contact={contact} companyName={company?.name} companies={await companyNames()} />
        </div>
        <form action={deleteContact.bind(null, contact.id)}>
          <button className="text-sm text-stone-400 hover:text-red-600">Delete contact and its activity</button>
        </form>
      </section>
    </div>
  );
}
