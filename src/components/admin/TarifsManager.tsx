"use client";

import { useState, useTransition } from "react";
import { updateFormule, updateParametresTarifs } from "@/app/actions/admin";

type Formule = {
  id: string;
  nom: string;
  prix_base: number;
  description: string | null;
  actif: boolean;
};

type Parametres = { adresse_base: string; rayon_gratuit_km: number; tarif_par_km: number };

const inputClass =
  "w-full border border-ink/25 bg-transparent px-3 py-2 text-[13.5px] text-ink focus:border-bronze focus:outline-none";

export function TarifsManager({
  formules,
  parametres,
}: {
  formules: Formule[];
  parametres: Parametres;
}) {
  const [formuleDrafts, setFormuleDrafts] = useState(
    Object.fromEntries(
      formules.map((f) => [
        f.id,
        { nom: f.nom, prix_base: String(f.prix_base), description: f.description ?? "", actif: f.actif },
      ])
    )
  );
  const [paramDraft, setParamDraft] = useState({
    adresse_base: parametres.adresse_base,
    rayon_gratuit_km: String(parametres.rayon_gratuit_km),
    tarif_par_km: String(parametres.tarif_par_km),
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSaveFormule(id: string) {
    const draft = formuleDrafts[id];
    startTransition(async () => {
      const result = await updateFormule(id, {
        nom: draft.nom,
        prix_base: parseFloat(draft.prix_base) || 0,
        description: draft.description,
        actif: draft.actif,
      });
      setMessage(result.ok ? "Formule sauvegardée." : result.error);
      setTimeout(() => setMessage(null), 3000);
    });
  }

  function handleSaveParams() {
    startTransition(async () => {
      const result = await updateParametresTarifs({
        adresse_base: paramDraft.adresse_base,
        rayon_gratuit_km: parseFloat(paramDraft.rayon_gratuit_km) || 0,
        tarif_par_km: parseFloat(paramDraft.tarif_par_km) || 0,
      });
      setMessage(result.ok ? "Paramètres sauvegardés (adresse re-géocodée si modifiée)." : result.error);
      setTimeout(() => setMessage(null), 4000);
    });
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-ink">Tarifs &amp; Formules</h1>
      {message && <p className="mt-3 text-[12.5px] text-bronze">{message}</p>}

      <h2 className="mt-8 font-serif text-lg text-ink">Formules</h2>
      <div className="mt-4 flex flex-col gap-4">
        {formules.map((formule) => {
          const draft = formuleDrafts[formule.id];
          return (
            <div key={formule.id} className="border border-ink/15 bg-cream-light p-4">
              <div className="grid grid-cols-[1fr_120px] gap-3">
                <input
                  value={draft.nom}
                  onChange={(e) =>
                    setFormuleDrafts({
                      ...formuleDrafts,
                      [formule.id]: { ...draft, nom: e.target.value },
                    })
                  }
                  className={inputClass}
                />
                <input
                  value={draft.prix_base}
                  onChange={(e) =>
                    setFormuleDrafts({
                      ...formuleDrafts,
                      [formule.id]: { ...draft, prix_base: e.target.value },
                    })
                  }
                  className={inputClass}
                  placeholder="Prix €"
                />
              </div>
              <textarea
                rows={2}
                value={draft.description}
                onChange={(e) =>
                  setFormuleDrafts({
                    ...formuleDrafts,
                    [formule.id]: { ...draft, description: e.target.value },
                  })
                }
                className={`${inputClass} mt-2`}
                placeholder="Description"
              />
              <div className="mt-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-[12.5px] text-ink/70">
                  <input
                    type="checkbox"
                    checked={draft.actif}
                    onChange={(e) =>
                      setFormuleDrafts({
                        ...formuleDrafts,
                        [formule.id]: { ...draft, actif: e.target.checked },
                      })
                    }
                  />
                  Active
                </label>
                <button
                  onClick={() => handleSaveFormule(formule.id)}
                  disabled={isPending}
                  className="bg-ink px-4 py-2 text-[12px] text-cream-light disabled:opacity-40"
                >
                  Sauver
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="mt-10 font-serif text-lg text-ink">Frais de déplacement</h2>
      <div className="mt-4 border border-ink/15 bg-cream-light p-4">
        <label className="mb-1.5 block text-[11.5px] tracking-[0.05em] text-ink/60">
          Adresse de base (point de départ des trajets)
        </label>
        <input
          value={paramDraft.adresse_base}
          onChange={(e) => setParamDraft({ ...paramDraft, adresse_base: e.target.value })}
          className={inputClass}
        />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11.5px] tracking-[0.05em] text-ink/60">
              Rayon gratuit (km)
            </label>
            <input
              value={paramDraft.rayon_gratuit_km}
              onChange={(e) => setParamDraft({ ...paramDraft, rayon_gratuit_km: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11.5px] tracking-[0.05em] text-ink/60">
              Tarif par km (€)
            </label>
            <input
              value={paramDraft.tarif_par_km}
              onChange={(e) => setParamDraft({ ...paramDraft, tarif_par_km: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
        <button
          onClick={handleSaveParams}
          disabled={isPending}
          className="mt-4 bg-ink px-4 py-2 text-[12px] text-cream-light disabled:opacity-40"
        >
          Sauver les paramètres
        </button>
      </div>
    </div>
  );
}
