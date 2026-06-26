/**
 * app.js — Punto de entrada: inicializa la tienda y conecta los módulos
 */

import { fetchProducts } from './api.js';
import {
  setProducts,
  getProducts,
  renderProducts,
  renderCategoryFilters,
} from './products.js';
import {
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  getCart,
  getCartItemCount,
  renderCart,
  sendWhatsAppOrder,
} from './cart.js';

// --- Referencias DOM ---
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const productsGrid = document.getElementById('productsGrid');
const emptyState = document.getElementById('emptyState');
const productCount = document.getElementById('productCount');
const retryBtn = document.getElementById('retryBtn');
const filtersSection = document.getElementById('filtersSection');
const categoryFilters = document.getElementById('categoryFilters');

const cartToggle = document.getElementById('cartToggle');
const cartBadge = document.getElementById('cartBadge');
const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const cartClose = document.getElementById('cartClose');
const cartBody = document.getElementById('cartBody');
const cartFooter = document.getElementById('cartFooter');
const cartTotal = document.getElementById('cartTotal');
const whatsappBtn = document.getElementById('whatsappBtn');
const clearCartBtn = document.getElementById('clearCartBtn');

const currentYear = document.getElementById('currentYear');

// --- Inicialización ---

currentYear.textContent = new Date().getFullYear();

/**
 * Obtiene la cantidad de un producto en el carrito.
 * @param {string} id
 * @returns {number}
 */
function getQty(id) {
  return getCart().get(id) || 0;
}

/**
 * Actualiza badge del carrito y re-renderiza el drawer.
 */
function refreshCartUI() {
  const count = getCartItemCount();

  if (count > 0) {
    cartBadge.textContent = count;
    cartBadge.hidden = false;
  } else {
    cartBadge.hidden = true;
  }

  renderCart(cartBody, cartFooter, cartTotal, getProducts());
}

/**
 * Re-renderiza catálogo y filtros.
 */
function refreshCatalogUI() {
  renderProducts(productsGrid, productCount, emptyState);
  renderCategoryFilters(categoryFilters, filtersSection, refreshCatalogUI);
}

/**
 * Abre el carrito lateral.
 */
function openCart() {
  cartDrawer.classList.add('cart-drawer--open');
  cartOverlay.classList.add('cart-overlay--visible');
  cartDrawer.setAttribute('aria-hidden', 'false');
  cartOverlay.setAttribute('aria-hidden', 'false');
  cartToggle.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

/**
 * Cierra el carrito lateral.
 */
function closeCart() {
  cartDrawer.classList.remove('cart-drawer--open');
  cartOverlay.classList.remove('cart-overlay--visible');
  cartDrawer.setAttribute('aria-hidden', 'true');
  cartOverlay.setAttribute('aria-hidden', 'true');
  cartToggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

/**
 * Muestra estado de carga.
 */
function showLoading() {
  loadingState.hidden = false;
  errorState.hidden = true;
  productsGrid.hidden = true;
  emptyState.hidden = true;
}

/**
 * Muestra estado de error.
 */
function showError() {
  loadingState.hidden = true;
  errorState.hidden = false;
  productsGrid.hidden = true;
}

/**
 * Muestra el catálogo cargado.
 */
function showCatalog() {
  loadingState.hidden = true;
  errorState.hidden = true;
  refreshCatalogUI();
}

/**
 * Carga productos desde la API y actualiza la UI.
 */
async function loadProducts() {
  showLoading();

  try {
    const products = await fetchProducts();
    setProducts(products);
    showCatalog();
  } catch (error) {
    console.error('Error al cargar productos:', error);
    showError();
  }
}

// --- Event listeners: Carrito ---

cartToggle.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCart();
});

whatsappBtn.addEventListener('click', () => {
  sendWhatsAppOrder(getProducts());
});

clearCartBtn.addEventListener('click', () => {
  if (confirm('¿Vaciar el carrito?')) {
    clearCart();
    refreshCartUI();
  }
});

cartBody.addEventListener('click', (e) => {
  const target = e.target;

  if (target.classList.contains('qty-plus')) {
    updateQuantity(target.dataset.id, getQty(target.dataset.id) + 1);
    refreshCartUI();
  }

  if (target.classList.contains('qty-minus')) {
    updateQuantity(target.dataset.id, getQty(target.dataset.id) - 1);
    refreshCartUI();
  }

  if (target.classList.contains('remove-item')) {
    removeFromCart(target.dataset.id);
    refreshCartUI();
  }
});

// --- Event listeners: Catálogo ---

productsGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.add-to-cart-btn');
  if (!btn || btn.disabled) return;

  addToCart(btn.dataset.id);
  refreshCartUI();
  openCart();
});

retryBtn.addEventListener('click', loadProducts);

// --- Arranque ---

refreshCartUI();
loadProducts();
