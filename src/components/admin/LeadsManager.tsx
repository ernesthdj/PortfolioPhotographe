"use client";

import { useState, useTransition } from "react";
import { addLeadNote, updateLeadStatut } from "@/app/actions/admin";

type Lead = {
  id: string;
  nom: string | null;
  email: string;
  telephone: string | null;
  date_mariage: string | null;
  ville_zone: string | null;
  distance_km: number | null;
  nombre_invites: number | null;
  formule_id: string | null;
  prix_estime: number | null;
  message: string | null;
  statut: string;
  created_at: string;
};

type Note = { id: string; lead_id: string; contenu: string; created_at: string };

const STATUTS = ["nouveau", "configure", "contacte", "signe"] as const;

const STATUT_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  configure: "Configuré",
  contacte: "Contacté",
  signe: "Signé",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("fr-BE", { dateStyle: "medium" }).format(new Date(value));

export function LeadsManager({
  leads,
  notes,
  formules,
}: {
  leads: Lead[];
  notes: Note[];
  formules: { id: string; nom: string }[];
}) {
  const [filter, setFilter] = useState<string>("tous");
  const [openId, setOpenId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  const formuleNames = new Map(formules.map((f) => [f.id, f.nom]));
  const filtered = filter === "tous" ? leads : leads.filter((l) => l.statut === filter);

  function handleStatut(leadId: string, statut: string) {
    startTransition(() => {
      updateLeadStatut(leadId, statut);
    });
  }

  function handleAddNote(leadId: string) {
    if (!noteDraft.trim()) return;
    startTransition(() => {
      addLeadNote(leadId, noteDraft);
      setNoteDraft("");
    });
  }

  return (
    <div>
      <h1 className="font-serif text-2xl text-ink">Leads</h1>

      <div className="mt-6 flex gap-2">
        {["tous", ...STATUTS].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`border px-3 py-1.5 text-[12px] ${
              filter === s
                ? "border-bronze bg-bronze/10 text-bronze"
                : "border-ink/20 text-ink/60 hover:border-ink/40"
            }`}
          >
            {s === "tous" ? "Tous" : STATUT_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {filtered.length === 0 && (
          <p className="text-[13px] text-ink/50">Aucun lead pour ce filtre.</p>
        )}
        {filtered.map((lead) => {
          const isOpen = openId === lead.id;
          const leadNotes = notes.filter((n) => n.lead_id === lead.id);
          return (
            <div key={lead.id} className="border border-ink/15 bg-cream-light">
              <button
                onClick={() => setOpenId(isOpen ? null : lead.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <span className="text-[13.5px] font-medium text-ink">
                    {lead.nom ?? lead.email}
                  </span>
                  <span className="ml-3 text-[12px] text-ink/50">
                    {lead.date_mariage ? formatDate(lead.date_mariage) : "date inconnue"}
                    {lead.ville_zone ? ` · ${lead.ville_zone}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {lead.prix_estime !== null && (
                    <span className="text-[12.5px] text-bronze">{Number(lead.prix_estime).toFixed(0)}€</span>
                  )}
                  <span className="border border-ink/20 px-2 py-0.5 text-[11px] text-ink/60">
                    {STATUT_LABELS[lead.statut] ?? lead.statut}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-ink/10 px-4 py-4">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[12.5px] text-ink/75 md:grid-cols-3">
                    <div>Email : {lead.email}</div>
                    <div>Téléphone : {lead.telephone ?? "—"}</div>
                    <div>Formule : {lead.formule_id ? formuleNames.get(lead.formule_id) ?? "—" : "—"}</div>
                    <div>Invités : {lead.nombre_invites ?? "—"}</div>
                    <div>Distance : {lead.distance_km ? `${Number(lead.distance_km).toFixed(1)} km` : "—"}</div>
                    <div>Reçu le : {formatDate(lead.created_at)}</div>
                  </div>
                  {lead.message && (
                    <p className="mt-3 border-l-2 border-bronze/40 pl-3 text-[12.5px] italic text-ink/70">
                      {lead.message}
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-3">
                    <select
                      value={lead.statut}
                      onChange={(e) => handleStatut(lead.id, e.target.value)}
                      disabled={isPending}
                      className="border border-ink/25 bg-transparent px-3 py-1.5 text-[12.5px] text-ink"
                    >
                      {STATUTS.map((s) => (
                        <option key={s} value={s}>
                          {STATUT_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <a
                      href={`mailto:${lead.email}`}
                      className="border border-bronze px-3 py-1.5 text-[12.5px] text-bronze hover:bg-bronze/10"
                    >
                      Répondre par email
                    </a>
                  </div>

                  <div className="mt-5">
                    <h3 className="text-[12px] font-semibold tracking-[0.05em] text-ink/60">
                      NOTES INTERNES
                    </h3>
                    <div className="mt-2 flex flex-col gap-1.5">
                      {leadNotes.length === 0 && (
                        <p className="text-[12px] text-ink/40">Aucune note.</p>
                      )}
                      {leadNotes.map((note) => (
                        <div key={note.id} className="text-[12.5px] text-ink/75">
                          <span className="font-mono text-[10.5px] text-ink/40">
                            {formatDate(note.created_at)}
                          </span>{" "}
                          — {note.contenu}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Ajouter une note…"
                        className="flex-1 border border-ink/25 bg-transparent px-3 py-1.5 text-[12.5px] text-ink focus:border-bronze focus:outline-none"
                      />
                      <button
                        onClick={() => handleAddNote(lead.id)}
                        disabled={isPending || !noteDraft.trim()}
                        className="bg-ink px-4 py-1.5 text-[12px] text-cream-light disabled:opacity-40"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
