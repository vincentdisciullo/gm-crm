"use client";

import { useActionState } from "react";
import { saveCompany, type FormState } from "@/lib/actions";
import { COMPANY_TYPES } from "@/lib/options";
import type { Company } from "@/db/schema";

export function CompanyForm({ company }: { company?: Company }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCompany.bind(null, company?.id ?? null), null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-3">
      <label>
        <span className="label">Name</span>
        <input name="name" className="input" defaultValue={company?.name ?? ""} required />
      </label>
      <label>
        <span className="label">Website</span>
        <input name="website" className="input" defaultValue={company?.website ?? ""} />
      </label>
      <label>
        <span className="label">Type</span>
        <select name="type" className="input" defaultValue={company?.type ?? "prospect"}>
          {Object.entries(COMPANY_TYPES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className="sm:col-span-3">
        <span className="label">Notes</span>
        <textarea name="notes" rows={3} className="input" defaultValue={company?.notes ?? ""} />
      </label>
      <div className="flex items-center gap-3 sm:col-span-3">
        <button className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : company ? "Save changes" : "Create company"}
        </button>
        {state && <span className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
