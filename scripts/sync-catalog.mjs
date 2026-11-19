// Sincroniza el catálogo público de la tienda Shopify de Mi Velería
// y genera src/data/catalog.json, que Astro usa para construir el sitio.
//
// Uso:  npm run sync
// Ejecutar cada vez que cambien productos, precios o existencias en Shopify.

import { writeFile, mkdir } from "node:fs/promises";

const STORE = (process.env.PUBLIC_SHOPIFY_URL || process.env.STORE_URL || "https://www.miveleria.com").replace(/\/$/, "");
// --soft: si Shopify no responde, se conserva el catálogo anterior en vez de romper la publicación
const SOFT = process.argv.includes("--soft");
const UA = "MiVeleriaCatalogSync/1.0";
const OUT = new URL("../src/data/catalog.json", import.meta.url);

async function getJSON(path) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(STORE + path, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 800 * attempt));
      continue;
    }
    throw new Error(`${res.status} al pedir ${path}`);
  }
  throw new Error(`No se pudo obtener ${path}`);
}

async function paged(path, key) {
  const all = [];
  for (let page = 1; page < 50; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const data = await getJSON(`${path}${sep}limit=250&page=${page}`);
    const items = data[key] ?? [];
    all.push(...items);
    if (items.length < 250) break;
  }
  return all;
}

const ALLOWED = new Set(["p", "br", "strong", "b", "em", "i", "ul", "ol", "li", "h2", "h3", "h4", "a"]);

function sanitize(html = "") {
  let s = html
    .replace(/<(script|style|iframe|object|embed|form|svg)[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/[⁠​]/g, "");
  s = s.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (tag, name, attrs) => {
    const n = name.toLowerCase();
    if (!ALLOWED.has(n)) return n === "div" || n === "tr" ? (tag.startsWith("</") ? "" : " ") : "";
    const closing = tag.startsWith("</");
    if (closing) return `</${n === "h2" || n === "h4" ? "h3" : n === "b" ? "strong" : n === "i" ? "em" : n}>`;
    if (n === "a") {
      const href = /href\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] ?? "";
      if (!/^(https?:|\/|mailto:)/i.test(href)) return "<a>";
      return `<a href="${href.replace(/"/g, "&quot;")}" rel="noopener">`;
    }
    if (n === "h2" || n === "h4") return "<h3>";
    if (n === "b") return "<strong>";
    if (n === "i") return "<em>";
    return `<${n}>`;
  });
  return s
    .replace(/<p>\s*(<br>\s*)*<\/p>/g, "")
    .replace(/<(strong|em)>\s*<\/\1>/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function plain(html = "") {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[⁠​]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const toInt = (v) => (v == null || v === "" ? null : Math.round(Number(v)));

async function main() {
console.log(`Leyendo catálogo de ${STORE} …`);
const [products, collections] = await Promise.all([
  paged("/products.json", "products"),
  paged("/collections.json", "collections"),
]);
console.log(`  ${products.length} productos, ${collections.length} colecciones`);

const membership = new Map(); // productId -> [collection handles]
const collOut = [];
for (const c of collections) {
  const items = await paged(`/collections/${encodeURIComponent(c.handle)}/products.json`, "products");
  for (const p of items) {
    if (!membership.has(p.id)) membership.set(p.id, []);
    membership.get(p.id).push(c.handle);
  }
  collOut.push({
    handle: c.handle,
    title: c.title.trim(),
    description: plain(c.description).slice(0, 220),
    image: c.image?.src ?? null,
    products: items.map((p) => p.handle),
  });
  process.stdout.write(".");
}
process.stdout.write("\n");

const prodOut = products.map((p) => {
  const variants = p.variants.map((v) => ({
    id: v.id,
    title: v.title === "Default Title" ? null : v.title,
    price: toInt(v.price),
    compare: toInt(v.compare_at_price),
    available: !!v.available,
    image: v.featured_image?.src ?? null,
  }));
  const prices = variants.map((v) => v.price);
  const text = plain(p.body_html);
  return {
    id: p.id,
    handle: p.handle,
    title: p.title.trim(),
    type: (p.product_type || "").trim(),
    tags: p.tags,
    createdAt: p.created_at,
    body: sanitize(p.body_html),
    excerpt: text.length > 170 ? text.slice(0, 167).replace(/\s\S*$/, "") + "…" : text,
    images: p.images.map((i) => ({ src: i.src, w: i.width, h: i.height })),
    option: p.options?.[0]?.name && p.options[0].name !== "Title" ? p.options[0].name : null,
    variants,
    priceMin: Math.min(...prices),
    priceMax: Math.max(...prices),
    available: variants.some((v) => v.available),
    onSale: variants.some((v) => v.compare && v.compare > v.price),
    collections: membership.get(p.id) ?? [],
  };
});

if (prodOut.length === 0) throw new Error("Shopify devolvió 0 productos");
await mkdir(new URL("../src/data/", import.meta.url), { recursive: true });
await writeFile(
  OUT,
  JSON.stringify({ syncedAt: new Date().toISOString(), store: STORE, products: prodOut, collections: collOut })
);
console.log(`Listo: ${prodOut.length} productos → src/data/catalog.json`);
}

try {
  await main();
} catch (err) {
  if (!SOFT) throw err;
  console.warn(`⚠ No se pudo sincronizar con Shopify (${err.message}). Se publica con el catálogo guardado.`);
}
