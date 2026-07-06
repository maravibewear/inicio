import { formatPrice } from './cart.js';

let allProducts = [];
let activeCategory = 'todas';

export function setProducts(products) { allProducts = products; return allProducts; }
export function getProducts() { return allProducts; }

export function getCategories() {
  const cats = new Set(allProducts.map((p) => p.categoria));
  return Array.from(cats).sort((a, b) => a.localeCompare(b, 'es'));
}

export function getFilteredProducts() {
  if (activeCategory === 'todas') return allProducts;
  return allProducts.filter((p) => p.categoria === activeCategory);
}
export function setActiveCategory(category) { activeCategory = category; }
export function getActiveCategory() { return activeCategory; }

function escapeHtml(unsafe) {
  return String(unsafe).replace(/[&<"'>]/g, (m) => {
    switch (m) { case '&': return '&amp;'; case '<': return '&lt;'; case '>': return '&gt;'; case '"': return '&quot;'; default: return '&#039;'; }
  });
}

export function createProductCardHTML(product) {
  const isOutOfStock = !product.enStock;
  const priceDisplay = formatPrice(product.precioUnidad);
  
  return `
    <article class="product-card ${isOutOfStock ? 'product-card--out-of-stock' : ''}">
      <div class="product-card__image-container">
        <img class="product-card__image" src="${product.imagenes[0] || ''}" alt="${escapeHtml(product.nombre)}" loading="lazy">
        ${isOutOfStock ? `<span class="product-card__badge product-card__badge--sold-out">Sin Stock</span>` : ''}
      </div>
      <div class="product-card__body">
        <span class="product-card__category">${escapeHtml(product.categoria)}</span>
        <h3 class="product-card__name">${escapeHtml(product.nombre)}</h3>
        <div class="product-card__prices">
          <span class="product-card__price">Desde ${priceDisplay}</span>
        </div>
        ${!isOutOfStock ? `<button class="btn btn-primary open-modal-btn" data-id="${product.id}">Ver Opciones</button>` : `<button class="btn" disabled>Agotado</button>`}
      </div>
    </article>
  `;
}

export function renderProducts(gridEl, emptyEl, countEl) {
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

export function renderCategoryFilters(filtersEl, sectionEl, onFilterChange) {
  const categories = getCategories();
  if (categories.length <= 1) { sectionEl.hidden = true; return; }
  sectionEl.hidden = false;
  const buttons = [
    `<button class="filter-btn ${activeCategory === 'todas' ? 'filter-btn--active' : ''}" data-category="todas">Todos</button>`,
    ...categories.map(cat => `<button class="filter-btn ${activeCategory === cat ? 'filter-btn--active' : ''}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`)
  ];
  filtersEl.innerHTML = buttons.join('');
  filtersEl.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => { setActiveCategory(btn.dataset.category); onFilterChange(); });
  });
}
