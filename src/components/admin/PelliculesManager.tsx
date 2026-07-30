"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createPellicule,
  deletePelliculeAction,
  movePellicule,
  setPelliculeActif,
} from "@/app/actions/admin";

type PelliculeRow = {
  id: string;
  slug: string;
  noms_maries: string;
  lieu: string | null;
  date_mariage: string | null;
  actif: boolean;
  ordre_affichage: number;
  photo_count: number;
};

export function PelliculesManager({ pellicules }: { pellicules: PelliculeRow[] }) {
  const router = useRouter();
  const [nomsMaries, setNomsMaries] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!nomsMaries.trim()) {
      setMessage("Renseignez les noms des mariés.");
      return;
    }
    startTransition(async () => {
      const result = await createPellicule(nomsMaries);
      if (result.ok) {
        router.push(`/admin/pellicules/${result.id}`);
      } else {
        setMessage(result.error);
        setTimeout(() => setMessage(null), 4000);
      }
    });
  }

  function handleToggleActif(pellicule: PelliculeRow) {
    startTransition(async () => {
      const result = await setPelliculeActif(pellicule.id, !pellicule.actif);
      if (!result.ok) {
        setMessage(result.error);
        setTimeout(() => setMessage(null), 4000);
      }
    });
  }

  function handleMove(id: string, direction: "up" | "down") {
    startTransition(() => {
      movePellicule(id, direction);
    });
  }

  function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setConfirmDeleteId(null);
    startTransition(() => {
      deletePelliculeAction(id);
    });
  }

  return (
    <div>
      <h1 className="font-serif text-2xl text-ink">Pellicules (Galerie)</h1>
      <p className="mt-2 text-[12.5px] text-ink/60">
        Chaque pellicule regroupe les photos d&apos;un mariage et son témoignage — page
        publique <code>/galerie</code>.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-3 border border-ink/15 bg-cream-light p-4">
        <div>
          <label className="mb-1.5 block text-[11.5px] tracking-[0.05em] text-ink/60">
            Noms des mariés
          </label>
          <input
            value={nomsMaries}
            onChange={(e) => setNomsMaries(e.target.value)}
            placeholder="Léa & Mathieu"
            className="border border-ink/25 bg-transparent px-3 py-2 text-[12.5px] text-ink focus:border-bronze focus:outline-none"
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={isPending}
          className="bg-ink px-4 py-2 text-[12px] text-cream-light disabled:opacity-40"
        >
          {isPending ? "Création…" : "Créer une pellicule"}
        </button>
      </div>
      {message && <p className="mt-3 text-[12.5px] text-red-700/80">{message}</p>}

      <div className="mt-8 flex flex-col gap-3">
        {pellicules.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-4 border border-ink/15 bg-cream-light p-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMove(p.id, "up")}
                  disabled={isPending || i === 0}
                  className="text-[11px] text-ink/50 hover:text-ink disabled:opacity-25"
                  aria-label="Monter"
                >
                  ▲
                </button>
                <button
                  onClick={() => handleMove(p.id, "down")}
                  disabled={isPending || i === pellicules.length - 1}
                  className="text-[11px] text-ink/50 hover:text-ink disabled:opacity-25"
                  aria-label="Descendre"
                >
                  ▼
                </button>
              </div>
              <div>
                <Link
                  href={`/admin/pellicules/${p.id}`}
                  className="font-serif text-lg italic text-ink hover:text-bronze"
                >
                  {p.noms_maries}
                </Link>
                <div className="mt-0.5 text-[11.5px] text-ink/55">
                  {[p.lieu, p.date_mariage].filter(Boolean).join(" · ") || "Détails à compléter"}
                  {" · "}
                  {p.photo_count} photo{p.photo_count !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleActif(p)}
                disabled={isPending}
                className={`px-2 py-1 text-[11px] ${
                  p.actif
                    ? "bg-bronze/15 text-bronze"
                    : "border border-ink/20 text-ink/50 hover:border-ink/40"
                }`}
              >
                {p.actif ? "✓ Publiée" : "Brouillon"}
              </button>
              <Link
                href={`/admin/pellicules/${p.id}`}
                className="px-2 py-1 text-[11px] text-ink/60 underline hover:text-ink"
              >
                Éditer
              </Link>
              {confirmDeleteId === p.id && (
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="text-[11px] text-ink/50 hover:text-ink"
                >
                  Annuler
                </button>
              )}
              <button
                onClick={() => handleDelete(p.id)}
                disabled={isPending}
                className={`text-[11px] ${
                  confirmDeleteId === p.id
                    ? "font-semibold text-red-700"
                    : "text-red-700/70 hover:text-red-700"
                }`}
              >
                {confirmDeleteId === p.id ? "Confirmer ?" : "Supprimer"}
              </button>
            </div>
          </div>
        ))}
        {pellicules.length === 0 && (
          <p className="text-[13px] text-ink/50">Aucune pellicule — créez la première ci-dessus.</p>
        )}
      </div>
    </div>
  );
}
