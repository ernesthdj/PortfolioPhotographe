"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-guard";
import { uploadPhoto, listFolder, type CloudinaryLibraryPhoto } from "@/lib/cloudinary";
import { geocode } from "@/lib/geo";
import { slugify } from "@/lib/slugify";

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

// Un slot unique (hero, about-*, timeline-*) ne doit jamais accumuler plusieurs lignes
// candidates — contrairement a "galerie" (multi, additif par design). Choisir une
// nouvelle photo pour un slot unique remplace donc integralement l'ancienne (supprime
// la/les ligne(s) DB existantes pour cette categorie) et active la nouvelle
// immediatement : plus besoin de geste "Activer" separe, le remplacement EST
// l'activation. On ne touche jamais l'asset Cloudinary lui-meme ici (contrairement a
// "Supprimer") — une photo assignee depuis la bibliotheque peut appartenir a la
// photothèque personnelle reutilisable de l'utilisateur, jamais supprimee sans geste
// explicite ("Supprimer").
async function replaceSlotPhoto(
  supabase: NonNullable<Awaited<ReturnType<typeof requireAdmin>>>["supabase"],
  categorie: string
) {
  if (SLOT_CATEGORIES.includes(categorie)) {
    await supabase.from("photos").delete().eq("categorie", categorie);
  }
}

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

  await replaceSlotPhoto(admin.supabase, categorie);

  const { error } = await admin.supabase.from("photos").insert({
    url_cloudinary: uploaded.url,
    public_id_cloudinary: uploaded.publicId,
    titre: titre || null,
    categorie,
    actif: SLOT_CATEGORIES.includes(categorie),
    image_width: uploaded.width,
    image_height: uploaded.height,
  });
  if (error) return { ok: false, error: "Échec de l'enregistrement." };

  revalidatePath("/admin/photos");
  revalidatePath("/");
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

// Retire uniquement la reference CMS — ne supprime jamais l'asset Cloudinary lui-meme.
// Les photos proviennent d'une phototheque personnelle reutilisable (bibliotheque
// Cloudinary partagee entre slots) : supprimer ici ne doit jamais detruire la source.
export async function deletePhotoAction(photoId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

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
// Slot unique : remplace la ligne existante et active immediatement (voir
// replaceSlotPhoto). "galerie" : additif, inseree inactive (activation manuelle,
// pertinent pour une collection qu'on prepare avant de publier).
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

  if (categorie === "galerie") {
    const { data: existing } = await admin.supabase
      .from("photos")
      .select("id")
      .eq("public_id_cloudinary", publicId)
      .eq("categorie", categorie)
      .maybeSingle();
    if (existing) return { ok: false, error: "Déjà présente dans la galerie." };
  }

  await replaceSlotPhoto(admin.supabase, categorie);

  const { error } = await admin.supabase.from("photos").insert({
    url_cloudinary: url,
    public_id_cloudinary: publicId,
    titre: titre?.trim() || null,
    categorie,
    actif: SLOT_CATEGORIES.includes(categorie),
    image_width: width,
    image_height: height,
  });
  if (error) return { ok: false, error: "Échec de l'enregistrement." };

  revalidatePath("/admin/photos");
  revalidatePath("/");
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

// ---------------------------------------------------------------------------
// Pellicules (module Galerie — docs/modules/GALERIE.md)
// ---------------------------------------------------------------------------

type PelliculeIdResult = { ok: true; id: string } | { ok: false; error: string };

async function uniqueSlug(
  supabase: NonNullable<Awaited<ReturnType<typeof requireAdmin>>>["supabase"],
  base: string,
  excludeId?: string
): Promise<string> {
  const root = slugify(base) || "pellicule";
  let candidate = root;
  let suffix = 2;
  // Boucle bornée par le nombre de pellicules existantes — pas de risque d'infini.
  for (let i = 0; i < 100; i++) {
    let query = supabase.from("pellicules").select("id").eq("slug", candidate);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
    candidate = `${root}-${suffix}`;
    suffix++;
  }
  return `${root}-${Date.now()}`;
}

export async function createPellicule(nomsMaries: string): Promise<PelliculeIdResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  const noms = nomsMaries.trim();
  if (!noms) return { ok: false, error: "Noms des mariés requis." };

  const slug = await uniqueSlug(admin.supabase, noms);

  const { data: maxOrdre } = await admin.supabase
    .from("pellicules")
    .select("ordre_affichage")
    .order("ordre_affichage", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await admin.supabase
    .from("pellicules")
    .insert({
      slug,
      noms_maries: noms,
      actif: false,
      ordre_affichage: (maxOrdre?.ordre_affichage ?? -1) + 1,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Échec de la création." };

  revalidatePath("/admin/pellicules");
  return { ok: true, id: data.id };
}

export async function updatePellicule(
  id: string,
  input: {
    nomsMaries: string;
    lieu: string;
    dateMariage: string;
    formule: string;
    temoignageCitation: string;
    temoignageAuteur: string;
    slug: string;
  }
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  const noms = input.nomsMaries.trim();
  if (!noms) return { ok: false, error: "Noms des mariés requis." };

  const requestedSlug = slugify(input.slug) || slugify(noms) || "pellicule";
  const { data: collision } = await admin.supabase
    .from("pellicules")
    .select("id")
    .eq("slug", requestedSlug)
    .neq("id", id)
    .maybeSingle();
  if (collision) {
    return { ok: false, error: "Ce slug est déjà utilisé par une autre pellicule." };
  }

  const { error } = await admin.supabase
    .from("pellicules")
    .update({
      slug: requestedSlug,
      noms_maries: noms,
      lieu: input.lieu.trim() || null,
      date_mariage: input.dateMariage || null,
      formule: input.formule.trim() || null,
      temoignage_citation: input.temoignageCitation.trim() || null,
      temoignage_auteur: input.temoignageAuteur.trim() || null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: "Échec de la mise à jour." };

  revalidatePath("/admin/pellicules");
  revalidatePath(`/admin/pellicules/${id}`);
  revalidatePath("/galerie");
  revalidatePath(`/galerie/${requestedSlug}`);
  return { ok: true };
}

// Publication bloquée sans photo (UC-A5 #14, GALERIE.md §4.3) — validation proactive
// côté admin plutôt qu'un simple non-affichage silencieux côté public.
export async function setPelliculeActif(id: string, actif: boolean): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  if (actif) {
    const { count } = await admin.supabase
      .from("pellicule_photos")
      .select("id", { count: "exact", head: true })
      .eq("pellicule_id", id);
    if (!count) return { ok: false, error: "Ajoutez au moins une photo avant de publier." };
  }

  const { error } = await admin.supabase.from("pellicules").update({ actif }).eq("id", id);
  if (error) return { ok: false, error: "Échec." };

  revalidatePath("/admin/pellicules");
  revalidatePath(`/admin/pellicules/${id}`);
  revalidatePath("/galerie");
  return { ok: true };
}

// Retire uniquement la Pellicule et ses references DB (cascade sur pellicule_photos) —
// ne touche jamais les assets Cloudinary, meme regle que le module Photos.
export async function deletePelliculeAction(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  const { error } = await admin.supabase.from("pellicules").delete().eq("id", id);
  if (error) return { ok: false, error: "Échec de la suppression." };

  revalidatePath("/admin/pellicules");
  revalidatePath("/galerie");
  return { ok: true };
}

export async function movePellicule(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  const { data: pellicules } = await admin.supabase
    .from("pellicules")
    .select("id, ordre_affichage")
    .order("ordre_affichage");
  if (!pellicules) return { ok: false, error: "Échec." };

  const index = pellicules.findIndex((p) => p.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= pellicules.length) {
    return { ok: true };
  }

  const a = pellicules[index];
  const b = pellicules[swapIndex];
  await admin.supabase.from("pellicules").update({ ordre_affichage: b.ordre_affichage }).eq("id", a.id);
  await admin.supabase.from("pellicules").update({ ordre_affichage: a.ordre_affichage }).eq("id", b.id);

  revalidatePath("/admin/pellicules");
  revalidatePath("/galerie");
  return { ok: true };
}

export async function uploadPelliculePhoto(
  pelliculeId: string,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Aucun fichier." };
  if (!file.type.startsWith("image/")) return { ok: false, error: "Fichier non-image refusé." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "Image trop lourde (max 12 Mo)." };

  const buffer = Buffer.from(await file.arrayBuffer());
  let uploaded: { url: string; publicId: string };
  try {
    uploaded = await uploadPhoto(buffer);
  } catch {
    return { ok: false, error: "Échec de l'upload Cloudinary." };
  }

  const { data: maxOrdre } = await admin.supabase
    .from("pellicule_photos")
    .select("ordre_affichage")
    .eq("pellicule_id", pelliculeId)
    .order("ordre_affichage", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await admin.supabase.from("pellicule_photos").insert({
    pellicule_id: pelliculeId,
    url_cloudinary: uploaded.url,
    public_id_cloudinary: uploaded.publicId,
    ordre_affichage: (maxOrdre?.ordre_affichage ?? -1) + 1,
  });
  if (error) return { ok: false, error: "Échec de l'enregistrement." };

  revalidatePath(`/admin/pellicules/${pelliculeId}`);
  revalidatePath("/galerie");
  return { ok: true };
}

export async function assignPelliculePhotoFromLibrary(
  pelliculeId: string,
  publicId: string,
  url: string
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;
  if (!publicId || !url) return { ok: false, error: "Photo invalide." };

  const { data: maxOrdre } = await admin.supabase
    .from("pellicule_photos")
    .select("ordre_affichage")
    .eq("pellicule_id", pelliculeId)
    .order("ordre_affichage", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await admin.supabase.from("pellicule_photos").insert({
    pellicule_id: pelliculeId,
    url_cloudinary: url,
    public_id_cloudinary: publicId,
    ordre_affichage: (maxOrdre?.ordre_affichage ?? -1) + 1,
  });
  if (error) return { ok: false, error: "Échec de l'enregistrement." };

  revalidatePath(`/admin/pellicules/${pelliculeId}`);
  revalidatePath("/galerie");
  return { ok: true };
}

// Retire uniquement la ligne DB — jamais l'asset Cloudinary (règle établie module Photos).
export async function removePelliculePhoto(photoId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  const { data: photo } = await admin.supabase
    .from("pellicule_photos")
    .select("pellicule_id")
    .eq("id", photoId)
    .single();
  if (!photo) return { ok: false, error: "Photo introuvable." };

  const { error } = await admin.supabase.from("pellicule_photos").delete().eq("id", photoId);
  if (error) return { ok: false, error: "Échec de la suppression." };

  revalidatePath(`/admin/pellicules/${photo.pellicule_id}`);
  revalidatePath("/galerie");
  return { ok: true };
}

export async function movePelliculePhoto(
  photoId: string,
  direction: "up" | "down"
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return FORBIDDEN;

  const { data: photo } = await admin.supabase
    .from("pellicule_photos")
    .select("pellicule_id")
    .eq("id", photoId)
    .single();
  if (!photo) return { ok: false, error: "Photo introuvable." };

  const { data: photos } = await admin.supabase
    .from("pellicule_photos")
    .select("id, ordre_affichage")
    .eq("pellicule_id", photo.pellicule_id)
    .order("ordre_affichage");
  if (!photos) return { ok: false, error: "Échec." };

  const index = photos.findIndex((p) => p.id === photoId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= photos.length) {
    return { ok: true };
  }

  const a = photos[index];
  const b = photos[swapIndex];
  await admin.supabase
    .from("pellicule_photos")
    .update({ ordre_affichage: b.ordre_affichage })
    .eq("id", a.id);
  await admin.supabase
    .from("pellicule_photos")
    .update({ ordre_affichage: a.ordre_affichage })
    .eq("id", b.id);

  revalidatePath(`/admin/pellicules/${photo.pellicule_id}`);
  revalidatePath("/galerie");
  return { ok: true };
}
