"use client";

import { useState, useTransition } from "react";
import { saveService } from "@/app/actions/admin";

type Service = {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  categorie: string | null;
  actif: boolean;
  ordre_affichage: number;
};

type Draft = {
  nom: string;
  description: string;
  prix: string;
  categorie: string;
  actif: boolean;
  ordre_affichage: number;
};

const emptyDraft: Draft = {
  nom: "",
  description: "",
  prix: "",
  categorie: "produit",
  actif: true,
  ordre_affichage: 99,
};

const inputClass =
  "w-full border border-ink/25 bg-transparent px-3 py-2 text-[13.5px] text-ink focus:border-bronze focus:outline-none";

export function ServicesManager({ services }: { services: Service[] }) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>(
    Object.fromEntries(
      services.map((s) => [
        s.id,
        {
          nom: s.nom,
          description: s.description ?? "",
          prix: String(s.prix),
          categorie: s.categorie ?? "produit",
          actif: s.actif,
          ordre_affichage: s.ordre_affichage,
        },
      ])
    )
  );
  const [newDraft, setNewDraft] = useState<Draft>(emptyDraft);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave(id: string | null, draft: Draft) {
    startTransition(async () => {
      const result = await saveService(id, {
        nom: draft.nom,
        description: draft.description,
        prix: parseFloat(draft.prix) || 0,
        categorie: draft.categorie,
        actif: draft.actif,
        ordre_affichage: draft.ordre_affichage,
      });
      setMessage(result.ok ? (id ? "Service sauvegardé." : "Service créé.") : result.error);
      if (result.ok && !id) setNewDraft(emptyDraft);
      setTimeout(() => setMessage(null), 3000);
    });
  }

  function renderForm(
    draft: Draft,
    onChange: (d: Draft) => void,
    onSave: () => void,
    isNew = false,
    key?: string
  ) {
    return (
      <div
        key={key}
        className={`border p-4 ${isNew ? "border-bronze/40 bg-bronze/5" : "border-ink/15 bg-cream-light"}`}
      >
        <div className="grid grid-cols-[1fr_100px_120px] gap-3">
          <input
            value={draft.nom}
            onChange={(e) => onChange({ ...draft, nom: e.target.value })}
            className={inputClass}
            placeholder="Nom du service"
          />
          <input
            value={draft.prix}
            onChange={(e) => onChange({ ...draft, prix: e.target.value })}
            className={inputClass}
            placeholder="Prix €"
          />
          <select
            value={draft.categorie}
            onChange={(e) => onChange({ ...draft, categorie: e.target.value })}
            className={inputClass}
          >
            <option value="produit">Produit</option>
            <option value="prestation">Prestation</option>
          </select>
        </div>
        <textarea
          rows={2}
          value={draft.description}
          onChange={(e) => onChange({ ...draft, description: e.target.value })}
          className={`${inputClass} mt-2`}
          placeholder="Description visible par le client"
        />
        <div className="mt-3 flex items-center justify-between">
          <label className="flex items-center gap-2 text-[12.5px] text-ink/70">
            <input
              type="checkbox"
              checked={draft.actif}
              onChange={(e) => onChange({ ...draft, actif: e.target.checked })}
            />
            Actif (visible dans le dossier client)
          </label>
          <button
            onClick={onSave}
            disabled={isPending || !draft.nom.trim()}
            className="bg-ink px-4 py-2 text-[12px] text-cream-light disabled:opacity-40"
          >
            {isNew ? "Créer" : "Sauver"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-ink">Services à la carte</h1>
      <p className="mt-2 text-[13px] text-ink/60">
        Les dossiers déjà en cours gardent le prix au moment de la sélection (snapshot) —
        modifier un prix ici n&apos;affecte que les nouveaux choix.
      </p>
      {message && <p className="mt-3 text-[12.5px] text-bronze">{message}</p>}

      <div className="mt-6 flex flex-col gap-4">
        {services.map((service) =>
          renderForm(
            drafts[service.id],
            (d) => setDrafts({ ...drafts, [service.id]: d }),
            () => handleSave(service.id, drafts[service.id]),
            false,
            service.id
          )
        )}
      </div>

      <h2 className="mt-10 font-serif text-lg text-ink">Nouveau service</h2>
      <div className="mt-3">
        {renderForm(newDraft, setNewDraft, () => handleSave(null, newDraft), true)}
      </div>
    </div>
  );
}
