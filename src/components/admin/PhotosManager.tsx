"use client";

import { useRef, useState, useTransition } from "react";
import {
  assignPhotoFromLibrary,
  deletePhotoAction,
  listCloudinaryLibrary,
  setPhotoActive,
  setPhotoInactive,
  uploadPhotoAction,
} from "@/app/actions/admin";
import type { CloudinaryLibraryPhoto } from "@/lib/cloudinary";
import { PhotoCropper, SLOT_CROP } from "./PhotoCropper";

type Photo = {
  id: string;
  url_cloudinary: string;
  public_id_cloudinary: string;
  titre: string | null;
  categorie: string;
  actif: boolean;
  ordre_affichage: number;
  created_at: string;
  image_width: number | null;
  image_height: number | null;
  crop_x: number | null;
  crop_y: number | null;
  crop_width: number | null;
  crop_height: number | null;
};

const CATEGORIES = [
  { value: "hero", label: "Hero (slot unique)" },
  { value: "about-portrait", label: "À propos — portrait (slot unique)" },
  { value: "about-travail", label: "À propos — au travail (slot unique)" },
  { value: "timeline-05h", label: "Timeline 05H (slot unique)" },
  { value: "timeline-14h", label: "Timeline 14H (slot unique)" },
  { value: "timeline-19h", label: "Timeline 19H (slot unique)" },
  { value: "timeline-23h", label: "Timeline 23H (slot unique)" },
  { value: "galerie", label: "Galerie (multi)" },
];

const SLOT_CATEGORIES = CATEGORIES.filter((c) => c.value !== "galerie").map((c) => c.value);

export function PhotosManager({ photos }: { photos: Photo[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [categorie, setCategorie] = useState("galerie");
  const [titre, setTitre] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [folder, setFolder] = useState("portfolio-photographe");
  const [library, setLibrary] = useState<CloudinaryLibraryPhoto[] | null>(null);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [croppingPhoto, setCroppingPhoto] = useState<Photo | null>(null);

  // Avertissement CMS.md §3 : catégories slot-unique sans photo active.
  const emptySlots = SLOT_CATEGORIES.filter(
    (slot) => !photos.some((p) => p.categorie === slot && p.actif)
  );

  function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setMessage("Choisissez un fichier.");
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    formData.set("categorie", categorie);
    formData.set("titre", titre);

    startTransition(async () => {
      const result = await uploadPhotoAction(formData);
      setMessage(result.ok ? "Photo uploadée — pensez à l'activer." : result.error);
      if (result.ok && fileRef.current) {
        fileRef.current.value = "";
        setTitre("");
      }
      setTimeout(() => setMessage(null), 4000);
    });
  }

  function handleToggle(photo: Photo) {
    startTransition(() => {
      if (photo.actif) setPhotoInactive(photo.id);
      else setPhotoActive(photo.id);
    });
  }

  function handleDelete(photo: Photo) {
    if (confirmDeleteId !== photo.id) {
      setConfirmDeleteId(photo.id);
      return;
    }
    setConfirmDeleteId(null);
    startTransition(() => {
      deletePhotoAction(photo.id);
    });
  }

  function handleLoadLibrary() {
    setIsLoadingLibrary(true);
    setLibraryError(null);
    startTransition(async () => {
      const result = await listCloudinaryLibrary(folder);
      if (result.ok) {
        setLibrary(result.photos);
      } else {
        setLibrary(null);
        setLibraryError(result.error);
      }
      setIsLoadingLibrary(false);
    });
  }

  function handleAssign(photo: CloudinaryLibraryPhoto) {
    setAssigningId(photo.publicId);
    startTransition(async () => {
      const result = await assignPhotoFromLibrary(
        categorie,
        photo.publicId,
        photo.url,
        photo.width,
        photo.height
      );
      setMessage(
        result.ok ? "Photo rattachée — pensez à l'activer." : result.error
      );
      setAssigningId(null);
      setTimeout(() => setMessage(null), 4000);
    });
  }

  const assignedPublicIds = new Set(photos.map((p) => p.public_id_cloudinary));

  return (
    <div>
      <h1 className="font-serif text-2xl text-ink">Photos</h1>

      {emptySlots.length > 0 && (
        <div className="mt-4 border border-bronze/40 bg-bronze/5 px-4 py-2.5 text-[12.5px] text-ink/75">
          Emplacements sans photo active :{" "}
          {emptySlots
            .map((s) => CATEGORIES.find((c) => c.value === s)?.label ?? s)
            .join(", ")}
          {" "}— les sections correspondantes du site s&apos;affichent sans image.
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-end gap-3 border border-ink/15 bg-cream-light p-4">
        <div>
          <label className="mb-1.5 block text-[11.5px] tracking-[0.05em] text-ink/60">Fichier</label>
          <input ref={fileRef} type="file" accept="image/*" className="text-[12.5px] text-ink/70" />
        </div>
        <div>
          <label className="mb-1.5 block text-[11.5px] tracking-[0.05em] text-ink/60">Catégorie</label>
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            className="border border-ink/25 bg-transparent px-3 py-2 text-[12.5px] text-ink"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[11.5px] tracking-[0.05em] text-ink/60">
            Titre (optionnel)
          </label>
          <input
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            className="border border-ink/25 bg-transparent px-3 py-2 text-[12.5px] text-ink focus:border-bronze focus:outline-none"
          />
        </div>
        <button
          onClick={handleUpload}
          disabled={isPending}
          className="bg-ink px-4 py-2 text-[12px] text-cream-light disabled:opacity-40"
        >
          {isPending ? "Upload…" : "Uploader"}
        </button>
      </div>
      {message && <p className="mt-3 text-[12.5px] text-bronze">{message}</p>}

      <div className="mt-6 border border-ink/15 bg-cream-light p-4">
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
          <p className="text-[11.5px] text-ink/50">
            Rattache à la catégorie sélectionnée ci-dessus ({CATEGORIES.find((c) => c.value === categorie)?.label}).
          </p>
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
                  title={alreadyAssigned ? "Déjà rattachée" : "Rattacher à cet emplacement"}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- vignettes bibliothèque Cloudinary */}
                  <img
                    src={photo.url.replace("/upload/", "/upload/w_200,q_auto/")}
                    alt=""
                    className="h-24 w-full object-cover"
                  />
                  {!alreadyAssigned && (
                    <span className="absolute inset-0 hidden items-center justify-center bg-ink/60 text-[11px] text-cream-light group-hover:flex">
                      {assigningId === photo.publicId ? "…" : "Choisir"}
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

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {photos.map((photo) => (
          <div key={photo.id} className="border border-ink/15 bg-cream-light">
            {/* eslint-disable-next-line @next/next/no-img-element -- vignettes admin, Cloudinary optimise déjà */}
            <img
              src={photo.url_cloudinary.replace("/upload/", "/upload/w_400,q_auto/")}
              alt={photo.titre ?? ""}
              className="h-36 w-full object-cover"
            />
            <div className="p-2.5">
              <div className="text-[11.5px] text-ink/70">
                {CATEGORIES.find((c) => c.value === photo.categorie)?.label ?? photo.categorie}
              </div>
              {photo.titre && <div className="text-[11px] text-ink/50">{photo.titre}</div>}
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(photo)}
                    disabled={isPending}
                    className={`px-2 py-1 text-[11px] ${
                      photo.actif
                        ? "bg-bronze/15 text-bronze"
                        : "border border-ink/20 text-ink/50 hover:border-ink/40"
                    }`}
                  >
                    {photo.actif ? "✓ Active" : "Activer"}
                  </button>
                  {SLOT_CROP[photo.categorie] && (
                    <button
                      onClick={() => setCroppingPhoto(photo)}
                      className="px-2 py-1 text-[11px] text-ink/60 underline hover:text-ink"
                    >
                      Cadrer
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {confirmDeleteId === photo.id && (
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-[11px] text-ink/50 hover:text-ink"
                    >
                      Annuler
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(photo)}
                    disabled={isPending}
                    className={`text-[11px] ${
                      confirmDeleteId === photo.id
                        ? "font-semibold text-red-700"
                        : "text-red-700/70 hover:text-red-700"
                    }`}
                  >
                    {confirmDeleteId === photo.id ? "Confirmer ?" : "Supprimer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {photos.length === 0 && (
          <p className="col-span-full text-[13px] text-ink/50">
            Aucune photo — uploadez la première ci-dessus.
          </p>
        )}
      </div>

      {croppingPhoto && (
        <PhotoCropper photo={croppingPhoto} onClose={() => setCroppingPhoto(null)} />
      )}
    </div>
  );
}
