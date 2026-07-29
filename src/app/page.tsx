import { About } from "@/components/About";
import { Footer } from "@/components/Footer";
import { Gallery } from "@/components/Gallery";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Pricing } from "@/components/Pricing";
import { Testimonial } from "@/components/Testimonial";
import { Timeline } from "@/components/Timeline";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <About />
        <Timeline />
        <Gallery />
        <Pricing />
        <Testimonial />
      </main>
      <Footer />
    </>
  );
}
