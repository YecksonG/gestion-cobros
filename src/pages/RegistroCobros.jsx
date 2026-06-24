import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import DatePicker, { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
import 'react-datepicker/dist/react-datepicker.css';
import { registrarNuevoPago, GAS_SCRIPT_URL } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

registerLocale('es', es);

function RegistroCobros() {
  const location = useLocation();
  const { usuario } = useAuth();
  const [esRenovacion, setEsRenovacion] = useState(false);
  const [renovarContrato, setRenovarContrato] = useState(false);
  const [preparandoCobro, setPreparandoCobro] = useState(false);

  // 1. ESTADO DEL FORMULARIO
  const [formData, setFormData] = useState({
    inmueble: '',
    cliente: '',
    mesesSeleccionados: [],
    pagoRecibido: '',
    fecha: null,
    referencia: '',
    sinMora: false
  });

  // 2. ESTADO DE CARGA
  const [cargandoClientes, setCargandoClientes] = useState(false);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);
  const [cargandoMeses, setCargandoMeses] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // 3. DATOS DINÁMICOS
  const [clientesDisponibles, setClientesDisponibles] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mesesDisponibles, setMesesDisponibles] = useState([]);
  const [creditoDisponible, setCreditoDisponible] = useState(0);
  const [creditoAplicado, setCreditoAplicado] = useState(0);

  // 4. CÁLCULOS
  const [desgloseMeses, setDesgloseMeses] = useState([]);
  const [totalCanon, setTotalCanon] = useState(0);
  const [totalMora, setTotalMora] = useState(0);
  const [totalACobrar, setTotalACobrar] = useState(0);

  const INMUEBLES = ['Tulipanes', 'Remanso', 'El Morro'];

  // DETECTAR SI VIENE DE RENOVACIÓN O AGENDA
  useEffect(() => {
    if (location.state?.renovacion) {
      setEsRenovacion(true);
      setFormData(prev => ({
        ...prev,
        inmueble: location.state.inmueble || '',
        cliente: location.state.nombreCliente || '',
        pagoRecibido: location.state.montoRenovacion?.toString() || '50',
        referencia: `Renovación Contrato #${location.state.numeroContrato}`
      }));
    } else if (location.state?.cliente) {
      // Viene de AgendaCobros con cliente pre-seleccionado
      setPreparandoCobro(true);
      setFormData(prev => ({
        ...prev,
        inmueble: location.state.inmueble || '',
        cliente: location.state.cliente || ''
      }));
      // Simular "preparando cobro"
      setTimeout(() => setPreparandoCobro(false), 1000);
    }
  }, [location.state]);

  // CARGAR CLIENTES AL CAMBIAR INMUEBLE
  useEffect(() => {
    if (formData.inmueble && !esRenovacion) {
      cargarClientesPorInmueble();
    } else {
      setClientesDisponibles([]);
      setClienteSeleccionado(null);
      setMesesDisponibles([]);
      setDesgloseMeses([]);
      setCreditoAplicado(0);
      setFormData(prev => ({ ...prev, cliente: '', mesesSeleccionados: [] }));
    }
  }, [formData.inmueble]);

  // CARGAR CLIENTES
  const cargarClientesPorInmueble = async () => {
    setCargandoClientes(true);
    try {
      const response = await axios.get(`${GAS_SCRIPT_URL}?action=getInquilinos`);
      const clientesValidos = (response.data || []).filter(
        (c) =>
          c.nombre &&
          typeof c.nombre === 'string' &&
          c.nombre.trim() !== '' &&
          c.status !== 'Inactivo' &&
          c.status !== 'Para Dar de Baja'
      );
      const clientesDelInmueble = clientesValidos.filter(
        (c) => c.inmueble === formData.inmueble
      );
      setClientesDisponibles(clientesDelInmueble);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      setClientesDisponibles([]);
    } finally {
      setCargandoClientes(false);
    }
  };

  // SELECCIONAR CLIENTE Y CARGAR MESES
  const handleClienteChange = async (nombreCliente) => {
    setFormData(prev => ({ ...prev, cliente: nombreCliente, mesesSeleccionados: [] }));
    setMesesDisponibles([]);
    setDesgloseMeses([]);

    if (!nombreCliente) {
      setClienteSeleccionado(null);
      setCreditoAplicado(0);
      setCreditoDisponible(0);
      return;
    }

    setCargandoDetalles(true);
    setCargandoMeses(true);

    try {
      // Cargar detalles
      const resDetalle = await axios.get(
        `${GAS_SCRIPT_URL}?action=getClienteDetalles&nombre=${encodeURIComponent(nombreCliente)}&inmueble=${encodeURIComponent(formData.inmueble)}`
      );
      if (resDetalle.data && !resDetalle.data.error) {
        setClienteSeleccionado(resDetalle.data);
        setCreditoDisponible(resDetalle.data.creditoDisponible || 0);  // 🆕 Cargar crédito
      }

      // Cargar meses pendientes
      const resMeses = await axios.get(
        `${GAS_SCRIPT_URL}?action=getMesesPendientes&nombre=${encodeURIComponent(nombreCliente)}&inmueble=${encodeURIComponent(formData.inmueble)}`
      );
      if (resMeses.data.success && resMeses.data.meses) {
        const mesesPendientes = resMeses.data.meses.filter(m => !m.pagado);
        setMesesDisponibles(mesesPendientes);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('❌ Error cargando datos');
      setClienteSeleccionado(null);
    } finally {
      setCargandoDetalles(false);
      setCargandoMeses(false);
    }
  };

  // MANEJAR SELECCIÓN DE MESES
  const toggleMesSeleccionado = (mes) => {
    setFormData(prev => {
      const nuevos = prev.mesesSeleccionados.includes(mes)
        ? prev.mesesSeleccionados.filter(m => m !== mes)
        : [...prev.mesesSeleccionados, mes];
      return { ...prev, mesesSeleccionados: nuevos };
    });
  };

  // SELECCIONAR TODOS LOS MESES
  const seleccionarTodosMeses = () => {
    const todosMeses = mesesDisponibles.map(m => m.mes);
    setFormData(prev => ({ ...prev, mesesSeleccionados: todosMeses }));
  };

  // LIMPIAR SELECCIÓN DE MESES
  const limpiarMesSeleccionados = () => {
    setFormData(prev => ({ ...prev, mesesSeleccionados: [] }));
  };

  // CALCULAR DESGLOSE CUANDO CAMBIEN MESES O EL CHECKBOX DE RENOVACIÓN
  useEffect(() => {
    if (formData.mesesSeleccionados.length > 0 && clienteSeleccionado && mesesDisponibles.length > 0) {
      calcularDesglose();
    } else {
      setDesgloseMeses([]);
      setTotalCanon(0);
      setTotalMora(0);
      setTotalACobrar(0);
    }
  }, [formData.mesesSeleccionados, clienteSeleccionado, renovarContrato]);

  // RECALCULAR TOTALES CUANDO CAMBIA "SIN MORA"
  useEffect(() => {
    if (desgloseMeses.length > 0) {
      const moraAplicada = formData.sinMora ? 0 : totalMora;
      const subtotal = totalCanon + moraAplicada;
      const credito = Math.min(creditoDisponible, subtotal);
      const totalFinal = Math.max(0, subtotal - credito);
      setCreditoAplicado(credito);
      setTotalACobrar(totalFinal);
      setFormData(prev => ({ ...prev, pagoRecibido: totalFinal.toFixed(2) }));
    }
  }, [formData.sinMora]);

  // CALCULAR DESGLOSE POR MESES
  const calcularDesglose = () => {
    const canon = clienteSeleccionado?.canonBaseUSD || 0;
    const contingencia = clienteSeleccionado?.planContingenciaUSD || 5;
    const canonPorMes = canon + contingencia;

    const desglose = formData.mesesSeleccionados.map(mesTxt => {
      const mesDato = mesesDisponibles.find(m => m.mes === mesTxt);
      const mora = mesDato?.mora || 0;
      const subtotal = canonPorMes + mora;
      return {
        mes: mesTxt,
        canon: canonPorMes,
        mora,
        subtotal
      };
    });

    const sumaCanon = desglose.reduce((s, d) => s + d.canon, 0);
    const sumaMora = desglose.reduce((s, d) => s + d.mora, 0);
    const costoRenovacion = renovarContrato ? (clienteSeleccionado?.costoRenovacion || 50) : 0;
    const sumaTotal = sumaCanon + sumaMora + costoRenovacion;

    // Aplicar crédito disponible automáticamente
    const credito = Math.min(creditoDisponible, sumaTotal);
    const totalFinal = Math.max(0, sumaTotal - credito);

    setDesgloseMeses(desglose);
    setTotalCanon(sumaCanon);
    setTotalMora(sumaMora);
    setCreditoAplicado(credito);
    setTotalACobrar(totalFinal);
    setFormData(prev => ({ ...prev, pagoRecibido: totalFinal.toFixed(2) }));
  };

  // REGISTRAR PAGO
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!clienteSeleccionado) {
      toast.error('❌ Debe seleccionar un cliente válido');
      return;
    }

    if (formData.mesesSeleccionados.length === 0 && !esRenovacion) {
      toast.error('❌ Debe seleccionar al menos un mes');
      return;
    }

    if (!formData.pagoRecibido || !formData.fecha) {
      toast.error('❌ Complete pago recibido y fecha');
      return;
    }

    setEnviando(true);
    try {
      // Para renovación, registrar como un pago especial
      if (esRenovacion) {
        const respuesta = await registrarNuevoPago({
          inmueble: formData.inmueble,
          cliente: formData.cliente,
          monto: parseFloat(formData.pagoRecibido),
          fecha: formatearFecha(formData.fecha),
          referencia: formData.referencia,
          sinMora: true,
          usarCredito: creditoDisponible > 0,
          mesCobro: 'Renovación',
          esRenovacion: true,
          numeroContrato: clienteSeleccionado?.id,
          gestorNombre: usuario?.nombre || '',
          gestorEmail: usuario?.email || ''
        });

        if (respuesta.success) {
          toast.success('✅ Renovación registrada');
          setFormData({
            inmueble: formData.inmueble,
            cliente: '',
            mesesSeleccionados: [],
            pagoRecibido: '',
            fecha: null,
            referencia: ''
          });
          setClienteSeleccionado(null);
        } else {
          toast.error('❌ ' + respuesta.error);
        }
      } else {
        // Para meses normales, registrar pago consolidado
        const respuesta = await registrarNuevoPago({
          inmueble: formData.inmueble,
          cliente: formData.cliente,
          monto: parseFloat(formData.pagoRecibido),
          fecha: formatearFecha(formData.fecha),
          referencia: formData.referencia,
          sinMora: formData.sinMora,
          usarCredito: creditoDisponible > 0,
          mesCobro: formData.mesesSeleccionados.join(', '),
          esRenovacion: renovarContrato,
          numeroContrato: renovarContrato ? clienteSeleccionado?.id : undefined,
          gestorNombre: usuario?.nombre || '',
          gestorEmail: usuario?.email || ''
        });

        if (respuesta.success) {
          toast.success('✅ ' + respuesta.message);
          setFormData({
            inmueble: formData.inmueble,
            cliente: '',
            mesesSeleccionados: [],
            pagoRecibido: '',
            fecha: null,
            referencia: ''
          });
          setClienteSeleccionado(null);
          setMesesDisponibles([]);
          setDesgloseMeses([]);
        } else {
          toast.error('❌ ' + respuesta.error);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('❌ Error de conexión');
    } finally {
      setEnviando(false);
    }
  };

  const formatearFecha = (fechaObj) => {
    if (!fechaObj) return '';
    const fecha = new Date(fechaObj);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const año = fecha.getFullYear();
    return `${dia}/${mes}/${año}`;
  };

  // LOADING DE PREPARACIÓN
  if (preparandoCobro) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center min-h-96">
        <div className="w-12 h-12 border-4 border-terra-copper border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-semibold">⏳ Preparando el cobro del cliente...</p>
        <p className="text-sm text-gray-500 mt-2">Por favor espera mientras se cargan los datos</p>
      </div>
    );
  }

  return (
    <div className="content-enter max-w-4xl mx-auto pb-16">
      <div className="relative bg-gradient-to-r from-terra-copper to-terra-navy rounded-2xl p-6 text-white overflow-hidden shadow-lg mb-4">
        <div className="absolute top-0 right-0 w-64 h-full bg-terra-gold/10 blur-2xl rounded-full" />
        <div className="relative z-10">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-1">Gestión de Cobros</p>
          <h1 className="text-2xl font-black tracking-tight">Registrar Pago</h1>
          <p className="text-sm text-white/70 mt-1">Seleccione inmueble, arrendatario, meses y complete los datos del pago.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {esRenovacion && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 m-6">
            <p className="text-green-800 font-semibold">🔄 Costo de Renovación: $50 USD</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

        {/* PASO 1 y 2: Inmueble y Arrendatario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inmueble */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📍 Inmueble</label>
            <select
              value={formData.inmueble}
              onChange={(e) => setFormData(prev => ({ ...prev, inmueble: e.target.value }))}
              disabled={esRenovacion}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper focus:border-transparent outline-none bg-white disabled:bg-gray-100"
              required
            >
              <option value="">Seleccione inmueble...</option>
              {INMUEBLES.map(inm => (
                <option key={inm} value={inm}>{inm}</option>
              ))}
            </select>
          </div>

          {/* Arrendatario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">👤 Arrendatario</label>
            <select
              value={formData.cliente}
              onChange={(e) => handleClienteChange(e.target.value)}
              disabled={!formData.inmueble || cargandoClientes || esRenovacion}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper focus:border-transparent outline-none bg-white disabled:bg-gray-100"
              required
            >
              <option value="">
                {cargandoClientes ? 'Cargando...' : 'Seleccione arrendatario...'}
              </option>
              {clientesDisponibles.map(c => (
                <option key={c.id} value={c.nombre}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* INFORMACIÓN DEL CLIENTE */}
        {cargandoDetalles && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-terra-copper border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-600">Cargando datos del cliente...</p>
          </div>
        )}

        {clienteSeleccionado && !esRenovacion && (
          <div className="bg-terra-cream border border-terra-gold/30 rounded-lg p-4">
            <h4 className="font-bold text-terra-copper mb-3">📋 Datos del Arrendatario</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600 text-xs">Cédula</p>
                <p className="font-semibold">{clienteSeleccionado.cedula || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs">Día de Pago</p>
                <p className="font-semibold">{clienteSeleccionado.diaPago || '18'}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs">Canon Base USD</p>
                <p className="font-semibold">${(clienteSeleccionado.canonBaseUSD || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs">Plan Contingencia</p>
                <p className="font-semibold">${(clienteSeleccionado.planContingenciaUSD || 5).toFixed(2)}</p>
              </div>
            </div>
            {creditoDisponible > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200 flex items-center gap-3">
                <span className="text-sm font-semibold text-green-700">💳 Saldo a favor:</span>
                <span className="text-lg font-bold text-green-600">${creditoDisponible.toFixed(2)} USD</span>
                <span className="text-xs text-green-500">(se aplicará automáticamente al total)</span>
              </div>
            )}
          </div>
        )}

        {/* PASO 3: SELECCIONAR MESES (solo si NO es renovación) */}
        {!esRenovacion && clienteSeleccionado && (
          <>
            {/* OPCIÓN DE RENOVACIÓN (si vence en ≤45 días) */}
            {clienteSeleccionado.diasParaVencer !== null &&
             clienteSeleccionado.diasParaVencer !== undefined &&
             clienteSeleccionado.diasParaVencer <= 45 && (
              <label className="flex items-center gap-3 p-3 bg-terra-gold/10 border-2 border-terra-gold rounded-lg cursor-pointer hover:bg-terra-gold/20 transition">
                <input
                  type="checkbox"
                  checked={renovarContrato}
                  onChange={() => setRenovarContrato(prev => !prev)}
                  className="w-4 h-4 accent-terra-copper"
                />
                <div className="flex-1">
                  <p className="font-bold text-terra-copper">🔄 Renovar Contrato</p>
                  <p className="text-xs text-gray-600">
                    {clienteSeleccionado.diasParaVencer <= 0
                      ? 'Contrato vencido'
                      : `Vence en ${clienteSeleccionado.diasParaVencer} días`
                    } — Costo: ${clienteSeleccionado.costoRenovacion || 50}
                  </p>
                </div>
                {renovarContrato && (
                  <span className="text-xs font-bold bg-terra-copper text-white px-2 py-0.5 rounded-full">
                    +${clienteSeleccionado.costoRenovacion || 50}
                  </span>
                )}
              </label>
            )}

            {cargandoMeses ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-terra-copper border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600">Cargando meses pendientes...</p>
              </div>
            ) : mesesDisponibles.length > 0 ? (
              <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-orange-900">📅 Paso 3: Selecciona Meses a Pagar</h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={seleccionarTodosMeses}
                      className="px-3 py-1.5 text-xs font-semibold bg-terra-copper hover:bg-terra-copper-dark text-white rounded-lg transition"
                    >
                      ✓ Todos
                    </button>
                    <button
                      type="button"
                      onClick={limpiarMesSeleccionados}
                      className="px-3 py-1.5 text-xs font-semibold bg-gray-400 hover:bg-gray-500 text-white rounded transition"
                    >
                      ✕ Limpiar
                    </button>
                  </div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {mesesDisponibles.map(mes => (
                    <label key={mes.mes} className="flex items-center gap-3 p-2 border border-orange-200 rounded-lg hover:bg-orange-100 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={formData.mesesSeleccionados.includes(mes.mes)}
                        onChange={() => toggleMesSeleccionado(mes.mes)}
                        className="w-4 h-4 accent-orange-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{mes.mes}</p>
                        <p className="text-xs text-gray-600">
                          ${((clienteSeleccionado.canonBaseUSD || 0) + (clienteSeleccionado.planContingenciaUSD || 5) + (mes.mora || 0)).toFixed(2)}
                        </p>
                      </div>
                      {mes.mora > 0 && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-semibold">
                          +${mes.mora.toFixed(2)} mora
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-semibold">✅ Sin meses pendientes a cobrar</p>
              </div>
            )}
          </>
        )}

        {/* PASO 4: DESGLOSE (solo si hay meses seleccionados) */}
        {desgloseMeses.length > 0 && (
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <h4 className="font-bold text-green-900 mb-3">📊 Paso 4: Desglose de Meses</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-green-100 text-green-900">
                    <th className="text-left p-2">Mes</th>
                    <th className="text-right p-2">Canon</th>
                    <th className="text-right p-2">Mora {formData.sinMora && '(No Aplicable)'}</th>
                    <th className="text-right p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {desgloseMeses.map((d, i) => (
                    <tr key={i} className="border-t border-green-200 hover:bg-green-100/50">
                      <td className="p-2">{d.mes}</td>
                      <td className="text-right p-2">${d.canon.toFixed(2)}</td>
                      <td className={`text-right p-2 font-semibold ${formData.sinMora ? 'text-gray-400 line-through' : 'text-red-600'}`}>
                        ${formData.sinMora ? '0.00' : d.mora.toFixed(2)}
                      </td>
                      <td className="text-right p-2 font-bold text-green-900">
                        ${formData.sinMora ? d.canon.toFixed(2) : d.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* RESUMEN TOTAL */}
            <div className="mt-4 bg-white border border-green-300 rounded-lg p-3 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-600">Total Canon</p>
                  <p className="text-2xl font-bold text-gray-900">${totalCanon.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Mora</p>
                  <p className={`text-2xl font-bold ${formData.sinMora ? 'text-gray-400 line-through' : 'text-red-600'}`}>
                    ${formData.sinMora ? '0.00' : totalMora.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Línea de renovación */}
              {renovarContrato && (
                <div className="flex items-center justify-between bg-terra-gold/10 border border-terra-gold/40 rounded-lg px-4 py-2">
                  <div>
                    <p className="text-sm font-semibold text-terra-copper">🔄 Costo renovación contrato</p>
                    <p className="text-xs text-gray-500">Se renovará automáticamente al registrar</p>
                  </div>
                  <p className="text-xl font-bold text-terra-copper">
                    +${(clienteSeleccionado?.costoRenovacion || 50).toFixed(2)}
                  </p>
                </div>
              )}

              {/* Línea de crédito */}
              {creditoAplicado > 0 && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  <div>
                    <p className="text-sm font-semibold text-green-700">💳 Crédito a favor aplicado</p>
                    <p className="text-xs text-green-500">Saldo disponible: ${creditoDisponible.toFixed(2)}</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">−${creditoAplicado.toFixed(2)}</p>
                </div>
              )}

              {/* Total final */}
              <div className={`rounded-lg p-3 text-center ${creditoAplicado > 0 ? 'bg-blue-50 border border-blue-200' : 'bg-green-100'}`}>
                <p className={`text-xs font-semibold ${creditoAplicado > 0 ? 'text-blue-700' : 'text-green-700'}`}>
                  Total a Pagar
                </p>
                <p className={`text-3xl font-bold ${creditoAplicado > 0 ? 'text-blue-900' : 'text-green-900'}`}>
                  ${totalACobrar.toFixed(2)}
                </p>
                {creditoAplicado > 0 && (
                  <p className="text-xs text-blue-500 mt-1">
                    Subtotal ${(totalCanon + (formData.sinMora ? 0 : totalMora)).toFixed(2)} − Crédito ${creditoAplicado.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            {/* AVISO SI NO APLICA MORA */}
            {formData.sinMora && (
              <div className="mt-3 bg-terra-cream border border-terra-gold/30 rounded-lg p-3">
                <p className="text-sm text-terra-copper-dark font-semibold">⚠️ La mora ha sido exenta en este pago</p>
                <p className="text-xs text-terra-copper/70 mt-1">Se registrará solo el canon sin cargos adicionales</p>
              </div>
            )}
          </div>
        )}

        {/* PASO 5, 6, 7: PAGO, FECHA Y REFERENCIA */}
        {(esRenovacion || formData.mesesSeleccionados.length > 0) && (
          <div className="border border-terra-gold/20 rounded-xl p-4 bg-gradient-to-r from-terra-cream to-terra-cream-mid">
            <h4 className="font-bold text-terra-navy mb-4">
              {esRenovacion ? '💳 Datos de Pago (Renovación)' : '💳 Paso 5-7: Datos de Pago'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pago Recibido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pago Recibido (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.pagoRecibido}
                  onChange={(e) => setFormData(prev => ({ ...prev, pagoRecibido: e.target.value }))}
                  placeholder="0.00"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper"
                  required
                />
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Pago</label>
                <DatePicker
                  selected={formData.fecha}
                  onChange={(date) => setFormData(prev => ({ ...prev, fecha: date }))}
                  dateFormat="dd/MM/yyyy"
                  locale="es"
                  placeholderText="DD/MM/YYYY"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper"
                  required
                />
              </div>

              {/* Referencia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de Referencia</label>
                <input
                  type="text"
                  value={formData.referencia}
                  onChange={(e) => setFormData(prev => ({ ...prev, referencia: e.target.value }))}
                  placeholder="Ej: ZEL-12345, TRF-67890"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper"
                />
              </div>
            </div>

            {/* Checkbox Sin Mora */}
            {!esRenovacion && (
              <div className="mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sinMora}
                    onChange={(e) => setFormData(prev => ({ ...prev, sinMora: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">No aplicar mora en este pago</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* BOTÓN SUBMIT */}
        {(esRenovacion || formData.mesesSeleccionados.length > 0) && (
          <button
            type="submit"
            disabled={enviando}
            className="w-full py-3 bg-gradient-to-r from-terra-copper to-terra-copper-dark hover:from-terra-copper-dark hover:to-[#6a3a22] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow-sm"
          >
            {enviando ? '⏳ Registrando pago...' : '✅ Registrar Pago'}
          </button>
        )}
        </form>
      </div>
    </div>
  );
}

export default RegistroCobros;
