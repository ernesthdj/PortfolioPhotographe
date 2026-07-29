"use client";

import { useMemo, useState } from "react";
import {
  saveDossierReponse,
  setDossierFormule,
  submitDossier,
  toggleServiceOption,
} from "@/app/actions/dossier";
import { Pellicule } from "./Pellicule";

type Formule = { id: string; nom: string; prix_base: number };
type Service = { id: string; nom: string; description: string | null; prix: number; categorie: string | null };
type Champ = {
  id: string;
  libelle: string;
  cle: string;
  type: string;
  options_json: string[] | null;
  obligatoire: boolean;
  section: string | null;
};

const formatEuros = (value: number) =>
  new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    value
  );

export function DossierBuilder({
  dossierId,
  formules,
  initialFormuleId,
  services,
  initialServiceIds,
  champs,
  initialReponses,
}: {
  dossierId: string;
  formules: Formule[];
  initialFormuleId: string | null;
  services: Service[];
  initialServiceIds: string[];
  champs: Champ[];
  initialReponses: Record<string, string>;
}) {
  const [formuleId, setFormuleId] = useState(initialFormuleId);
  const [serviceIds, setServiceIds] = useState(new Set(initialServiceIds));
  const [reponses, setReponses] = useState(initialReponses);
  const [developing, setDeveloping] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sections = useMemo(() => {
    const map = new Map<string, Champ[]>();
    for (const champ of champs) {
      const key = champ.section ?? "Autres";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(champ);
    }
    return Array.from(map.entries());
  }, [champs]);

  const total = 1 + services.length + champs.length;
  const filled =
    (formuleId ? 1 : 0) +
    serviceIds.size +
    Object.values(reponses).filter((v) => v && v.trim() !== "").length;

  const selectedFormule = formules.find((f) => f.id === formuleId);
  const optionsTotal = services
    .filter((s) => serviceIds.has(s.id))
    .reduce((sum, s) => sum + s.prix, 0);
  const total_price = (selectedFormule?.prix_base ?? 0) + optionsTotal;

  async function handleFormuleClick(id: string) {
    setFormuleId(id);
    await setDossierFormule(dossierId, id);
  }

  async function handleServiceClick(id: string) {
    const next = new Set(serviceIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setServiceIds(next);
    await toggleServiceOption(dossierId, id);
  }

  function handleChampChange(champId: string, value: string) {
    setReponses((prev) => ({ ...prev, [champId]: value }));
  }

  async function handleChampBlur(champId: string, value: string) {
    await saveDossierReponse(dossierId, champId, value);
  }

  async function handleSubmit() {
    setError(null);
    setDeveloping(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    const result = await submitDossier(dossierId);
    if (result.ok) {
      setSubmitted(true);
    } else {
      setDeveloping(false);
      setError("Une erreur est survenue, réessayez.");
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="font-serif text-2xl text-ink">Votre pellicule est développée.</p>
        <p className="mt-3 text-[14px] leading-[1.7] text-ink/70">
          Votre dossier a bien été envoyé. Je reviens vers vous très vite.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-ink">Votre dossier</h1>
        <div className="text-right text-[12px] text-ink/50">
          <div>{formatEuros(total_price)} estimés</div>
        </div>
      </div>

      <Pellicule total={total} filled={filled} developing={developing} />

      <section className="mt-10">
        <h2 className="mb-4 font-serif text-lg text-ink">Formule</h2>
        <div className="flex flex-wrap gap-3">
          {formules.map((formule) => (
            <button
              key={formule.id}
              type="button"
              onClick={() => handleFormuleClick(formule.id)}
              className={`border px-4 py-2.5 text-[13px] transition-colors ${
                formuleId === formule.id
                  ? "border-bronze bg-bronze/10 text-bronze"
                  : "border-ink/20 text-ink/70 hover:border-ink/40"
              }`}
            >
              {formule.nom} — {formatEuros(formule.prix_base)}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-serif text-lg text-ink">Options à la carte</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {services.map((service) => {
            const isSelected = serviceIds.has(service.id);
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => handleServiceClick(service.id)}
                className={`flex flex-col items-start border px-4 py-3.5 text-left transition-colors ${
                  isSelected ? "border-bronze bg-bronze/10" : "border-ink/20 hover:border-ink/40"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-[13.5px] font-medium text-ink">{service.nom}</span>
                  <span className="text-[12.5px] text-bronze">{formatEuros(service.prix)}</span>
                </div>
                {service.description && (
                  <span className="mt-1 text-[12px] text-ink/55">{service.description}</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {sections.map(([sectionName, sectionChamps]) => (
        <section key={sectionName} className="mt-10">
          <h2 className="mb-4 font-serif text-lg text-ink">{sectionName}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sectionChamps.map((champ) => (
              <ChampField
                key={champ.id}
                champ={champ}
                value={reponses[champ.id] ?? ""}
                onChange={(v) => handleChampChange(champ.id, v)}
                onBlur={(v) => handleChampBlur(champ.id, v)}
              />
            ))}
          </div>
        </section>
      ))}

      {error && <p className="mt-6 text-[12.5px] text-red-700">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!formuleId || developing}
        className="mt-10 w-full bg-ink px-6 py-3.5 text-center text-[12.5px] tracking-[0.05em] text-cream-light transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {developing ? "Développement…" : "Envoyer mon dossier"}
      </button>
    </div>
  );
}

function ChampField({
  champ,
  value,
  onChange,
  onBlur,
}: {
  champ: Champ;
  value: string;
  onChange: (value: string) => void;
  onBlur: (value: string) => void;
}) {
  const inputClass =
    "w-full border border-ink/25 bg-transparent px-4 py-2.5 text-[14px] text-ink focus:border-bronze focus:outline-none";

  const commonProps = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange(e.target.value),
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onBlur(e.target.value),
    className: inputClass,
  };

  return (
    <div>
      <label className="mb-1.5 block text-[11.5px] tracking-[0.05em] text-ink/60">
        {champ.libelle}
        {champ.obligatoire && <span className="text-bronze"> *</span>}
      </label>
      {champ.type === "texte_long" ? (
        <textarea rows={3} {...commonProps} />
      ) : champ.type === "choix_unique" && champ.options_json ? (
        <select {...commonProps}>
          <option value="">—</option>
          {champ.options_json.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={
            champ.type === "date"
              ? "date"
              : champ.type === "heure"
              ? "time"
              : champ.type === "nombre"
              ? "text"
              : champ.type === "email"
              ? "email"
              : champ.type === "telephone"
              ? "tel"
              : "text"
          }
          {...commonProps}
        />
      )}
    </div>
  );
}
