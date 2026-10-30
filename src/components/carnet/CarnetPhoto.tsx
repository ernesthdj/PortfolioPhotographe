import { cloudinaryUrl, type PhotoCrop } from "@/lib/cloudinary-url";

type PhotoSource = { url: string; titre: string | null; crop: PhotoCrop | null };

// Photo du CMS, ou un emplacement étiqueté si elle manque : une page du carnet ne
// reste jamais avec un trou (docs/modules/CMS.md §3).
export function CarnetPhoto({
  photo,
  label,
  width,
  id,
  eager = false,
}: {
  photo: PhotoSource | null;
  label: string;
  width: number;
  id?: string;
  eager?: boolean;
}) {
  if (!photo) {
    return (
      <span className="ph ph-empty" id={id}>
        {label}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Cloudinary gère déjà l'optimisation via l'URL de transformation
    <img
      className="ph"
      id={id}
      src={cloudinaryUrl(photo.url, width, photo.crop)}
      alt={photo.titre ?? label}
      loading={eager ? "eager" : "lazy"}
    />
  );
}
