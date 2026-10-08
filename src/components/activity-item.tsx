import Link from "next/link";
import type { Activity } from "@/db/schema";
import { formatDay } from "@/lib/dates";
import { CHANNELS, OUTCOMES } from "@/lib/options";

export function ActivityItem({ activity: a, contactName, contactId, actions }: { activity: Activity; contactName?: string; contactId?: string; actions?: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 py-2">
      <span className={`mt-0.5 w-16 shrink-0 text-xs font-medium ${a.direction === "inbound" ? "text-emerald-700" : "text-blue-700"}`}>
        {a.direction === "inbound" ? "← In" : "→ Out"}
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <div>
          {contactName && (
            <>
              <Link href={`/contacts/${contactId ?? a.contactId}`} className="font-medium hover:underline">
                {contactName}
              </Link>{" "}
              ·{" "}
            </>
          )}
          {CHANNELS[a.channel]}
          {a.outcome && <span className="pill ml-2">{OUTCOMES[a.outcome]}</span>}
        </div>
        {a.notes && <p className="whitespace-pre-wrap text-stone-600">{a.notes}</p>}
      </div>
      <span className="shrink-0 text-xs text-stone-500">{formatDay(a.occurredOn)}</span>
      {actions}
    </li>
  );
}
