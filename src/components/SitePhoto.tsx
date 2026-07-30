import { cloudinaryUrl, type PhotoRef } from "@/lib/site-content";
import { PlaceholderImage } from "./PlaceholderImage";

// Affiche la photo active du CMS, ou un placeholder si la catégorie n'a encore
// aucune photo active — dégradation propre, jamais de section vide/cassée
// (docs/modules/CMS.md §3).
export function SitePhoto({
  photo,
  label,
  className = "",
  rounded = false,
}: {
  photo: PhotoRef | null;
  label: string;
  className?: string;
  rounded?: boolean;
}) {
  if (!photo) {
    return <PlaceholderImage label={label} className={className} rounded={rounded} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Cloudinary gère déjà l'optimisation via l'URL de transformation
    <img
      src={cloudinaryUrl(photo.url, 1200, photo.crop)}
      alt={photo.titre ?? label}
      className={`object-cover ${rounded ? "rounded-full" : ""} ${className}`}
    />
  );
}
