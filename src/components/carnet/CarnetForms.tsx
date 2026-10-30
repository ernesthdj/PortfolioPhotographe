"use client";

import Link from "next/link";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { estimateTravelFee, submitDevis, type TravelFeeEstimate } from "@/app/actions/devis";
import { calculateTotal } from "@/lib/devis";
import type { DevisFormValues } from "@/lib/validation/devis-schema";
import { PageHead } from "./CarnetPages";
import { formatEuros, type CarnetFormule } from "./carnet.types";

const CONTACT_EMAIL = "ernest_photography@outlook.com";
const ARC_LENGTH = 2 * Math.PI * 14;

type DevisForm = UseFormReturn<DevisFormValues>;

export function QuotePage({
  formules,
  form,
  onAsk,
}: {
  formules: CarnetFormule[];
  form: DevisForm;
  onAsk: () => void;
}) {
  const [estimate, setEstimate] = useState<TravelFeeEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const formuleId = form.watch("formuleId");
  const formule = formules.find((f) => f.id === formuleId);
  const frais = estimate?.ok ? estimate.fraisDeplacement : 0;

  async function handleVilleBlur(event: React.FocusEvent<HTMLInputElement>) {
    const ville = event.target.value.trim();
    if (!ville) {
      setEstimate(null);
      return;
    }
    setEstimating(true);
    setEstimate(await estimateTravelFee(ville));
    setEstimating(false);
  }

  function detailEstimation() {
    if (!formule) return "";
    if (estimating) return "Calcul du déplacement…";
    if (estimate?.ok === false) return `${formule.nom} ${formatEuros(formule.prix_base)}, déplacement à confirmer`;
    if (!estimate) return `${formule.nom} ${formatEuros(formule.prix_base)}, indiquez la ville pour le déplacement`;
    return `${formule.nom} ${formatEuros(formule.prix_base)} + ${frais ? `${formatEuros(frais, 2)} de déplacement` : "déplacement offert"}`;
  }

  return (
    <div className="pg">
      <PageHead kicker="Nº003 · Devis" numero="03" />
      <h2>
        Trois formules, un devis <b>clair</b>.
      </h2>
      {formules.length === 0 ? (
        <p className="lede">Les formules arrivent bientôt. Écrivez-moi pour un devis sur mesure.</p>
      ) : (
        <div className="forms" role="radiogroup" aria-label="Formule">
          {formules.map((f, i) => {
            const part = (i + 1) / formules.length;
            return (
              <button
                type="button"
                className="fo"
                role="radio"
                key={f.id}
                aria-checked={f.id === formuleId}
                onClick={() => form.setValue("formuleId", f.id, { shouldValidate: true })}
              >
                <svg viewBox="0 0 34 34" aria-hidden="true">
                  <circle className="arc-bg" cx="17" cy="17" r="14" fill="none" strokeWidth="3" />
                  <circle
                    className="arc"
                    cx="17"
                    cy="17"
                    r="14"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    transform="rotate(-90 17 17)"
                    strokeDasharray={`${(part * ARC_LENGTH).toFixed(1)} ${ARC_LENGTH.toFixed(1)}`}
                  />
                </svg>
                <span>
                  <b>{f.nom}</b>
                  {f.description && <small>{f.description}</small>}
                </span>
                <span className="pr">{formatEuros(f.prix_base)}</span>
              </button>
            );
          })}
        </div>
      )}
      <label className="field">
        Ville du mariage
        <input {...form.register("villeZone")} onBlur={handleVilleBlur} autoComplete="address-level2" maxLength={200} />
      </label>
      <div className="total">
        <div>
          <span className="label">Estimation</span>
          <span className="v">{formule ? formatEuros(calculateTotal(formule.prix_base, frais), 2) : "—"}</span>
          <small>{detailEstimation()}</small>
        </div>
        <button type="button" className="cta" onClick={onAsk}>
          Demander ce devis
        </button>
      </div>
    </div>
  );
}

type SubmitState = "idle" | "success" | "error" | "rate_limited";

export function ContactPage({
  form,
  temoignage,
  onChooseFormule,
}: {
  form: DevisForm;
  temoignage: { citation: string; auteur: string };
  onChooseFormule: () => void;
}) {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const { errors, isSubmitting } = form.formState;
  const premiereErreur =
    errors.nom?.message ??
    errors.dateMariage?.message ??
    errors.email?.message ??
    errors.telephone?.message ??
    errors.message?.message ??
    errors.rgpd?.message ??
    errors.formuleId?.message;

  async function onSubmit(values: DevisFormValues) {
    const result = await submitDevis(values);
    if (result.ok) {
      setSubmittedEmail(values.email);
      setSubmitState("success");
    } else {
      setSubmitState(result.error === "rate_limited" ? "rate_limited" : "error");
    }
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (submitState === "success") {
    return (
      <div className="pg">
        <PageHead kicker="Nº004 · Contact" numero="04" />
        <h2>
          <b>Merci</b> !
        </h2>
        <p className="lede">
          Votre demande a bien été reçue, avec un récapitulatif dans votre boîte mail. Je reviens vers vous sous 48h.
        </p>
        <Link className="more" href={`/connexion?mode=signup&email=${encodeURIComponent(submittedEmail)}`}>
          Personnaliser mon offre →
        </Link>
      </div>
    );
  }

  return (
    <div className="pg">
      <PageHead kicker="Nº004 · Contact" numero="04" />
      <h2>
        Une date en tête&nbsp;? <b>Écrivez</b>-moi.
      </h2>
      <blockquote className="quote">
        « {temoignage.citation} »<cite>{temoignage.auteur.toUpperCase()}</cite>
      </blockquote>
      <form className="form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {/* Honeypot — jamais rempli par un humain */}
        <input type="text" tabIndex={-1} autoComplete="off" style={{ display: "none" }} {...form.register("honeypot")} />
        <div className="row2">
          <label className="field">
            Vos prénoms
            <input {...form.register("nom")} autoComplete="name" maxLength={100} aria-invalid={Boolean(errors.nom)} />
          </label>
          <label className="field">
            Date du mariage
            <input type="date" {...form.register("dateMariage")} aria-invalid={Boolean(errors.dateMariage)} />
          </label>
        </div>
        <div className="row2">
          <label className="field">
            E-mail
            <input type="email" {...form.register("email")} autoComplete="email" aria-invalid={Boolean(errors.email)} />
          </label>
          <label className="field">
            Téléphone
            <input type="tel" {...form.register("telephone")} autoComplete="tel" aria-invalid={Boolean(errors.telephone)} />
          </label>
        </div>
        <label className="field">
          Message
          <textarea rows={2} {...form.register("message")} maxLength={1000} placeholder="Lieu, nombre d'invités, ce qui compte pour vous" />
        </label>
        <label className="consent">
          <input type="checkbox" {...form.register("rgpd")} aria-invalid={Boolean(errors.rgpd)} />
          <span>J&apos;accepte que mes données soient utilisées pour être recontacté(e) au sujet de ma demande.</span>
        </label>
        <div className="send">
          <button className="cta" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Envoi…" : "Envoyer"}
          </button>
          <p className="status" role="status">
            {submitState === "rate_limited" && "Trop de tentatives, réessayez plus tard."}
            {submitState === "error" && "Une erreur est survenue, réessayez dans quelques instants."}
            {submitState === "idle" && errors.formuleId && (
              <button type="button" className="link" onClick={onChooseFormule}>
                {errors.formuleId.message}
              </button>
            )}
            {submitState === "idle" && !errors.formuleId && premiereErreur}
          </p>
        </div>
      </form>
      <div className="mail">
        <span>{CONTACT_EMAIL}</span>
        <button type="button" className="ghost" onClick={copyEmail}>
          {copied ? "Copié" : "Copier"}
        </button>
        <a href="https://instagram.com/h.ernest_photography" target="_blank" rel="noreferrer">
          INSTAGRAM
        </a>
      </div>
    </div>
  );
}
