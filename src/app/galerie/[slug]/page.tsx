import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { GalerieViewer } from "@/components/GalerieViewer";
import { Header } from "@/components/Header";
import { getPelliculeBySlug, getPellicules } from "@/lib/pellicules";
import { cloudinaryOgImage } from "@/lib/cloudinary-url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pellicule = await getPelliculeBySlug(slug);
  if (!pellicule) return { title: "Galerie — Ernest H. Photography" };

  const title = `${pellicule.nomsMaries} — Ernest H. Photography`;
  const description =
    [pellicule.lieu, pellicule.dateMariage].filter(Boolean).join(" · ") ||
    "Une pellicule de mariage — Ernest H. Photography.";
  const image = pellicule.photos[0] ? cloudinaryOgImage(pellicule.photos[0].url) : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
  };
}

export default async function PelliculePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [pellicules, current] = await Promise.all([getPellicules(), getPelliculeBySlug(slug)]);

  // UC-V2 #3/#4 (GALERIE.md §4.3) — slug inexistant ou pellicule dépubliée : 404 propre.
  if (!current) notFound();

  return (
    <>
      <Header />
      <main className="flex-1">
        <GalerieViewer pellicules={pellicules} currentSlug={slug} />
      </main>
      <Footer />
    </>
  );
}
