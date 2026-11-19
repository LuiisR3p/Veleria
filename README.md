# Mi Velería · propuesta de nuevo sitio

Propuesta de rediseño para [miveleria.com](https://www.miveleria.com), tienda de insumos, moldes y talleres de velas en Bogotá.

El sitio usa **el catálogo y las fotos reales de la tienda Shopify**. El carrito termina en el **checkout oficial de Shopify**, así que no cambia nada en pagos, inventario ni pedidos.

## Qué mejora frente al sitio actual

| | Sitio actual (tema Empire) | Propuesta |
|---|---|---|
| Velocidad | Página de inicio de ~680 KB de HTML más scripts del tema y apps | Portada de ~21 KB comprimida, 7 KB de JavaScript, sin frameworks |
| Navegación | Menú con categorías repetidas y nombres cruzados | Menú desplegable con foto y conteo por categoría, menú móvil por secciones |
| Búsqueda | Búsqueda por página | Búsqueda instantánea en los 335 productos (tecla `/`) |
| Primera compra | "Los básicos para tu primera vela" como imagen con puntos | **Arma tu primera vela**: elige cera, molde, fragancia, colorante y pabilo y agrégalos de una vez |
| Ceras | Cada ficha técnica por separado | **Guía comparativa de ceras**: uso ideal, punto de fusión y precio |
| Talleres | Tarjetas iguales a cualquier producto | Página propia con requisitos ("requiere el Taller Base"), cómo funciona y WhatsApp para fechas |
| Pedido | Solo checkout | Checkout de Shopify **o** pedido armado automáticamente por WhatsApp |
| SEO | Genérico del tema | URL limpia por producto y colección, datos estructurados `Product` y `Store`, sitemap |

## Cómo funciona

- **Astro** genera un sitio estático: ~376 páginas (inicio, tienda, talleres, 37 colecciones y 335 productos).
- `scripts/sync-catalog.mjs` lee el catálogo público de Shopify (`/products.json` y `/collections.json`) y lo guarda en `src/data/catalog.json`.
- Las imágenes se sirven desde el CDN de Shopify, redimensionadas al tamaño exacto (`?width=`) y en WebP/AVIF automático.
- El logo oficial está en `public/brand/`: se extrajo de su arte original con fondo transparente, en versión oscura (encabezado) y clara (pie de página), más el ícono de pestaña con su llama.
- El carrito vive en el navegador y "Ir a pagar" abre `miveleria.com/cart/<variante>:<cantidad>,…`, que crea el checkout en Shopify.

## Uso

```bash
npm install
npm run dev        # http://localhost:4321
npm run sync       # actualiza productos, precios y existencias desde Shopify
npm run build      # genera /dist
```

> Si `npm run sync` falla detrás de un proxy, usa Node 22.21+ con `NODE_USE_ENV_PROXY=1`.

## Despliegue en Vercel

Importa el repositorio en Vercel; detecta Astro automáticamente (`vercel.json` ya está incluido). Para que precios y existencias se mantengan al día, puedes cambiar el comando de build a `npm run sync && npm run build` y programar un redeploy diario con un Deploy Hook.

## Estructura

```
scripts/sync-catalog.mjs   sincroniza el catálogo de Shopify
src/data/catalog.json      catálogo generado
src/lib/catalog.ts         datos del negocio, menú, guía de ceras y helpers
src/components/            encabezado, carrito, buscador, armador, tarjetas
src/pages/                 inicio, tienda, talleres, colección y producto
src/scripts/site.ts        menú, carrito y búsqueda (TypeScript sin dependencias)
src/styles/global.css      sistema visual: cera, madera, canela
```
