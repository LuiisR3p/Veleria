# Pasar el sitio nuevo a www.miveleria.com

Objetivo: que **www.miveleria.com** muestre este sitio y que Shopify siga funcionando por detrás en **tienda.miveleria.com** (checkout, pedidos, cuenta de clientes, inventario y panel de administración).

El código ya está preparado. El cambio es de configuración: Shopify, Vercel y GoDaddy. Tiempo estimado: 30–60 minutos, más la propagación del DNS (normalmente menos de 1 hora).

## Situación actual (revisada en noviembre de 2026)

| Registro | Hoy | Apunta a |
|---|---|---|
| DNS del dominio | GoDaddy (`ns33/ns34.domaincontrol.com`) | — |
| `miveleria.com` (A, `@`) | `23.227.38.32` | Shopify |
| `www.miveleria.com` (CNAME) | `miveleria.com` | Shopify |
| Tienda Shopify interna | `0ta9dh-xb.myshopify.com` | — |

## Antes del día del cambio

- [ ] Plan de Vercel apto para uso comercial (**Pro**). El plan Hobby no permite sitios de negocio.
- [ ] Acceso al panel de **GoDaddy** del dominio.
- [ ] Acceso de administrador a **Shopify**.
- [ ] Decidir quién es dueño del repositorio de GitHub y del proyecto de Vercel (transferir o mantener).
- [ ] Copiar el ID de **Google Analytics / Google Ads** del tema actual para agregarlo al sitio nuevo.

## Paso 1. Shopify: conectar tienda.miveleria.com

1. En GoDaddy → DNS → **agregar** este registro (no borres nada todavía):

   | Tipo | Nombre | Valor |
   |---|---|---|
   | CNAME | `tienda` | `shops.myshopify.com` |

2. En Shopify → **Configuración → Dominios → Conectar dominio existente** → `tienda.miveleria.com`. Espera a que Shopify lo marque como conectado y emita el certificado SSL.
3. En la misma pantalla, **cambia el dominio principal** a `tienda.miveleria.com` y deja activa la opción de redirigir todo el tráfico al dominio principal.
4. Prueba `https://tienda.miveleria.com`: debe abrir la tienda Shopify de siempre.

> Durante unos minutos, www.miveleria.com redirigirá a tienda.miveleria.com. Es normal: la tienda sigue vendiendo.

## Paso 2. Vercel: variable y dominios

1. Vercel → proyecto **mi-veleria** → Settings → **Environment Variables** → agrega en *Production*:

   | Nombre | Valor |
   |---|---|
   | `PUBLIC_SHOPIFY_URL` | `https://tienda.miveleria.com` |

2. Settings → **Domains** → agrega `www.miveleria.com`.
3. Agrega también `miveleria.com` y elige **Redirect to www.miveleria.com**.
4. Deployments → último despliegue → **Redeploy**, para que tome la variable.

## Paso 3. GoDaddy: apuntar www a Vercel

En GoDaddy → DNS, **edita** estos registros:

| Tipo | Nombre | Valor nuevo | Reemplaza a |
|---|---|---|---|
| CNAME | `www` | `cname.vercel-dns.com` | `miveleria.com` |
| A | `@` | `76.76.21.21` | `23.227.38.32` |

Vercel puede sugerir valores más nuevos en su pantalla de Domains (por ejemplo `7f234f0ddc8870bd.vercel-dns-017.com` y las IP `216.198.79.1` / `64.29.17.1`). Si los muestra, usa esos.

No toques los registros **MX** ni **TXT**, porque son del correo `hola@miveleria.com` y de las verificaciones.

## Paso 4. Shopify: quitar los dominios viejos

Cuando Vercel muestre los dos dominios como **Valid Configuration**, ve a Shopify → Configuración → Dominios y **elimina** `miveleria.com` y `www.miveleria.com` de Shopify. Debe quedar solo `tienda.miveleria.com` (más el `.myshopify.com`).

## Paso 5. Comprobar (en el celular y en el computador)

- [ ] `https://www.miveleria.com` abre el sitio nuevo y `https://miveleria.com` redirige a www.
- [ ] Agregar un producto al carrito → **Ir a pagar** abre el checkout en `tienda.miveleria.com`.
- [ ] Hacer una **compra de prueba** (o una con descuento del 100%) y verla en Shopify → Pedidos.
- [ ] Enlaces viejos: `www.miveleria.com/products/cera-de-soya-apf` → `/producto/cera-de-soya-apf`.
- [ ] `www.miveleria.com/collections/moldes-de-flores` → `/coleccion/moldes-de-flores`.
- [ ] "Mi cuenta" y las políticas del pie de página abren en `tienda.miveleria.com`.
- [ ] Google Search Console: agregar `https://www.miveleria.com/sitemap-index.xml`.

## Mantener precios y existencias al día

Cada publicación en Vercel descarga de nuevo el catálogo de Shopify (`npm run sync -- --soft`). Si Shopify no responde, se publica con el último catálogo guardado.

Para republicar automáticamente cuando cambie un producto:

1. Vercel → Settings → Git → **Deploy Hooks** → crea uno (rama `ccr-9546368d-m9l6sy` o la rama principal que usen) y copia la URL.
2. Shopify → Configuración → Notificaciones → **Webhooks** → crea webhooks para *Actualización de producto*, *Creación de producto* y *Actualización de inventario* que envíen a esa URL.

Aunque el sitio muestre un dato viejo unos minutos, el checkout de Shopify siempre valida el stock y el precio reales.

## Si algo sale mal

Vuelve a dejar en GoDaddy `@ → 23.227.38.32` y `www → miveleria.com`, y en Shopify marca de nuevo `www.miveleria.com` como dominio principal. La tienda Shopify nunca se apaga, así que volver atrás es inmediato salvo por la propagación del DNS.
