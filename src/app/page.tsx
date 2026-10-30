import { Carnet } from "@/components/carnet/Carnet";
import { getPellicules } from "@/lib/pellicules";
import { getContenus, getGaleriePhotos, getPhotoByCategorie } from "@/lib/site-content";
import { createClient } from "@/lib/supabase/server";

const MOMENTS = [
  { time: "05H", label: "Préparatifs", categorie: "timeline-05h" },
  { time: "14H", label: "Cérémonie", categorie: "timeline-14h" },
  { time: "19H", label: "Golden hour", categorie: "timeline-19h" },
  { time: "23H", label: "Fête", categorie: "timeline-23h" },
];
const PLANCHE_PHOTOS = 9;

async function getGalerie() {
  const [pellicule] = await getPellicules();
  if (pellicule) {
    return {
      titre: `Pellicule ${pellicule.nomsMaries}`,
      href: `/galerie/${pellicule.slug}`,
      photos: pellicule.photos
        .slice(0, PLANCHE_PHOTOS)
        .map((photo) => ({ url: photo.url, titre: photo.titre, crop: null })),
    };
  }
  const photos = await getGaleriePhotos();
  return { titre: "Galerie", href: "/galerie", photos: photos.slice(0, PLANCHE_PHOTOS) };
}

async function getFormules() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("formules")
    .select("id, nom, prix_base, description")
    .eq("actif", true)
    .order("ordre_affichage");
  return data ?? [];
}

export default async function Home() {
  const [contenus, heroPhoto, momentPhotos, galerie, formules] = await Promise.all([
    getContenus(),
    getPhotoByCategorie("hero"),
    Promise.all(MOMENTS.map((moment) => getPhotoByCategorie(moment.categorie))),
    getGalerie(),
    getFormules(),
  ]);

  return (
    <Carnet
      heroTitre={contenus.hero_titre || "Je photographie la lumière qui ne repasse pas."}
      heroSoustitre={
        contenus.hero_soustitre ||
        "De l'aube des préparatifs à la dernière danse : un fil du temps, pas une liste de poses."
      }
      heroPhoto={heroPhoto}
      moments={MOMENTS.map((moment, i) => ({ time: moment.time, label: moment.label, photo: momentPhotos[i] }))}
      galerie={galerie}
      formules={formules}
      temoignage={{
        citation:
          contenus.temoignage_citation ||
          "Il a su capturer des moments qu'on n'aurait même pas remarqués nous-mêmes.",
        auteur: contenus.temoignage_auteur || "Clémence & Antoine",
      }}
    />
  );
}
