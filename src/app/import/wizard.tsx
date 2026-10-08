"use client";

import Link from "next/link";
import Papa from "papaparse";
import { useMemo, useState, useTransition } from "react";
import { importContacts, type ImportResult } from "@/lib/actions";
import { IMPORT_FIELDS, buildRows, guessMapping, type ColumnMapping, type ImportField } from "@/lib/import";
import { CHANNELS, SOURCES } from "@/lib/options";

type Parsed = { fileName: string; headers: string[]; records: Record<string, string>[] };

export function ImportWizard() {
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const { rows, skipped } = useMemo(() => (parsed ? buildRows(parsed.records, mapping) : { rows: [], skipped: [] }), [parsed, mapping]);
  const hasIdentity = mapping.name || mapping.firstName || mapping.lastName || mapping.email;

  function onFile(file: File) {
    setResult(null);
    setError(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (res) => {
        const headers = (res.meta.fields ?? []).filter((h) => h.trim() !== "");
        if (headers.length === 0) {
          setError("Couldn't find a header row in that file.");
          return;
        }
        setParsed({ fileName: file.name, headers, records: res.data });
        setMapping(guessMapping(headers));
      },
      error: (e) => setError(e.message),
    });
  }

  function runImport() {
    startTransition(async () => {
      try {
        setResult(await importContacts(rows));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Import failed");
      }
    });
  }

  if (result) {
    return (
      <div className="card space-y-2 text-sm">
        <p className="font-medium text-green-700">Import finished.</p>
        <ul className="list-inside list-disc text-stone-700">
          <li>{result.created} contacts added</li>
          <li>{result.updated} existing contacts filled in</li>
          <li>{result.companiesCreated} companies created</li>
          <li>{result.activities} past touches recorded</li>
        </ul>
        <div className="flex gap-3 pt-2">
          <Link href="/contacts" className="btn-primary">
            View contacts
          </Link>
          <button className="btn" onClick={() => { setParsed(null); setResult(null); }}>
            Import another file
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        {parsed && (
          <p className="mt-2 text-sm text-stone-600">
            {parsed.fileName}: {parsed.records.length} rows, {parsed.headers.length} columns
          </p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {parsed && (
        <>
          <div className="card space-y-3">
            <h2 className="h2">Match columns</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {(Object.keys(IMPORT_FIELDS) as ImportField[]).map((f) => (
                <label key={f}>
                  <span className="label">{IMPORT_FIELDS[f]}</span>
                  <select
                    className="input"
                    value={mapping[f] ?? ""}
                    onChange={(e) => setMapping((m) => ({ ...m, [f]: e.target.value || undefined }))}
                  >
                    <option value="">Not in file</option>
                    {parsed.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div className="card space-y-3 overflow-x-auto">
            <h2 className="h2">
              Preview: {rows.length} contacts{skipped.length > 0 && `, ${skipped.length} rows skipped`}
            </h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Source</th>
                  <th>Next step</th>
                  <th>Last contacted</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    <td>{r.name}</td>
                    <td>{r.email}</td>
                    <td>{r.company}</td>
                    <td>{r.source && SOURCES[r.source]}</td>
                    <td>{[r.nextStep, r.nextStepDate].filter(Boolean).join(" · ")}</td>
                    <td>{r.lastTouchDate && `${r.lastTouchDate} · ${CHANNELS[r.lastTouchChannel!]}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 10 && <p className="text-xs text-stone-500">Showing the first 10.</p>}
            {skipped.length > 0 && (
              <details className="text-sm text-stone-600">
                <summary className="cursor-pointer">Skipped rows</summary>
                <ul className="mt-1 list-inside list-disc">
                  {skipped.slice(0, 50).map((s) => (
                    <li key={s.line}>
                      Line {s.line}: {s.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <div className="flex items-center gap-3">
              <button className="btn-primary" disabled={!hasIdentity || rows.length === 0 || pending} onClick={runImport}>
                {pending ? "Importing…" : `Import ${rows.length} contacts`}
              </button>
              {!hasIdentity && <span className="text-sm text-amber-700">Match a name or email column first.</span>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
