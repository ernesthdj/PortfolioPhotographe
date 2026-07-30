import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { GalerieViewer } from "@/components/GalerieViewer";
import { Header } from "@/components/Header";
import { getPellicules } from "@/lib/pellicules";

export const metadata: Metadata = {
  title: "Galerie — Ernest H. Photography",
  description:
    "Chaque mariage a son propre rouleau — parcourez les photos et les mots de nos mariés.",
};

export default async function GaleriePage() {
  const pellicules = await getPellicules();
  const currentSlug = pellicules[0]?.slug ?? "";

  return (
    <>
      <Header />
      <main className="flex-1">
        <GalerieViewer pellicules={pellicules} currentSlug={currentSlug} />
      </main>
      <Footer />
    </>
  );
}
