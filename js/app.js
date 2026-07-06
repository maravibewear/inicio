import { fetchProducts } from './api.js';

const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const productsGrid = document.getElementById('productsGrid');

// Función para actualizar el número del carrito al cargar la página
function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const carrito = JSON.parse(localStorage.getItem('maravibewear_cart')) || [];
  const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  badge.textContent = total;
}

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

    card.addEventListener('click', () => openModal(product));
    productsGrid.appendChild(card);
  });
}

// Lógica completa del Modal
function openModal(product) {
  const modal = document.getElementById('productModal');
  
  // 1. Textos e imagen principal
  document.getElementById('modalTitle').textContent = product.nombre;
  document.getElementById('modalDesc').textContent = product.descripcion || '';
  
  const modalMainImg = document.getElementById('modalMainImg');
  modalMainImg.src = product.imagenes[0] || ''; 

  // Galería de miniaturas
  const modalThumbs = document.getElementById('modalThumbs');
  modalThumbs.innerHTML = ''; 
  
  if (product.imagenes.length > 1) {
    product.imagenes.forEach((imgUrl, index) => {
      const thumb = document.createElement('img');
      thumb.src = imgUrl;
      thumb.alt = `Miniatura ${index + 1}`;
      if (index === 0) thumb.classList.add('active');
      
      thumb.addEventListener('click', () => {
        modalMainImg.src = imgUrl;
        modalThumbs.querySelectorAll('img').forEach(img => img.classList.remove('active'));
        thumb.classList.add('active');
      });
      modalThumbs.appendChild(thumb);
    });
  }

  // 2. Precios
  const modalPrices = document.getElementById('modalPrices');
  modalPrices.innerHTML = ''; 
  
  if (product.precioUnidad > 0) {
    modalPrices.innerHTML += `
      <label>
        <input type="radio" name="tipoCompra" value="unidad" checked>
        Unidad - $${product.precioUnidad}
      </label>
    `;
  }
  if (product.precioBulto > 0) {
    const desc = product.descBulto || 'Bulto';
    modalPrices.innerHTML += `
      <label>
        <input type="radio" name="tipoCompra" value="bulto">
        ${desc} - $${product.precioBulto}
      </label>
    `;
  }

  // 3 y 4. Color y Talle
  const colorGroup = document.getElementById('colorGroup');
  const colorSelect = document.getElementById('modalColor');
  colorSelect.innerHTML = ''; 
  if (product.colores && product.colores.length > 0) {
    colorGroup.hidden = false;
    product.colores.forEach(color => {
      colorSelect.innerHTML += `<option value="${color}">${color}</option>`;
    });
  } else { colorGroup.hidden = true; }

  const sizeGroup = document.getElementById('sizeGroup');
  const sizeSelect = document.getElementById('modalSize');
  sizeSelect.innerHTML = ''; 
  if (product.talles && product.talles.length > 0) {
    sizeGroup.hidden = false;
    product.talles.forEach(talle => {
      sizeSelect.innerHTML += `<option value="${talle}">${talle}</option>`;
    });
  } else { sizeGroup.hidden = true; }

  // 5. Selector de Cantidad
  let qty = 1;
  const qtyVal = document.getElementById('modalQtyVal');
  qtyVal.textContent = qty;

  document.getElementById('modalQtyMinus').onclick = () => {
    if (qty > 1) { qty--; qtyVal.textContent = qty; }
  };
  document.getElementById('modalQtyPlus').onclick = () => {
    qty++; qtyVal.textContent = qty;
  };

  // 6. LÓGICA DE AGREGAR AL CARRITO (¡NUEVO!)
  const btnAddToCart = document.getElementById('modalAddToCart');
  
  // Clonamos el botón para limpiar eventos click anteriores (evita que se agreguen duplicados por error)
  const newBtnAddToCart = btnAddToCart.cloneNode(true);
  btnAddToCart.parentNode.replaceChild(newBtnAddToCart, btnAddToCart);
  
  newBtnAddToCart.onclick = () => {
    const tipoCompra = document.querySelector('input[name="tipoCompra"]:checked').value;
    const precioSeleccionado = tipoCompra === 'unidad' ? product.precioUnidad : product.precioBulto;
    const nombreFinal = product.nombre + (tipoCompra === 'bulto' ? ` (${product.descBulto || 'Bulto'})` : '');
    const colorSeleccionado = colorGroup.hidden ? '' : colorSelect.value;
    const talleSeleccionado = sizeGroup.hidden ? '' : sizeSelect.value;
    
    // Generar ID único para que no se pise la misma prenda en distinto talle o tipo
    const idUnico = `${product.id}-${tipoCompra}-${colorSeleccionado}-${talleSeleccionado}`;

    const itemCart = {
      idUnico: idUnico,
      idProducto: product.id,
      nombre: nombreFinal,
      precio: precioSeleccionado,
      imagen: product.imagenes[0],
      color: colorSeleccionado,
      talle: talleSeleccionado,
      cantidad: qty
    };

    // Guardar en localStorage
    let carrito = JSON.parse(localStorage.getItem('maravibewear_cart')) || [];
    const index = carrito.findIndex(i => i.idUnico === itemCart.idUnico);
    
    if (index !== -1) {
      carrito[index].cantidad += qty; // Si ya existe, suma la cantidad
    } else {
      carrito.push(itemCart); // Si no existe, lo agrega
    }
    
    localStorage.setItem('maravibewear_cart', JSON.stringify(carrito));
    updateCartBadge(); // Actualiza el globito rojo

    // Feedback visual en el botón
    const textoOriginal = newBtnAddToCart.textContent;
    newBtnAddToCart.textContent = '¡Agregado!';
    newBtnAddToCart.style.backgroundColor = 'var(--color-success)'; 
    newBtnAddToCart.style.color = 'white';

    setTimeout(() => {
      newBtnAddToCart.textContent = textoOriginal;
      newBtnAddToCart.style.backgroundColor = ''; 
      newBtnAddToCart.style.color = '';
      modal.hidden = true; // Cierra el modal automáticamente después de agregar
    }, 1200);
  };

  // Mostrar y Cerrar Modal
  modal.hidden = false;
  document.getElementById('closeModal').onclick = () => { modal.hidden = true; };
}

async function init() {
  updateCartBadge(); // Lee el carrito apenas entras a la página
  
  try {
    const products = await fetchProducts();
    if (!products || products.length === 0) throw new Error("No hay productos");

    loadingState.style.display = 'none';
    productsGrid.hidden = false;
    renderProducts(products);

  } catch (error) {
    loadingState.style.display = 'none';
    errorState.hidden = false;
    console.error("Error al inicializar:", error);
  }
}

document.addEventListener('DOMContentLoaded', init);
