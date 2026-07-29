"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function ConnexionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"signup" | "login">(
    searchParams.get("mode") === "login" ? "login" : "signup"
  );
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
      });

      if (signUpError) {
        // Compte déjà existant — voir docs/modules/DOSSIER.md cas limite #1.
        if (signUpError.message.toLowerCase().includes("already")) {
          setError("Cet email est déjà utilisé — connectez-vous plutôt.");
          setMode("login");
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError("Un compte existe déjà avec cet email — connectez-vous plutôt.");
        setMode("login");
        setLoading(false);
        return;
      }

      router.push("/dossier");
      router.refresh();
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    router.push("/dossier");
    router.refresh();
  }

  async function handleResetPassword() {
    if (!email) {
      setError("Renseignez votre email pour réinitialiser le mot de passe.");
      return;
    }
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reinitialiser-mot-de-passe`,
    });
    setResetSent(true);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-center font-serif text-3xl text-ink">
        {mode === "signup" ? "Créer mon dossier" : "Se connecter"}
      </h1>
      <p className="mt-3 text-center text-[13.5px] leading-[1.6] text-ink/60">
        {mode === "signup"
          ? "Un compte protège vos données et vous permet de reprendre votre dossier à tout moment."
          : "Reprenez votre dossier là où vous l'avez laissé."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-[11.5px] tracking-[0.05em] text-ink/60">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-ink/25 bg-transparent px-4 py-2.5 text-[14px] text-ink focus:border-bronze focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11.5px] tracking-[0.05em] text-ink/60">
            Mot de passe
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-ink/25 bg-transparent px-4 py-2.5 text-[14px] text-ink focus:border-bronze focus:outline-none"
          />
        </div>

        {error && <p className="text-[12.5px] text-red-700">{error}</p>}
        {resetSent && (
          <p className="text-[12.5px] text-ink/60">
            Email de réinitialisation envoyé, si ce compte existe.
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 bg-ink px-6 py-3.5 text-center text-[12.5px] tracking-[0.05em] text-cream-light transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "…" : mode === "signup" ? "Créer mon compte" : "Se connecter"}
        </button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-2 text-[12.5px] text-ink/60">
        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "login" : "signup")}
          className="underline"
        >
          {mode === "signup" ? "J'ai déjà un compte" : "Créer un compte"}
        </button>
        {mode === "login" && (
          <button type="button" onClick={handleResetPassword} className="underline">
            Mot de passe oublié ?
          </button>
        )}
      </div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense>
      <ConnexionForm />
    </Suspense>
  );
}
