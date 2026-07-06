import { fetchProducts } from './api.js';
import { setProducts, getProducts, renderProducts, renderCategoryFilters } from './products.js';
import { addToCart, updateQuantity, removeFromCart, clearCart, getCart, renderCart, sendWhatsAppOrder, formatPrice } from './cart.js';

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

// Variables para el Modal
const productModal = document.getElementById('productModal');
const closeModalBtn = document.getElementById('closeModal');
let currentModalProduct = null;
let modalQty = 1;

function init() {
  document.getElementById('currentYear').textContent = new Date().getFullYear();
  refreshCartUI();
  loadCatalog();
}

function showLoading() { loadingState.hidden = false; errorState.hidden = true; productsGrid.hidden = true; filtersSection.hidden = true; emptyState.hidden = true; }
function showError() { loadingState.hidden = true; errorState.hidden = false; productsGrid.hidden = true; filtersSection.hidden = true; emptyState.hidden = true; }
function showCatalog() { loadingState.hidden = true; errorState.hidden = true; renderCategoryFilters(categoryFilters, filtersSection, () => renderProducts(productsGrid, emptyState, productCount)); renderProducts(productsGrid, emptyState, productCount); }

async function loadCatalog() {
  showLoading();
  try {
    const products = await fetchProducts();
    setProducts(products);
    showCatalog();
  } catch (error) { showError(); }
}

function openCart() { cartDrawer.classList.add('cart-drawer--open'); cartOverlay.hidden = false; document.body.style.overflow = 'hidden'; }
function closeCart() { cartDrawer.classList.remove('cart-drawer--open'); cartOverlay.hidden = true; document.body.style.overflow = ''; }
function refreshCartUI() { renderCart(cartBody, cartFooter, cartTotal, cartBadge); }

cartToggle.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
whatsappBtn.addEventListener('click', sendWhatsAppOrder);
clearCartBtn.addEventListener('click', () => { if (confirm('¿Vaciar el carrito?')) { clearCart(); refreshCartUI(); } });
retryBtn.addEventListener('click', loadCatalog);

cartBody.addEventListener('click', (e) => {
  const target = e.target;
  const vid = target.dataset.vid;
  if (!vid) return;
  const item = getCart().find(i => i.variantId === vid);
  if (target.classList.contains('qty-plus')) updateQuantity(vid, item.cantidad + 1);
  if (target.classList.contains('qty-minus')) updateQuantity(vid, item.cantidad - 1);
  if (target.classList.contains('remove-item')) removeFromCart(vid);
  refreshCartUI();
});

// Lógica del Modal
productsGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.open-modal-btn');
  if (!btn) return;
  const id = btn.dataset.id;
  currentModalProduct = getProducts().find(p => p.id === id);
  if (currentModalProduct) openModal();
});

function openModal() {
  const p = currentModalProduct;
  modalQty = 1;
  document.getElementById('modalQtyVal').textContent = modalQty;
  document.getElementById('modalTitle').textContent = p.nombre;
  document.getElementById('modalDesc').textContent = p.descripcion;
  
  // Galería
  const mainImg = document.getElementById('modalMainImg');
  const thumbs = document.getElementById('modalThumbs');
  mainImg.src = p.imagenes[0] || '';
  thumbs.innerHTML = p.imagenes.map((img, i) => `<img src="${img}" data-src="${img}" class="${i===0?'active':''}">`).join('');
  
  thumbs.querySelectorAll('img').forEach(thumb => {
    thumb.addEventListener('click', (e) => {
      mainImg.src = e.target.dataset.src;
      thumbs.querySelectorAll('img').forEach(img => img.classList.remove('active'));
      e.target.classList.add('active');
    });
  });

  // Precios (Unidad / Bulto)
  let pricesHtml = '';
  if (p.precioUnidad > 0) {
    pricesHtml += `<label><input type="radio" name="modalPrice" value="unidad" checked> Precio por Unidad: ${formatPrice(p.precioUnidad)}</label>`;
  }
  if (p.precioBulto > 0) {
    const isChecked = p.precioUnidad <= 0 ? 'checked' : '';
    pricesHtml += `<label><input type="radio" name="modalPrice" value="bulto" ${isChecked}> Precio por ${p.descBulto}: ${formatPrice(p.precioBulto)}</label>`;
  }
  document.getElementById('modalPrices').innerHTML = pricesHtml;

  // Colores
  const colorGroup = document.getElementById('colorGroup');
  if (p.colores.length > 0) {
    colorGroup.hidden = false;
    document.getElementById('modalColor').innerHTML = p.colores.map(c => `<option value="${c}">${c}</option>`).join('');
  } else {
    colorGroup.hidden = true;
  }

  // Talles
  const sizeGroup = document.getElementById('sizeGroup');
  if (p.talles.length > 0) {
    sizeGroup.hidden = false;
    document.getElementById('modalSize').innerHTML = p.talles.map(t => `<option value="${t}">${t}</option>`).join('');
  } else {
    sizeGroup.hidden = true;
  }

  productModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  productModal.hidden = true;
  currentModalProduct = null;
  document.body.style.overflow = '';
}

closeModalBtn.addEventListener('click', closeModal);
productModal.addEventListener('click', (e) => { if (e.target === productModal) closeModal(); });

document.getElementById('modalQtyPlus').addEventListener('click', () => { modalQty++; document.getElementById('modalQtyVal').textContent = modalQty; });
document.getElementById('modalQtyMinus').addEventListener('click', () => { if (modalQty > 1) { modalQty--; document.getElementById('modalQtyVal').textContent = modalQty; } });

document.getElementById('modalAddToCart').addEventListener('click', () => {
  if (!currentModalProduct) return;
  const p = currentModalProduct;
  
  const priceType = document.querySelector('input[name="modalPrice"]:checked')?.value || 'unidad';
  const price = priceType === 'unidad' ? p.precioUnidad : p.precioBulto;
  
  const color = p.colores.length > 0 ? document.getElementById('modalColor').value : null;
  const talle = p.talles.length > 0 ? document.getElementById('modalSize').value : null;

  if (price <= 0) return alert('No hay un precio configurado para esta opción.');

  addToCart(p, modalQty, { tipo: priceType, precio: price, color, talle });
  refreshCartUI();
  closeModal();
  openCart();
});

document.addEventListener('DOMContentLoaded', init);
