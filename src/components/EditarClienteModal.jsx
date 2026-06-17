import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { GAS_SCRIPT_URL } from '../services/api';
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

function EditarClienteModal({ isOpen, onClose, nombreCliente, inmueble }) {
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
    canonEUR: '',
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

  const [calculados, setCalculados] = useState({
    canonEUR: '',
    montoContingencia: 5,
    mensajeMora: ''
  });

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const INMUEBLES = ['Miko', 'Federación', 'La Candelaria', 'Valencia'];

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    try {
      // Si ya está en formato DD/MM/YYYY, devolver tal cual (GAS lo manda así)
      if (typeof fecha === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(fecha.trim())) {
        return fecha.trim();
      }
      // Si es otro formato (ISO, timestamp), parsearlo
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return '';
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const año = date.getFullYear();
      return `${dia}/${mes}/${año}`;
    } catch (err) {
      return typeof fecha === 'string' ? fecha : '';
    }
  };

  // CARGAR DATOS AL ABRIR MODAL
  useEffect(() => {
    if (isOpen && nombreCliente && inmueble) {
      cargarDatos();
    }
  }, [isOpen, nombreCliente, inmueble]);

  const calcularDuracionRelacion = (fechaStr) => {
    if (!fechaStr || fechaStr.trim() === '') return '';
    try {
      const partes = fechaStr.trim().split('/');
      if (partes.length === 3) {
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10);
        const año = parseInt(partes[2], 10);
        if (!isNaN(dia) && !isNaN(mes) && !isNaN(año) && año > 1900) {
          const fechaInicio = new Date(año, mes - 1, dia);
          const fechaHoy = new Date();
          let meses = (fechaHoy.getFullYear() - fechaInicio.getFullYear()) * 12;
          meses += (fechaHoy.getMonth() - fechaInicio.getMonth());
          return Math.max(0, meses).toString();
        }
      }
    } catch (err) {
      console.error('Error calculando duración:', err);
    }
    return '';
  };

  const cargarDatos = async () => {
    setCargando(true);
    setError('');
    try {
      const tasasResponse = await axios.get(`${GAS_SCRIPT_URL}?action=getTasasActuales`);
      if (tasasResponse.data) {
        setTasas({
          usd: parseFloat(tasasResponse.data.usd) || 36.50,
          eur: parseFloat(tasasResponse.data.eur) || 39.10
        });
      }

      const response = await axios.get(
        `${GAS_SCRIPT_URL}?action=getClienteDetalles&nombre=${encodeURIComponent(nombreCliente)}&inmueble=${encodeURIComponent(inmueble)}`
      );

      if (response.data && !response.data.error) {
        const fechaInicioRelacionFormateada = formatearFecha(response.data.fechaInicioRelacion);
        const duracionCalculada = calcularDuracionRelacion(fechaInicioRelacionFormateada);

        setFormData(prev => ({
          ...prev,
          numeroCliente: response.data.id,
          inmueble: response.data.inmueble,
          ubicacion: response.data.ubicacion,
          unidad: response.data.unidad,
          nombre: response.data.nombre,
          cedula: response.data.cedula,
          rif: response.data.rif,
          paisCodigo: separarTelefono(response.data.telefono).paisCodigo,
          telefono: separarTelefono(response.data.telefono).numero,
          correo: response.data.correo,
          canonUSD: response.data.canonBaseUSD,
          canonEUR: response.data.canonBaseEUR,
          monedaPrincipal: response.data.monedaPrincipal,
          diaPago: response.data.diaPago,
          frecuenciaPago: response.data.frecuenciaPago,
          metodoPago: response.data.metodoPago,
          tipoContingencia: (response.data.tipoContingencia || 'Mensual').startsWith('Anual') ? 'Anual USD' : 'Mensual',
          montoContingencia: response.data.planContingenciaUSD || 5,
          depositoUSD: response.data.depositoTotalUSD,
          depositoEUR: response.data.depositoTotalEUR,
          fechaInicio: formatearFecha(response.data.fechaInicioContrato),
          fechaVencimiento: formatearFecha(response.data.fechaVencimiento),
          statusContrato: response.data.statusContrato,
          estacionamiento: (response.data.estacionamiento?.trim?.() || 'No').trim(),
          observaciones: response.data.observaciones || '',
          tipoRelacion: response.data.tipoRelacion || '',
          fechaInicioRelacion: fechaInicioRelacionFormateada,
          duracionRelacion: duracionCalculada
        }));
      } else {
        setError('Error al cargar datos del cliente');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  // RECALCULAR DÍA DE PAGO cuando cambia fecha de inicio (wrap si > 28)
  useEffect(() => {
    const fechaInicio = parseFechaStr(formData.fechaInicio);
    if (!fechaInicio) return;
    const resultado = calcularDiaPagoTexto(fechaInicio);
    setFormData(prev => ({ ...prev, diaPago: resultado.texto }));
    setCalculados(prev => ({ ...prev, mensajeMora: resultado.mensajeMora }));
  }, [formData.fechaInicio]);

  // RECALCULAR CANON EUR
  useEffect(() => {
    const canonUSD = parseFloat(formData.canonUSD) || 0;
    if (canonUSD <= 0 || !tasas.usd) {
      setCalculados(prev => ({ ...prev, canonEUR: '' }));
      return;
    }

    const canonVEF = canonUSD * tasas.usd;
    const canonEUR_calc = canonVEF / tasas.eur;
    const canonEUR_redondeado = Math.ceil(canonEUR_calc / 5) * 5;

    setCalculados(prev => ({ ...prev, canonEUR: canonEUR_redondeado.toFixed(2) }));
  }, [formData.canonUSD, tasas]);

  // Calcular duración de la relación en meses desde fecha inicio hasta hoy
  useEffect(() => {
    if (formData.fechaInicioRelacion && formData.fechaInicioRelacion.trim() !== '') {
      try {
        const partes = formData.fechaInicioRelacion.trim().split('/');
        if (partes.length === 3) {
          const dia = parseInt(partes[0], 10);
          const mes = parseInt(partes[1], 10);
          const año = parseInt(partes[2], 10);
          if (!isNaN(dia) && !isNaN(mes) && !isNaN(año) && año > 1900) {
            const fechaInicio = new Date(año, mes - 1, dia);
            const fechaHoy = new Date();
            let meses = (fechaHoy.getFullYear() - fechaInicio.getFullYear()) * 12;
            meses += (fechaHoy.getMonth() - fechaInicio.getMonth());
            meses = Math.max(0, meses);
            setFormData(prev => ({ ...prev, duracionRelacion: meses.toString() }));
          }
        }
      } catch (err) {
        console.error('Error calculando duración:', err);
      }
    }
  }, [formData.fechaInicioRelacion]);

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

  const handleContingenciaChange = (tipo) => {
    const montoSugerido = tipo === 'Anual USD' ? 60 : 5;
    setFormData(prev => ({
      ...prev,
      tipoContingencia: tipo,
      ...(([5, 60, 72].includes(Number(formData.montoContingencia))) && { montoContingencia: montoSugerido })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones de formato (normalizando puntos/espacios para tolerar formatos viejos como "V-7.147.198")
    const cedulaNorm = normalizarCedulaRif(formData.cedula);
    const rifNorm = normalizarCedulaRif(formData.rif);

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
    setMensaje('');
    setError('');

    try {
      const response = await axios.post(`${GAS_SCRIPT_URL}`, JSON.stringify({
        action: 'procesarEditarCliente',
        numeroCliente: formData.numeroCliente,
        inmueble: formData.inmueble,
        ubicacion: formData.ubicacion,
        unidad: formData.unidad,
        nombre: formData.nombre,
        cedula: formData.cedula,
        rif: formData.rif,
        telefono: formData.telefono ? `${formData.paisCodigo} ${formData.telefono}` : '',
        correo: formData.correo,
        canonUSD: parseFloat(formData.canonUSD) || 0,
        canonEUR: parseFloat(calculados.canonEUR) || 0,
        monedaPrincipal: formData.monedaPrincipal,
        diaPago: formData.diaPago,
        duracionMeses: formData.duracionMeses,
        frecuenciaPago: formData.frecuenciaPago,
        metodoPago: formData.metodoPago,
        tipoContingencia: formData.tipoContingencia,
        montoContingencia: formData.montoContingencia,
        depositoUSD: parseFloat(formData.depositoUSD) || 0,
        depositoEUR: parseFloat(formData.depositoEUR) || 0,
        fechaInicio: formData.fechaInicio,
        fechaVencimiento: formData.fechaVencimiento,
        statusContrato: formData.statusContrato,
        estacionamiento: formData.estacionamiento,
        observaciones: formData.observaciones,
        tipoRelacion: formData.tipoRelacion,
        fechaInicioRelacion: formData.fechaInicioRelacion,
        duracionRelacion: formData.duracionRelacion
      }), {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });

      if (response.data.success) {
        setMensaje('✅ Cliente actualizado correctamente');
        setTimeout(() => {
          onClose();
          window.location.reload(); // Recargar para actualizar la tabla
        }, 1500);
      } else {
        setError(response.data.message || 'Error al actualizar');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* ENCABEZADO */}
        <div className="bg-gradient-to-r from-terra-copper to-terra-navy text-white p-6 sticky top-0 flex justify-between items-center">
          <h2 className="text-2xl font-bold">✏️ Editar Cliente</h2>
          <button
            onClick={onClose}
            className="text-3xl hover:opacity-75 transition w-10 h-10 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 p-8 overflow-y-auto">
          {cargando && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terra-copper mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Cargando datos del cliente...</p>
            </div>
          )}

          {error && !cargando && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">❌ {error}</p>
            </div>
          )}

          {mensaje && !cargando && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-semibold">✅ {mensaje}</p>
            </div>
          )}

          {!cargando && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* SECCIÓN 1: DATOS PERSONALES */}
              <div>
                <h4 className="font-bold text-lg text-terra-copper mb-4 pb-3 border-b-2 border-terra-copper">👤 DATOS PERSONALES</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre <span className="text-red-500">*</span></label>
                      <input type="text" name="nombre" value={formData.nombre} onChange={handleNombreChange} required className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none" />
                      <p className="text-xs text-gray-500 mt-1">Solo letras (sin números ni símbolos)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Cédula <span className="text-red-500">*</span></label>
                      <input type="text" name="cedula" value={formData.cedula} onChange={handleCedulaChange} maxLength={10} required className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none" />
                      <p className="text-xs text-gray-500 mt-1">V/E/P/A/O + 8 dígitos</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                      <div className="flex gap-2">
                        <select
                          name="paisCodigo"
                          value={formData.paisCodigo}
                          onChange={handleChange}
                          className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none bg-white min-w-[110px]"
                        >
                          {PAISES.map(p => (
                            <option key={p.codigo} value={p.codigo}>{p.bandera} {p.codigo}</option>
                          ))}
                        </select>
                        <input type="text" name="telefono" placeholder="424-4325183" value={formData.telefono} onChange={handleTelefonoChange} className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {(() => {
                          const pais = PAISES.find(p => p.codigo === formData.paisCodigo) || PAISES[0];
                          return `${pais.nombre}: ${pais.maxDigitos} dígitos`;
                        })()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Correo</label>
                      <input type="email" name="correo" value={formData.correo} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none" />
                      <p className="text-xs text-gray-500 mt-1">Dominios permitidos: .com, .ve, .co, .ar, .cl, .mx, .es, .us, .net, .org, .edu, .gov, .gob, .mil, .tech, .io, .me, etc.</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">RIF</label>
                    <input type="text" name="rif" placeholder="J-12345678-3" value={formData.rif} onChange={handleRifChange} maxLength={12} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none" />
                    <p className="text-xs text-gray-500 mt-1">V/E/P/J/G/C + 8 dígitos + dígito verificador</p>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: UBICACIÓN */}
              <div>
                <h4 className="font-bold text-lg text-terra-copper mb-4 pb-3 border-b-2 border-terra-copper">🏢 UBICACIÓN</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Inmueble <span className="text-red-500">*</span></label>
                      <select name="inmueble" value={formData.inmueble} onChange={handleChange} required className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none">
                        <option value="">-- Selecciona --</option>
                        {INMUEBLES.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Ubicación <span className="text-red-500">*</span></label>
                      <input type="text" name="ubicacion" value={formData.ubicacion} onChange={handleChange} placeholder="Ej: Piso 1, PB" required className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Unidad <span className="text-red-500">*</span></label>
                    <input type="text" name="unidad" value={formData.unidad} onChange={handleChange} placeholder="Ej: 1-A, Local 3" required className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none" />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: DATOS FINANCIEROS */}
              <div>
                <h4 className="font-bold text-lg text-terra-copper mb-4 pb-3 border-b-2 border-terra-copper">💰 DATOS FINANCIEROS</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Canon Base USD <span className="text-red-500">*</span> <span className="text-orange-500 font-bold text-xs">🔒 SENSIBLE</span></label>
                      <input type="number" name="canonUSD" step="0.01" min="0.01" value={formData.canonUSD} onChange={handleChange} required className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Canon Base EUR</label>
                      <input type="number" name="canonEUR" step="0.01" min="0" value={calculados.canonEUR} readOnly className="w-full p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-600" />
                      <p className="text-xs text-terra-copper font-bold mt-1">⚡ Calculado automáticamente</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Moneda Principal <span className="text-red-500">*</span></label>
                    <select name="monedaPrincipal" value={formData.monedaPrincipal} onChange={handleChange} required className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none">
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Depósito Total USD <span className="text-red-500">*</span> <span className="text-orange-500 font-bold text-xs">🔒 SENSIBLE</span></label>
                      <input type="number" name="depositoUSD" step="0.01" min="0" value={formData.depositoUSD} onChange={handleChange} required className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Depósito Total EUR</label>
                      <input type="number" name="depositoEUR" step="0.01" min="0" value={formData.depositoEUR} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none" />
                      <p className="text-xs text-terra-copper font-bold mt-1">⚡ Déjalo vacío o en 0 para auto-calcularlo</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 4: PLAN CONTINGENCIA */}
              <div>
                <h4 className="font-bold text-lg text-terra-copper mb-4 pb-3 border-b-2 border-terra-copper">💰 PLAN DE CONTINGENCIA</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Contingencia <span className="text-red-500">*</span></label>
                    <select value={formData.tipoContingencia} onChange={(e) => handleContingenciaChange(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none">
                      <option value="Mensual">Mensual</option>
                      <option value="Anual USD">Anual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Monto Plan Contingencia <span className="text-red-500">*</span></label>
                    <input type="number" name="montoContingencia" value={formData.montoContingencia} onChange={handleChange} min="0" step="0.01" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none" />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 5: CONDICIONES DE PAGO */}
              <div>
                <h4 className="font-bold text-lg text-terra-copper mb-4 pb-3 border-b-2 border-terra-copper">📅 CONDICIONES DE PAGO</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Día de Pago (Período) <span className="text-red-500">*</span></label>
                      <input type="text" name="diaPago" value={formData.diaPago} readOnly placeholder="Esperando fecha inicio..." className="w-full p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed" />
                      <p className="text-xs text-terra-copper font-bold mt-1">
                        {calculados.mensajeMora ? `⚡ ${calculados.mensajeMora}` : '⚡ 5 días a partir del inicio'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Frecuencia Pago</label>
                      <select name="frecuenciaPago" value={formData.frecuenciaPago} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none">
                        <option value="Mensual">Mensual</option>
                        <option value="Trimestral">Trimestral</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Método de Pago <span className="text-red-500">*</span></label>
                    <select name="metodoPago" value={formData.metodoPago} onChange={handleChange} required className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none">
                      <option value="">-- Selecciona --</option>
                      <option value="Cash">Cash</option>
                      <option value="Zelle">Zelle</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="USDT">USDT</option>
                      <option value="Euro a Bs">Euro a Bs</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 6: CONTRATO */}
              <div>
                <h4 className="font-bold text-lg text-terra-copper mb-4 pb-3 border-b-2 border-terra-copper">📋 CONTRATO</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Inicio <span className="text-red-500">*</span> <span className="text-orange-500 font-bold text-xs">🔒 SENSIBLE</span></label>
                      <input
                        type="text"
                        value={formData.fechaInicio}
                        onChange={(e) => handleFechaChange('fechaInicio', e)}
                        placeholder="DD/MM/YYYY"
                        maxLength={10}
                        required
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Duración <span className="text-red-500">*</span></label>
                      <select name="duracionMeses" value={formData.duracionMeses} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none">
                        <option value="">Renovación...</option>
                        <option value="1">1 mes</option>
                        <option value="3">3 meses</option>
                        <option value="6">6 meses</option>
                        <option value="12">1 año (12 meses)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Vence <span className="text-red-500">*</span> <span className="text-orange-500 font-bold text-xs">🔒</span></label>
                      <input
                        type="text"
                        value={formData.fechaVencimiento}
                        onChange={(e) => handleFechaChange('fechaVencimiento', e)}
                        placeholder="DD/MM/YYYY"
                        maxLength={10}
                        required
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Status Contrato <span className="text-red-500">*</span></label>
                      <select name="statusContrato" value={formData.statusContrato} onChange={handleChange} required className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none">
                        <option value="Vigente">Vigente</option>
                        <option value="Vencido">Vencido</option>
                        <option value="Por Renovar">Por Renovar</option>
                        <option value="Sin Contrato">Sin Contrato</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Estacionamiento</label>
                      <select name="estacionamiento" value={formData.estacionamiento} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none">
                        <option value="No">No</option>
                        <option value="Sí">Sí</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 7: OBSERVACIONES */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Observaciones</label>
                <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} placeholder="Notas adicionales..." className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none resize-none h-20" />
              </div>

              {/* SECCIÓN 8: RELACIÓN ARRENDATARIA */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <h3 className="font-bold text-lg text-terra-copper mb-4">🤝 Relación Arrendataria</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Relación</label>
                    <select name="tipoRelacion" value={formData.tipoRelacion} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none bg-white">
                      <option value="">Seleccionar...</option>
                      <option value="Arrendatario Directo">Arrendatario Directo</option>
                      <option value="Coarrendatario">Coarrendatario</option>
                      <option value="Representante Legal">Representante Legal</option>
                      <option value="Ocupante">Ocupante</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Inicio Relación</label>
                    <input
                      type="text"
                      value={formData.fechaInicioRelacion}
                      onChange={(e) => handleFechaChange('fechaInicioRelacion', e)}
                      placeholder="DD/MM/YYYY"
                      maxLength={10}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Meses en Relación (Calculado)</label>
                    <input type="number" value={formData.duracionRelacion} disabled className="w-full p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 font-semibold" />
                    <p className="text-xs text-gray-500 mt-1">Se calcula automáticamente desde la fecha de inicio</p>
                  </div>
                </div>
              </div>

              {/* BOTONES */}
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={onClose} className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="flex-1 bg-terra-copper text-white py-3 rounded-lg font-semibold hover:bg-terra-copper-dark disabled:opacity-50 disabled:cursor-not-allowed transition">
                  {guardando ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default EditarClienteModal;
