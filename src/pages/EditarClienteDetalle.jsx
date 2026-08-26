import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { GAS_SCRIPT_URL } from '../services/api';
import { LISTA_INMUEBLES as INMUEBLES } from '../config/inmuebles';
import {
  PAISES,
  aplicarMascaraNombre,
  aplicarMascaraCedula,
  aplicarMascaraRif,
  aplicarMascaraTelefono,
  validarCorreo,
  separarTelefono,
  REGEX_CEDULA,
  REGEX_RIF,
  normalizarCedulaRif,
  parseFechaStr,
  calcularDiaPagoTexto
} from '../utils/validaciones';

// ── Clases base ───────────────────────────────────────────────────────────────

const INPUT_BASE   = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper transition-colors bg-white';
const INPUT_RO     = 'w-full px-3 py-2.5 border border-gray-100 rounded-lg text-sm text-gray-500 bg-gray-50 cursor-not-allowed';
const SELECT_BASE  = `${INPUT_BASE}`;

// ── Componentes UI ────────────────────────────────────────────────────────────

function SeccionCard({ icon, titulo, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-terra-cream to-terra-cream-mid px-5 py-3 border-b border-gray-100 flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <h3 className="text-xs font-bold text-terra-copper-dark uppercase tracking-wider">{titulo}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function CampoForm({ label, required, sensible, hint, children }) {
  return (
    <div>
      <label className="block text-[10px] text-terra-copper/70 font-bold uppercase tracking-wider mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
        {sensible && <span className="text-orange-400 ml-1">🔒</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function EditarClienteDetalle() {
  const { inmueble, nombre } = useParams();
  const navigate = useNavigate();

  const [tasas, setTasas] = useState({ usd: 36.50, eur: 39.10 });
  const [formData, setFormData] = useState({
    numeroCliente: '',
    inmueble: '',
    ubicacion: '',
    unidad: '',
    nombre: '',
    cedula: '',
    rif: '',
    paisCodigo: '+58',
    telefono: '',
    correo: '',
    canonUSD: '',
    monedaPrincipal: 'USD',
    diaPago: '',
    duracionMeses: '',
    frecuenciaPago: 'Mensual',
    metodoPago: '',
    tipoContingencia: 'Mensual',
    montoContingencia: 5,
    depositoUSD: '',
    depositoEUR: '',
    fechaInicio: '',
    fechaVencimiento: '',
    statusContrato: 'Vigente',
    estacionamiento: 'No',
    observaciones: '',
    tipoRelacion: '',
    fechaInicioRelacion: '',
    duracionRelacion: ''
  });

  const [calculados, setCalculados] = useState({ canonEUR: '', mensajeMora: '' });
  const [cargando, setCargando]   = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState('');

  // ── Utilidades fecha ────────────────────────────────────────────────────────

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    try {
      if (typeof fecha === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(fecha.trim())) return fecha.trim();
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return '';
      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    } catch { return typeof fecha === 'string' ? fecha : ''; }
  };

  const calcularDuracionRelacion = (fechaStr) => {
    if (!fechaStr) return '';
    const partes = fechaStr.trim().split('/');
    if (partes.length !== 3) return '';
    const [dia, mes, anio] = partes.map(Number);
    if (isNaN(dia) || isNaN(mes) || isNaN(anio) || anio < 1900) return '';
    const inicio = new Date(anio, mes - 1, dia);
    const hoy    = new Date();
    const meses  = (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth());
    return String(Math.max(0, meses));
  };

  const aplicarMascaraFecha = (valorNuevo, valorAnterior) => {
    const digitos = valorNuevo.replace(/\D/g, '').substring(0, 8);
    const borrando = valorNuevo.length < (valorAnterior || '').length;
    if (!digitos) return '';
    let dd = digitos.substring(0, Math.min(2, digitos.length));
    let mm = digitos.length > 2 ? digitos.substring(2, Math.min(4, digitos.length)) : '';
    const yyyy = digitos.length > 4 ? digitos.substring(4) : '';
    if (dd.length === 2) { const n = parseInt(dd,10); if (n===0) dd='01'; else if (n>31) dd='31'; }
    if (mm.length === 2) { const n = parseInt(mm,10); if (n===0) mm='01'; else if (n>12) mm='12'; }
    let resultado = dd;
    if (mm.length > 0 || (dd.length === 2 && !borrando)) resultado += '/' + mm;
    if (yyyy.length > 0 || (mm.length === 2 && !borrando)) resultado += '/' + yyyy;
    return resultado;
  };

  // ── Carga de datos ──────────────────────────────────────────────────────────

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      setError('');
      try {
        const [resTasas, resCliente] = await Promise.all([
          axios.get(`${GAS_SCRIPT_URL}?action=getTasasActuales`),
          axios.get(`${GAS_SCRIPT_URL}?action=getClienteDetalles&nombre=${encodeURIComponent(nombre)}&inmueble=${encodeURIComponent(inmueble)}`),
        ]);

        if (resTasas.data) {
          setTasas({
            usd: parseFloat(resTasas.data.usd) || 36.50,
            eur: parseFloat(resTasas.data.eur) || 39.10,
          });
        }

        const d = resCliente.data;
        if (!d || d.error) {
          setError('No se encontró el cliente en el sistema');
          return;
        }

        const fechaRelacion = formatearFecha(d.fechaInicioRelacion);
        setFormData({
          numeroCliente:      d.id,
          inmueble:           d.inmueble,
          ubicacion:          d.ubicacion,
          unidad:             d.unidad,
          nombre:             d.nombre,
          cedula:             d.cedula,
          rif:                d.rif,
          paisCodigo:         separarTelefono(d.telefono).paisCodigo,
          telefono:           separarTelefono(d.telefono).numero,
          correo:             d.correo,
          canonUSD:           d.canonBaseUSD,
          monedaPrincipal:    d.monedaPrincipal || 'USD',
          diaPago:            d.diaPago,
          duracionMeses:      '',
          frecuenciaPago:     d.frecuenciaPago || 'Mensual',
          metodoPago:         d.metodoPago,
          tipoContingencia:   d.tipoContingencia || 'Mensual',
          montoContingencia:  d.tipoContingencia === 'Anual EUR'
            ? (d.planContingenciaEUR || 72)
            : (d.planContingenciaUSD || 5),
          depositoUSD:        d.depositoTotalUSD,
          depositoEUR:        d.depositoTotalEUR,
          fechaInicio:        formatearFecha(d.fechaInicioContrato),
          fechaVencimiento:   formatearFecha(d.fechaVencimiento),
          statusContrato:     d.statusContrato,
          estacionamiento:    (d.estacionamiento?.trim() || 'No').trim(),
          observaciones:      d.observaciones || '',
          tipoRelacion:       d.tipoRelacion || '',
          fechaInicioRelacion: fechaRelacion,
          duracionRelacion:   calcularDuracionRelacion(fechaRelacion),
        });
      } catch (err) {
        setError('Error de conexión al cargar los datos');
      } finally {
        setCargando(false);
      }
    };
    if (nombre && inmueble) cargar();
  }, [nombre, inmueble]);

  // ── Efectos calculados ──────────────────────────────────────────────────────

  useEffect(() => {
    const fechaInicio = parseFechaStr(formData.fechaInicio);
    if (!fechaInicio) return;
    const resultado = calcularDiaPagoTexto(fechaInicio);
    setFormData(prev => ({ ...prev, diaPago: resultado.texto }));
    setCalculados(prev => ({ ...prev, mensajeMora: resultado.mensajeMora }));
  }, [formData.fechaInicio]);

  useEffect(() => {
    const usd = parseFloat(formData.canonUSD) || 0;
    if (usd <= 0) { setCalculados(prev => ({ ...prev, canonEUR: '' })); return; }
    const vef  = usd * tasas.usd;
    const eur  = vef / tasas.eur;
    setCalculados(prev => ({ ...prev, canonEUR: (Math.ceil(eur / 5) * 5).toFixed(2) }));
  }, [formData.canonUSD, tasas]);

  useEffect(() => {
    if (!formData.fechaInicioRelacion) return;
    setFormData(prev => ({
      ...prev,
      duracionRelacion: calcularDuracionRelacion(formData.fechaInicioRelacion),
    }));
  }, [formData.fechaInicioRelacion]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNombreChange    = (e) => setFormData(prev => ({ ...prev, nombre:   aplicarMascaraNombre(e.target.value) }));
  const handleCedulaChange    = (e) => setFormData(prev => ({ ...prev, cedula:   aplicarMascaraCedula(e.target.value) }));
  const handleRifChange       = (e) => setFormData(prev => ({ ...prev, rif:      aplicarMascaraRif(e.target.value) }));
  const handleTelefonoChange  = (e) => {
    const pais = PAISES.find(p => p.codigo === formData.paisCodigo) || PAISES[0];
    setFormData(prev => ({ ...prev, telefono: aplicarMascaraTelefono(e.target.value, pais.maxDigitos) }));
  };
  const handleFechaChange = (name, e) => {
    setFormData(prev => ({ ...prev, [name]: aplicarMascaraFecha(e.target.value, prev[name]) }));
  };

  const handleContingenciaChange = (tipo) => {
    const defaults = { Mensual: 5, 'Anual USD': 60, 'Anual EUR': 72 };
    const actual   = Number(formData.montoContingencia);
    const eraDefault = Object.values(defaults).includes(actual);
    setFormData(prev => ({
      ...prev,
      tipoContingencia: tipo,
      montoContingencia: eraDefault ? (defaults[tipo] || 5) : prev.montoContingencia,
    }));
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cedulaNorm = normalizarCedulaRif(formData.cedula);
    const rifNorm    = normalizarCedulaRif(formData.rif);

    if (cedulaNorm && !REGEX_CEDULA.test(cedulaNorm)) {
      setError('Cédula inválida. Formato esperado: V-XXXXXXXX (5-9 dígitos)');
      window.scrollTo(0, 0);
      return;
    }
    if (rifNorm && !REGEX_RIF.test(rifNorm)) {
      setError('RIF inválido. Formato esperado: V-XXXXXXXX-X');
      window.scrollTo(0, 0);
      return;
    }
    if (formData.correo && !validarCorreo(formData.correo)) {
      setError('Correo inválido o dominio no permitido');
      window.scrollTo(0, 0);
      return;
    }

    setGuardando(true);
    try {
      const res = await axios.post(GAS_SCRIPT_URL, JSON.stringify({
        action:            'procesarEditarCliente',
        numeroCliente:     formData.numeroCliente,
        inmueble:          formData.inmueble,
        ubicacion:         formData.ubicacion,
        unidad:            formData.unidad,
        nombre:            formData.nombre,
        cedula:            formData.cedula,
        rif:               formData.rif,
        telefono:          formData.telefono ? `${formData.paisCodigo} ${formData.telefono}` : '',
        correo:            formData.correo,
        canonUSD:          parseFloat(formData.canonUSD) || 0,
        canonEUR:          parseFloat(calculados.canonEUR) || 0,
        monedaPrincipal:   formData.monedaPrincipal,
        diaPago:           formData.diaPago,
        duracionMeses:     formData.duracionMeses,
        frecuenciaPago:    formData.frecuenciaPago,
        metodoPago:        formData.metodoPago,
        tipoContingencia:  formData.tipoContingencia,
        montoContingencia: formData.montoContingencia,
        depositoUSD:       parseFloat(formData.depositoUSD) || 0,
        depositoEUR:       parseFloat(formData.depositoEUR) || 0,
        fechaInicio:       formData.fechaInicio,
        fechaVencimiento:  formData.fechaVencimiento,
        statusContrato:    formData.statusContrato,
        estacionamiento:   formData.estacionamiento,
        observaciones:     formData.observaciones,
        tipoRelacion:      formData.tipoRelacion,
        fechaInicioRelacion: formData.fechaInicioRelacion,
        duracionRelacion:  formData.duracionRelacion,
      }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' } });

      if (res.data.success) {
        toast.success('✅ Cliente actualizado correctamente');
        setTimeout(() => {
          navigate(
            `/inquilinos/${encodeURIComponent(formData.inmueble)}/${encodeURIComponent(formData.nombre)}`,
            { replace: true }
          );
        }, 800);
      } else {
        setError(res.data.message || 'Error al actualizar');
      }
    } catch (err) {
      setError('Error de conexión: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  // ── Render: cargando ────────────────────────────────────────────────────────

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-24">
        <div className="w-12 h-12 border-4 border-terra-copper border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-500 animate-pulse">Cargando datos del cliente...</p>
      </div>
    );
  }

  if (error && !formData.nombre) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-24 text-center px-6">
        <p className="text-5xl mb-4">⚠️</p>
        <p className="text-gray-700 font-semibold text-lg">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-5 px-5 py-2 bg-gradient-to-r from-terra-copper to-terra-copper-dark text-white font-bold rounded-lg shadow-sm transition-all"
        >
          ← Volver
        </button>
      </div>
    );
  }

  // ── Render: formulario ──────────────────────────────────────────────────────

  const paisActual = PAISES.find(p => p.codigo === formData.paisCodigo) || PAISES[0];

  return (
    <div className="content-enter max-w-4xl mx-auto pb-16 space-y-5">

      {/* Breadcrumb */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-terra-copper transition-colors font-semibold uppercase tracking-wider group"
      >
        <span className="transition-transform group-hover:-translate-x-0.5">←</span> Volver
      </button>

      {/* Header gradiente */}
      <div className="bg-gradient-to-r from-terra-copper to-terra-navy rounded-2xl shadow-lg overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-terra-gold rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>
        <div className="relative p-6">
          <p className="text-[10px] text-terra-gold-light/80 font-bold uppercase tracking-[0.2em] mb-1">
            Editar Expediente
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{nombre}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-xs text-white/80 bg-white/10 px-3 py-1 rounded-full">{inmueble}</span>
            {formData.unidad && (
              <span className="text-xs text-white/70 bg-white/10 px-3 py-1 rounded-full">
                {formData.ubicacion} · {formData.unidad}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-800 font-semibold">❌ {error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Datos Personales ── */}
        <SeccionCard icon="👤" titulo="Datos Personales">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoForm label="Nombre" required hint="Solo letras">
              <input className={INPUT_BASE} type="text" name="nombre" value={formData.nombre} onChange={handleNombreChange} required />
            </CampoForm>
            <CampoForm label="Cédula" required hint="V/E/P/A/O + 5-9 dígitos">
              <input className={INPUT_BASE} type="text" name="cedula" value={formData.cedula} onChange={handleCedulaChange} maxLength={10} required />
            </CampoForm>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoForm label="Teléfono" hint={`${paisActual.nombre}: ${paisActual.maxDigitos} dígitos`}>
              <div className="flex gap-2">
                <select
                  name="paisCodigo"
                  value={formData.paisCodigo}
                  onChange={handleChange}
                  className={`${SELECT_BASE} min-w-[100px] flex-shrink-0`}
                >
                  {PAISES.map(p => (
                    <option key={p.codigo} value={p.codigo}>{p.bandera} {p.codigo}</option>
                  ))}
                </select>
                <input className={`${INPUT_BASE} flex-1`} type="text" name="telefono" placeholder="424-4325183" value={formData.telefono} onChange={handleTelefonoChange} />
              </div>
            </CampoForm>
            <CampoForm label="Correo" hint=".com .ve .co .net .org etc.">
              <input className={INPUT_BASE} type="email" name="correo" value={formData.correo} onChange={handleChange} />
            </CampoForm>
          </div>
          <CampoForm label="RIF" hint="V/E/P/J/G/C + 8 dígitos + verificador">
            <input className={INPUT_BASE} type="text" name="rif" placeholder="J-12345678-3" value={formData.rif} onChange={handleRifChange} maxLength={12} />
          </CampoForm>
        </SeccionCard>

        {/* ── Ubicación ── */}
        <SeccionCard icon="🏢" titulo="Ubicación">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoForm label="Inmueble" required>
              <select className={SELECT_BASE} name="inmueble" value={formData.inmueble} onChange={handleChange} required>
                <option value="">-- Selecciona --</option>
                {INMUEBLES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </CampoForm>
            <CampoForm label="Ubicación" required>
              <input className={INPUT_BASE} type="text" name="ubicacion" value={formData.ubicacion} onChange={handleChange} placeholder="Ej: Piso 1, PB" required />
            </CampoForm>
          </div>
          <CampoForm label="Unidad" required>
            <input className={INPUT_BASE} type="text" name="unidad" value={formData.unidad} onChange={handleChange} placeholder="Ej: 1-A, Local 3" required />
          </CampoForm>
        </SeccionCard>

        {/* ── Datos Financieros ── */}
        <SeccionCard icon="💰" titulo="Datos Financieros">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoForm label="Canon Base USD" required sensible>
              <input className={INPUT_BASE} type="number" name="canonUSD" step="0.01" min="0.01" value={formData.canonUSD} onChange={handleChange} required />
            </CampoForm>
            <CampoForm label="Canon Base EUR" hint="⚡ Calculado automáticamente">
              <input className={INPUT_RO} type="number" value={calculados.canonEUR} readOnly />
            </CampoForm>
          </div>
          <CampoForm label="Moneda Principal" required>
            <select className={SELECT_BASE} name="monedaPrincipal" value={formData.monedaPrincipal} onChange={handleChange} required>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </CampoForm>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoForm label="Depósito Total USD" required sensible>
              <input className={INPUT_BASE} type="number" name="depositoUSD" step="0.01" min="0" value={formData.depositoUSD} onChange={handleChange} required />
            </CampoForm>
            <CampoForm label="Depósito Total EUR" hint="⚡ Dejar en 0 para auto-calcular">
              <input className={INPUT_BASE} type="number" name="depositoEUR" step="0.01" min="0" value={formData.depositoEUR} onChange={handleChange} />
            </CampoForm>
          </div>
        </SeccionCard>

        {/* ── Plan de Contingencia ── */}
        <SeccionCard icon="🛡️" titulo="Plan de Contingencia">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoForm label="Tipo de Contingencia" required>
              <select
                className={SELECT_BASE}
                value={formData.tipoContingencia}
                onChange={(e) => handleContingenciaChange(e.target.value)}
                required
              >
                <option value="">Seleccionar...</option>
                <option value="Mensual">💰 Mensual ($5/mes)</option>
                <option value="Anual USD">💵 Anual USD ($60)</option>
                <option value="Anual EUR">💶 Anual EUR (€72)</option>
              </select>
            </CampoForm>
            <CampoForm label="Monto Contingencia" required>
              <input className={INPUT_BASE} type="number" name="montoContingencia" value={formData.montoContingencia} onChange={handleChange} min="0" step="0.01" />
            </CampoForm>
          </div>
        </SeccionCard>

        {/* ── Condiciones de Pago ── */}
        <SeccionCard icon="📅" titulo="Condiciones de Pago">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoForm label="Período de Pago" hint={calculados.mensajeMora ? `⚡ ${calculados.mensajeMora}` : '⚡ Calculado desde la fecha inicio'}>
              <input className={INPUT_RO} type="text" value={formData.diaPago} readOnly />
            </CampoForm>
            <CampoForm label="Frecuencia Pago">
              <select className={SELECT_BASE} name="frecuenciaPago" value={formData.frecuenciaPago} onChange={handleChange}>
                <option value="Mensual">Mensual</option>
                <option value="Trimestral">Trimestral</option>
              </select>
            </CampoForm>
          </div>
          <CampoForm label="Método de Pago" required>
            <select className={SELECT_BASE} name="metodoPago" value={formData.metodoPago} onChange={handleChange} required>
              <option value="">-- Selecciona --</option>
              <option value="Cash">Cash</option>
              <option value="Zelle">Zelle</option>
              <option value="Transferencia">Transferencia</option>
              <option value="USDT">USDT</option>
              <option value="Euro a Bs">Euro a Bs</option>
            </select>
          </CampoForm>
        </SeccionCard>

        {/* ── Contrato ── */}
        <SeccionCard icon="📋" titulo="Contrato">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CampoForm label="Fecha Inicio" required sensible>
              <input
                className={INPUT_BASE}
                type="text"
                value={formData.fechaInicio}
                onChange={(e) => handleFechaChange('fechaInicio', e)}
                placeholder="DD/MM/YYYY"
                maxLength={10}
                required
              />
            </CampoForm>
            <CampoForm label="Duración">
              <select className={SELECT_BASE} name="duracionMeses" value={formData.duracionMeses} onChange={handleChange}>
                <option value="">Renovación...</option>
                <option value="1">1 mes</option>
                <option value="3">3 meses</option>
                <option value="6">6 meses</option>
                <option value="12">1 año (12 meses)</option>
              </select>
            </CampoForm>
            <CampoForm label="Fecha Vencimiento" required sensible>
              <input
                className={INPUT_BASE}
                type="text"
                value={formData.fechaVencimiento}
                onChange={(e) => handleFechaChange('fechaVencimiento', e)}
                placeholder="DD/MM/YYYY"
                maxLength={10}
                required
              />
            </CampoForm>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoForm label="Status Contrato" required>
              <select className={SELECT_BASE} name="statusContrato" value={formData.statusContrato} onChange={handleChange} required>
                <option value="Vigente">Vigente</option>
                <option value="Vencido">Vencido</option>
                <option value="Por Renovar">Por Renovar</option>
                <option value="Sin Contrato">Sin Contrato</option>
              </select>
            </CampoForm>
            <CampoForm label="Estacionamiento">
              <select className={SELECT_BASE} name="estacionamiento" value={formData.estacionamiento} onChange={handleChange}>
                <option value="No">No</option>
                <option value="Sí">Sí</option>
              </select>
            </CampoForm>
          </div>
        </SeccionCard>

        {/* ── Relación Arrendataria ── */}
        <SeccionCard icon="🤝" titulo="Relación Arrendataria">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CampoForm label="Tipo de Relación">
              <select className={SELECT_BASE} name="tipoRelacion" value={formData.tipoRelacion} onChange={handleChange}>
                <option value="">Seleccionar...</option>
                <option value="Arrendatario Directo">Arrendatario Directo</option>
                <option value="Coarrendatario">Coarrendatario</option>
                <option value="Representante Legal">Representante Legal</option>
                <option value="Ocupante">Ocupante</option>
              </select>
            </CampoForm>
            <CampoForm label="Fecha Inicio Relación">
              <input
                className={INPUT_BASE}
                type="text"
                value={formData.fechaInicioRelacion}
                onChange={(e) => handleFechaChange('fechaInicioRelacion', e)}
                placeholder="DD/MM/YYYY"
                maxLength={10}
              />
            </CampoForm>
            <CampoForm label="Meses en Relación" hint="Calculado automáticamente">
              <input className={INPUT_RO} type="number" value={formData.duracionRelacion} readOnly />
            </CampoForm>
          </div>
        </SeccionCard>

        {/* ── Observaciones ── */}
        <SeccionCard icon="📝" titulo="Observaciones">
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            placeholder="Notas adicionales sobre el cliente o contrato..."
            rows={3}
            className={`${INPUT_BASE} resize-none`}
          />
        </SeccionCard>

        {/* ── Botones de acción ── */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 sm:flex-none sm:px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="flex-1 py-3 bg-gradient-to-r from-terra-copper to-terra-copper-dark hover:from-terra-copper-dark hover:to-terra-copper-deeper text-white font-bold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {guardando ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : '💾 Guardar Cambios'}
          </button>
        </div>

      </form>
    </div>
  );
}
