/**
 * Google Apps Script — Pegar en script.google.com
 *
 * 1. Creá una Google Sheet con la hoja "Productos" y estas columnas en la fila 1:
 *    id | nombre | precio | descripcion | imagen | categoria | oferta | precio_anterior | stock
 *
 * 2. Extensiones → Apps Script → pegá este código → Guardar.
 * 3. Implementar → Nueva implementación → Aplicación web.
 *    - Ejecutar como: Yo
 *    - Quién tiene acceso: Cualquier persona
 * 4. Copiá la URL generada y pegala en js/api.js (API_URL).
 */

function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Productos');

  if (!sheet) {
    return jsonResponse({ error: 'No se encontró la hoja "Productos"' });
  }

  const data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    return jsonResponse([]);
  }

  const headers = data.shift().map(normalizeHeader);
  const products = [];

  for (const row of data) {
    if (!row[0]) continue;

    const product = {};
    headers.forEach((header, i) => {
      product[header] = row[i];
    });
    products.push(product);
  }

  return jsonResponse(products);
}

/**
 * Normaliza encabezados: minúsculas, sin espacios extra.
 */
function normalizeHeader(header) {
  return String(header).trim().toLowerCase().replace(/\s+/g, '_');
}

/**
 * Devuelve JSON con headers CORS para fetch desde GitHub Pages.
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
