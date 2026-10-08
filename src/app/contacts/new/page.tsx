import { ContactForm } from "@/components/contact-form";
import { companyNames } from "@/lib/queries";

export default async function NewContactPage() {
  return (
    <div className="space-y-4">
      <h1 className="h1">New contact</h1>
      <div className="card">
        <ContactForm companies={await companyNames()} />
      </div>
    </div>
  );
}
