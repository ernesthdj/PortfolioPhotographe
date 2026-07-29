"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Identifiants incorrects.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-center font-serif text-2xl text-ink">Administration</h1>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-ink/25 bg-transparent px-4 py-2.5 text-[14px] text-ink focus:border-bronze focus:outline-none"
        />
        <input
          type="password"
          required
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-ink/25 bg-transparent px-4 py-2.5 text-[14px] text-ink focus:border-bronze focus:outline-none"
        />
        {error && <p className="text-[12.5px] text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-ink px-6 py-3 text-[12.5px] tracking-[0.05em] text-cream-light disabled:opacity-50"
        >
          {loading ? "…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
