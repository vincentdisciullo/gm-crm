import { ImportWizard } from "./wizard";

export default function ImportPage() {
  return (
    <div className="space-y-4">
      <h1 className="h1">Import contacts</h1>
      <p className="max-w-2xl text-sm text-stone-600">
        Export your spreadsheet as CSV and upload it here. Contacts are matched by email: new people are added, and existing
        ones only get their blank fields filled in, so importing the same file twice is safe. A &quot;last contacted&quot; column
        becomes one outbound activity per contact.
      </p>
      <ImportWizard />
    </div>
  );
}
