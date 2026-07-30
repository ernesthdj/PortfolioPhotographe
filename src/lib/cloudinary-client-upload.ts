import { requestUploadSignature } from "@/app/actions/admin";

// Upload direct navigateur -> Cloudinary (upload signe). Le fichier ne transite
// jamais par une Server Action Vercel — voir getUploadSignature() dans
// src/lib/cloudinary.ts pour le pourquoi (plafond plateforme ~4-5 Mo contourné).

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export type CloudinaryUploadResult =
  | { ok: true; url: string; publicId: string; width: number; height: number }
  | { ok: false; error: string };

export async function uploadFileToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  if (!file.type.startsWith("image/")) return { ok: false, error: "Fichier non-image refusé." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "Image trop lourde (max 25 Mo)." };

  const sig = await requestUploadSignature();
  if (!sig.ok) return { ok: false, error: sig.error };

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sig.apiKey);
  formData.append("timestamp", String(sig.timestamp));
  formData.append("signature", sig.signature);
  formData.append("folder", sig.folder);

  let response: Response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });
  } catch {
    return { ok: false, error: "Échec de connexion à Cloudinary." };
  }

  const data = await response.json();
  if (!response.ok) {
    return { ok: false, error: data?.error?.message ?? "Échec de l'upload Cloudinary." };
  }

  return {
    ok: true,
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
  };
}
