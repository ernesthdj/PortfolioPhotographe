import "server-only";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Signature d'upload — le fichier ne transite JAMAIS par notre Serverless Function
// (Vercel plafonne le corps de requete d'une fonction a ~4-5 Mo, en amont de Next.js ;
// aucun reglage next.config.ts ne peut lever cette limite — voir regle #7 JOURNAL.md).
// Le navigateur envoie le fichier directement a Cloudinary avec cette signature ;
// seule la reponse (url/publicId/dimensions, quelques octets) revient par nos Server
// Actions pour l'enregistrement en base. La cle API secrete ne quitte jamais le serveur.
export function getUploadSignature(folder = "portfolio-photographe") {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET!
  );
  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    folder,
  };
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
