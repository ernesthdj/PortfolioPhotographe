"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  assignPelliculePhotoFromLibrary,
  deletePelliculeAction,
  listCloudinaryLibrary,
  movePelliculePhoto,
  removePelliculePhoto,
  setPelliculeActif,
  updatePellicule,
  uploadPelliculePhoto,
} from "@/app/actions/admin";
import type { CloudinaryLibraryPhoto } from "@/lib/cloudinary";

type Pellicule = {
  id: string;
  slug: string;
  noms_maries: string;
  lieu: string | null;
  date_mariage: string | null;
  formule: string | null;
  temoignage_citation: string | null;
  temoignage_auteur: string | null;
  actif: boolean;
};

type Photo = {
  id: string;
  url_cloudinary: string;
  public_id_cloudinary: string;
  ordre_affichage: number;
};

export function PelliculeEditor({
  pellicule,
  photos,
}: {
  pellicule: Pellicule;
  photos: Photo[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [nomsMaries, setNomsMaries] = useState(pellicule.noms_maries);
  const [lieu, setLieu] = useState(pellicule.lieu ?? "");
  const [dateMariage, setDateMariage] = useState(pellicule.date_mariage ?? "");
  const [formule, setFormule] = useState(pellicule.formule ?? "");
  const [slug, setSlug] = useState(pellicule.slug);
  const [temoignageCitation, setTemoignageCitation] = useState(
    pellicule.temoignage_citation ?? ""
  );
  const [temoignageAuteur, setTemoignageAuteur] = useState(pellicule.temoignage_auteur ?? "");

  const [folder, setFolder] = useState("portfolio-photographe");
  const [library, setLibrary] = useState<CloudinaryLibraryPhoto[] | null>(null);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  function flash(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(null), 4000);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updatePellicule(pellicule.id, {
        nomsMaries,
        lieu,
        dateMariage,
        formule,
        temoignageCitation,
        temoignageAuteur,
        slug,
      });
      if (result.ok) {
        flash("Enregistré.");
        router.refresh();
      } else {
        flash(result.error);
      }
    });
  }

  function handleToggleActif() {
    startTransition(async () => {
      const result = await setPelliculeActif(pellicule.id, !pellicule.actif);
      if (result.ok) router.refresh();
      else flash(result.error);
    });
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      const result = await deletePelliculeAction(pellicule.id);
      if (result.ok) router.push("/admin/pellicules");
      else flash(result.error);
    });
  }

  function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      flash("Choisissez un fichier.");
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadPelliculePhoto(pellicule.id, formData);
      flash(result.ok ? "Photo ajoutée." : result.error);
      if (result.ok && fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  }

  function handleLoadLibrary() {
    setIsLoadingLibrary(true);
    setLibraryError(null);
    startTransition(async () => {
      const result = await listCloudinaryLibrary(folder);
      if (result.ok) setLibrary(result.photos);
      else {
        setLibrary(null);
        setLibraryError(result.error);
      }
      setIsLoadingLibrary(false);
    });
  }

  function handleAssign(photo: CloudinaryLibraryPhoto) {
    startTransition(async () => {
      const result = await assignPelliculePhotoFromLibrary(
        pellicule.id,
        photo.publicId,
        photo.url
      );
      flash(result.ok ? "Photo ajoutée." : result.error);
      router.refresh();
    });
  }

  function handleRemovePhoto(photoId: string) {
    startTransition(async () => {
      await removePelliculePhoto(photoId);
      router.refresh();
    });
  }

  function handleMovePhoto(photoId: string, direction: "up" | "down") {
    startTransition(async () => {
      await movePelliculePhoto(photoId, direction);
      router.refresh();
    });
  }

  const assignedPublicIds = new Set(photos.map((p) => p.public_id_cloudinary));

  return (
    <div>
      <Link href="/admin/pellicules" className="text-[12px] text-ink/50 hover:text-ink">
        ← Toutes les pellicules
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-ink">{pellicule.noms_maries}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleActif}
            disabled={isPending}
            className={`px-3 py-1.5 text-[11px] ${
              pellicule.actif
                ? "bg-bronze/15 text-bronze"
                : "border border-ink/20 text-ink/50 hover:border-ink/40"
            }`}
          >
            {pellicule.actif ? "✓ Publiée" : "Brouillon"}
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className={`px-3 py-1.5 text-[11px] ${
              confirmDelete
                ? "font-semibold text-red-700"
                : "text-red-700/70 hover:text-red-700"
            }`}
          >
            {confirmDelete ? "Confirmer la suppression ?" : "Supprimer la pellicule"}
          </button>
        </div>
      </div>

      {message && <p className="mt-3 text-[12.5px] text-bronze">{message}</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 border border-ink/15 bg-cream-light p-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[11.5px] tracking-[0.05em] text-ink/60">
            Noms des mariés
          </label>
          <input
            value={nomsMaries}
            onChange={(e) => setNomsMaries(e.target.value)}
            className="w-full border border-ink/25 bg-transparent px-3 py-2 text-[12.5px] text-ink focus:border-bronze focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11.5px] tracking-[0.05em] text-ink/60">
            Lieu
          </label>
          <input
            value={lieu}
            onChange={(e) => setLieu(e.target.value)}
            className="w-full border border-ink/25 bg-transparent px-3 py-2 text-[12.5px] text-ink focus:border-bronze focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11.5px] tracking-[0.05em] text-ink/60">
            Date du mariage
          </label>
          <input
            type="date"
            value={dateMariage}
            onChange={(e) => setDateMariage(e.target.value)}
            className="w-full border border-ink/25 bg-transparent px-3 py-2 text-[12.5px] text-ink focus:border-bronze focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11.5px] tracking-[0.05em] text-ink/60">
            Formule
          </label>
          <input
            value={formule}
            onChange={(e) => setFormule(e.target.value)}
            placeholder="Journée complète"
            className="w-full border border-ink/25 bg-transparent px-3 py-2 text-[12.5px] text-ink focus:border-bronze focus:outline-none"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-[11.5px] tracking-[0.05em] text-ink/60">
            Slug (URL — /galerie/…)
          </label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full border border-ink/25 bg-transparent px-3 py-2 text-[12.5px] text-ink focus:border-bronze focus:outline-none"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-[11.5px] tracking-[0.05em] text-ink/60">
            Témoignage (optionnel)
          </label>
          <textarea
            value={temoignageCitation}
            onChange={(e) => setTemoignageCitation(e.target.value)}
            rows={3}
            className="w-full border border-ink/25 bg-transparent px-3 py-2 text-[12.5px] text-ink focus:border-bronze focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11.5px] tracking-[0.05em] text-ink/60">
            Auteur du témoignage
          </label>
          <input
            value={temoignageAuteur}
            onChange={(e) => setTemoignageAuteur(e.target.value)}
            placeholder="Léa & Mathieu"
            className="w-full border border-ink/25 bg-transparent px-3 py-2 text-[12.5px] text-ink focus:border-bronze focus:outline-none"
          />
        </div>
        <div className="md:col-span-2">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="bg-ink px-4 py-2 text-[12px] text-cream-light disabled:opacity-40"
          >
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>

      <h2 className="mt-10 font-serif text-lg text-ink">Photos de la pellicule</h2>

      <div className="mt-4 flex flex-wrap items-end gap-3 border border-ink/15 bg-cream-light p-4">
        <div>
          <label className="mb-1.5 block text-[11.5px] tracking-[0.05em] text-ink/60">
            Fichier
          </label>
          <input ref={fileRef} type="file" accept="image/*" className="text-[12.5px] text-ink/70" />
        </div>
        <button
          onClick={handleUpload}
          disabled={isPending}
          className="bg-ink px-4 py-2 text-[12px] text-cream-light disabled:opacity-40"
        >
          Uploader
        </button>
      </div>

      <div className="mt-4 border border-ink/15 bg-cream-light p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1.5 block text-[11.5px] tracking-[0.05em] text-ink/60">
              Dossier Cloudinary
            </label>
            <input
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="border border-ink/25 bg-transparent px-3 py-2 text-[12.5px] text-ink focus:border-bronze focus:outline-none"
            />
          </div>
          <button
            onClick={handleLoadLibrary}
            disabled={isLoadingLibrary}
            className="border border-ink/25 px-4 py-2 text-[12px] text-ink hover:border-bronze disabled:opacity-40"
          >
            {isLoadingLibrary ? "Chargement…" : "Charger le dossier"}
          </button>
        </div>

        {libraryError && <p className="mt-3 text-[12.5px] text-red-700/80">{libraryError}</p>}

        {library && (
          <div className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-6">
            {library.map((photo) => {
              const alreadyAssigned = assignedPublicIds.has(photo.publicId);
              return (
                <button
                  key={photo.publicId}
                  onClick={() => handleAssign(photo)}
                  disabled={isPending || alreadyAssigned}
                  className="group relative border border-ink/15 disabled:opacity-40"
                  title={alreadyAssigned ? "Déjà dans cette pellicule" : "Ajouter à la pellicule"}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- vignettes bibliothèque Cloudinary */}
                  <img
                    src={photo.url.replace("/upload/", "/upload/w_200,q_auto/")}
                    alt=""
                    className="h-24 w-full object-cover"
                  />
                  {!alreadyAssigned && (
                    <span className="absolute inset-0 hidden items-center justify-center bg-ink/60 text-[11px] text-cream-light group-hover:flex">
                      Ajouter
                    </span>
                  )}
                </button>
              );
            })}
            {library.length === 0 && (
              <p className="col-span-full text-[12.5px] text-ink/50">Dossier vide.</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {photos.map((photo, i) => (
          <div key={photo.id} className="border border-ink/15 bg-cream-light">
            {/* eslint-disable-next-line @next/next/no-img-element -- vignette admin */}
            <img
              src={photo.url_cloudinary.replace("/upload/", "/upload/w_400,q_auto/")}
              alt=""
              className="h-36 w-full object-cover"
            />
            <div className="flex items-center justify-between p-2.5">
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleMovePhoto(photo.id, "up")}
                  disabled={isPending || i === 0}
                  className="text-[11px] text-ink/50 hover:text-ink disabled:opacity-25"
                  aria-label="Photo précédente"
                >
                  ‹
                </button>
                <button
                  onClick={() => handleMovePhoto(photo.id, "down")}
                  disabled={isPending || i === photos.length - 1}
                  className="text-[11px] text-ink/50 hover:text-ink disabled:opacity-25"
                  aria-label="Photo suivante"
                >
                  ›
                </button>
              </div>
              <button
                onClick={() => handleRemovePhoto(photo.id)}
                disabled={isPending}
                className="text-[11px] text-red-700/70 hover:text-red-700"
              >
                Retirer
              </button>
            </div>
          </div>
        ))}
        {photos.length === 0 && (
          <p className="col-span-full text-[13px] text-ink/50">
            Aucune photo — la pellicule ne pourra pas être publiée tant qu&apos;au moins
            une photo n&apos;est pas ajoutée.
          </p>
        )}
      </div>
    </div>
  );
}
