import "server-only";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Upload sécurisé — le fichier transite toujours par cette fonction serveur (jamais
// de clé API exposée côté client, jamais d'upload preset non signé). Voir
// docs/modules/CMS.md §3.
export async function uploadPhoto(fileBuffer: Buffer, folder = "portfolio-photographe") {
  return new Promise<{ url: string; publicId: string; width: number; height: number }>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder }, (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Échec de l'upload Cloudinary"));
            return;
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
          });
        })
        .end(fileBuffer);
    }
  );
}

export type CloudinaryLibraryPhoto = {
  publicId: string;
  url: string;
  width: number;
  height: number;
  createdAt: string;
};

// Liste les images d'un dossier Cloudinary existant (uploadées hors de l'app) pour
// permettre de les rattacher a un emplacement du CMS sans re-upload. Pas de pagination
// (max_results=200) — suffisant pour une selection de meilleures photos. Voir plan
// "Bibliotheque Cloudinary" du 2026-07-30.
//
// Ce compte Cloudinary utilise le Dynamic Folder Mode : le public_id des images
// uploadees via le dashboard n'est PAS prefixe par le nom du dossier (asset_folder
// est un attribut separe). `resources({ prefix })` (filtre sur public_id) ne les
// trouve donc pas — il faut `resources_by_asset_folder`, la methode dediee a ce mode.
export async function listFolder(folder: string): Promise<CloudinaryLibraryPhoto[]> {
  const result = await cloudinary.api.resources_by_asset_folder(folder, {
    max_results: 200,
  });

  return (result.resources as Array<{
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
    created_at: string;
  }>).map((r) => ({
    publicId: r.public_id,
    url: r.secure_url,
    width: r.width,
    height: r.height,
    createdAt: r.created_at,
  }));
}
