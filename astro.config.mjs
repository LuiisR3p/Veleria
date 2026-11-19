import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Cambia SITE_URL en Vercel si el dominio final es otro.
export default defineConfig({
  site: process.env.SITE_URL ?? "https://www.miveleria.com",
  output: "static",
  trailingSlash: "never",
  build: { format: "file", inlineStylesheets: "auto" },
  compressHTML: true,
  integrations: [sitemap({ filter: (page) => !page.includes("/404") })],
});
