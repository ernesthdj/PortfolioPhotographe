import { Archivo_Black, Geist, IBM_Plex_Mono, Michroma, Sora, VT323 } from "next/font/google";

// Polices du calepin — limitées à cette page tant que la palette et la typographie
// finales du site ne sont pas décidées (docs/front/premier-impact-design.md §5).
const sora = Sora({ variable: "--carnet-title", subsets: ["latin"], weight: ["200", "300", "400"], display: "swap" });
const archivoBlack = Archivo_Black({ variable: "--carnet-strong", subsets: ["latin"], weight: "400", display: "swap" });
const michroma = Michroma({ variable: "--carnet-brand", subsets: ["latin"], weight: "400", display: "swap" });
const geist = Geist({ variable: "--carnet-body", subsets: ["latin"], weight: ["300", "400", "600"], display: "swap" });
const plexMono = IBM_Plex_Mono({ variable: "--carnet-label", subsets: ["latin"], weight: ["400", "500"], display: "swap" });
const vt323 = VT323({ variable: "--carnet-data", subsets: ["latin"], weight: "400", display: "swap" });

export const carnetFontVariables = [sora, archivoBlack, michroma, geist, plexMono, vt323]
  .map((font) => font.variable)
  .join(" ");
