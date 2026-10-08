import { CompanyForm } from "@/components/company-form";

export default function NewCompanyPage() {
  return (
    <div className="space-y-4">
      <h1 className="h1">New company</h1>
      <div className="card">
        <CompanyForm />
      </div>
    </div>
  );
}
