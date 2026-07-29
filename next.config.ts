import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      // Upload photo CMS via Server Action (max 12 Mo côté action + marge).
      bodySizeLimit: "15mb",
    },
    // Le proxy.ts (middleware) a sa PROPRE limite de taille de requête (10mb par
    // défaut), appliquée avant même que la Server Action ne voie le body — sans ça,
    // un upload photo un peu lourd est tronqué en amont ("Unexpected end of form").
    proxyClientMaxBodySize: "15mb",
  },
};

export default nextConfig;
