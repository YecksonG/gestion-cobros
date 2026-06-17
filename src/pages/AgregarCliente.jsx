import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { GAS_SCRIPT_URL } from '../services/api';
import {
  PAISES,
  aplicarMascaraNombre,
  aplicarMascaraCedula,
  aplicarMascaraRif,
  aplicarMascaraTelefono,
  validarCorreo,
  REGEX_CEDULA,
  REGEX_RIF,
  normalizarCedulaRif,
  parseFechaStr,
  calcularDiaPagoTexto
} from '../utils/validaciones';

const INPUT_BASE = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper transition-colors bg-white';
const INPUT_RO   = 'w-full px-3 py-2.5 border border-gray-100 rounded-lg text-sm text-gray-500 bg-gray-50 cursor-not-allowed';

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

function AgregarCliente() {
  const [tasas, setTasas] = useState({ usd: 36.50, eur: 39.10 });
  const [formData, setFormData] = useState({
    inmueble: '',
    ubicacion: '',
    unidad: '',
    nombre: '',
    cedula: '',
    rif: '',
    paisCodigo: '+58',
    telefono: '',
    correo: '',
    fechaInicioRelacion: '',
    tipoRelacion: '',
    fechaInicio: '',
    duracionMeses: '',
    frecuenciaPago: 'Mensual',
    canonUSD: '',
    monedalPrincipal: 'USD',
    metodoPago: '',
    depositoUSD: '',
    tipoContingencia: 'Mensual',
    estacionamiento: 'No'
  });

  const [calculados, setCalculados] = useState({
    duracionRelacionMeses: '',
    fechaVencimiento: '',
    diaPago: '',
    diaAplicaMora: '',
    mensajeMora: '',
    canonEUR: '',
    depositoEUR: '',
    montoContingencia: '',
    previewTotal: 0
  });

  const [guardando, setGuardando] = useState(false);

  const INMUEBLES = ['Miko', 'Federación', 'La Candelaria'];

  // Máscara para input de fecha DD/MM/YYYY con validación día ≤31, mes ≤12
  const aplicarMascaraFecha = (valorNuevo, valorAnterior) => {
    const digitos = valorNuevo.replace(/\D/g, '').substring(0, 8);
    const borrando = valorNuevo.length < (valorAnterior || '').length;
    if (!digitos) return '';

    let dd = digitos.substring(0, Math.min(2, digitos.length));
    let mm = digitos.length > 2 ? digitos.substring(2, Math.min(4, digitos.length)) : '';
    const yyyy = digitos.length > 4 ? digitos.substring(4) : '';

    if (dd.length === 2) {
      const n = parseInt(dd, 10);
      if (n === 0) dd = '01';
      else if (n > 31) dd = '31';
    }
    if (mm.length === 2) {
      const n = parseInt(mm, 10);
      if (n === 0) mm = '01';
      else if (n > 12) mm = '12';
    }

    let resultado = dd;
    if (mm.length > 0 || (dd.length === 2 && !borrando)) resultado += '/' + mm;
    if (yyyy.length > 0 || (mm.length === 2 && !borrando)) resultado += '/' + yyyy;
    return resultado;
  };

  const handleFechaChange = (name, e) => {
    const valorNuevo = e.target.value;
    const valorAnterior = formData[name];
    setFormData(prev => ({ ...prev, [name]: aplicarMascaraFecha(valorNuevo, valorAnterior) }));
  };

  // CARGAR TASAS AL MONTAR
  useEffect(() => {
    cargarTasas();
  }, []);

  // Duración relación — recalcula cuando cambia fecha inicio relación
  useEffect(() => { calcularDuracionRelacion(); }, [formData.fechaInicioRelacion]);

  // Fecha vencimiento — recalcula cuando cambia fecha inicio contrato o duración meses
  useEffect(() => { calcularFechaVencimiento(); }, [formData.fechaInicio, formData.duracionMeses]);

  // Día de pago — recalcula cuando cambia fecha inicio contrato
  useEffect(() => { calcularDiaPago(); }, [formData.fechaInicio]);

  // Canon EUR — recalcula cuando cambia canon USD o tasas
  useEffect(() => { calcularCanonEUR(); }, [formData.canonUSD, tasas]);

  // Depósito EUR — recalcula cuando cambia depósito USD o tasas
  useEffect(() => { calcularDepositoEUR(); }, [formData.depositoUSD, tasas]);

  // Monto contingencia sugerido — recalcula cuando cambia tipo contingencia
  useEffect(() => { sugerirMontoContingencia(formData.tipoContingencia); }, [formData.tipoContingencia]);

  // Preview total — recalcula cuando cambian los campos de monto
  useEffect(() => { calcularPreview(); }, [formData.canonUSD, formData.montoContingencia, formData.depositoUSD, formData.estacionamiento]);

  const cargarTasas = async () => {
    try {
      const response = await axios.get(`${GAS_SCRIPT_URL}?action=getTasasActuales`);
      if (response.data.success) {
        setTasas({
          usd: parseFloat(response.data.usd),
          eur: parseFloat(response.data.eur)
        });
      }
    } catch (err) {
      console.error('Error cargando tasas:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handlers con validación/máscara
  const handleNombreChange = (e) => {
    setFormData(prev => ({ ...prev, nombre: aplicarMascaraNombre(e.target.value) }));
  };

  const handleCedulaChange = (e) => {
    setFormData(prev => ({ ...prev, cedula: aplicarMascaraCedula(e.target.value) }));
  };

  const handleRifChange = (e) => {
    setFormData(prev => ({ ...prev, rif: aplicarMascaraRif(e.target.value) }));
  };

  const handleTelefonoChange = (e) => {
    const pais = PAISES.find(p => p.codigo === formData.paisCodigo) || PAISES[0];
    setFormData(prev => ({ ...prev, telefono: aplicarMascaraTelefono(e.target.value, pais.maxDigitos) }));
  };

  // CALCULAR DURACIÓN RELACIÓN ARRENDATICIA (en meses)
  const calcularDuracionRelacion = () => {
    const fecha = parseFechaStr(formData.fechaInicioRelacion);
    if (!fecha) {
      setCalculados(prev => ({ ...prev, duracionRelacionMeses: '' }));
      return;
    }
    const hoy = new Date();
    const meses = (hoy.getFullYear() - fecha.getFullYear()) * 12
                  + (hoy.getMonth() - fecha.getMonth());
    setCalculados(prev => ({ ...prev, duracionRelacionMeses: `${Math.max(0, meses)} meses` }));
  };

  // CALCULAR FECHA VENCIMIENTO (inicio + duración - 1 día)
  const calcularFechaVencimiento = () => {
    const fechaInicio = parseFechaStr(formData.fechaInicio);
    if (!fechaInicio || !formData.duracionMeses) {
      setCalculados(prev => ({ ...prev, fechaVencimiento: '' }));
      return;
    }

    const diaOriginal = fechaInicio.getDate();
    const mesOriginal = fechaInicio.getMonth();
    const añoOriginal = fechaInicio.getFullYear();
    const mesesAgregados = parseInt(formData.duracionMeses);

    const nuevoMes = mesOriginal + mesesAgregados;
    const nuevoAño = añoOriginal + Math.floor(nuevoMes / 12);
    const mesFinal = nuevoMes % 12;

    const fechaVenc = new Date(nuevoAño, mesFinal, diaOriginal);
    fechaVenc.setDate(fechaVenc.getDate() - 1);

    const dia = String(fechaVenc.getDate()).padStart(2, '0');
    const mes = String(fechaVenc.getMonth() + 1).padStart(2, '0');
    setCalculados(prev => ({ ...prev, fechaVencimiento: `${dia}/${mes}/${fechaVenc.getFullYear()}` }));
  };

  // CALCULAR DÍA DE PAGO (5 días desde la fecha de inicio, con wrap si > 28)
  const calcularDiaPago = () => {
    const fechaInicio = parseFechaStr(formData.fechaInicio);
    const resultado = calcularDiaPagoTexto(fechaInicio);
    setCalculados(prev => ({
      ...prev,
      diaPago: resultado.texto,
      diaAplicaMora: resultado.diaAplicaMora,
      mensajeMora: resultado.mensajeMora
    }));
  };

  // CALCULAR CANON EUR DESDE TASAS BCV
  const calcularCanonEUR = () => {
    const canonUSD = parseFloat(formData.canonUSD) || 0;
    if (canonUSD <= 0 || !tasas.usd) {
      setCalculados(prev => ({ ...prev, canonEUR: '' }));
      return;
    }

    const canonVEF = canonUSD * tasas.usd;
    const canonEUR_calc = canonVEF / tasas.eur;
    const canonEUR_redondeado = Math.ceil(canonEUR_calc / 5) * 5;

    setCalculados(prev => ({ ...prev, canonEUR: canonEUR_redondeado.toFixed(2) }));
  };

  // CALCULAR DEPÓSITO EUR
  const calcularDepositoEUR = () => {
    const depositoUSD = parseFloat(formData.depositoUSD) || 0;
    if (depositoUSD <= 0 || !tasas.usd) {
      setCalculados(prev => ({ ...prev, depositoEUR: '' }));
      return;
    }

    const depositoVEF = depositoUSD * tasas.usd;
    const depositoEUR_calc = depositoVEF / tasas.eur;
    const depositoEUR_redondeado = Math.ceil(depositoEUR_calc / 5) * 5;

    setCalculados(prev => ({ ...prev, depositoEUR: depositoEUR_redondeado.toFixed(2) }));
  };

  // SUGERIR MONTO PLAN CONTINGENCIA (pero permitir editar)
  const sugerirMontoContingencia = (tipo) => {
    const montoSugerido = tipo === 'Anual USD' ? '60' : '5';
    setFormData(prev => ({ ...prev, montoContingencia: montoSugerido }));
  };

  // CALCULAR PREVIEW TOTAL
  const calcularPreview = () => {
    const canonUSD = parseFloat(formData.canonUSD) || 0;
    const contingencia = parseFloat(formData.montoContingencia) || 0;
    const depositoCuota = formData.tipoContingencia === 'Mensual' && formData.depositoUSD
      ? (parseFloat(formData.depositoUSD) / 4) : 0;
    const estacionamiento = formData.estacionamiento === 'Sí' ? 20 : 0;

    const total = canonUSD + contingencia + depositoCuota + estacionamiento;
    setCalculados(prev => ({ ...prev, previewTotal: total.toFixed(2) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      if (!formData.nombre.trim()) {
        toast.error('❌ El nombre es obligatorio');
        setGuardando(false);
        return;
      }
      const cedulaNorm = normalizarCedulaRif(formData.cedula);
      const rifNorm = normalizarCedulaRif(formData.rif);
      if (cedulaNorm && !REGEX_CEDULA.test(cedulaNorm)) {
        toast.error('❌ Cédula inválida. Formato esperado: V-XXXXXXXX (5-9 dígitos)');
        setGuardando(false);
        return;
      }
      if (rifNorm && !REGEX_RIF.test(rifNorm)) {
        toast.error('❌ RIF inválido. Formato esperado: V-XXXXXXXX-X');
        setGuardando(false);
        return;
      }
      if (formData.correo && !validarCorreo(formData.correo)) {
        toast.error('❌ Correo inválido o dominio no permitido');
        setGuardando(false);
        return;
      }
      if (!formData.canonUSD || parseFloat(formData.canonUSD) <= 0) {
        toast.error('❌ Canon USD debe ser > 0');
        setGuardando(false);
        return;
      }
      if (!parseFechaStr(formData.fechaInicio)) {
        toast.error('❌ Fecha de inicio es obligatoria (DD/MM/YYYY)');
        setGuardando(false);
        return;
      }
      if (!formData.duracionMeses) {
        toast.error('❌ Duración del contrato es obligatoria');
        setGuardando(false);
        return;
      }

      const datosConvertidos = {
        inmueble: formData.inmueble,
        ubicacion: formData.ubicacion,
        unidad: formData.unidad,
        nombre: formData.nombre,
        cedula: formData.cedula,
        rif: formData.rif,
        telefono: formData.telefono ? `${formData.paisCodigo} ${formData.telefono}` : '',
        correo: formData.correo,
        fechaInicioRelacion: formData.fechaInicioRelacion,
        tipoRelacion: formData.tipoRelacion,
        fechaInicio: formData.fechaInicio,
        duracionMeses: formData.duracionMeses,
        diaPago: calculados.diaPago,
        frecuenciaPago: formData.frecuenciaPago,
        canonUSD: formData.canonUSD,
        monedalPrincipal: formData.monedalPrincipal,
        metodoPago: formData.metodoPago,
        depositoUSD: formData.depositoUSD,
        tipoContingencia: formData.tipoContingencia,
        estacionamiento: formData.estacionamiento,
        fechaVencimiento: calculados.fechaVencimiento,
        canonEUR: calculados.canonEUR,
        depositoEUR: calculados.depositoEUR,
        montoContingencia: calculados.montoContingencia
      };

      const payload = JSON.stringify({ action: 'agregarCliente', datos: datosConvertidos });

      const response = await axios.post(
        GAS_SCRIPT_URL,
        payload,
        {
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          timeout: 30000
        }
      );

      if (response.data && response.data.success) {
        toast.success(`✅ ${response.data.message}`);
        setFormData({
          inmueble: '',
          ubicacion: '',
          unidad: '',
          nombre: '',
          cedula: '',
          rif: '',
          paisCodigo: '+58',
          telefono: '',
          correo: '',
          fechaInicioRelacion: '',
          tipoRelacion: '',
          fechaInicio: '',
          duracionMeses: '',
          frecuenciaPago: 'Mensual',
          canonUSD: '',
          monedalPrincipal: 'USD',
          metodoPago: '',
          depositoUSD: '',
          tipoContingencia: 'Mensual',
          estacionamiento: 'No'
        });
        // Resetear calculados también
        setCalculados({
          duracionRelacionMeses: '',
          fechaVencimiento: '',
          diaPago: '',
          diaAplicaMora: '',
          mensajeMora: '',
          canonEUR: '',
          depositoEUR: '',
          montoContingencia: '',
          previewTotal: 0
        });
      } else {
        const mensajeError = response.data?.message || 'Error desconocido del servidor';
        console.error('❌ Error del servidor:', mensajeError);
        toast.error(`❌ ${mensajeError}`);
      }
    } catch (err) {
      console.error('❌ Error completo:', err);
      console.error('Mensaje:', err.message);
      if (err.response) {
        console.error('Status:', err.response.status);
        console.error('Data:', err.response.data);
        toast.error(`❌ Error ${err.response.status}: ${err.response.data?.message || err.message}`);
      } else if (err.request) {
        console.error('Sin respuesta del servidor:', err.request);
        toast.error('❌ No hay respuesta del servidor. Verifica la conexión.');
      } else {
        toast.error(`❌ Error: ${err.message}`);
      }
    } finally {
      setGuardando(false);
    }
  };

  const paisActual = PAISES.find(p => p.codigo === formData.paisCodigo) || PAISES[0];

  return (
    <div className="content-enter max-w-4xl mx-auto pb-16 space-y-4">

      {/* Tasas BCV banner */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-terra-cream to-terra-cream-mid rounded-xl border border-terra-gold/30 px-5 py-3 shadow-sm">
        <span className="text-xl">💱</span>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
          <span className="text-terra-copper-dark font-bold uppercase tracking-wide">Tasas BCV Actuales</span>
          <span className="text-gray-700">1 USD = <strong className="text-terra-copper">{tasas.usd.toFixed(2)} VEF</strong></span>
          <span className="text-gray-700">1 EUR = <strong className="text-terra-copper">{tasas.eur.toFixed(2)} VEF</strong></span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Ubicación ── */}
        <SeccionCard icon="🏢" titulo="Ubicación">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CampoForm label="Inmueble" required>
              <select className={INPUT_BASE} name="inmueble" value={formData.inmueble} onChange={handleChange} required>
                <option value="">Seleccionar...</option>
                {INMUEBLES.map(inm => <option key={inm} value={inm}>{inm}</option>)}
              </select>
            </CampoForm>
            <CampoForm label="Ubicación" required>
              <input className={INPUT_BASE} type="text" name="ubicacion" placeholder="Ej: Piso 1" value={formData.ubicacion} onChange={handleChange} required />
            </CampoForm>
            <CampoForm label="Unidad" required>
              <input className={INPUT_BASE} type="text" name="unidad" placeholder="Ej: 1-A" value={formData.unidad} onChange={handleChange} required />
            </CampoForm>
          </div>
        </SeccionCard>

        {/* ── Arrendatario ── */}
        <SeccionCard icon="👤" titulo="Arrendatario">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoForm label="Nombre Completo" required hint="Solo letras (sin números ni símbolos)">
              <input className={INPUT_BASE} type="text" name="nombre" placeholder="Nombres y Apellidos" value={formData.nombre} onChange={handleNombreChange} required />
            </CampoForm>
            <CampoForm label="Cédula" hint="V/E/P/A/O + 8 dígitos">
              <input className={INPUT_BASE} type="text" name="cedula" placeholder="V-12345678" value={formData.cedula} onChange={handleCedulaChange} maxLength={10} />
            </CampoForm>
            <CampoForm label="RIF" hint="V/E/P/J/G/C + 8 dígitos + verificador">
              <input className={INPUT_BASE} type="text" name="rif" placeholder="J-12345678-3" value={formData.rif} onChange={handleRifChange} maxLength={12} />
            </CampoForm>
            <CampoForm label="Teléfono" hint={`${paisActual.nombre}: ${paisActual.maxDigitos} dígitos`}>
              <div className="flex gap-2">
                <select name="paisCodigo" value={formData.paisCodigo} onChange={handleChange} className="w-[115px] flex-shrink-0 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper transition-colors bg-white">
                  {PAISES.map(p => <option key={p.codigo} value={p.codigo}>{p.bandera} {p.codigo}</option>)}
                </select>
                <input className={`${INPUT_BASE} flex-1`} type="text" name="telefono" placeholder="424-4325183" value={formData.telefono} onChange={handleTelefonoChange} />
              </div>
            </CampoForm>
          </div>
          <CampoForm label="Correo" hint=".com .ve .co .net .org .edu .gov etc.">
            <input className={INPUT_BASE} type="email" name="correo" placeholder="ejemplo@gmail.com" value={formData.correo} onChange={handleChange} />
          </CampoForm>
        </SeccionCard>

        {/* ── Relación Arrendataria ── */}
        <SeccionCard icon="🤝" titulo="Relación Arrendataria">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CampoForm label="Tipo de Relación" required>
              <select className={INPUT_BASE} name="tipoRelacion" value={formData.tipoRelacion} onChange={handleChange} required>
                <option value="">Seleccionar...</option>
                <option value="Arrendatario Directo">Arrendatario Directo</option>
                <option value="Coarrendatario">Coarrendatario</option>
                <option value="Representante Legal">Representante Legal</option>
                <option value="Ocupante">Ocupante</option>
              </select>
            </CampoForm>
            <CampoForm label="Fecha Inicio Relación" required>
              <input
                className={INPUT_BASE} type="text"
                value={formData.fechaInicioRelacion}
                onChange={(e) => handleFechaChange('fechaInicioRelacion', e)}
                placeholder="DD/MM/YYYY" maxLength={10}
              />
            </CampoForm>
            <CampoForm label="Duración Relación" hint="⚡ Calculado automáticamente">
              <input className={INPUT_RO} type="text" value={calculados.duracionRelacionMeses} readOnly />
            </CampoForm>
          </div>
        </SeccionCard>

        {/* ── Términos del Contrato ── */}
        <SeccionCard icon="📋" titulo="Términos del Contrato">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoForm label="Fecha Inicio Contrato" required>
              <input
                className={INPUT_BASE} type="text"
                value={formData.fechaInicio}
                onChange={(e) => handleFechaChange('fechaInicio', e)}
                placeholder="DD/MM/YYYY" maxLength={10} required
              />
            </CampoForm>
            <CampoForm label="Duración Contrato" required>
              <select className={INPUT_BASE} name="duracionMeses" value={formData.duracionMeses} onChange={handleChange} required>
                <option value="">Seleccionar duración...</option>
                <optgroup label="Meses">
                  {[1,2,3,4,5,6,7,8,9,10,11].map(m => (
                    <option key={m} value={m}>{m} mes{m > 1 ? 'es' : ''}</option>
                  ))}
                </optgroup>
                <optgroup label="Años">
                  <option value="12">1 año (12 meses)</option>
                  <option value="24">2 años (24 meses)</option>
                  <option value="36">3 años (36 meses)</option>
                </optgroup>
              </select>
            </CampoForm>
            <CampoForm label="Fecha Vencimiento" hint="⚡ Calculado automáticamente">
              <input className={INPUT_RO} type="text" value={calculados.fechaVencimiento} readOnly />
            </CampoForm>
            <CampoForm label="Período de Pago" hint={calculados.mensajeMora ? `⚡ ${calculados.mensajeMora}` : '⚡ Calculado desde la fecha inicio'}>
              <input className={INPUT_RO} type="text" value={calculados.diaPago} readOnly />
            </CampoForm>
            <CampoForm label="Frecuencia Pago">
              <select className={INPUT_BASE} name="frecuenciaPago" value={formData.frecuenciaPago} onChange={handleChange}>
                <option value="Mensual">Mensual</option>
                <option value="Bimestral">Bimestral</option>
                <option value="Trimestral">Trimestral</option>
              </select>
            </CampoForm>
          </div>
        </SeccionCard>

        {/* ── Canon Mensual ── */}
        <SeccionCard icon="💰" titulo="Canon Mensual">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoForm label="Canon Base USD" required sensible>
              <input className={INPUT_BASE} type="number" name="canonUSD" step="0.01" min="0.01" placeholder="160.00" value={formData.canonUSD} onChange={handleChange} required />
            </CampoForm>
            <CampoForm label="Canon Base EUR" hint="⚡ Calculado automáticamente">
              <input className={INPUT_RO} type="text" value={calculados.canonEUR} readOnly />
            </CampoForm>
            <CampoForm label="Moneda Principal" required>
              <select className={INPUT_BASE} name="monedalPrincipal" value={formData.monedalPrincipal} onChange={handleChange} required>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="Ambas">Ambas</option>
              </select>
            </CampoForm>
            <CampoForm label="Método de Pago" required>
              <select className={INPUT_BASE} name="metodoPago" value={formData.metodoPago} onChange={handleChange} required>
                <option value="">Seleccionar...</option>
                <option value="Cash">Cash</option>
                <option value="Zelle">Zelle</option>
                <option value="Transferencia">Transferencia</option>
                <option value="USDT">USDT</option>
                <option value="Euro a Bs">Euro a Bs</option>
              </select>
            </CampoForm>
          </div>
        </SeccionCard>

        {/* ── Depósito y Contingencia ── */}
        <SeccionCard icon="🛡️" titulo="Depósito y Contingencia">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoForm label="Depósito Total USD" hint="Se divide en 4 cuotas los primeros 4 meses">
              <input className={INPUT_BASE} type="number" name="depositoUSD" step="0.01" min="0" placeholder="320.00" value={formData.depositoUSD} onChange={handleChange} />
            </CampoForm>
            <CampoForm label="Depósito Total EUR" hint="⚡ Calculado automáticamente">
              <input className={INPUT_RO} type="text" value={calculados.depositoEUR} readOnly />
            </CampoForm>
            <CampoForm label="Plan de Contingencia" required>
              <select className={INPUT_BASE} name="tipoContingencia" value={formData.tipoContingencia} onChange={handleChange} required>
                <option value="Mensual">Mensual</option>
                <option value="Anual USD">Anual</option>
              </select>
            </CampoForm>
            <CampoForm label="Monto Contingencia" required hint="Mensual: $5 sugerido · Anual: $60 sugerido">
              <input className={INPUT_BASE} type="number" name="montoContingencia" value={formData.montoContingencia} onChange={handleChange} min="0" step="0.01" required />
            </CampoForm>
          </div>
        </SeccionCard>

        {/* ── Información Adicional ── */}
        <SeccionCard icon="📌" titulo="Información Adicional">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoForm label="Estacionamiento">
              <select className={INPUT_BASE} name="estacionamiento" value={formData.estacionamiento} onChange={handleChange}>
                <option value="No">No</option>
                <option value="Sí">Sí (+$20/mes)</option>
                <option value="Opcional">Opcional</option>
              </select>
            </CampoForm>
          </div>
        </SeccionCard>

        {/* ── Preview Total ── */}
        {formData.canonUSD && (
          <div className="bg-gradient-to-br from-terra-cream to-terra-cream-mid rounded-xl border-l-4 border-terra-gold shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-terra-gold/20 flex items-center gap-2">
              <span className="text-base">💳</span>
              <h3 className="text-xs font-bold text-terra-copper-dark uppercase tracking-wider">Total a cobrar — 1er mes</h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3 border border-terra-gold/20 text-center">
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Canon</p>
                  <p className="text-lg font-bold text-terra-copper-dark mt-1">${parseFloat(formData.canonUSD || 0).toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-terra-gold/20 text-center">
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Contingencia</p>
                  <p className="text-lg font-bold text-terra-copper-dark mt-1">${parseFloat(formData.montoContingencia || 0).toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-terra-gold/20 text-center">
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Depósito 1/4</p>
                  <p className="text-lg font-bold text-terra-copper-dark mt-1">${(parseFloat(formData.depositoUSD || 0) / 4).toFixed(2)}</p>
                </div>
                {formData.estacionamiento === 'Sí' && (
                  <div className="bg-white rounded-lg p-3 border border-terra-gold/20 text-center">
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Estacionam.</p>
                    <p className="text-lg font-bold text-terra-copper-dark mt-1">$20.00</p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between bg-gradient-to-r from-terra-copper to-terra-navy rounded-lg px-5 py-3">
                <span className="text-sm font-bold text-white/80 uppercase tracking-wider">Total</span>
                <span className="text-2xl font-black text-white">${calculados.previewTotal}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Botones ── */}
        <div className="flex gap-3 pt-2">
          <button
            type="reset"
            className="flex-1 sm:flex-none sm:px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            Limpiar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="flex-1 py-3 bg-gradient-to-r from-terra-copper to-terra-copper-dark hover:from-terra-copper-dark hover:to-[#6a3a22] text-white font-bold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {guardando ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : '✅ Agregar Cliente'}
          </button>
        </div>

      </form>
    </div>
  );
}

export default AgregarCliente;
