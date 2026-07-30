"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-guard";
import {
  uploadPhoto,
  deletePhoto as deleteCloudinaryPhoto,
  listFolder,
  type CloudinaryLibraryPhoto,
} from "@/lib/cloudinary";
import { geocode } from "@/lib/geo";

// Catégories photo à slot unique : une seule photo active à la fois (CMS.md §3).
const SLOT_CATEGORIES = [
  "hero",
  "about-portrait",
  "about-travail",
  "timeline-05h",
  "timeline-14h",
  "timeline-19h",
  "timeline-23h",
];

type ActionResult = { ok: true } | { ok: false; error: string };

const FORBIDDEN = { ok: false as const, error: "Accès refusé." };

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export async function updateLeadStatut(leadId: string, statut: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  if (!["nouveau", "configure", "contacte", "signe"].includes(statut)) {
    return { ok: false, error: "Statut invalide." };
  }

  const { error } = await admin.supabase.from("leads").update({ statut }).eq("id", leadId);
  if (error) return { ok: false, error: "Échec de la mise à jour." };

  revalidatePath("/admin/leads");
  return { ok: true };
}

export async function addLeadNote(leadId: string, contenu: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  const trimmed = contenu.trim();
  if (!trimmed) return { ok: false, error: "Note vide." };

  const { error } = await admin.supabase
    .from("lead_notes")
    .insert({ lead_id: leadId, contenu: trimmed });
  if (error) return { ok: false, error: "Échec de l'ajout." };

  revalidatePath("/admin/leads");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Textes
// ---------------------------------------------------------------------------

export async function updateContenu(cle: string, valeur: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  const { error } = await admin.supabase
    .from("contenus_site")
    .upsert({ cle, valeur }, { onConflict: "cle" });
  if (error) return { ok: false, error: "Échec de la sauvegarde." };

  revalidatePath("/");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Tarifs & Formules
// ---------------------------------------------------------------------------

export async function updateFormule(
  id: string,
  values: { nom: string; prix_base: number; description: string; actif: boolean }
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  if (!values.nom.trim() || values.prix_base < 0) {
    return { ok: false, error: "Valeurs invalides." };
  }

  const { error } = await admin.supabase.from("formules").update(values).eq("id", id);
  if (error) return { ok: false, error: "Échec de la sauvegarde." };

  revalidatePath("/");
  return { ok: true };
}

export async function updateParametresTarifs(values: {
  adresse_base: string;
  rayon_gratuit_km: number;
  tarif_par_km: number;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  const { data: current } = await admin.supabase
    .from("parametres_tarifs")
    .select("id, adresse_base")
    .limit(1)
    .single();
  if (!current) return { ok: false, error: "Paramètres introuvables." };

  // Changement d'adresse de base -> re-géocodage immédiat (CMS.md §5, DEVIS.md §6).
  let coords: { lat: number; lon: number } | null = null;
  if (values.adresse_base.trim() !== current.adresse_base) {
    coords = await geocode(values.adresse_base.trim());
    if (!coords) {
      return { ok: false, error: "Adresse introuvable — géocodage impossible." };
    }
  }

  const { error } = await admin.supabase
    .from("parametres_tarifs")
    .update({
      adresse_base: values.adresse_base.trim(),
      rayon_gratuit_km: values.rayon_gratuit_km,
      tarif_par_km: values.tarif_par_km,
      ...(coords ? { lat: coords.lat, lon: coords.lon } : {}),
    })
    .eq("id", current.id);
  if (error) return { ok: false, error: "Échec de la sauvegarde." };

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Services à la carte
// ---------------------------------------------------------------------------

export async function saveService(
  id: string | null,
  values: {
    nom: string;
    description: string;
    prix: number;
    categorie: string;
    actif: boolean;
    ordre_affichage: number;
  }
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  if (!values.nom.trim() || values.prix < 0) {
    return { ok: false, error: "Valeurs invalides." };
  }

  const { error } = id
    ? await admin.supabase.from("services_carte").update(values).eq("id", id)
    : await admin.supabase.from("services_carte").insert(values);
  if (error) return { ok: false, error: "Échec de la sauvegarde." };

  revalidatePath("/admin/services");
  revalidatePath("/dossier");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Champs du dossier (form builder)
// ---------------------------------------------------------------------------

const CHAMP_TYPES = [
  "texte_court",
  "texte_long",
  "date",
  "heure",
  "nombre",
  "email",
  "telephone",
  "choix_unique",
  "choix_multiple",
];

export async function saveChamp(
  id: string | null,
  values: {
    libelle: string;
    type: string;
    obligatoire: boolean;
    section: string;
    ordre_affichage: number;
    actif: boolean;
    options_json: string[] | null;
  }
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  if (!values.libelle.trim() || !CHAMP_TYPES.includes(values.type)) {
    return { ok: false, error: "Valeurs invalides." };
  }

  if (id) {
    const { error } = await admin.supabase.from("dossier_champs").update(values).eq("id", id);
    if (error) return { ok: false, error: "Échec de la sauvegarde." };
  } else {
    // Clé technique dérivée du libellé, unique — les réponses restent liées par id
    // même si le libellé change ensuite (DOSSIER.md §3.2).
    const cle =
      values.libelle
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 50) + "_" + Date.now().toString(36);
    const { error } = await admin.supabase.from("dossier_champs").insert({ ...values, cle });
    if (error) return { ok: false, error: "Échec de la création." };
  }

  revalidatePath("/admin/champs");
  revalidatePath("/dossier");
  return { ok: true };
}

// Suppression définitive — l'UI affiche un avertissement de perte de traçabilité
// avant d'appeler cette action (CMS.md §6bis). La désactivation reste le défaut.
export async function deleteChamp(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  await admin.supabase.from("dossier_reponses").delete().eq("champ_id", id);
  const { error } = await admin.supabase.from("dossier_champs").delete().eq("id", id);
  if (error) return { ok: false, error: "Échec de la suppression." };

  revalidatePath("/admin/champs");
  revalidatePath("/dossier");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export async function uploadPhotoAction(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  const file = formData.get("file");
  const categorie = String(formData.get("categorie") ?? "");
  const titre = String(formData.get("titre") ?? "").trim();

  if (!(file instanceof File)) return { ok: false, error: "Aucun fichier." };
  if (!file.type.startsWith("image/")) return { ok: false, error: "Fichier non-image refusé." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "Image trop lourde (max 12 Mo)." };
  if (![...SLOT_CATEGORIES, "galerie"].includes(categorie)) {
    return { ok: false, error: "Catégorie invalide." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let uploaded: { url: string; publicId: string; width: number; height: number };
  try {
    uploaded = await uploadPhoto(buffer);
  } catch {
    return { ok: false, error: "Échec de l'upload Cloudinary." };
  }

  const { error } = await admin.supabase.from("photos").insert({
    url_cloudinary: uploaded.url,
    public_id_cloudinary: uploaded.publicId,
    titre: titre || null,
    categorie,
    actif: false,
    image_width: uploaded.width,
    image_height: uploaded.height,
  });
  if (error) return { ok: false, error: "Échec de l'enregistrement." };

  revalidatePath("/admin/photos");
  return { ok: true };
}

export async function setPhotoActive(photoId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  const { data: photo } = await admin.supabase
    .from("photos")
    .select("id, categorie")
    .eq("id", photoId)
    .single();
  if (!photo) return { ok: false, error: "Photo introuvable." };

  // Slot unique : activer celle-ci désactive automatiquement l'ancienne (CMS.md §3).
  if (SLOT_CATEGORIES.includes(photo.categorie)) {
    await admin.supabase
      .from("photos")
      .update({ actif: false })
      .eq("categorie", photo.categorie)
      .neq("id", photoId);
  }

  const { error } = await admin.supabase.from("photos").update({ actif: true }).eq("id", photoId);
  if (error) return { ok: false, error: "Échec de l'activation." };

  revalidatePath("/admin/photos");
  revalidatePath("/");
  return { ok: true };
}

export async function setPhotoInactive(photoId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  const { error } = await admin.supabase.from("photos").update({ actif: false }).eq("id", photoId);
  if (error) return { ok: false, error: "Échec." };

  revalidatePath("/admin/photos");
  revalidatePath("/");
  return { ok: true };
}

export async function deletePhotoAction(photoId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  const { data: photo } = await admin.supabase
    .from("photos")
    .select("id, public_id_cloudinary")
    .eq("id", photoId)
    .single();
  if (!photo) return { ok: false, error: "Photo introuvable." };

  try {
    await deleteCloudinaryPhoto(photo.public_id_cloudinary);
  } catch {
    // Suppression Cloudinary échouée : on supprime quand même la référence DB,
    // l'orphelin Cloudinary est sans conséquence (pas affiché, quota généreux).
  }

  const { error } = await admin.supabase.from("photos").delete().eq("id", photoId);
  if (error) return { ok: false, error: "Échec de la suppression." };

  revalidatePath("/admin/photos");
  revalidatePath("/");
  return { ok: true };
}

type LibraryResult = { ok: true; photos: CloudinaryLibraryPhoto[] } | { ok: false; error: string };

export async function listCloudinaryLibrary(folder: string): Promise<LibraryResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  const trimmed = folder.trim();
  if (!trimmed) return { ok: false, error: "Nom de dossier vide." };

  try {
    const photos = await listFolder(trimmed);
    return { ok: true, photos };
  } catch {
    return { ok: false, error: "Échec du chargement du dossier Cloudinary." };
  }
}

// Rattache une photo deja presente sur Cloudinary a un emplacement, sans re-upload.
// Inseree inactive comme le flux d'upload : l'activation reste un geste separe et
// explicite (evite d'ecraser par erreur la photo active d'un slot unique).
export async function assignPhotoFromLibrary(
  categorie: string,
  publicId: string,
  url: string,
  width: number,
  height: number,
  titre?: string
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  if (![...SLOT_CATEGORIES, "galerie"].includes(categorie)) {
    return { ok: false, error: "Catégorie invalide." };
  }
  if (!publicId || !url) return { ok: false, error: "Photo invalide." };
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { ok: false, error: "Dimensions invalides." };
  }

  const { data: existing } = await admin.supabase
    .from("photos")
    .select("id")
    .eq("public_id_cloudinary", publicId)
    .eq("categorie", categorie)
    .maybeSingle();
  if (existing) return { ok: false, error: "Déjà présente pour cet emplacement." };

  const { error } = await admin.supabase.from("photos").insert({
    url_cloudinary: url,
    public_id_cloudinary: publicId,
    titre: titre?.trim() || null,
    categorie,
    actif: false,
    image_width: width,
    image_height: height,
  });
  if (error) return { ok: false, error: "Échec de l'enregistrement." };

  revalidatePath("/admin/photos");
  return { ok: true };
}

// Cadrage manuel (zoom + position) sauvegardé depuis le cropper CMS. Coordonnées en
// pixels de l'image originale (image_width/image_height) — voir plan "Recadrage" du
// 2026-07-30. null = pas de cadrage custom, fallback object-cover centré.
export async function savePhotoCrop(
  photoId: string,
  crop: { x: number; y: number; width: number; height: number }
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  const { data: photo } = await admin.supabase
    .from("photos")
    .select("id, image_width, image_height")
    .eq("id", photoId)
    .single();
  if (!photo) return { ok: false, error: "Photo introuvable." };
  if (!photo.image_width || !photo.image_height) {
    return { ok: false, error: "Dimensions de l'image inconnues." };
  }

  const { x, y, width, height } = crop;
  const valid =
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    x >= 0 &&
    y >= 0 &&
    width > 0 &&
    height > 0 &&
    x + width <= photo.image_width + 1 &&
    y + height <= photo.image_height + 1;
  if (!valid) return { ok: false, error: "Cadrage invalide." };

  const { error } = await admin.supabase
    .from("photos")
    .update({
      crop_x: Math.round(x),
      crop_y: Math.round(y),
      crop_width: Math.round(width),
      crop_height: Math.round(height),
    })
    .eq("id", photoId);
  if (error) return { ok: false, error: "Échec de l'enregistrement du cadrage." };

  revalidatePath("/admin/photos");
  revalidatePath("/");
  return { ok: true };
}
