"use client";

import { useActionState } from "react";
import { saveContact, type FormState } from "@/lib/actions";
import { SOURCES } from "@/lib/options";
import type { Contact } from "@/db/schema";

export function ContactForm({ contact, companyName, companies }: { contact?: Contact; companyName?: string | null; companies: string[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveContact.bind(null, contact?.id ?? null), null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <Field label="Name" name="name" defaultValue={contact?.name} required />
      <Field label="Email" name="email" type="email" defaultValue={contact?.email} />
      <label>
        <span className="label">Company</span>
        <input name="company" className="input" list="company-names" defaultValue={companyName ?? ""} autoComplete="off" />
        <datalist id="company-names">
          {companies.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>
      <Field label="Role" name="role" defaultValue={contact?.role} />
      <Field label="LinkedIn URL" name="linkedinUrl" type="url" defaultValue={contact?.linkedinUrl} />
      <label>
        <span className="label">Source</span>
        <select name="source" className="input" defaultValue={contact?.source ?? ""}>
          <option value="">Set from first activity</option>
          {Object.entries(SOURCES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <Field label="Next step" name="nextStep" defaultValue={contact?.nextStep} />
      <Field label="Next step date" name="nextStepDate" type="date" defaultValue={contact?.nextStepDate} />
      <label className="sm:col-span-2">
        <span className="label">Notes</span>
        <textarea name="notes" rows={3} className="input" defaultValue={contact?.notes ?? ""} />
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : contact ? "Save changes" : "Create contact"}
        </button>
        {state && <span className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>{state.message}</span>}
      </div>
    </form>
  );
}

function Field({ label, name, defaultValue, type = "text", required }: { label: string; name: string; defaultValue?: string | null; type?: string; required?: boolean }) {
  return (
    <label>
      <span className="label">{label}</span>
      <input name={name} type={type} className="input" defaultValue={defaultValue ?? ""} required={required} />
    </label>
  );
}
