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

//  ═══════════════════════════════════════════════════════════════════════
//  CONEXIÓN REAL CON EL DASHBOARD
//  ═══════════════════════════════════════════════════════════════════════
export const obtenerResumenFinanciero = async () => {
  try {
    const response = await axios.get(`${SCRIPT_URL}?action=getDashboardData`);

    // Filtro de seguridad: descartar contratos vacíos o con cliente sin nombre
    const contratosValidos = (response.data.contratos || []).filter(
      (contrato) =>
        contrato.cliente &&
        typeof contrato.cliente === 'string' &&
        contrato.cliente.trim() !== ''
    );

    return {
      ...response.data,
      contratos: contratosValidos
    };
  } catch (error) {
    console.error("Error al obtener el Dashboard:", error);
    // Si falla, devolvemos valores en cero para no romper la pantalla
    return {
      canonEsperado: 0, recaudado: 0, moraAplicada: 0, saldoPendiente: 0, contratos: []
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════
// CONEXIÓN REAL CON GOOGLE SHEETS
// ═══════════════════════════════════════════════════════════════════════
export const obtenerInquilinos = async () => {
  try {
    // Hacemos la petición GET a tu Google Apps Script pidiendo la acción 'getInquilinos'
    const response = await axios.get(`${SCRIPT_URL}?action=getInquilinos`);

    // Filtro de seguridad: descartar registros vacíos o con espacios en blanco
    const inquilinosValidos = response.data.filter(
      (cliente) =>
        cliente.nombre &&
        typeof cliente.nombre === 'string' &&
        cliente.nombre.trim() !== ''
    );

    return inquilinosValidos;
  } catch (error) {
    console.error("Error al obtener los datos de la base de datos:", error);
    // Retornamos un arreglo vacío para que la aplicación no se rompa si hay un fallo
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