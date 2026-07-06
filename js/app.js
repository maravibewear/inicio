import { fetchProducts } from './api.js';

const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const productsGrid = document.getElementById('productsGrid');

// Función básica para inyectar las tarjetas en el HTML
function renderProducts(products) {
  productsGrid.innerHTML = '';
  
  products.forEach(product => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-card__image-wrap">
        <img src="${product.imagenes[0] || ''}" alt="${product.nombre}" class="product-card__image">
      </div>
      <div class="product-card__body">
        <h3 class="product-card__name">${product.nombre}</h3>
        <p class="product-card__price">$${product.precioUnidad}</p>
      </div>
    `;

    // Conectar evento para el modal
    card.addEventListener('click', () => openModal(product));
    productsGrid.appendChild(card);
  });
}

// Lógica básica del Modal
function openModal(product) {
  const modal = document.getElementById('productModal');
  document.getElementById('modalTitle').textContent = product.nombre;
  document.getElementById('modalDesc').textContent = product.descripcion;
  document.getElementById('modalMainImg').src = product.imagenes[0] || '';
  modal.hidden = false;
  
  document.getElementById('closeModal').onclick = () => {
    modal.hidden = true;
  };
}

async function init() {
  try {
    const products = await fetchProducts();
    
    if (!products || products.length === 0) throw new Error("No hay productos");

    // Éxito: Ocultar carga y mostrar la grilla
    loadingState.style.display = 'none';
    productsGrid.hidden = false;
    
    renderProducts(products);

  } catch (error) {
    // Error: Ocultar carga y mostrar botón de reintentar
    loadingState.style.display = 'none';
    errorState.hidden = false;
  }
}

// Iniciar aplicación
document.addEventListener('DOMContentLoaded', init);
