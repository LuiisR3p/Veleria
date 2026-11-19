import raw from "../data/catalog.json";

export type Variant = {
  id: number;
  title: string | null;
  price: number;
  compare: number | null;
  available: boolean;
  image: string | null;
};
export type Product = {
  id: number;
  handle: string;
  title: string;
  type: string;
  tags: string[];
  createdAt: string;
  body: string;
  excerpt: string;
  images: { src: string; w: number; h: number }[];
  option: string | null;
  variants: Variant[];
  priceMin: number;
  priceMax: number;
  available: boolean;
  onSale: boolean;
  collections: string[];
};
export type Collection = {
  handle: string;
  title: string;
  description: string;
  image: string | null;
  products: string[];
};

export const STORE = "https://www.miveleria.com";
export const SITE = {
  name: "Mi Velería",
  tagline: "Crea tu vela con estilo",
  whatsapp: "573125253893",
  whatsappLabel: "312 525 3893",
  email: "hola@miveleria.com",
  address: "Carrera 52 C # 39 A Sur 09, La Alquería, Bogotá",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Carrera+52C+%2339A+Sur+09+Bogot%C3%A1",
  instagram: "https://www.instagram.com/miveleriastudio",
  tiktok: "https://www.tiktok.com/@mi.veleria.studio",
  facebook: "https://www.facebook.com/share/18qCMFpWFV/",
  freeShippingFrom: 230000,
};

const data = raw as { syncedAt: string; products: Product[]; collections: Collection[] };
export const syncedAt = data.syncedAt;

/* --- Limpieza de textos y rutas ------------------------------------------ */

const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}]/gu;
export const clean = (s: string) => s.replace(EMOJI, "").replace(/\s{2,}/g, " ").replace(/\s+([,.–-])\s*$/, "").trim();
export const slugify = (h: string) =>
  decodeURIComponent(h)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(EMOJI, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");

/* Títulos de colección que en Shopify quedaron con handles cruzados o con emoji */
const COLLECTION_TITLES: Record<string, string> = {
  "decorativos-para-velas-y-manualidades-flores-piedras-y-bouquet": "Decorativos para velas",
  "pabilos-y-accesorios-para-velas-mechas": "Pabilos y accesorios",
  "colorantes-pigmentos-y-micas-para-velas": "Colorantes, pigmentos y micas",
  "ceras-y-parafinas-para-velas": "Ceras y parafinas",
  "talleres-de-velas-mi-veleria-studio": "Talleres",
  "velas-aromaticas-mi-veleria": "Velas Mi Velería",
  "moldes-recipientes-en-yeso-y-cemento": "Moldes para yeso y cemento",
  "herramientas-para-hacer-velas": "Herramientas",
  "kit-para-velas": "Kits",
};

export const products: Product[] = data.products.map((p) => ({ ...p, title: clean(p.title) }));
export const collections: (Collection & { slug: string; name: string })[] = data.collections.map((c) => ({
  ...c,
  slug: slugify(c.handle),
  name: COLLECTION_TITLES[c.handle] ?? clean(c.title),
}));

const byHandle = new Map(products.map((p) => [p.handle, p]));
export const productSlug = (p: Product) => slugify(p.handle);
export const productUrl = (p: Product) => `/producto/${productSlug(p)}`;
export const collectionUrl = (c: { slug: string }) => `/coleccion/${c.slug}`;
export const getProduct = (handle: string) => byHandle.get(handle);
export const getCollection = (handle: string) => collections.find((c) => c.handle === handle);
export const collectionProducts = (c: Collection) =>
  c.products.map((h) => byHandle.get(h)).filter((p): p is Product => !!p);

/* --- Imágenes: servidas desde el CDN de Shopify, redimensionadas ---------- */

const CDN_PREFIX = /^https?:\/\/cdn\.shopify\.com\/s\/files\/1\/0812\/0254\/4884\//;
export function img(src: string | null | undefined, width = 600) {
  if (!src) return "";
  const base = src.replace(CDN_PREFIX, `${STORE}/cdn/shop/`).replace(/^\/\//, "https://");
  const url = new URL(base);
  url.searchParams.delete("v");
  url.searchParams.set("width", String(width));
  return url.toString();
}
export const srcset = (src: string | null | undefined, widths = [240, 360, 480, 720, 960]) =>
  src ? widths.map((w) => `${img(src, w)} ${w}w`).join(", ") : "";
/* Fotos propias del sitio actual (banners, logo, taller) */
export const siteImg = (file: string, width = 1200) => img(`${STORE}/cdn/shop/files/${file}`, width);
export const siteSrcset = (file: string, widths = [480, 800, 1200, 1600, 2000]) =>
  widths.map((w) => `${siteImg(file, w)} ${w}w`).join(", ");

/* --- Precios ------------------------------------------------------------- */

const fmt = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
export const money = (n: number) => fmt.format(n).replace(/\s/g, " ");
export const priceLabel = (p: Product) => (p.priceMin === p.priceMax ? money(p.priceMin) : `Desde ${money(p.priceMin)}`);

/* --- Navegación ---------------------------------------------------------- */

export type NavGroup = { id: string; title: string; href: string; children?: string[]; blurb?: string };
export const NAV: NavGroup[] = [
  { id: "talleres", title: "Talleres", href: "/talleres" },
  {
    id: "insumos",
    title: "Insumos",
    href: "/tienda?grupo=insumos",
    blurb: "Ceras, fragancias, colorantes y pabilos para resultados profesionales.",
    children: [
      "ceras-y-parafinas-para-velas",
      "fragancias-para-velas",
      "fragancias-premium",
      "fragancias-estandar",
      "colorantes-pigmentos-y-micas-para-velas",
      "pabilos-y-accesorios-para-velas-mechas",
      "aditivos-para-velas",
      "mantequillas-y-aceites",
    ],
  },
  {
    id: "moldes",
    title: "Moldes",
    href: "/tienda?grupo=moldes",
    blurb: "Más de 130 moldes de silicona para dar forma a tus ideas.",
    children: [
      "moldes-para-velas-1",
      "moldes-de-flores",
      "moldes-navidenos-🎄",
      "moldes-de-comida",
      "moldes-de-animales",
      "moldes-decorativos",
      "moldes-religiosos",
      "moldes-para-jabones-copia",
      "moldes-halloween",
      "wax-melts-moldes-envases-y-materiales-para-ceras-aromaticas",
      "moldes-para-velas-copia",
      "moldes-recipientes-en-yeso-y-cemento",
    ],
  },
  {
    id: "envases",
    title: "Envases",
    href: "/tienda?grupo=envases",
    blurb: "Presentaciones para vender o regalar con estilo.",
    children: [
      "envases-para-velas",
      "envases-de-vidrio-para-velas",
      "envases-de-ceramica-para-velas",
      "envases-metalicos-para-velas",
      "envases-de-policarbonato-para-velas",
      "envases-para-wax-melts",
      "empaques",
    ],
  },
  {
    id: "decoracion",
    title: "Decoración",
    href: "/tienda?grupo=decoracion",
    blurb: "Flores, piedras, brillos y todo para bouquets.",
    children: [
      "decorativos-para-velas-y-manualidades-flores-piedras-y-bouquet",
      "todo-para-bouquets",
      "flores-y-elementos-naturales",
      "acabados-y-brillos",
      "accesorios-decorativos",
    ],
  },
  {
    id: "herramientas",
    title: "Herramientas",
    href: "/tienda?grupo=herramientas",
    blurb: "Lo que necesitas para medir, derretir y verter con precisión.",
    children: ["herramientas-para-hacer-velas", "kit-para-velas"],
  },
  { id: "velas", title: "Velas hechas", href: "/coleccion/velas-aromaticas-mi-veleria" },
];

/* Grupo principal de cada producto, para los filtros de la tienda */
export function groupsOf(p: Product): string[] {
  const g = new Set<string>();
  for (const n of NAV) if (n.children?.some((h) => p.collections.includes(h))) g.add(n.id);
  if (p.type === "Talleres") g.add("talleres");
  if (/vela/i.test(p.type) && !/molde/i.test(p.type)) g.add("velas");
  if (/^molde/i.test(p.type)) g.add("moldes");
  if (/fragancia|ceras|colorante|pabilo|aditivo|humectante/i.test(p.type)) g.add("insumos");
  if (/envase/i.test(p.type)) g.add("envases");
  if (/espatula|medici|pistola|batidora|olla|estufa|portacal|kit/i.test(p.type)) g.add("herramientas");
  if (/decoraci|cinta floral|empaque/i.test(p.type)) g.add("decoracion");
  return [...g];
}

/* --- Talleres ------------------------------------------------------------ */

/* Resumen corto sin el aviso de requisito previo ni emojis */
function summarize(html: string, max = 160) {
  const text = clean(
    html
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z#0-9]+;/gi, " ")
      .replace(/Es indispensable[^.]*\.\s*/i, "")
      .replace(/\s+/g, " ")
  ).replace(/^\s+/, "");
  return text.length > max ? text.slice(0, max - 1).replace(/\s\S*$/, "") + "…" : text;
}

export const workshops = products
  .filter((p) => p.type === "Talleres")
  .map((p) => ({
    ...p,
    needsBase: /indispensable[^.]*taller (inicial|base)/i.test(p.body.replace(/<[^>]+>/g, " ")),
    summary: summarize(p.body),
  }))
  .sort((a, b) => (a.handle === "taller-base-de-velas-artesanales" ? -1 : b.handle === "taller-base-de-velas-artesanales" ? 1 : a.priceMin - b.priceMin));

/* --- Guía de ceras (datos de las fichas técnicas de cada producto) ------- */

export const WAX_GUIDE: { handle: string; use: string; melt: string; note: string }[] = [
  { handle: "cera-de-soya-bpf", use: "Velas en vaso o recipiente", melt: "45–48 °C", note: "Cremosa y maleable. Se adhiere bien al vidrio y suelta mucho aroma." },
  { handle: "cera-de-vaso", use: "Velas en vaso o recipiente", melt: "≈ 50 °C", note: "Mezcla vegetal formulada para contenedor, con buena difusión en frío y en caliente." },
  { handle: "cera-de-abejas-amarilla", use: "Velas en recipiente y mezclas", melt: "40–45 °C", note: "Cera de coco en bloque. Acabado cremoso y gran retención de fragancia." },
  { handle: "cera-de-palma-bpf", use: "Velas en recipiente", melt: "47–57 °C", note: "Vegetal, de palma. Alternativa a la soya para contenedor." },
  { handle: "cera-de-soya-apf", use: "Velas de molde y wax melts", melt: "63–65 °C", note: "Firme y sedosa. Desmolda limpio y conserva detalles." },
  { handle: "cera-de-molde", use: "Velas de molde", melt: "58–62 °C", note: "Mezcla vegetal y mineral, dura y blanca traslúcida. Vertido a 60–65 °C." },
  { handle: "parafina-china", use: "Velas de molde firmes", melt: "58–60 °C", note: "La más usada para molde: dura, uniforme y fácil de desmoldar." },
  { handle: "cerda-de-palma-apf-1", use: "Velas de molde y pilar", melt: "58–62 °C", note: "Vegetal, quebradiza, con acabado perlado." },
  { handle: "cera-de-abeja-amarilla", use: "Velas naturales", melt: "62–65 °C", note: "Origen animal, aroma natural a miel y color cálido sin colorante." },
  { handle: "parafina-cera-en-gel", use: "Velas transparentes", melt: "Gel", note: "Para velas tipo acuario, bebidas y encapsulados en vidrio." },
  { handle: "cera-de-arena", use: "Velas sin fundir", melt: "45–55 °C", note: "Granulada. Se sirve en el recipiente con pabilo y está lista para encender." },
  { handle: "cera-flor-de-hielo-grande", use: "Textura de cristal", melt: "Decorativa", note: "Escamas para efecto hielo en velas tipo Ice Latte." },
];

/* --- Armador "Tu primera vela" ------------------------------------------ */

export type BuilderOption = { productId: number; handle: string; url: string; title: string; fullTitle: string; image: string; variants: Variant[]; hint?: string };
const toOption = (p: Product, hint?: string): BuilderOption => ({
  productId: p.id,
  handle: p.handle,
  url: productUrl(p),
  title: p.title,
  fullTitle: p.title,
  image: img(p.images[0]?.src, 240),
  variants: p.variants,
  hint,
});
const pick = (handles: [string, string?][]) =>
  handles
    .map(([h, hint]) => {
      const p = getProduct(h);
      return p && p.available ? toOption(p, hint) : null;
    })
    .filter((x): x is BuilderOption => !!x);

export function builderSteps() {
  const moldes = collectionProducts(getCollection("moldes-para-velas-1")!)
    .filter((p) => p.available && p.images.length)
    .slice(0, 10)
    .map((p) => toOption(p));
  const fragancias = products
    .filter((p) => p.type === "Fragancias" && p.available && p.title.startsWith("Fragancia para Velas"))
    .slice(0, 14)
    .map((p) => ({ ...toOption(p), title: p.title.replace("Fragancia para Velas ", "") }));
  return [
    {
      id: "cera",
      title: "Cera",
      help: "Para velas de molde necesitas una cera de alto punto de fusión: endurece rápido y desmolda limpio.",
      options: pick([
        ["cera-de-molde", "Recomendada para empezar"],
        ["cera-de-soya-apf", "100% vegetal"],
        ["parafina-china", "La más económica"],
        ["cera-de-abeja-amarilla", "Natural, aroma a miel"],
      ]),
    },
    { id: "molde", title: "Molde", help: "Moldes de silicona: flexibles, reutilizables y fáciles de desmoldar.", options: moldes },
    {
      id: "fragancia",
      title: "Fragancia",
      help: "Usa entre 6% y 10% del peso de la cera. 30 ml alcanzan para varias velas pequeñas.",
      options: fragancias,
    },
    {
      id: "color",
      title: "Colorante",
      help: "Unas pocas gotas de colorante concentrado tiñen hasta 1 kilo de cera.",
      options: pick([["colorante-concentrado-5-ml"], ["colorante-concentrado-en-polvo-5-gramos"], ["colorante-mica", "Efecto perlado"]]),
    },
    {
      id: "pabilo",
      title: "Pabilo",
      help: "Talla S para velas de hasta 5 cm de diámetro, M hasta 8 cm y L para más grandes.",
      options: pick([["pabilo-encerado-por-metro", "Precio por metro"], ["pabilos-de-madera-para-velas-13-cm", "Llama crepitante"]]),
    },
  ];
}

/* --- Índice de búsqueda ligero (se sirve en /buscar.json) ---------------- */
export const searchIndex = () =>
  products.map((p) => ({
    t: p.title,
    u: productUrl(p),
    i: img(p.images[0]?.src, 120),
    p: priceLabel(p),
    k: [p.type, ...p.tags].join(" ").toLowerCase(),
    a: p.available ? 1 : 0,
  }));
