"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { savePhotoCrop } from "@/app/actions/admin";

// Ratios dérivés des classes Tailwind réelles des composants publics (desktop) —
// voir plan "Recadrage" du 2026-07-30. "galerie" volontairement absent : catégorie
// multi-photos réordonnable, sans position fixe (réservée à une page galerie v2 pas
// encore conçue) — verrouiller un ratio dessus aujourd'hui créerait de la dette.
export const SLOT_CROP: Record<string, { aspect: number; shape: "round" | "rect"; label: string }> = {
  hero: { aspect: 1, shape: "round", label: "Hero (cadran)" },
  "about-portrait": { aspect: 370 / 300, shape: "rect", label: "À propos — portrait" },
  "about-travail": { aspect: 370 / 300, shape: "rect", label: "À propos — au travail" },
  "timeline-05h": { aspect: 214.5 / 150, shape: "rect", label: "Timeline 05H" },
  "timeline-23h": { aspect: 214.5 / 150, shape: "rect", label: "Timeline 23H" },
  "timeline-14h": { aspect: 214.5 / 196, shape: "rect", label: "Timeline 14H" },
  "timeline-19h": { aspect: 214.5 / 196, shape: "rect", label: "Timeline 19H" },
};

type CroppablePhoto = {
  id: string;
  url_cloudinary: string;
  categorie: string;
  image_width: number | null;
  image_height: number | null;
  crop_x: number | null;
  crop_y: number | null;
  crop_width: number | null;
  crop_height: number | null;
};

export function PhotoCropper({
  photo,
  onClose,
}: {
  photo: CroppablePhoto;
  onClose: () => void;
}) {
  const config = SLOT_CROP[photo.categorie];
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleSave() {
    if (!croppedAreaPixels) return;
    setIsSaving(true);
    setError(null);
    const result = await savePhotoCrop(photo.id, croppedAreaPixels);
    setIsSaving(false);
    if (result.ok) onClose();
    else setError(result.error);
  }

  if (!config) return null;

  if (!photo.image_width || !photo.image_height) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-6">
        <div className="w-full max-w-sm border border-ink/15 bg-cream-light p-5">
          <p className="text-[13px] text-ink/80">
            Dimensions de l&apos;image inconnues — cette photo a été uploadée avant
            l&apos;ajout du cadrage. Supprimez-la et re-uploadez-la (ou re-sélectionnez-la
            depuis la bibliothèque Cloudinary) pour pouvoir la cadrer.
          </p>
          <button
            onClick={onClose}
            className="mt-4 border border-ink/25 px-4 py-2 text-[12px] text-ink"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const initialCroppedAreaPixels =
    photo.crop_x != null && photo.crop_y != null && photo.crop_width && photo.crop_height
      ? { x: photo.crop_x, y: photo.crop_y, width: photo.crop_width, height: photo.crop_height }
      : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-6">
      <div className="w-full max-w-lg border border-ink/15 bg-cream-light p-5">
        <h2 className="font-serif text-lg text-ink">Cadrer — {config.label}</h2>

        <div className="relative mt-4 h-[360px] w-full bg-ink/90">
          <Cropper
            image={photo.url_cloudinary}
            crop={crop}
            zoom={zoom}
            aspect={config.aspect}
            cropShape={config.shape}
            showGrid={config.shape === "rect"}
            initialCroppedAreaPixels={initialCroppedAreaPixels}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <label className="mt-4 block text-[11.5px] tracking-[0.05em] text-ink/60">Zoom</label>
        <input
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="mt-1.5 w-full"
        />

        {error && <p className="mt-3 text-[12.5px] text-red-700/80">{error}</p>}

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="border border-ink/25 px-4 py-2 text-[12px] text-ink disabled:opacity-40"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !croppedAreaPixels}
            className="bg-ink px-4 py-2 text-[12px] text-cream-light disabled:opacity-40"
          >
            {isSaving ? "Enregistrement…" : "Enregistrer le cadrage"}
          </button>
        </div>
      </div>
    </div>
  );
}
