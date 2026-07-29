"use client";

import { useState, useTransition } from "react";
import { updateContenu } from "@/app/actions/admin";

type ChampTexte = { cle: string; label: string; multiline: boolean };

export function TextesManager({
  champs,
  valeurs,
}: {
  champs: ChampTexte[];
  valeurs: Record<string, string>;
}) {
  const [drafts, setDrafts] = useState(valeurs);
  const [savedCle, setSavedCle] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave(cle: string) {
    startTransition(async () => {
      const result = await updateContenu(cle, drafts[cle] ?? "");
      if (result.ok) {
        setSavedCle(cle);
        setTimeout(() => setSavedCle(null), 2000);
      }
    });
  }

  const inputClass =
    "w-full border border-ink/25 bg-transparent px-4 py-2.5 text-[14px] text-ink focus:border-bronze focus:outline-none";

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-ink">Textes du site</h1>
      <p className="mt-2 text-[13px] text-ink/60">
        Les modifications sont visibles immédiatement sur le site public.
      </p>

      <div className="mt-8 flex flex-col gap-6">
        {champs.map((champ) => (
          <div key={champ.cle}>
            <label className="mb-1.5 block text-[11.5px] tracking-[0.05em] text-ink/60">
              {champ.label}
            </label>
            <div className="flex items-start gap-2">
              {champ.multiline ? (
                <textarea
                  rows={3}
                  value={drafts[champ.cle] ?? ""}
                  onChange={(e) => setDrafts({ ...drafts, [champ.cle]: e.target.value })}
                  className={inputClass}
                />
              ) : (
                <input
                  value={drafts[champ.cle] ?? ""}
                  onChange={(e) => setDrafts({ ...drafts, [champ.cle]: e.target.value })}
                  className={inputClass}
                />
              )}
              <button
                onClick={() => handleSave(champ.cle)}
                disabled={isPending || (drafts[champ.cle] ?? "") === (valeurs[champ.cle] ?? "")}
                className="flex-none bg-ink px-4 py-2.5 text-[12px] text-cream-light disabled:opacity-30"
              >
                {savedCle === champ.cle ? "✓" : "Sauver"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
