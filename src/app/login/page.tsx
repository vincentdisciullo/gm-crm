"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form action={action} className="w-full max-w-sm space-y-4 card">
        <h1 className="text-xl font-semibold">Generative Mind CRM</h1>
        <label className="block">
          <span className="label">Password</span>
          <input name="password" type="password" autoFocus required className="input" />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
