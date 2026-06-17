import axios from 'axios';

// URL del Google Apps Script
// En desarrollo (localhost o dev tunnel): usa proxy `/api` configurado en vite.config.js
// En producción (vercel): usa la URL completa del Google Apps Script
const isProduction = window.location.hostname.includes('vercel.app');
export const GAS_SCRIPT_URL = isProduction
  ? 'https://script.google.com/macros/s/AKfycbziE7-v21rMxN98s6XXE049cRMBWHwMK-yUffyCIV9t3uCcMlkylLp5XeaHq_EkR8wj/exec'
  : '/api';

// Alias interno
const SCRIPT_URL = GAS_SCRIPT_URL;

// ═══════════════════════════════════════════════════════════════════════
// CACHÉ EN MEMORIA — TTL 2 minutos
// Parchea axios.get y axios.post globalmente para que todos los
// componentes se beneficien sin cambiar ningún archivo.
// GET al GAS → sirve desde caché si tiene < 2 min.
// POST al GAS exitoso → limpia el caché completo.
// ═══════════════════════════════════════════════════════════════════════
const _cache = new Map();
const CACHE_TTL = 2 * 60 * 1000;

const _origGet  = axios.get.bind(axios);
const _origPost = axios.post.bind(axios);

axios.get = async (url, config) => {
  if (typeof url === 'string' && (url.includes('script.google.com') || url === '/api')) {
    const hit = _cache.get(url);
    if (hit && Date.now() - hit.ts < CACHE_TTL) return { data: hit.data };
    const res = await _origGet(url, config);
    _cache.set(url, { data: res.data, ts: Date.now() });
    return res;
  }
  return _origGet(url, config);
};

axios.post = async (url, data, config) => {
  const res = await _origPost(url, data, config);
  // Cualquier POST exitoso al GAS invalida todo el caché
  if (res?.data?.success) _cache.clear();
  return res;
};

export const invalidarCache = () => _cache.clear();

//  ═══════════════════════════════════════════════════════════════════════
//  CONEXIÓN REAL CON EL DASHBOARD
//  ═══════════════════════════════════════════════════════════════════════
export const obtenerResumenFinanciero = async () => {
  try {
    const { data } = await axios.get(`${SCRIPT_URL}?action=getDashboardData`);

    const contratosValidos = (data.contratos || []).filter(
      (contrato) =>
        contrato.cliente &&
        typeof contrato.cliente === 'string' &&
        contrato.cliente.trim() !== ''
    );

    return { ...data, contratos: contratosValidos };
  } catch (error) {
    console.error("Error al obtener el Dashboard:", error);
    return { canonEsperado: 0, recaudado: 0, moraAplicada: 0, saldoPendiente: 0, contratos: [] };
  }
};

// ═══════════════════════════════════════════════════════════════════════
// CONEXIÓN REAL CON GOOGLE SHEETS
// ═══════════════════════════════════════════════════════════════════════
export const obtenerInquilinos = async () => {
  try {
    const { data } = await axios.get(`${SCRIPT_URL}?action=getInquilinos`);

    return (Array.isArray(data) ? data : []).filter(
      (cliente) =>
        cliente.nombre &&
        typeof cliente.nombre === 'string' &&
        cliente.nombre.trim() !== ''
    );
  } catch (error) {
    console.error("Error al obtener los datos de la base de datos:", error);
    return [];
  }
};

// ====================================================================
// ENVIAR DATOS A GOOGLE SHEETS (POST)
// ====================================================================
export const registrarNuevoPago = async (datosPago) => {
  try {
    // Para hacer POST a Google Apps Script evitando problemas de CORS,
    // a menudo es más seguro enviar el cuerpo como una cadena de texto (JSON.stringify)
    // indicando que es texto plano. Apps Script luego lo parsea.
    const response = await axios.post(SCRIPT_URL, JSON.stringify({
      action: 'registrarPago',
      ...datosPago
    }), {
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      }
    });

    return response.data;
  } catch (error) {
    console.error("Error al registrar el pago:", error);
    return { success: false, error: "Fallo de conexión." };
  }
};