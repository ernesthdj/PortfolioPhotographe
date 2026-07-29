import { z } from "zod";

// Champs du formulaire de devis — voir docs/modules/DEVIS.md §4.
// Validée à la fois côté client (React Hook Form) et côté serveur (Server Action,
// dernier rempart même si déjà validé côté client).
export const devisSchema = z.object({
  formuleId: z.string().uuid({ message: "Choisissez une formule." }),
  nom: z.string().trim().min(1, "Nom requis.").max(100),
  email: z.string().trim().email("Email invalide."),
  telephone: z
    .string()
    .trim()
    .regex(/^[0-9+()\s.-]{6,20}$/, "Numéro de téléphone invalide."),
  dateMariage: z
    .string()
    .min(1, "Date requise.")
    .refine((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return !Number.isNaN(date.getTime()) && date >= today;
    }, "La date doit être dans le futur."),
  villeZone: z.string().trim().max(200).optional().or(z.literal("")),
  nombreInvites: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || /^[0-9]+$/.test(value), "Nombre invalide."),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  rgpd: z.literal(true, {
    message: "Le consentement est requis pour envoyer la demande.",
  }),
  // Honeypot — doit toujours rester vide. Champ légitime jamais rempli par un humain.
  honeypot: z.string().max(0).optional().or(z.literal("")),
});

export type DevisFormValues = z.infer<typeof devisSchema>;
