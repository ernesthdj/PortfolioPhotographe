"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { estimateTravelFee, submitDevis, type TravelFeeEstimate } from "@/app/actions/devis";
import { calculateTotal } from "@/lib/devis";
import { devisSchema, type DevisFormValues } from "@/lib/validation/devis-schema";

type Formule = {
  id: string;
  nom: string;
  prix_base: number;
  description: string | null;
};

const formatEuros = (value: number) =>
  new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    value
  );

export function DevisForm({ formules }: { formules: Formule[] }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DevisFormValues>({
    resolver: zodResolver(devisSchema),
    defaultValues: { formuleId: "", honeypot: "" },
  });

  const [travelEstimate, setTravelEstimate] = useState<TravelFeeEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [submitResult, setSubmitResult] = useState<"idle" | "success" | "error" | "rate_limited">(
    "idle"
  );
  const [submittedEmail, setSubmittedEmail] = useState("");

  const formuleId = watch("formuleId");
  const selectedFormule = formules.find((f) => f.id === formuleId);

  const fraisDeplacement =
    travelEstimate && travelEstimate.ok ? travelEstimate.fraisDeplacement : 0;
  const total = selectedFormule ? calculateTotal(selectedFormule.prix_base, fraisDeplacement) : null;

  async function handleVilleBlur(event: React.FocusEvent<HTMLInputElement>) {
    const ville = event.target.value.trim();
    if (!ville) {
      setTravelEstimate(null);
      return;
    }
    setEstimating(true);
    const result = await estimateTravelFee(ville);
    setTravelEstimate(result);
    setEstimating(false);
  }

  async function onSubmit(values: DevisFormValues) {
    const result = await submitDevis(values);
    if (result.ok) {
      setSubmittedEmail(values.email);
      setSubmitResult("success");
    } else if (result.error === "rate_limited") {
      setSubmitResult("rate_limited");
    } else {
      setSubmitResult("error");
    }
  }

  if (submitResult === "success") {
    return (
      <div className="max-w-md text-center">
        <p className="font-serif text-2xl text-cream-light">Merci !</p>
        <p className="mt-3 text-[14px] leading-[1.7] text-cream-light/70">
          Votre demande a bien été reçue, avec un récapitulatif dans votre boîte mail.
          Je reviens vers vous sous 48h.
        </p>
        <a
          href={`/connexion?mode=signup&email=${encodeURIComponent(submittedEmail)}`}
          className="mt-7 inline-block border border-gold px-6 py-3.5 text-[12.5px] tracking-[0.05em] text-gold transition-colors hover:bg-gold/10"
        >
          Personnaliser mon offre
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-2xl text-left">
      {/* Honeypot — jamais rempli par un humain */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        style={{ display: "none" }}
        {...register("honeypot")}
      />

      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-9">
        {formules.map((formule, i) => {
          const isSelected = formule.id === formuleId;
          return (
            <button
              type="button"
              key={formule.id}
              onClick={() => setValue("formuleId", formule.id, { shouldValidate: true })}
              className={`relative flex flex-col items-center justify-center rounded-full transition-all ${
                isSelected
                  ? "h-[210px] w-[210px] border border-gold bg-gold/[0.14]"
                  : "h-[190px] w-[190px] border border-cream-light/25 bg-cream-light/[0.06] hover:border-cream-light/50"
              }`}
            >
              {isSelected && (
                <div className="absolute -inset-2.5 rounded-full border border-dashed border-gold/40" />
              )}
              <div
                className={`text-[10.5px] uppercase tracking-[0.1em] ${
                  isSelected ? "text-gold" : "text-cream-light/60"
                }`}
              >
                {formule.nom}
              </div>
              <div className="mt-1.5 font-serif text-3xl text-cream-light">
                {formatEuros(formule.prix_base)}
              </div>
            </button>
          );
        })}
      </div>
      {errors.formuleId && (
        <p className="mt-3 text-center text-[12px] text-red-300">{errors.formuleId.message}</p>
      )}

      {selectedFormule && (
        <div className="mt-8 text-center">
          <div className="font-serif text-2xl text-cream-light">
            {total !== null ? formatEuros(total) : "—"}{" "}
            <span className="text-[13px] font-sans text-cream-light/50">estimés</span>
          </div>
          <div className="mt-1 text-[12px] text-cream-light/50">
            {selectedFormule.nom} {formatEuros(selectedFormule.prix_base)}
            {fraisDeplacement > 0 && (
              <>
                {" "}
                + déplacement {formatEuros(fraisDeplacement)}
                {travelEstimate?.ok && travelEstimate.distanceKm
                  ? ` (${travelEstimate.distanceKm.toFixed(1)} km)`
                  : ""}
              </>
            )}
            {estimating && " · calcul en cours…"}
            {travelEstimate?.ok === false && " · frais de déplacement à confirmer"}
          </div>
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Nom" error={errors.nom?.message}>
          <input {...register("nom")} className={inputClass} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input type="email" {...register("email")} className={inputClass} />
        </Field>
        <Field label="Téléphone" error={errors.telephone?.message}>
          <input type="tel" {...register("telephone")} className={inputClass} />
        </Field>
        <Field label="Date du mariage" error={errors.dateMariage?.message}>
          <input type="date" {...register("dateMariage")} className={inputClass} />
        </Field>
        <Field label="Ville / zone de l'événement" error={errors.villeZone?.message}>
          <input {...register("villeZone")} onBlur={handleVilleBlur} className={inputClass} />
        </Field>
        <Field label="Nombre d'invités (indicatif)" error={errors.nombreInvites?.message}>
          <input type="text" inputMode="numeric" {...register("nombreInvites")} className={inputClass} />
        </Field>
      </div>

      <div className="mt-5">
        <Field label="Message (optionnel)" error={errors.message?.message}>
          <textarea rows={3} {...register("message")} className={inputClass} />
        </Field>
      </div>

      <label className="mt-6 flex items-start gap-3 text-[12.5px] text-cream-light/70">
        <input type="checkbox" {...register("rgpd")} className="mt-0.5" />
        <span>
          J&apos;accepte que mes données soient utilisées pour être recontacté(e) au
          sujet de ma demande.
        </span>
      </label>
      {errors.rgpd && <p className="mt-2 text-[12px] text-red-300">{errors.rgpd.message}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-8 w-full bg-gold px-6 py-3.5 text-center text-[12.5px] tracking-[0.05em] text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? "Envoi…" : "Demander un devis"}
      </button>

      {submitResult === "rate_limited" && (
        <p className="mt-4 text-center text-[12.5px] text-red-300">
          Trop de tentatives, réessayez plus tard.
        </p>
      )}
      {submitResult === "error" && (
        <p className="mt-4 text-center text-[12.5px] text-red-300">
          Une erreur est survenue, réessayez dans quelques instants.
        </p>
      )}
    </form>
  );
}

const inputClass =
  "w-full border border-cream-light/25 bg-transparent px-4 py-2.5 text-[14px] text-cream-light placeholder:text-cream-light/40 focus:border-gold focus:outline-none";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11.5px] tracking-[0.05em] text-cream-light/60">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-[12px] text-red-300">{error}</p>}
    </div>
  );
}
