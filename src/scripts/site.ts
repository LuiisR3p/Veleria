/* Mi Velería: interacción del sitio (sin frameworks).
   - Menú principal y menú móvil
   - Carrito persistente (localStorage) que termina en el checkout real de Shopify
   - Búsqueda instantánea sobre /buscar.json
*/

type CartItem = {
  id: number; // id de variante en Shopify
  qty: number;
  title: string;
  variant: string | null;
  price: number;
  image: string;
  url: string;
};

const STORE = "https://www.miveleria.com";
const WA = "573125253893";
const KEY = "mv-cart-v1";
const fmt = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const money = (n: number) => fmt.format(n).replace(/\s/g, " ");
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];

/* ---------------- Cajones (menú móvil y carrito) ---------------- */
let lastFocus: HTMLElement | null = null;
function openDrawer(el: HTMLElement) {
  lastFocus = document.activeElement as HTMLElement;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add("is-open"));
  document.body.classList.add("is-locked");
  const focusable = el.querySelector<HTMLElement>("button, a, input");
  setTimeout(() => focusable?.focus(), 50);
}
function closeDrawer(el: HTMLElement) {
  el.classList.remove("is-open");
  document.body.classList.remove("is-locked");
  setTimeout(() => (el.hidden = true), 320);
  lastFocus?.focus();
}
const mobile = $("[data-mobile-nav]");
const cartEl = $("[data-cart]");
$("[data-open-mobile]")?.addEventListener("click", () => mobile && openDrawer(mobile));
$$("[data-close-mobile]").forEach((b) => b.addEventListener("click", () => mobile && closeDrawer(mobile)));
$$("[data-open-cart]").forEach((b) => b.addEventListener("click", () => cartEl && openDrawer(cartEl)));
$$("[data-close-cart]").forEach((b) => b.addEventListener("click", () => cartEl && closeDrawer(cartEl)));
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (cartEl && !cartEl.hidden) closeDrawer(cartEl);
  if (mobile && !mobile.hidden) closeDrawer(mobile);
  closePanels();
});

/* ---------------- Menú desplegable de escritorio ---------------- */
const triggers = $$<HTMLButtonElement>("[data-nav-trigger]");
function closePanels(except?: HTMLButtonElement) {
  triggers.forEach((t) => {
    if (t === except) return;
    t.setAttribute("aria-expanded", "false");
    document.getElementById(t.getAttribute("aria-controls")!)?.classList.remove("is-open");
  });
}
let hoverTimer: number | undefined;
triggers.forEach((t) => {
  const panel = document.getElementById(t.getAttribute("aria-controls")!)!;
  const open = () => {
    closePanels(t);
    t.setAttribute("aria-expanded", "true");
    panel.classList.add("is-open");
  };
  t.addEventListener("click", () => (t.getAttribute("aria-expanded") === "true" ? closePanels() : open()));
  const item = t.closest("li")!;
  item.addEventListener("mouseenter", () => {
    if (!matchMedia("(hover: hover)").matches) return;
    clearTimeout(hoverTimer);
    hoverTimer = window.setTimeout(open, 90);
  });
  item.addEventListener("mouseleave", () => {
    if (!matchMedia("(hover: hover)").matches) return;
    clearTimeout(hoverTimer);
    hoverTimer = window.setTimeout(() => closePanels(), 160);
  });
});
document.addEventListener("click", (e) => {
  if (!(e.target as Element).closest(".nav")) closePanels();
});

/* ---------------- Aviso flotante ---------------- */
const toast = document.createElement("div");
toast.className = "toast";
toast.setAttribute("role", "status");
document.body.append(toast);
let toastTimer: number | undefined;
function notify(msg: string, action?: { label: string; run: () => void }) {
  toast.innerHTML = "";
  const p = document.createElement("span");
  p.textContent = msg;
  toast.append(p);
  if (action) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = action.label;
    b.onclick = () => {
      toast.classList.remove("is-on");
      action.run();
    };
    toast.append(b);
  }
  toast.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-on"), 4200);
}

/* ---------------- Carrito ---------------- */
function load(): CartItem[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
let cart: CartItem[] = load();
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cart));
  } catch {
    /* modo privado: el carrito vive solo en esta pestaña */
  }
  render();
}

type NewItem = Omit<CartItem, "qty"> & { qty?: number };
export function addToCart(items: NewItem[], opts: { silent?: boolean } = {}) {
  let added = 0;
  for (const it of items) {
    const qty = Math.max(1, Number(it.qty) || 1);
    const found = cart.find((c) => c.id === it.id);
    if (found) found.qty += qty;
    else cart.push({ ...it, qty });
    added += qty;
  }
  save();
  const btn = $("[data-open-cart]");
  btn?.classList.remove("is-bump");
  void btn?.offsetWidth;
  btn?.classList.add("is-bump");
  if (!opts.silent)
    notify(added === 1 ? "Agregado al carrito" : `${added} productos agregados`, {
      label: "Ver carrito",
      run: () => cartEl && openDrawer(cartEl),
    });
}
(window as any).mvAddToCart = addToCart;

function render() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.qty * i.price, 0);
  $$("[data-cart-count]").forEach((el) => (el.textContent = String(count)));

  const list = $("[data-cart-items]");
  const tpl = $<HTMLTemplateElement>("#cart-item-tpl");
  if (!list || !tpl) return;
  list.innerHTML = "";
  for (const item of cart) {
    const li = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
    const im = $<HTMLImageElement>(".citem__img", li)!;
    im.src = item.image;
    const a = $<HTMLAnchorElement>(".citem__title", li)!;
    a.textContent = item.title;
    a.href = item.url;
    $(".citem__variant", li)!.textContent = item.variant ?? "";
    $("[data-qty]", li)!.textContent = String(item.qty);
    $(".citem__price", li)!.textContent = money(item.price * item.qty);
    $("[data-inc]", li)!.addEventListener("click", () => { item.qty++; save(); });
    $("[data-dec]", li)!.addEventListener("click", () => {
      item.qty--;
      if (item.qty < 1) cart = cart.filter((c) => c !== item);
      save();
    });
    $("[data-remove]", li)!.addEventListener("click", () => {
      cart = cart.filter((c) => c !== item);
      save();
      notify("Producto quitado", { label: "Deshacer", run: () => { cart.push(item); save(); } });
    });
    list.append(li);
  }

  const empty = !cart.length;
  $("[data-cart-empty]")!.hidden = !empty;
  $("[data-cart-foot]")!.hidden = empty;
  $("[data-cart-total]")!.textContent = money(total);

  const ship = $("[data-ship]");
  if (ship) {
    const free = Number(ship.dataset.freeFrom);
    const left = Math.max(0, free - total);
    $("[data-ship-text]", ship)!.textContent =
      left > 0 ? `Te faltan ${money(left)} para el envío gratis.` : "Tu pedido tiene envío gratis.";
    ($("[data-ship-bar]", ship) as HTMLElement).style.width = `${Math.min(100, (total / free) * 100)}%`;
  }

  const checkout = $<HTMLAnchorElement>("[data-checkout]");
  if (checkout) checkout.href = `${STORE}/cart/${cart.map((i) => `${i.id}:${i.qty}`).join(",")}`;
  const wa = $<HTMLAnchorElement>("[data-wa-order]");
  if (wa) {
    const lines = cart.map((i) => `• ${i.qty} × ${i.title}${i.variant ? ` (${i.variant})` : ""}: ${money(i.price * i.qty)}`);
    const msg = `Hola Mi Velería, quiero hacer este pedido:\n${lines.join("\n")}\nSubtotal: ${money(total)}`;
    wa.href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
  }
}
window.addEventListener("storage", (e) => {
  if (e.key === KEY) {
    cart = load();
    render();
  }
});
render();

/* Botones simples "agregar" (tarjetas y formularios de producto) */
document.addEventListener("submit", (e) => {
  const form = e.target as HTMLFormElement;
  if (!form.matches("[data-add-form]")) return;
  e.preventDefault();
  const fd = new FormData(form);
  const id = Number(fd.get("id"));
  const opt = form.querySelector<HTMLInputElement>(`input[name="id"][value="${id}"]`) ?? form.querySelector<HTMLInputElement>('input[name="id"]');
  addToCart([
    {
      id,
      qty: Number(fd.get("qty") || 1),
      title: form.dataset.title!,
      variant: opt?.dataset.label || null,
      price: Number(opt?.dataset.price ?? form.dataset.price),
      image: opt?.dataset.image || form.dataset.image!,
      url: form.dataset.url!,
    },
  ]);
});

/* ---------------- Búsqueda ---------------- */
const dlg = $<HTMLDialogElement>("[data-search]");
const input = $<HTMLInputElement>("[data-search-input]");
const results = $("[data-search-results]");
const status = $("[data-search-status]");
const suggest = $("[data-search-suggest]");
type Hit = { t: string; u: string; i: string; p: string; k: string; a: number };
let index: Hit[] | null = null;
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

$$("[data-open-search]").forEach((b) =>
  b.addEventListener("click", async () => {
    dlg?.showModal();
    input?.focus();
    if (!index) index = await fetch("/buscar.json").then((r) => r.json()).catch(() => []);
  })
);
$("[data-close-search]")?.addEventListener("click", () => dlg?.close());
dlg?.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    dlg.close();
  }
});
dlg?.addEventListener("click", (e) => {
  if (e.target === dlg) dlg.close();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && !(e.target as Element).closest("input, textarea")) {
    e.preventDefault();
    ($("[data-open-search]") as HTMLButtonElement | null)?.click();
  }
});
input?.addEventListener("input", () => {
  const q = norm(input.value.trim());
  results!.innerHTML = "";
  if (q.length < 2 || !index) {
    status!.textContent = "Escribe al menos 2 letras.";
    suggest!.hidden = false;
    return;
  }
  suggest!.hidden = true;
  const words = q.split(/\s+/);
  const hits = index
    .map((h) => {
      const t = norm(h.t);
      const hay = t + " " + h.k;
      if (!words.every((w) => hay.includes(w))) return null;
      const score = (t.startsWith(q) ? 4 : 0) + (t.includes(q) ? 2 : 0) + h.a;
      return { h, score };
    })
    .filter(Boolean)
    .sort((a, b) => b!.score - a!.score)
    .slice(0, 12) as { h: Hit }[];
  status!.textContent = hits.length ? `${hits.length === 12 ? "Más de 12" : hits.length} resultados` : `No encontramos "${input.value}". Prueba con "cera", "molde" o "fragancia".`;
  for (const { h } of hits) {
    const li = document.createElement("li");
    li.innerHTML = h.i ? `<a class="sres" href="${h.u}"><img src="${h.i}" alt="" width="52" height="52" loading="lazy"><span></span></a>` : `<a class="sres" href="${h.u}"><i class="sres__noimg"></i><span></span></a>`;
    const span = li.querySelector("span")!;
    const b = document.createElement("strong");
    b.textContent = h.t;
    const sm = document.createElement("small");
    sm.textContent = h.a ? h.p : `${h.p} · agotado`;
    span.append(b, sm);
    results!.append(li);
  }
});
