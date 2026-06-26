/**
 * cart.js — Lógica del carrito de compras y pedido por WhatsApp
 */

/** Clave de localStorage para persistir el carrito */
const STORAGE_KEY = 'maravibewear_cart';

/**
 * Número de WhatsApp con código de país (sin + ni espacios).
 * Ejemplo Argentina: 5492236613489
 * @type {string}
 */
export const WHATSAPP_NUMBER = '5491157089345';

/** @type {Map<string, number>} id → cantidad */
let cart = loadCart();

/**
 * Carga el carrito desde localStorage.
 * @returns {Map<string, number>}
 */
function loadCart() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return new Map();
    const parsed = JSON.parse(saved);
    return new Map(Object.entries(parsed).map(([k, v]) => [k, Number(v)]));
  } catch {
    return new Map();
  }
}

/**
 * Persiste el carrito en localStorage.
 */
function saveCart() {
  const obj = Object.fromEntries(cart);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

/**
 * @returns {Map<string, number>}
 */
export function getCart() {
  return cart;
}

/**
 * @returns {number} Total de unidades en el carrito
 */
export function getCartItemCount() {
  let total = 0;
  cart.forEach((qty) => { total += qty; });
  return total;
}

/**
 * Agrega un producto al carrito (o incrementa cantidad).
 * @param {string} productId
 * @param {number} [qty=1]
 */
export function addToCart(productId, qty = 1) {
  const current = cart.get(productId) || 0;
  cart.set(productId, current + qty);
  saveCart();
}

/**
 * Actualiza la cantidad de un producto.
 * Si qty <= 0, elimina el producto.
 * @param {string} productId
 * @param {number} qty
 */
export function updateQuantity(productId, qty) {
  if (qty <= 0) {
    cart.delete(productId);
  } else {
    cart.set(productId, qty);
  }
  saveCart();
}

/**
 * Elimina un producto del carrito.
 * @param {string} productId
 */
export function removeFromCart(productId) {
  cart.delete(productId);
  saveCart();
}

/**
 * Vacía el carrito por completo.
 */
export function clearCart() {
  cart = new Map();
  saveCart();
}

/**
 * Formatea un número como precio en pesos argentinos.
 * @param {number} amount
 * @returns {string}
 */
export function formatPrice(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calcula el total del carrito dado un mapa de productos.
 * @param {object[]} products
 * @returns {{ items: object[], total: number }}
 */
export function getCartDetails(products) {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const items = [];
  let total = 0;

  cart.forEach((qty, id) => {
    const product = productMap.get(id);
    if (!product) return;

    const subtotal = product.precio * qty;
    total += subtotal;

    items.push({
      ...product,
      cantidad: qty,
      subtotal,
    });
  });

  return { items, total };
}

/**
 * Genera el mensaje de texto para WhatsApp.
 * @param {object[]} products
 * @returns {string}
 */
export function buildWhatsAppMessage(products) {
  const { items, total } = getCartDetails(products);

  if (items.length === 0) return '';

  const lines = [
    '🛍️ *Nuevo pedido — Maravibewear*',
    '',
    '*Detalle del pedido:*',
    '',
  ];

  items.forEach((item, index) => {
    lines.push(`${index + 1}. *${item.nombre}*`);
    lines.push(`   Cantidad: ${item.cantidad}`);
    lines.push(`   Precio unitario: ${formatPrice(item.precio)}`);
    lines.push(`   Subtotal: ${formatPrice(item.subtotal)}`);
    lines.push('');
  });

  lines.push('─────────────────');
  lines.push(`*TOTAL: ${formatPrice(total)}*`);
  lines.push('');
  lines.push('_Pedido generado desde la tienda online_');

  return lines.join('\n');
}

/**
 * Abre WhatsApp con el mensaje del pedido pre-cargado.
 * @param {object[]} products
 */
export function sendWhatsAppOrder(products) {
  const message = buildWhatsAppMessage(products);
  if (!message) return;

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Renderiza los items del carrito en el drawer.
 * @param {HTMLElement} bodyEl
 * @param {HTMLElement} footerEl
 * @param {HTMLElement} totalEl
 * @param {object[]} products
 */
export function renderCart(bodyEl, footerEl, totalEl, products) {
  const { items, total } = getCartDetails(products);

  if (items.length === 0) {
    bodyEl.innerHTML = `
      <div class="cart-drawer__empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
        <p>Tu carrito está vacío</p>
      </div>
    `;
    footerEl.hidden = true;
    return;
  }

  footerEl.hidden = false;
  totalEl.textContent = formatPrice(total);

  const placeholder = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><rect fill="#f0f0f0" width="72" height="72"/></svg>'
  );

  bodyEl.innerHTML = items.map((item) => `
    <div class="cart-item" data-id="${item.id}">
      <img
        class="cart-item__image"
        src="${item.imagen || placeholder}"
        alt="${escapeHtml(item.nombre)}"
        onerror="this.src='${placeholder}'"
      >
      <div class="cart-item__info">
        <span class="cart-item__name">${escapeHtml(item.nombre)}</span>
        <span class="cart-item__price">${formatPrice(item.precio)} c/u</span>
        <div class="cart-item__controls">
          <div class="cart-item__qty">
            <button class="cart-item__qty-btn qty-minus" data-id="${item.id}" aria-label="Disminuir cantidad">−</button>
            <span class="cart-item__qty-value">${item.cantidad}</span>
            <button class="cart-item__qty-btn qty-plus" data-id="${item.id}" aria-label="Aumentar cantidad">+</button>
          </div>
          <span class="cart-item__subtotal">${formatPrice(item.subtotal)}</span>
        </div>
        <button class="cart-item__remove remove-item" data-id="${item.id}">Eliminar</button>
      </div>
    </div>
  `).join('');
}

/**
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
