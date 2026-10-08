"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { logActivity, type FormState } from "@/lib/actions";
import { CHANNELS, INBOUND_CHANNELS, OUTBOUND_CHANNELS, OUTCOMES, type Direction } from "@/lib/options";

type PickerContact = { id: string; name: string; email: string | null; company: string | null };

const OPEN_EVENT = "quicklog:open";

/** Opens the quick log from anywhere, optionally with a contact already chosen. */
export function openQuickLog(contactId?: string, direction?: Direction) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { contactId, direction } }));
}

const labelFor = (c: PickerContact) =>
  [c.name, c.company && `· ${c.company}`, c.email && `<${c.email}>`].filter(Boolean).join(" ");

export function QuickLog({ contacts, today }: { contacts: PickerContact[]; today: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const contactInput = useRef<HTMLInputElement>(null);
  const [contactText, setContactText] = useState("");
  const [direction, setDirection] = useState<Direction>("outbound");
  const [showNext, setShowNext] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(logActivity, null);

  const byLabel = useMemo(() => new Map(contacts.map((c) => [labelFor(c), c])), [contacts]);
  const picked = byLabel.get(contactText);
  const channels = direction === "outbound" ? OUTBOUND_CHANNELS : INBOUND_CHANNELS;

  function open(contactId?: string, dir?: Direction) {
    const c = contactId ? contacts.find((x) => x.id === contactId) : undefined;
    setContactText(c ? labelFor(c) : "");
    if (dir) setDirection(dir);
    dialog.current?.showModal();
    setTimeout(() => contactInput.current?.focus(), 0);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "l" && !dialog.current?.open) {
        e.preventDefault();
        open();
      }
    };
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<{ contactId?: string; direction?: Direction }>).detail;
      open(d?.contactId, d?.direction);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts]);

  useEffect(() => {
    if (!state?.ok) return;
    dialog.current?.close();
    form.current?.reset();
    setContactText("");
    setShowNext(false);
    setFlash(state.message);
    const t = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <>
      {flash && <span className="text-sm text-green-700">{flash}</span>}
      <button type="button" className="btn-primary" onClick={() => open()} title="Shortcut: L">
        Log activity <kbd className="ml-1 rounded bg-blue-500 px-1 text-xs">L</kbd>
      </button>
      <dialog ref={dialog} className="m-auto w-full max-w-lg rounded-lg p-0 backdrop:bg-black/30">
        <form ref={form} action={action} className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Log activity</h2>
            <button type="button" className="text-stone-400 hover:text-stone-700" onClick={() => dialog.current?.close()}>
              Close
            </button>
          </div>

          <label className="block">
            <span className="label">Contact</span>
            <input
              ref={contactInput}
              className="input"
              list="quicklog-contacts"
              value={contactText}
              onChange={(e) => setContactText(e.target.value)}
              placeholder="Start typing a name, or enter a new one"
              autoComplete="off"
              required
            />
            <datalist id="quicklog-contacts">
              {contacts.map((c) => (
                <option key={c.id} value={labelFor(c)} />
              ))}
            </datalist>
          </label>
          {picked ? (
            <input type="hidden" name="contactId" value={picked.id} />
          ) : (
            contactText.trim() && (
              <div className="rounded-md bg-amber-50 p-3 text-sm">
                <p className="mb-2 text-amber-800">New contact: {contactText.trim()}</p>
                <input type="hidden" name="newContactName" value={contactText.trim()} />
                <input name="newContactEmail" type="email" className="input" placeholder="Email (optional)" />
              </div>
            )
          )}

          <div className="flex gap-2">
            {(["outbound", "inbound"] as const).map((d) => (
              <label key={d} className={`btn flex-1 cursor-pointer ${direction === d ? "border-blue-500 bg-blue-50" : ""}`}>
                <input
                  type="radio"
                  name="direction"
                  value={d}
                  checked={direction === d}
                  onChange={() => setDirection(d)}
                  className="sr-only"
                />
                {d === "outbound" ? "Outbound" : "Inbound"}
              </label>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label>
              <span className="label">Channel</span>
              <select name="channel" className="input" key={direction} defaultValue={direction === "outbound" ? "email" : "website"}>
                {channels.map((c) => (
                  <option key={c} value={c}>
                    {CHANNELS[c]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Outcome</span>
              <select name="outcome" className="input" defaultValue="">
                <option value="">None yet</option>
                {Object.entries(OUTCOMES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Date</span>
              <input name="occurredOn" type="date" className="input" defaultValue={today} key={today} />
            </label>
          </div>

          <label className="block">
            <span className="label">Notes</span>
            <textarea name="notes" rows={2} className="input" />
          </label>

          {showNext ? (
            <div className="grid grid-cols-3 gap-3">
              <label className="col-span-2">
                <span className="label">Next step</span>
                <input name="nextStep" className="input" placeholder="e.g. Send proposal" />
              </label>
              <label>
                <span className="label">Due</span>
                <input name="nextStepDate" type="date" className="input" />
              </label>
            </div>
          ) : (
            <button type="button" className="btn-link" onClick={() => setShowNext(true)}>
              + Set next step
            </button>
          )}

          {state && !state.ok && <p className="text-sm text-red-600">{state.message}</p>}
          <div className="flex justify-end">
            <button className="btn-primary" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
