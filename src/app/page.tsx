import Link from "next/link";
import { ActivityItem } from "@/components/activity-item";
import { LogButton } from "@/components/log-button";
import { clearNextStep, markFollowedUp } from "@/lib/actions";
import { formatDay, isoDate } from "@/lib/dates";
import { todayData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const today = isoDate();
  const { due, inbound, recent } = await todayData(today);

  return (
    <div className="space-y-8">
      <h1 className="h1">Today</h1>

      <section className="space-y-2">
        <h2 className="h2">Next steps due ({due.length})</h2>
        {due.length === 0 ? (
          <p className="text-sm text-stone-500">Nothing due. Set a next step when you log an activity and it shows up here on its date.</p>
        ) : (
          <ul className="card divide-y divide-stone-100 py-1">
            {due.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 py-2">
                <div className="min-w-0 flex-1 text-sm">
                  <Link href={`/contacts/${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                  {c.company && <span className="text-stone-500"> · {c.company}</span>}
                  <div className="text-stone-600">{c.nextStep || "Follow up"}</div>
                </div>
                <span className={`text-xs ${c.nextStepDate! < today ? "font-medium text-red-600" : "text-stone-500"}`}>
                  {c.nextStepDate! < today ? `Overdue · ${formatDay(c.nextStepDate!)}` : "Today"}
                </span>
                <LogButton contactId={c.id} label="Log" />
                <form action={clearNextStep.bind(null, c.id)}>
                  <button className="btn">Done</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="h2">Inbound to follow up ({inbound.length})</h2>
        {inbound.length === 0 ? (
          <p className="text-sm text-stone-500">No open inbound. Logging an outbound reply to someone clears theirs automatically.</p>
        ) : (
          <ul className="card divide-y divide-stone-100 py-1">
            {inbound.map(({ activity, contactName }) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                contactName={contactName}
                actions={
                  <div className="flex gap-2">
                    <LogButton contactId={activity.contactId} direction="outbound" label="Reply" />
                    <form action={markFollowedUp.bind(null, activity.id)}>
                      <button className="btn">Dismiss</button>
                    </form>
                  </div>
                }
              />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="h2">Recent activity</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-stone-500">
            Nothing logged yet. Press <kbd className="pill">L</kbd> to log a touch, or <Link href="/import" className="btn-link">import your spreadsheet</Link>.
          </p>
        ) : (
          <ul className="card divide-y divide-stone-100 py-1">
            {recent.map(({ activity, contactName }) => (
              <ActivityItem key={activity.id} activity={activity} contactName={contactName} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
