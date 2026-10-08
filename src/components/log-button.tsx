"use client";

import { openQuickLog } from "./quick-log";
import type { Direction } from "@/lib/options";

export function LogButton({ contactId, direction, label = "Log activity" }: { contactId: string; direction?: Direction; label?: string }) {
  return (
    <button type="button" className="btn" onClick={() => openQuickLog(contactId, direction)}>
      {label}
    </button>
  );
}
