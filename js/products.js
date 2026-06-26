/**
 * products.js — Renderizado del catálogo y filtros por categoría
 */

import { formatPrice } from './cart.js';

/** @type {object[]} Cache local de productos */
let allProducts = [];

/** @type {string} Categoría activa ('todas' muestra todo) */
let activeCategory = 'todas';

/**
 * Guarda los productos en memoria y los devuelve.
 * @param {object[]} products
 * @returns {object[]}
 */
export function setProducts(products) {
  allProducts = products;
  return allProducts;
}

/**
 * @returns {object[]}
 */
export function getProducts() {
  return allProducts;
}

/**
 * Obtiene categorías únicas ordenadas alfabéticamente.
 * @returns {string[]}
 */
export function getCategories() {
  const cats = new Set(allProducts.map((p) => p.categoria));
  return Array.from(cats).sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Filtra productos por categoría activa.
 * @returns {object[]}
 */
export function getFilteredProducts() {
  if (activeCategory === 'todas') return allProducts;
  return allProducts.filter((p) => p.categoria === activeCategory);
}

/**
 * @param {string} category
 */
export function setActiveCategory(category) {
  activeCategory = category;
}

/**
 * @returns {string}
 */
export function getActiveCategory() {
  return activeCategory;
}

/**
 * Genera el HTML de una tarjeta de producto.
 * @param {object} product
 * @returns {string}
 */
export function createProductCardHTML(product) {
  const badge = !product.enStock
    ? '<span class="product-card__badge product-card__badge--out">Sin stock</span>'
    : product.oferta
      ? '<span class="product-card__badge">Oferta</span>'
      : '';

  const description = product.descripcion
    ? `<p class="product-card__description">${escapeHtml(product.descripcion)}</p>`
    : '';

  const priceOld = product.precioAnterior
    ? `<span class="product-card__price-old">${formatPrice(product.precioAnterior)}</span>`
    : '';

  const placeholder = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">' +
    '<rect fill="#f0f0f0" width="400" height="400"/>' +
    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ccc" font-family="sans-serif" font-size="16">Sin imagen</text></svg>'
  );

  const imgSrc = product.imagen || placeholder;

  return `
    <article class="product-card" data-id="${escapeHtml(product.id)}">
      <div class="product-card__image-wrap">
        ${badge}
        <img
          class="product-card__image"
          src="${escapeHtml(imgSrc)}"
          alt="${escapeHtml(product.nombre)}"
          loading="lazy"
          onerror="this.src='${placeholder}'"
        >
      </div>
      <div class="product-card__body">
        <span class="product-card__category">${escapeHtml(product.categoria)}</span>
        <h3 class="product-card__name">${escapeHtml(product.nombre)}</h3>
        ${description}
        <p class="product-card__price">
          ${formatPrice(product.precio)}
          ${priceOld}
        </p>
      </div>
      <div class="product-card__footer">
        <button
          class="btn btn--primary add-to-cart-btn"
          data-id="${escapeHtml(product.id)}"
          ${!product.enStock ? 'disabled' : ''}
        >
          ${product.enStock ? 'Agregar al carrito' : 'Sin stock'}
        </button>
      </div>
    </article>
  `;
}

/**
 * Renderiza el grid de productos en el DOM.
 * @param {HTMLElement} gridEl
 * @param {HTMLElement} countEl
 * @param {HTMLElement} emptyEl
 */
export function renderProducts(gridEl, countEl, emptyEl) {
  const filtered = getFilteredProducts();

  if (filtered.length === 0) {
    gridEl.hidden = true;
    emptyEl.hidden = false;
    countEl.textContent = '';
    return;
  }

  gridEl.hidden = false;
  emptyEl.hidden = true;
  countEl.textContent = `${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`;

  gridEl.innerHTML = filtered.map(createProductCardHTML).join('');
}

/**
 * Renderiza los botones de filtro por categoría.
 * @param {HTMLElement} filtersEl
 * @param {HTMLElement} sectionEl
 * @param {function} onFilterChange
 */
export function renderCategoryFilters(filtersEl, sectionEl, onFilterChange) {
  const categories = getCategories();

  if (categories.length <= 1) {
    sectionEl.hidden = true;
    return;
  }

  sectionEl.hidden = false;

  const buttons = [
    `<button class="filter-btn ${activeCategory === 'todas' ? 'filter-btn--active' : ''}" data-category="todas">Todos</button>`,
    ...categories.map(
      (cat) =>
        `<button class="filter-btn ${activeCategory === cat ? 'filter-btn--active' : ''}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`
    ),
  ];

  filtersEl.innerHTML = buttons.join('');

  filtersEl.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveCategory(btn.dataset.category);
      onFilterChange();
    });
  });
}

/**
 * Escapa HTML para prevenir XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
