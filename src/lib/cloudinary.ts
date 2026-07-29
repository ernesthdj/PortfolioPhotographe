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
  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder }, (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Échec de l'upload Cloudinary"));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      })
      .end(fileBuffer);
  });
}

export async function deletePhoto(publicId: string) {
  await cloudinary.uploader.destroy(publicId);
}
