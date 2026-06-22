import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { GAS_SCRIPT_URL } from '../services/api';

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const TIPO = {
  pago:       { dot: 'bg-green-500',  badge: 'bg-green-100 text-green-800',  icon: '✅', label: 'Al Día' },
  moroso:     { dot: 'bg-red-500',    badge: 'bg-red-100 text-red-800',      icon: '⚠️', label: 'Moroso' },
  pendiente:  { dot: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-800',  icon: '⏳', label: 'Pendiente' },
  renovacion: { dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800',icon: '🔄', label: 'Por Renovar' },
};

const FILTROS = [
  { key: 'todos',     label: '📅 Todos' },
  { key: 'morosos',   label: '⚠️ Morosos' },
  { key: 'pagados',   label: '✅ Al Día' },
  { key: 'pendientes',label: '⏳ Pendientes' },
  { key: 'renovacion',label: '🔄 Renovación' },
];

function filtrar(eventos, filtro) {
  if (filtro === 'todos') return eventos;
  if (filtro === 'morosos')    return eventos.filter(e => e.tipo === 'moroso');
  if (filtro === 'pagados')    return eventos.filter(e => e.tipo === 'pago');
  if (filtro === 'pendientes') return eventos.filter(e => e.tipo === 'pendiente');
  if (filtro === 'renovacion') return eventos.filter(e => e.tipo === 'renovacion');
  return eventos;
}

function AgendaCobros() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventos, setEventos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos');

  const [panelMode, setPanelMode] = useState(null);
  const [diaKey, setDiaKey] = useState(null);
  const [clienteEvt, setClienteEvt] = useState(null);
  const [mesesData, setMesesData] = useState(null);
  const [cargandoMeses, setCargandoMeses] = useState(false);
  const [detalleCliente, setDetalleCliente] = useState(null);
  const [mostrarModalEmail, setMostrarModalEmail] = useState(false);
  const [mesesSeleccionados, setMesesSeleccionados] = useState([]);
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  useEffect(() => {
    cargarCalendario();
  }, [currentDate]);

  const cargarCalendario = async () => {
    setCargando(true);
    setEventos({});
    cerrarPanel();
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const res = await axios.get(
        `${GAS_SCRIPT_URL}?action=getCalendarioData&year=${year}&month=${month}`
      );
      if (res.data.success) {
        setEventos(res.data.eventos || {});
      } else {
        toast.error('❌ Error cargando calendario');
      }
    } catch {
      toast.error('❌ Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  const abrirPanelDia = (key) => {
    const evts = filtrar(eventos[key] || [], filtro);
    if (evts.length === 0) return;
    setDiaKey(key);
    setClienteEvt(null);
    setMesesData(null);
    setPanelMode('dia');
  };

  const abrirDetalleCliente = async (evt) => {
    setClienteEvt(evt);
    setPanelMode('cliente');
    setCargandoMeses(true);
    setMesesData(null);
    setDetalleCliente(null);
    setMesesSeleccionados([]);
    try {
      // Cargar meses pendientes
      const resMeses = await axios.get(
        `${GAS_SCRIPT_URL}?action=getMesesPendientes&nombre=${encodeURIComponent(evt.nombre)}&inmueble=${encodeURIComponent(evt.inmueble)}`
      );
      if (resMeses.data.success) setMesesData(resMeses.data);

      // Cargar detalles completos del cliente (información de contacto)
      const resDetalle = await axios.get(
        `${GAS_SCRIPT_URL}?action=getClienteDetalles&nombre=${encodeURIComponent(evt.nombre)}&inmueble=${encodeURIComponent(evt.inmueble)}`
      );
      if (resDetalle.data && !resDetalle.data.error) setDetalleCliente(resDetalle.data);
    } catch {
      toast.error('❌ Error cargando detalle');
    } finally {
      setCargandoMeses(false);
    }
  };

  const cerrarPanel = () => {
    setPanelMode(null);
    setDiaKey(null);
    setClienteEvt(null);
    setMesesData(null);
    setDetalleCliente(null);
    setMostrarModalEmail(false);
    setMesesSeleccionados([]);
  };

  const irACobros = (mes = null) => {
    if (!clienteEvt) return;
    navigate('/cobros', {
      state: { cliente: clienteEvt.nombre, inmueble: clienteEvt.inmueble, mesCobro: mes }
    });
    cerrarPanel();
  };

  const toggleMesSeleccionado = (mes) => {
    setMesesSeleccionados(prev =>
      prev.includes(mes) ? prev.filter(m => m !== mes) : [...prev, mes]
    );
  };

  const seleccionarTodos = () => {
    if (mesesData?.meses) {
      const todosMeses = mesesData.meses
        .filter(m => !m.pagado)
        .map(m => m.mes);
      setMesesSeleccionados(todosMeses);
    }
  };

  const limpiarSeleccion = () => {
    setMesesSeleccionados([]);
  };

  const enviarEmailCobro = async () => {
    if (!clienteEvt || mesesSeleccionados.length === 0) {
      toast.error('❌ Selecciona al menos un mes');
      return;
    }

    setEnviandoEmail(true);
    try {
      // Construir array de meses con mora incluida
      const mesesConMora = mesesSeleccionados.map(mesNombre => {
        const mes = mesesData.meses.find(m => m.mes === mesNombre);
        return {
          mes: mesNombre,
          mora: mes?.mora || 0
        };
      });

      const response = await axios.post(GAS_SCRIPT_URL, JSON.stringify({
        action: 'enviarEmailCobro',
        nombre: clienteEvt.nombre,
        inmueble: clienteEvt.inmueble,
        meses: mesesConMora
      }), {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });

      if (response.data.success) {
        toast.success(`✅ ${response.data.message}`);
        setMostrarModalEmail(false);
        setMesesSeleccionados([]);
      } else {
        toast.error(`❌ ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('❌ Error al enviar email');
    } finally {
      setEnviandoEmail(false);
    }
  };

  // ── Construcción de la cuadrícula ──────────────────────────────────────
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const primerDia = new Date(year, month, 1).getDay();
  const diasMes = new Date(year, month + 1, 0).getDate();
  const diasMesAnt = new Date(year, month, 0).getDate();
  const hoy = new Date();
  const esHoy = (d) =>
    hoy.getFullYear() === year && hoy.getMonth() === month && hoy.getDate() === d;

  const celdas = [];
  for (let i = primerDia - 1; i >= 0; i--) celdas.push({ dia: diasMesAnt - i, otroMes: true });
  for (let d = 1; d <= diasMes; d++) celdas.push({ dia: d, otroMes: false });
  const resto = 7 - (celdas.length % 7);
  if (resto < 7) for (let d = 1; d <= resto; d++) celdas.push({ dia: d, otroMes: true });

  const keyDia = (d) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  // ── Panel lateral: lista de clientes del día ───────────────────────────
  const eventosDia = diaKey ? filtrar(eventos[diaKey] || [], filtro) : [];

  return (
    <div className="flex h-full">
      {/* ── CONTENIDO PRINCIPAL ─────────────────────────────────────────── */}
      <div className="flex-1 space-y-4 min-w-0">

        {/* Encabezado */}
        <div className="bg-gradient-to-r from-terra-copper to-terra-navy text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">📅 Agenda de Cobros</h1>
              <p className="text-sm opacity-90 mt-1">Visualiza y gestiona los cobros del mes</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setCurrentDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; })}
                className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition"
              >◀</button>
              <div className="px-3 py-2 bg-white/10 rounded-lg font-bold text-base min-w-[130px] text-center">
                {MESES[month]} {year}
              </div>
              <button
                onClick={() => setCurrentDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; })}
                className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition"
              >▶</button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition"
              >Hoy</button>
            </div>
          </div>
        </div>

        {/* Chips de filtro */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
          <div className="flex gap-2 flex-wrap">
            {FILTROS.map(f => (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  filtro === f.key
                    ? 'bg-terra-copper text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calendario */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Cabecera días */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="p-3 text-center text-xs font-bold text-terra-copper uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {cargando ? (
            <div className="grid grid-cols-7 gap-px bg-gray-100">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="bg-white min-h-[100px] animate-pulse">
                  <div className="m-2 h-4 bg-gray-200 rounded w-6"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-px bg-gray-100">
              {celdas.map((celda, idx) => {
                if (celda.otroMes) {
                  return (
                    <div key={idx} className="bg-gray-50 min-h-[60px] sm:min-h-[100px] p-1 sm:p-2">
                      <span className="text-xs text-gray-300 font-medium">{celda.dia}</span>
                    </div>
                  );
                }

                const key = keyDia(celda.dia);
                const todosEvts = eventos[key] || [];
                const evtsFiltrados = filtrar(todosEvts, filtro);
                const hayMoroso = todosEvts.some(e => e.tipo === 'moroso');
                const hayEventos = evtsFiltrados.length > 0;
                const esDiaHoy = esHoy(celda.dia);

                // Badge color: rojo si hay morosos, verde si todos pagados, naranja si mix
                const badgeColor = hayMoroso
                  ? 'bg-red-500'
                  : todosEvts.every(e => e.tipo === 'pago')
                  ? 'bg-green-500'
                  : 'bg-terra-copper';

                return (
                  <div
                    key={idx}
                    onClick={() => hayEventos && abrirPanelDia(key)}
                    className={[
                      'min-h-[60px] sm:min-h-[110px] p-1 sm:p-2 relative',
                      'transition-all duration-200',
                      hayEventos
                        ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:z-10'
                        : 'cursor-default',
                      esDiaHoy
                        ? 'bg-terra-copper/8 ring-2 ring-terra-copper ring-inset'
                        : hayMoroso && hayEventos
                        ? 'bg-red-50 hover:bg-red-100'
                        : hayEventos
                        ? 'bg-white hover:bg-blue-50/40'
                        : 'bg-white',
                    ].join(' ')}
                  >
                    {/* Número del día */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={[
                        'text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors',
                        esDiaHoy
                          ? 'bg-terra-copper text-white shadow-sm'
                          : 'text-gray-700',
                      ].join(' ')}>
                        {celda.dia}
                      </span>
                      {todosEvts.length > 0 && (
                        <span className={`text-xs ${badgeColor} text-white rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm`}>
                          {todosEvts.length}
                        </span>
                      )}
                    </div>

                    {/* Pulso rojo para días con morosos */}
                    {hayMoroso && (
                      <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-red-500 animate-ping opacity-75" />
                    )}

                    <div className="space-y-1">
                      {evtsFiltrados.slice(0, 3).map((evt, i) => {
                        const cfg = TIPO[evt.tipo] || TIPO.pendiente;
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-0.5 px-1 py-0.5 rounded-md text-[10px] sm:text-xs font-medium ${cfg.badge} truncate transition-transform duration-150 hover:scale-[1.03]`}
                          >
                            <span className="flex-shrink-0">{cfg.icon}</span>
                            <span className="truncate hidden sm:block">{evt.unidad || evt.nombre}</span>
                          </div>
                        );
                      })}
                      {evtsFiltrados.length > 3 && (
                        <div className="text-xs text-terra-copper font-bold px-1 mt-0.5">
                          +{evtsFiltrados.length - 3} más
                        </div>
                      )}
                    </div>

                    {/* Borde inferior animado al hover si hay eventos */}
                    {hayEventos && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-terra-copper scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left rounded-b" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Leyenda */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex gap-6 flex-wrap">
            {Object.entries(TIPO).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-2 text-sm text-gray-600">
                <div className={`w-3 h-3 rounded-full ${cfg.dot}`}></div>
                <span>{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PANEL LATERAL ───────────────────────────────────────────────── */}
      {panelMode && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={cerrarPanel}
        />
      )}

      <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${panelMode ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* ── MODO: Lista del día ───────────────────────────────── */}
        {panelMode === 'dia' && (
          <>
            <div className="bg-gradient-to-r from-terra-copper to-terra-navy text-white p-5 flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold">📅 {diaKey ? `${parseInt(diaKey.split('-')[2])} de ${MESES[month]}` : ''}</h2>
                <p className="text-sm opacity-80 mt-0.5">{eventosDia.length} cliente{eventosDia.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={cerrarPanel} className="text-2xl hover:opacity-70 transition">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {eventosDia.map((evt, i) => {
                const cfg = TIPO[evt.tipo] || TIPO.pendiente;
                return (
                  <button
                    key={i}
                    onClick={() => abrirDetalleCliente(evt)}
                    className="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-terra-copper hover:shadow-md transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${cfg.dot} flex items-center justify-center text-white text-lg flex-shrink-0`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{evt.nombre}</p>
                        <p className="text-xs text-gray-500">{evt.inmueble} • {evt.unidad}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-800">${(evt.canon || 0).toFixed(2)}</p>
                        {evt.mora > 0 && (
                          <p className="text-xs text-red-600 font-semibold">+${evt.mora.toFixed(2)} mora</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── MODO: Detalle del cliente ─────────────────────────── */}
        {panelMode === 'cliente' && clienteEvt && (
          <>
            <div className="bg-gradient-to-r from-terra-copper to-terra-navy text-white p-5 flex-shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <button
                    onClick={() => { setPanelMode('dia'); setClienteEvt(null); setMesesData(null); }}
                    className="text-xs opacity-70 hover:opacity-100 mb-2 flex items-center gap-1"
                  >
                    ← Volver
                  </button>
                  <h2 className="text-lg font-bold">{clienteEvt.nombre}</h2>
                  <p className="text-sm opacity-80">{clienteEvt.inmueble} • {clienteEvt.unidad}</p>
                </div>
                <button onClick={cerrarPanel} className="text-2xl hover:opacity-70 transition ml-4">✕</button>
              </div>
              {/* STATUS BADGE */}
              {clienteEvt?.statusContrato && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="text-xs opacity-70 mb-1">Estado del Contrato:</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    clienteEvt.statusContrato === 'Vigente' ? 'bg-green-500/80' :
                    clienteEvt.statusContrato === 'Moroso' ? 'bg-red-500/80' :
                    clienteEvt.statusContrato === 'Por Renovar' ? 'bg-blue-500/80' :
                    clienteEvt.statusContrato === 'Vencido' ? 'bg-orange-500/80' :
                    'bg-gray-500/80'
                  }`}>
                    {clienteEvt.statusContrato === 'Vigente' && '✅ Vigente'}
                    {clienteEvt.statusContrato === 'Moroso' && '⚠️ Moroso'}
                    {clienteEvt.statusContrato === 'Por Renovar' && '🔄 Por Renovar'}
                    {clienteEvt.statusContrato === 'Vencido' && '❌ Vencido'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {cargandoMeses ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-10 h-10 border-4 border-terra-copper border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-gray-500 text-sm">Cargando detalle...</p>
                </div>
              ) : mesesData ? (
                <div className="p-4 space-y-4">
                  {/* ESTADO DEL CONTRATO */}
                  {clienteEvt?.statusContrato && (
                    <div className={`border rounded-lg p-3 ${
                      clienteEvt.statusContrato === 'Vigente' ? 'bg-green-50 border-green-200' :
                      clienteEvt.statusContrato === 'Moroso' ? 'bg-red-50 border-red-200' :
                      clienteEvt.statusContrato === 'Por Renovar' ? 'bg-blue-50 border-blue-200' :
                      clienteEvt.statusContrato === 'Vencido' ? 'bg-orange-50 border-orange-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <p className={`text-xs font-bold uppercase mb-2 ${
                        clienteEvt.statusContrato === 'Vigente' ? 'text-green-700' :
                        clienteEvt.statusContrato === 'Moroso' ? 'text-red-700' :
                        clienteEvt.statusContrato === 'Por Renovar' ? 'text-blue-700' :
                        clienteEvt.statusContrato === 'Vencido' ? 'text-orange-700' :
                        'text-gray-700'
                      }`}>
                        {clienteEvt.statusContrato === 'Vigente' && '✅ Estado: Vigente'}
                        {clienteEvt.statusContrato === 'Moroso' && '⚠️ Estado: Moroso'}
                        {clienteEvt.statusContrato === 'Por Renovar' && '🔄 Estado: Por Renovar'}
                        {clienteEvt.statusContrato === 'Vencido' && '❌ Estado: Vencido'}
                      </p>
                      <div className={`text-xs space-y-1 ${
                        clienteEvt.statusContrato === 'Vigente' ? 'text-green-900' :
                        clienteEvt.statusContrato === 'Moroso' ? 'text-red-900' :
                        clienteEvt.statusContrato === 'Por Renovar' ? 'text-blue-900' :
                        clienteEvt.statusContrato === 'Vencido' ? 'text-orange-900' :
                        'text-gray-900'
                      }`}>
                        {clienteEvt.statusContrato === 'Vigente' && <p>Contrato activo y al día con los pagos.</p>}
                        {clienteEvt.statusContrato === 'Moroso' && <p>⚠️ Cliente con pagos vencidos. Requiere atención urgente.</p>}
                        {clienteEvt.statusContrato === 'Por Renovar' && <p>🔄 Contrato próximo a vencer. Renovación requerida en próximos días.</p>}
                        {clienteEvt.statusContrato === 'Vencido' && <p>❌ Contrato ya venció. Renovación urgente.</p>}
                      </div>
                    </div>
                  )}

                  {/* INFORMACIÓN DE CONTACTO */}
                  {detalleCliente && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs font-bold text-blue-700 uppercase mb-2">📱 Información de Contacto</p>
                      <div className="text-xs space-y-1 text-blue-900">
                        {detalleCliente.correo && (
                          <div><strong>Email:</strong> {detalleCliente.correo}</div>
                        )}
                        {detalleCliente.telefono && (
                          <div><strong>Teléfono:</strong> {detalleCliente.telefono}</div>
                        )}
                        {detalleCliente.metodoPago && (
                          <div><strong>Método de Pago:</strong> {detalleCliente.metodoPago}</div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Resumen */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 font-semibold uppercase">Pagados</p>
                      <p className="text-2xl font-bold text-green-600">
                        {mesesData.totalMeses - mesesData.totalMesesPendientes}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 font-semibold uppercase">Pendientes</p>
                      <p className="text-2xl font-bold text-red-600">{mesesData.totalMesesPendientes}</p>
                    </div>
                  </div>

                  {mesesData.totalMesesPendientes > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-xs text-orange-700 font-semibold uppercase mb-1">Deuda Total</p>
                      <p className="text-2xl font-bold text-orange-800">${mesesData.totalAdeudado.toFixed(2)}</p>
                      <p className="text-xs text-orange-600 mt-1">
                        Canon: ${mesesData.canonAdeudado.toFixed(2)} + Mora: ${mesesData.moraTotalAcumulada.toFixed(2)}
                      </p>
                    </div>
                  )}

                  {/* Lista de meses */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Meses del contrato</p>
                    <div className="space-y-2">
                      {mesesData.meses.map((mes, i) => {
                        const canonMes = mesesData.totalMesesPendientes > 0
                          ? mesesData.canonAdeudado / mesesData.totalMesesPendientes
                          : clienteEvt.canon || 0;
                        return (
                          <div
                            key={i}
                            className={`rounded-lg p-3 flex items-center justify-between ${mes.pagado ? 'bg-green-50' : 'bg-red-50'}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">{mes.pagado ? '✅' : '⏳'}</span>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{mes.mes}</p>
                                {!mes.pagado && mes.diasRetraso > 0 && (
                                  <p className="text-xs text-red-600">{mes.diasRetraso} días de retraso</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {!mes.pagado && (
                                <>
                                  <p className="text-xs text-gray-600">${(canonMes + (mes.mora || 0)).toFixed(2)}</p>
                                  <button
                                    onClick={() => irACobros(mes.mes)}
                                    className="mt-1 text-xs px-3 py-1 bg-terra-copper text-white rounded-lg font-semibold hover:bg-terra-copper-dark transition"
                                  >
                                    Pagar
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <p>No se pudo cargar el detalle</p>
                </div>
              )}
            </div>

            {/* Footer con acciones principales */}
            <div className="p-4 border-t border-gray-100 flex-shrink-0 space-y-2">
              <button
                onClick={() => irACobros(null)}
                className="w-full py-3 bg-terra-navy hover:bg-terra-copper text-white font-bold rounded-xl transition"
              >
                💳 Registrar Pago
              </button>
              <button
                onClick={() => setMostrarModalEmail(true)}
                className="w-full py-2 bg-cyan-100 hover:bg-cyan-200 text-cyan-700 font-semibold rounded-xl transition text-sm"
              >
                📧 Enviar Email de Cobro
              </button>
              <button
                onClick={cerrarPanel}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition text-sm"
              >
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>

      {/* MODAL: Seleccionar Meses para Email de Cobro */}
      {mostrarModalEmail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Encabezado */}
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">📧 Enviar Email de Cobro</h2>
                <p className="text-sm opacity-90 mt-1">{clienteEvt?.nombre}</p>
              </div>
              <button
                onClick={() => setMostrarModalEmail(false)}
                className="text-2xl hover:opacity-70 transition"
              >
                ✕
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {mesesData?.meses ? (
                <>
                  {/* Selector de meses */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Selecciona los meses a incluir:</p>
                    {mesesData.meses
                      .filter(m => !m.pagado)
                      .map((mes, i) => (
                        <label key={i} className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mesesSeleccionados.includes(mes.mes)}
                            onChange={() => toggleMesSeleccionado(mes.mes)}
                            className="w-4 h-4 accent-cyan-600"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{mes.mes}</p>
                            <p className="text-xs text-gray-500">
                              ${((mesesData.canonAdeudado / mesesData.totalMesesPendientes) + (mes.mora || 0)).toFixed(2)}
                            </p>
                          </div>
                        </label>
                      ))}
                  </div>

                  {/* Botones de acciones rápidas */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={seleccionarTodos}
                      className="flex-1 text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition"
                    >
                      Seleccionar Todo
                    </button>
                    <button
                      onClick={limpiarSeleccion}
                      className="flex-1 text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                    >
                      Limpiar
                    </button>
                  </div>

                  {/* Resumen */}
                  {mesesSeleccionados.length > 0 && (() => {
                    const totalAEnviar = mesesSeleccionados.reduce((sum, mesNombre) => {
                      const mes = mesesData.meses.find(m => m.mes === mesNombre);
                      if (mes) {
                        const montoMes = (mesesData.canonAdeudado / mesesData.totalMesesPendientes) + (mes.mora || 0);
                        return sum + montoMes;
                      }
                      return sum;
                    }, 0);

                    return (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs text-amber-700 font-semibold uppercase mb-1">Total a Enviar</p>
                        <p className="text-sm text-amber-900 mb-1">
                          {mesesSeleccionados.length} mes{mesesSeleccionados.length !== 1 ? 'es' : ''}
                        </p>
                        <p className="text-lg font-bold text-amber-900">
                          ${totalAEnviar.toFixed(2)} USD
                        </p>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <p className="text-center text-gray-500 py-4">No hay meses pendientes</p>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 flex gap-2">
              <button
                onClick={() => setMostrarModalEmail(false)}
                className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={enviarEmailCobro}
                disabled={enviandoEmail || mesesSeleccionados.length === 0}
                className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
              >
                {enviandoEmail ? '⏳ Enviando...' : '📧 Enviar Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgendaCobros;
