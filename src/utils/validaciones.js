// Países con código telefónico y longitud máxima de dígitos
export const PAISES = [
  { codigo: '+58', bandera: '🇻🇪', nombre: 'Venezuela',   maxDigitos: 10 },
  { codigo: '+1',  bandera: '🇺🇸', nombre: 'EE.UU.',      maxDigitos: 10 },
  { codigo: '+57', bandera: '🇨🇴', nombre: 'Colombia',    maxDigitos: 10 },
  { codigo: '+54', bandera: '🇦🇷', nombre: 'Argentina',   maxDigitos: 10 },
  { codigo: '+56', bandera: '🇨🇱', nombre: 'Chile',       maxDigitos: 9  },
  { codigo: '+52', bandera: '🇲🇽', nombre: 'México',      maxDigitos: 10 },
  { codigo: '+34', bandera: '🇪🇸', nombre: 'España',      maxDigitos: 9  },
  { codigo: '+51', bandera: '🇵🇪', nombre: 'Perú',        maxDigitos: 9  },
  { codigo: '+593',bandera: '🇪🇨', nombre: 'Ecuador',     maxDigitos: 9  },
  { codigo: '+507',bandera: '🇵🇦', nombre: 'Panamá',      maxDigitos: 8  },
];

// Dominios de correo permitidos (TLDs)
export const TLDS_VALIDOS = [
  've','co','ar','cl','mx','es','us','net','org','edu','gov','gob','mil',
  'com','tech','io','store','shop','me','agency','live','online'
];

// Máscara para nombre: solo letras, espacios, apóstrofes, acentos
export const aplicarMascaraNombre = (valor) => valor.replace(/[^a-zA-ZÀ-ÿñÑ\s']/g, '');

// Máscara para cédula: V/E/P/A/O + "-" + 8 dígitos
export const aplicarMascaraCedula = (valor) => {
  const limpio = valor.toUpperCase().replace(/[^VEPAO0-9]/g, '');
  if (!limpio) return '';
  if (!'VEPAO'.includes(limpio[0])) return '';
  const letra = limpio[0];
  const numeros = limpio.substring(1).replace(/\D/g, '').substring(0, 8);
  return numeros.length > 0 ? `${letra}-${numeros}` : letra;
};

// Máscara para RIF: V/E/P/J/G/C + "-" + 8 dígitos + "-" + 1 dígito (1-9)
export const aplicarMascaraRif = (valor) => {
  const limpio = valor.toUpperCase().replace(/[^VEPJGC0-9]/g, '');
  if (!limpio) return '';
  if (!'VEPJGC'.includes(limpio[0])) return '';
  const letra = limpio[0];
  const numeros = limpio.substring(1).replace(/\D/g, '');
  const parte1 = numeros.substring(0, 8);
  const parte2 = numeros.substring(8, 9);
  let resultado = letra;
  if (parte1.length > 0) resultado += '-' + parte1;
  if (parte2.length > 0) resultado += '-' + parte2;
  return resultado;
};

// Máscara para teléfono: NNN-NNNNNNN (variable según país)
export const aplicarMascaraTelefono = (valor, maxDigitos) => {
  const digitos = valor.replace(/\D/g, '').substring(0, maxDigitos);
  if (digitos.length <= 3) return digitos;
  return `${digitos.substring(0, 3)}-${digitos.substring(3)}`;
};

// Valida correo: usuario@dominio.tld donde tld esté en TLDS_VALIDOS
export const validarCorreo = (email) => {
  if (!email) return true; // Opcional
  const match = email.toLowerCase().match(/^[^\s@]+@[^\s@]+\.([a-z]+)$/i);
  if (!match) return false;
  return TLDS_VALIDOS.includes(match[1]);
};

// Regex de validación final al submit (acepta 5-9 dígitos, ignora puntos)
export const REGEX_CEDULA = /^[VEPAO]-\d{5,9}$/;
export const REGEX_RIF = /^[VEPJGC]-\d{5,9}-[1-9]$/;

// Normaliza cédula/RIF removiendo puntos y espacios (acepta "V-7.147.198" → "V-7147198")
export const normalizarCedulaRif = (valor) => {
  if (!valor) return '';
  return String(valor).replace(/[.\s]/g, '');
};

// Parsea "DD/MM/YYYY" → Date (o null si inválido)
export const parseFechaStr = (str) => {
  if (!str || str.length < 10) return null;
  const partes = String(str).split('/');
  if (partes.length !== 3) return null;
  const d = parseInt(partes[0], 10), m = parseInt(partes[1], 10), y = parseInt(partes[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y) || y < 1900) return null;
  return new Date(y, m - 1, d);
};

/**
 * Calcula el texto del día de pago a partir de la fecha de inicio del contrato.
 *
 * Regla: ventana de 5 días (diaInicial → diaInicial+4). Si la ventana cruza el
 * día 28, los días que exceden se mueven al mes siguiente, SIEMPRE iniciando
 * desde el día 1. Razón: garantizar que el cliente siempre tenga un día válido
 * para pagar (febrero solo tiene 28 días).
 *
 * Casos:
 *  A) diaInicial > 28 (29, 30, 31): toda la ventana → "Del 1 al 5 de cada mes"
 *  B) diaFinal > 28 (cruza el corte): wrap parcial → "Del X al Y del mes siguiente"
 *  C) Normal: "Del X al Y de cada mes"
 *
 * @param {Date|null} fechaInicio
 * @returns {{ texto: string, diaAplicaMora: number|string, mensajeMora: string }}
 */
export const calcularDiaPagoTexto = (fechaInicio) => {
  if (!fechaInicio) return { texto: '', diaAplicaMora: '', mensajeMora: '' };

  const diaInicial = fechaInicio.getDate();
  const diaFinal = diaInicial + 4;

  // Caso A: día inicial > 28 → toda la ventana al mes siguiente, siempre desde día 1
  if (diaInicial > 28) {
    return {
      texto: 'Del 1 al 5 de cada mes',
      diaAplicaMora: 6,
      mensajeMora: 'A partir del día 6 de cada mes se aplica mora de $3'
    };
  }

  // Caso B: día final > 28 → wrap parcial al mes siguiente
  if (diaFinal > 28) {
    const finalWrap = diaFinal - 28; // 29→1, 30→2, 31→3, 32→4
    return {
      texto: `Del ${diaInicial} al ${finalWrap} del mes siguiente`,
      diaAplicaMora: finalWrap + 1,
      mensajeMora: `A partir del día ${finalWrap + 1} del mes siguiente se aplica mora de $3`
    };
  }

  // Caso normal: toda la ventana dentro del 1-28
  return {
    texto: `Del ${diaInicial} al ${diaFinal} de cada mes`,
    diaAplicaMora: diaInicial + 5,
    mensajeMora: `A partir del día ${diaInicial + 5} de cada mes se aplica mora de $3`
  };
};

// Separa un teléfono tipo "+58 424-4325183" en { paisCodigo, numero }
// Si no encuentra un código conocido, retorna paisCodigo='+58' (default) y el teléfono completo como número
export const separarTelefono = (telefonoCompleto) => {
  if (!telefonoCompleto) return { paisCodigo: '+58', numero: '' };
  const str = String(telefonoCompleto).trim();
  // Buscar código de país que haga match al inicio
  const paisMatch = PAISES.find(p => str.startsWith(p.codigo));
  if (paisMatch) {
    const numeroRaw = str.substring(paisMatch.codigo.length).trim();
    return {
      paisCodigo: paisMatch.codigo,
      numero: aplicarMascaraTelefono(numeroRaw, paisMatch.maxDigitos)
    };
  }
  // Sin código país: limpiar y aplicar máscara con Venezuela como default
  return {
    paisCodigo: '+58',
    numero: aplicarMascaraTelefono(str, 10)
  };
};
