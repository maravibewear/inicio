/**
 * api.js — Comunicación con Google Apps Script (Google Sheets)
 *
 * CONFIGURACIÓN:
 * Reemplazá API_URL con la URL de tu Web App desplegada en Apps Script.
 * Ejemplo: https://script.google.com/macros/s/AKfycb.../exec
 */

/** @type {string} URL del endpoint JSON de Google Apps Script */
export const API_URL = 'https://script.google.com/macros/s/AKfycbyMIxQSkPgixtqnaeezNo-99H-K_aSdAmbCMCpj1Ng7nULiJX0cgZvBvsPE8Am7czLI/exec';

/** Tiempo máximo de espera para la petición (ms) */
const FETCH_TIMEOUT = 15000;

/**
 * Convierte URLs de Google Drive al formato directo para <img>.
 * Soporta:
 *  - https://drive.google.com/file/d/ID/view
 *  - https://drive.google.com/open?id=ID
 *  - https://lh3.googleusercontent.com/... (ya directas)
 *
 * @param {string} url
 * @returns {string}
 */
export function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim();
  if (!trimmed) return '';

  // Ya es una URL directa de imagen
  if (/^https?:\/\/lh3\.googleusercontent\.com/i.test(trimmed)) {
    return trimmed;
  }

  // Formato: /file/d/ID/
  const fileMatch = trimmed.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) {
    return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
  }

  // Formato: ?id=ID o &id=ID
  const idMatch = trimmed.match(/[?&]id=([^&]+)/);
  if (idMatch) {
    return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
  }

  return trimmed;
}

/**
 * Normaliza un producto crudo del JSON al formato interno de la app.
 *
 * Columnas esperadas en Google Sheets (primera fila = encabezados):
 * id | nombre | precio | descripcion | imagen | categoria | oferta | precio_anterior | stock
 *
 * @param {object} raw
 * @returns {object|null}
 */
export function normalizeProduct(raw) {
  if (!raw) return null;

  const id = String(raw.id ?? raw.ID ?? '').trim();
  const nombre = String(raw.nombre ?? raw.Nombre ?? raw.name ?? '').trim();

  if (!id || !nombre) return null;

  const precio = parseFloat(raw.precio ?? raw.Precio ?? raw.price ?? 0);
  const precioAnterior = parseFloat(raw.precio_anterior ?? raw['precio anterior'] ?? raw.precioAnterior ?? 0);
  const stock = String(raw.stock ?? raw.Stock ?? 'si').toLowerCase();
  const oferta = String(raw.oferta ?? raw.Oferta ?? '').toLowerCase();

  return {
    id,
    nombre,
    precio: isNaN(precio) ? 0 : precio,
    descripcion: String(raw.descripcion ?? raw.Descripcion ?? raw.description ?? '').trim(),
    imagen: normalizeImageUrl(String(raw.imagen ?? raw.Imagen ?? raw.image ?? '').trim()),
    categoria: String(raw.categoria ?? raw.Categoria ?? raw.category ?? 'General').trim(),
    oferta: oferta === 'si' || oferta === 'true' || oferta === '1',
    precioAnterior: isNaN(precioAnterior) || precioAnterior <= 0 ? null : precioAnterior,
    enStock: stock !== 'no' && stock !== 'false' && stock !== '0',
  };
}

/**
 * Obtiene la lista de productos desde el endpoint JSON.
 *
 * @returns {Promise<object[]>}
 */
export async function fetchProducts() {
  if (!API_URL || API_URL === 'TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI' || !/^https?:\/\//i.test(API_URL)) {
    throw new Error(
      'Configurá API_URL en js/api.js con la URL completa de tu Google Apps Script (debe empezar con https://).'
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('La respuesta del servidor no es un array de productos.');
    }

    return data
      .map(normalizeProduct)
      .filter(Boolean);
  } finally {
    clearTimeout(timeoutId);
  }
}
