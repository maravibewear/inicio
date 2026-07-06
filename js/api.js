/**
 * api.js — Comunicación con Google Apps Script (Google Sheets)
 */

/** @type {string} URL del endpoint JSON de Google Apps Script */
export const API_URL = 'https://script.google.com/macros/s/AKfycbyMIxQSkPgixtqnaeezNo-99H-K_aSdAmbCMCpj1Ng7nULiJX0cgZvBvsPE8Am7czLI/exec'; // <-- PEGA TU NUEVA URL ACA

const FETCH_TIMEOUT = 15000;

export function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\/lh3\.googleusercontent\.com/i.test(trimmed)) return trimmed;
  const fileMatch = trimmed.match(/\/file\/d\/([^\/]+)/);
  if (fileMatch) return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w1000`;
  const idMatch = trimmed.match(/[\?&]id=([^&]+)/);
  if (idMatch) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000`;
  return trimmed;
}

export function normalizeProduct(raw) {
  if (!raw) return null;
  const id = String(raw.id ?? raw.ID ?? '').trim();
  const nombre = String(raw.nombre ?? raw.Nombre ?? raw.name ?? '').trim();
  if (!id || !nombre) return null;

  const stock = String(raw.stock ?? raw.Stock ?? 'si').toLowerCase();
  
  // Múltiples imágenes y atributos
  const imgString = String(raw.imagen ?? raw.Imagen ?? '').trim();
  const imagenes = imgString.split(',').map(u => normalizeImageUrl(u.trim())).filter(Boolean);
  
  const colorString = String(raw.color ?? raw.Color ?? '').trim();
  const tallesString = String(raw.talles ?? raw.Talles ?? '').trim();

  return {
    id,
    nombre,
    descripcion: String(raw.descripcion ?? raw.Descripcion ?? '').trim(),
    imagenes: imagenes.length > 0 ? imagenes : [''],
    categoria: String(raw.categoria ?? raw.Categoria ?? 'General').trim(),
    enStock: stock !== 'no' && stock !== 'false' && stock !== '0',
    colores: colorString ? colorString.split(',').map(c => c.trim()) : [],
    talles: tallesString ? tallesString.split(',').map(t => t.trim()) : [],
    precioUnidad: parseFloat(raw.precio_unidad ?? raw.preciounidad ?? 0) || 0,
    precioBulto: parseFloat(raw.precio_bulto ?? raw.preciobulto ?? 0) || 0,
    descBulto: String(raw.desc_bulto ?? raw.descbulto ?? 'bulto').trim(),
  };
}

export async function fetchProducts() {
  if (!API_URL || !/^https?:\/\//i.test(API_URL)) throw new Error('Configurá API_URL.');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const response = await fetch(API_URL, { method: 'GET', signal: controller.signal });
    if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Formato inválido.');
    return data.map(normalizeProduct).filter(Boolean);
  } finally {
    clearTimeout(timeoutId);
  }
}
