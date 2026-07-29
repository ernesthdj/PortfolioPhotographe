"use client";

import { useState, useTransition } from "react";
import { deleteChamp, saveChamp } from "@/app/actions/admin";

type Champ = {
  id: string;
  libelle: string;
  cle: string;
  type: string;
  options_json: string[] | null;
  obligatoire: boolean;
  section: string | null;
  ordre_affichage: number;
  actif: boolean;
};

type Draft = {
  libelle: string;
  type: string;
  obligatoire: boolean;
  section: string;
  ordre_affichage: number;
  actif: boolean;
  options: string; // saisies séparées par des virgules pour choix_unique/multiple
};

const TYPES = [
  { value: "texte_court", label: "Texte court" },
  { value: "texte_long", label: "Texte long" },
  { value: "date", label: "Date" },
  { value: "heure", label: "Heure" },
  { value: "nombre", label: "Nombre" },
  { value: "email", label: "Email" },
  { value: "telephone", label: "Téléphone" },
  { value: "choix_unique", label: "Choix unique" },
  { value: "choix_multiple", label: "Choix multiple" },
];

const emptyDraft: Draft = {
  libelle: "",
  type: "texte_court",
  obligatoire: false,
  section: "Lieu & horaire",
  ordre_affichage: 99,
  actif: true,
  options: "",
};

const inputClass =
  "w-full border border-ink/25 bg-transparent px-3 py-2 text-[13.5px] text-ink focus:border-bronze focus:outline-none";

function toDraft(champ: Champ): Draft {
  return {
    libelle: champ.libelle,
    type: champ.type,
    obligatoire: champ.obligatoire,
    section: champ.section ?? "",
    ordre_affichage: champ.ordre_affichage,
    actif: champ.actif,
    options: (champ.options_json ?? []).join(", "),
  };
}

export function ChampsManager({ champs }: { champs: Champ[] }) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>(
    Object.fromEntries(champs.map((c) => [c.id, toDraft(c)]))
  );
  const [newDraft, setNewDraft] = useState<Draft>(emptyDraft);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave(id: string | null, draft: Draft) {
    const isChoix = draft.type === "choix_unique" || draft.type === "choix_multiple";
    const options = isChoix
      ? draft.options
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean)
      : null;

    startTransition(async () => {
      const result = await saveChamp(id, {
        libelle: draft.libelle,
        type: draft.type,
        obligatoire: draft.obligatoire,
        section: draft.section.trim() || "Autres",
        ordre_affichage: draft.ordre_affichage,
        actif: draft.actif,
        options_json: options,
      });
      setMessage(result.ok ? (id ? "Champ sauvegardé." : "Champ créé.") : result.error);
      if (result.ok && !id) setNewDraft(emptyDraft);
      setTimeout(() => setMessage(null), 3000);
    });
  }

  function handleDelete(champ: Champ) {
    if (confirmDeleteId !== champ.id) {
      setConfirmDeleteId(champ.id);
      return;
    }
    setConfirmDeleteId(null);
    startTransition(async () => {
      const result = await deleteChamp(champ.id);
      setMessage(result.ok ? "Champ supprimé." : result.error);
      setTimeout(() => setMessage(null), 3000);
    });
  }

  function renderForm(
    draft: Draft,
    onChange: (d: Draft) => void,
    onSave: () => void,
    champ: Champ | null
  ) {
    const isChoix = draft.type === "choix_unique" || draft.type === "choix_multiple";
    const isNew = champ === null;
    return (
      <div
        key={champ?.id}
        className={`border p-4 ${isNew ? "border-bronze/40 bg-bronze/5" : "border-ink/15 bg-cream-light"}`}
      >
        <div className="grid grid-cols-[1fr_150px_150px] gap-3">
          <input
            value={draft.libelle}
            onChange={(e) => onChange({ ...draft, libelle: e.target.value })}
            className={inputClass}
            placeholder="Libellé affiché au client"
          />
          <select
            value={draft.type}
            onChange={(e) => onChange({ ...draft, type: e.target.value })}
            className={inputClass}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            value={draft.section}
            onChange={(e) => onChange({ ...draft, section: e.target.value })}
            className={inputClass}
            placeholder="Section"
          />
        </div>
        {champ && confirmDeleteId === champ.id && (
          <p className="mt-2 text-[12px] text-red-700">
            Les réponses déjà données par des clients pour ce champ seront perdues (perte de
            traçabilité). Préférez la désactivation (décocher « Actif ») pour masquer le champ
            sans rien effacer.
          </p>
        )}
        {isChoix && (
          <input
            value={draft.options}
            onChange={(e) => onChange({ ...draft, options: e.target.value })}
            className={`${inputClass} mt-2`}
            placeholder="Options possibles, séparées par des virgules"
          />
        )}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-5 text-[12.5px] text-ink/70">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.obligatoire}
                onChange={(e) => onChange({ ...draft, obligatoire: e.target.checked })}
              />
              Obligatoire
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.actif}
                onChange={(e) => onChange({ ...draft, actif: e.target.checked })}
              />
              Actif
            </label>
            <label className="flex items-center gap-1.5">
              Ordre
              <input
                type="number"
                value={draft.ordre_affichage}
                onChange={(e) =>
                  onChange({ ...draft, ordre_affichage: parseInt(e.target.value, 10) || 0 })
                }
                className="w-16 border border-ink/25 bg-transparent px-2 py-1 text-[12px] text-ink"
              />
            </label>
          </div>
          <div className="flex items-center gap-3">
            {champ && confirmDeleteId === champ.id && (
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="text-[11.5px] text-ink/50 hover:text-ink"
              >
                Annuler
              </button>
            )}
            {champ && (
              <button
                onClick={() => handleDelete(champ)}
                disabled={isPending}
                className={`text-[11.5px] ${
                  confirmDeleteId === champ.id
                    ? "font-semibold text-red-700"
                    : "text-red-700/70 hover:text-red-700"
                }`}
              >
                {confirmDeleteId === champ.id ? "Confirmer ?" : "Supprimer"}
              </button>
            )}
            <button
              onClick={onSave}
              disabled={isPending || !draft.libelle.trim()}
              className="bg-ink px-4 py-2 text-[12px] text-cream-light disabled:opacity-40"
            >
              {isNew ? "Créer" : "Sauver"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Groupement par section pour refléter ce que verra le client.
  const sections = new Map<string, Champ[]>();
  for (const champ of champs) {
    const key = champ.section ?? "Autres";
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key)!.push(champ);
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-2xl text-ink">Champs du dossier</h1>
      <p className="mt-2 text-[13px] text-ink/60">
        Le questionnaire logistique que remplit le client dans son dossier. Renommer un
        champ ne casse pas les réponses existantes ; désactiver le masque des nouveaux
        dossiers sans effacer l&apos;historique.
      </p>
      {message && <p className="mt-3 text-[12.5px] text-bronze">{message}</p>}

      {Array.from(sections.entries()).map(([sectionName, sectionChamps]) => (
        <div key={sectionName} className="mt-8">
          <h2 className="mb-3 font-serif text-lg text-ink">{sectionName}</h2>
          <div className="flex flex-col gap-3">
            {sectionChamps.map((champ) =>
              renderForm(
                drafts[champ.id],
                (d) => setDrafts({ ...drafts, [champ.id]: d }),
                () => handleSave(champ.id, drafts[champ.id]),
                champ
              )
            )}
          </div>
        </div>
      ))}

      <h2 className="mt-10 font-serif text-lg text-ink">Nouveau champ</h2>
      <div className="mt-3">
        {renderForm(newDraft, setNewDraft, () => handleSave(null, newDraft), null)}
      </div>
    </div>
  );
}
