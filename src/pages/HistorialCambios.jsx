import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { GAS_SCRIPT_URL } from '../services/api';
import { useAuth } from '../hooks/useAuth';

function HistorialCambios() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [ultimaCarga, setUltimaCarga] = useState(null);
  const [totalCargado, setTotalCargado] = useState(0);
  const [mostrarModalLimpiar, setMostrarModalLimpiar] = useState(false);
  const [pinLimpiar, setPinLimpiar] = useState('');
  const [limpando, setLimpando] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState('cambios'); // 'cambios' | 'pagos' | 'bugs'
  const [pagos, setPagos] = useState([]);
  const [cargandoPagos, setCargandoPagos] = useState(false);
  const [mostrarModalDeshabilitarPago, setMostrarModalDeshabilitarPago] = useState(false);
  const [pagoADeshabilitar, setPagoADeshabilitar] = useState(null);
  const [pinDeshabilitarPago, setPinDeshabilitarPago] = useState('');
  const [deshabilitandoPago, setDeshabilitandoPago] = useState(false);
  const [bugs, setBugs] = useState([]);
  const [cargandoBugs, setCargandoBugs] = useState(false);

  const puedeGestionarBugs = ['admin', 'gestor'].includes(usuario?.rol);

  const accionesDisponibles = [
    'Contrato Creado',
    'Pago Registrado',
    'Datos Editados',
    'Status Cambió',
    'Contrato Eliminado',
    'Contrato Renovado',
    'Bug Reportado',
    'Bug Actualizado',
  ];

  // ════════════════════════════════════════════════════════════════════════
  // 1. CARGA INICIAL
  // ════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    cargarHistorial();
  }, []);

  // ════════════════════════════════════════════════════════════════════════
  // 1.5 LIMPIAR HISTORIAL DE PAGOS
  // ════════════════════════════════════════════════════════════════════════

  const limpiarHistorialPagos = async () => {
    if (!pinLimpiar.trim()) {
      toast.error('PIN requerido');
      return;
    }

    setLimpando(true);
    try {
      const response = await axios.post(GAS_SCRIPT_URL, JSON.stringify({
        action: 'limpiarHistorialPagos',
        pin: pinLimpiar
      }), {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });

      if (response.data.success) {
        toast.success(`✅ ${response.data.message}`);
        setPinLimpiar('');
        setMostrarModalLimpiar(false);
        cargarHistorial(); // Recargar para ver la nueva entrada en auditoría
        cargarPagos(); // Recargar lista de pagos
      } else {
        toast.error(`❌ ${response.data.error || 'Error al limpiar'}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al conectar con el servidor');
    } finally {
      setLimpando(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // 1.6 CARGAR HISTORIAL DE PAGOS
  // ════════════════════════════════════════════════════════════════════════

  const cargarPagos = async () => {
    setCargandoPagos(true);
    try {
      const response = await axios.get(
        `${GAS_SCRIPT_URL}?action=getHistorialPagos`
      );

      if (response.data.success) {
        setPagos(response.data.pagos || []);
        if (response.data.total > 0) {
          toast.success(`✅ Cargados ${response.data.total} pagos`);
        }
      } else {
        toast.error('Error cargando pagos');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar pagos');
    } finally {
      setCargandoPagos(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // 1.65 CARGAR Y GESTIONAR REPORTES DE BUGS
  // ════════════════════════════════════════════════════════════════════════

  const cargarBugs = async () => {
    setCargandoBugs(true);
    try {
      const res = await axios.get(`${GAS_SCRIPT_URL}?action=getReportesBugs`);
      if (res.data?.success) setBugs(res.data.bugs || []);
      else toast.error('❌ Error cargando reportes de bugs');
    } catch (e) {
      toast.error('❌ Error de conexión al cargar bugs');
    } finally {
      setCargandoBugs(false);
    }
  };

  const cambiarEstadoBug = async (n, estado) => {
    try {
      const res = await axios.post(GAS_SCRIPT_URL,
        JSON.stringify({ action: 'actualizarEstadoBug', n, estado }),
        { headers: { 'Content-Type': 'text/plain;charset=utf-8' } }
      );
      if (res.data?.success) {
        toast.success('✅ Estado actualizado');
        cargarBugs();
      } else {
        toast.error(`❌ ${res.data?.error || 'Error al actualizar'}`);
      }
    } catch (e) {
      toast.error('❌ Error de conexión');
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // 1.7 DESHABILITAR PAGO INDIVIDUAL (soft-disable, el registro permanece)
  // ════════════════════════════════════════════════════════════════════════

  const deshabilitarPago = async () => {
    if (!pinDeshabilitarPago.trim()) {
      toast.error('PIN requerido');
      return;
    }

    setDeshabilitandoPago(true);
    try {
      const response = await axios.post(GAS_SCRIPT_URL, JSON.stringify({
        action: 'deshabilitarPago',
        pin: pinDeshabilitarPago,
        fila: pagoADeshabilitar.fila
      }), {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });

      if (response.data.success) {
        toast.success(`✅ ${response.data.message}`);
        setPinDeshabilitarPago('');
        setMostrarModalDeshabilitarPago(false);
        setPagoADeshabilitar(null);
        cargarPagos();
        cargarHistorial();
      } else {
        toast.error(`❌ ${response.data.error || 'Error al deshabilitar'}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al conectar con el servidor');
    } finally {
      setDeshabilitandoPago(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // 2. CARGAR HISTORIAL COMPLETO
  // ════════════════════════════════════════════════════════════════════════

  const cargarHistorial = async () => {
    setCargando(true);
    try {
      const response = await axios.get(
        `${GAS_SCRIPT_URL}?action=getHistorialCompleto`
      );

      if (response.data.success) {
        setRegistros(response.data.registros || []);
        setTotalCargado(response.data.total || 0);
        setUltimaCarga(new Date());

        if (response.data.total > 0) {
          toast.success(`✅ Cargados ${response.data.total} registros`);
        } else {
          toast.info('ℹ️ No hay registros en el historial');
        }

        console.log(`📊 Historial cargado:`, {
          total: response.data.total,
          ultimaFila: response.data.ultimaFila,
          timestamp: response.data.timestamp
        });
      } else {
        toast.error('Error cargando historial');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar historial');
    } finally {
      setCargando(false);
    }
  };

  // Auto-refresh cada 30 segundos cuando está activado
  React.useEffect(() => {
    if (!autoRefresh) return;

    const intervalo = setInterval(() => {
      cargarHistorial();
    }, 30000); // 30 segundos

    return () => clearInterval(intervalo);
  }, [autoRefresh]);

  // ════════════════════════════════════════════════════════════════════════
  // 3. FILTRAR Y ORDENAR REGISTROS
  // ════════════════════════════════════════════════════════════════════════

  const registrosFiltrados = registros
    .filter((registro) => {
      const coincideCliente = !filtroCliente ||
        (registro.idRegistro || '').toLowerCase().includes(filtroCliente.toLowerCase());
      const coincideAccion = !filtroAccion || registro.accion === filtroAccion;
      const coincideFecha = !filtroFecha || (registro.fecha || '').startsWith(filtroFecha);

      return coincideCliente && coincideAccion && coincideFecha;
    })
    .sort((a, b) => {
      // Ordenar por fecha + hora descendente (más recientes primero)
      const parseDate = (fechaStr, horaStr) => {
        if (!fechaStr || !horaStr) return new Date(0);
        // DD/MM/YYYY HH:MM:SS
        const [dia, mes, año] = fechaStr.split('/');
        const [hora, minuto, segundo] = horaStr.split(':');
        return new Date(año, parseInt(mes) - 1, dia, hora, minuto, segundo);
      };

      const dateA = parseDate(a.fecha, a.hora);
      const dateB = parseDate(b.fecha, b.hora);

      return dateB - dateA; // Descendente
    });

  // ════════════════════════════════════════════════════════════════════════
  // 4. UI: HISTORIAL COMPLETO
  // ════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* ENCABEZADO */}
      <div className="bg-gradient-to-r from-terra-copper to-terra-navy text-white p-4 sm:p-8 rounded-xl shadow-lg">
        <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold truncate">📋 Panel Administrativo</h1>
            <p className="text-xs sm:text-sm opacity-90 mt-1 sm:mt-2">Auditoría y gestión de datos - Acceso protegido</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => navigate('/')}
              className="px-3 sm:px-4 py-2 bg-red-600/80 hover:bg-red-700 rounded-lg font-semibold transition text-white text-sm"
            >
              ❌ Salir
            </button>
          </div>
        </div>

        {/* PESTAÑAS */}
        <div className="flex flex-wrap gap-2 border-t border-white/20 pt-3 sm:pt-4">
          <button
            onClick={() => {
              setPestanaActiva('cambios');
              cargarHistorial();
            }}
            className={`px-3 sm:px-6 py-2 text-sm font-semibold rounded-lg transition ${
              pestanaActiva === 'cambios'
                ? 'bg-white text-terra-copper'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            📝 Historial
          </button>
          <button
            onClick={() => {
              setPestanaActiva('pagos');
              cargarPagos();
            }}
            className={`px-3 sm:px-6 py-2 text-sm font-semibold rounded-lg transition ${
              pestanaActiva === 'pagos'
                ? 'bg-white text-terra-copper'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            💰 Pagos
          </button>
          <button
            onClick={() => {
              setPestanaActiva('bugs');
              cargarBugs();
            }}
            className={`px-3 sm:px-6 py-2 text-sm font-semibold rounded-lg transition ${
              pestanaActiva === 'bugs'
                ? 'bg-white text-terra-copper'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            🐞 Bugs
          </button>
        </div>
      </div>

      {/* CONTENIDO DINÁMICO SEGÚN PESTAÑA */}
      {pestanaActiva === 'cambios' ? (
        <>
      {/* INFORMACIÓN DE CARGA - HISTORIAL DE CAMBIOS */}
      <div className="bg-terra-cream border border-terra-gold/30 rounded-xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-gray-600 font-semibold">📊 Registros Cargados</p>
              <p className="text-3xl font-bold text-terra-copper">{totalCargado}</p>
            </div>
            <div className="h-12 w-px bg-gray-300"></div>
            <div>
              <p className="text-sm text-gray-600 font-semibold">⏰ Última Actualización</p>
              <p className="text-sm text-gray-800 font-mono">
                {ultimaCarga
                  ? ultimaCarga.toLocaleTimeString('es-ES')
                  : 'Cargando...'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => cargarHistorial()}
              disabled={cargando}
              className="px-4 py-2 bg-terra-copper text-white rounded-lg font-semibold hover:bg-terra-copper-dark transition disabled:opacity-50 flex items-center gap-2"
            >
              {cargando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Recargan...
                </>
              ) : (
                <>
                  🔄 Recargar Ahora
                </>
              )}
            </button>

            <label
              title="Auto-refrescar la lista cada 30 segundos"
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition cursor-pointer"
            >
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <span>
                ⏱️ Auto-refresh
                <span className="block text-[10px] font-normal text-blue-400 leading-none">
                  {autoRefresh ? 'ON' : 'OFF'}
                </span>
              </span>
            </label>

            <button
              onClick={() => setMostrarModalLimpiar(true)}
              className="px-4 py-2 bg-red-600/10 border-2 border-red-600 text-red-600 rounded-lg font-semibold hover:bg-red-600/20 transition flex items-center gap-2"
              title="Limpiar todos los pagos del Historial"
            >
              🗑️ Limpiar Pagos
            </button>
          </div>
        </div>

        {autoRefresh && (
          <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800 font-semibold">
            ℹ️ Auto-actualización activada (cada 30 segundos)
          </div>
        )}
      </div>

      {/* FILTROS */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg text-gray-800 mb-4">🔍 Filtros de Búsqueda</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cliente o ID
            </label>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terra-copper focus:border-transparent outline-none"
            />
          </div>

          {/* Acción */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tipo de Acción
            </label>
            <select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terra-copper focus:border-transparent outline-none"
            >
              <option value="">Todas las acciones</option>
              {accionesDisponibles.map((accion) => (
                <option key={accion} value={accion}>
                  {accion}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terra-copper focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Resumen de resultados */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          📊 Mostrando <strong>{registrosFiltrados.length}</strong> de{' '}
          <strong>{registros.length}</strong> registros
        </div>
      </div>

      {/* HISTORIAL */}
      <div>
        <div className="mb-4">
          <h3 className="font-bold text-lg text-gray-800">📝 Registro de Cambios</h3>
        </div>

        {cargando ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 border-4 border-terra-copper border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Cargando historial...</p>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
            <p className="text-lg">No hay registros que coincidan con los filtros</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-6">
            {registrosFiltrados.map((registro, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">

                {/* Cabecera de la Tarjeta */}
                <div className="bg-gray-50/80 border-b border-gray-100 px-5 py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="inline-block px-3 py-1 bg-terra-copper/10 text-terra-copper rounded-full text-xs font-bold">
                      {registro.accion}
                    </span>
                    <span className="text-xs text-gray-500">
                      📅 {registro.fecha} ⏰ {registro.hora}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-semibold">Tabla:</p>
                    <p className="font-bold text-gray-700">{registro.tabla}</p>
                  </div>
                </div>

                {/* Cuerpo de la Tarjeta */}
                <div className="p-5 space-y-4">

                  {/* Identificador del registro */}
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      {registro.idRegistro || 'Sistema'}
                    </p>
                  </div>

                  {/* Usuario */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">👤 Usuario:</p>
                    <p className="text-sm font-mono text-gray-700 break-all">
                      {registro.usuario}
                    </p>
                  </div>

                  {/* Cambios */}
                  {registro.campo && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 font-semibold">Campo:</p>
                        <p className="text-sm font-medium text-blue-900">{registro.campo}</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-xs text-red-600 font-semibold">Antes:</p>
                        <p className="text-sm text-red-900 font-mono break-all">
                          {registro.valorAnterior || '(vacío)'}
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-600 font-semibold">Después:</p>
                        <p className="text-sm text-green-900 font-mono break-all">
                          {registro.valorNuevo || '(vacío)'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Detalles */}
                  {registro.detalles && (
                    <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                      <p className="text-xs text-yellow-600 font-semibold">💬 Detalles:</p>
                      <p className="text-sm text-yellow-900 italic">{registro.detalles}</p>
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ESTADÍSTICAS */}
      {registros.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 font-semibold uppercase">Total Cambios</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{registros.length}</p>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
            <p className="text-sm text-gray-500 font-semibold uppercase">Usuarios Únicos</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {new Set(registros.map((r) => r.usuario)).size}
            </p>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
            <p className="text-sm text-gray-500 font-semibold uppercase">Clientes Afectados</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {new Set(registros.map((r) => r.idRegistro)).size}
            </p>
          </div>

          <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
            <p className="text-sm text-gray-500 font-semibold uppercase">Últimas 24h</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {registros.filter((r) => {
                const fecha = new Date(r.fecha);
                const hoy = new Date();
                const diff = hoy - fecha;
                return diff < 86400000; // 24 horas en ms
              }).length}
            </p>
          </div>
        </div>
      )}

        </>
      ) : (
        <>
      {/* PESTAÑA: GESTIONAR PAGOS */}

      {/* INFO PAGOS */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-gray-600 font-semibold">💳 Pagos Registrados</p>
              <p className="text-3xl font-bold text-green-600">{pagos.length}</p>
            </div>
            <div className="h-12 w-px bg-gray-300"></div>
            <div>
              <p className="text-sm text-gray-600 font-semibold">💰 Total Cobrado</p>
              <p className="text-2xl font-bold text-green-600">
                ${pagos.reduce((sum, p) => sum + p.montoUSD, 0).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={cargarPagos}
              disabled={cargandoPagos}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {cargandoPagos ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Recargan...
                </>
              ) : (
                <>
                  🔄 Recargar
                </>
              )}
            </button>

            <button
              onClick={() => setMostrarModalLimpiar(true)}
              className="px-4 py-2 bg-red-600/10 border-2 border-red-600 text-red-600 rounded-lg font-semibold hover:bg-red-600/20 transition"
              title="Eliminar TODOS los pagos"
            >
              🗑️ Limpiar Todo
            </button>
          </div>
        </div>
      </div>

      {/* TABLA DE PAGOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-800">📋 Registro de Pagos</h3>
        </div>

        {cargandoPagos ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="w-12 h-12 border-4 border-terra-copper border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Cargando pagos...</p>
          </div>
        ) : pagos.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg">No hay pagos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Fecha</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Cliente</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Inmueble</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Referencia</th>
                  <th className="px-6 py-4 text-right font-semibold text-gray-700">Monto USD</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Gestor</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700">Acción</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 transition ${pago.anulado ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}`}>
                    <td className={`px-6 py-4 font-medium ${pago.anulado ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{pago.fecha}</td>
                    <td className={`px-6 py-4 ${pago.anulado ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{pago.cliente}</td>
                    <td className={`px-6 py-4 ${pago.anulado ? 'text-gray-400' : 'text-gray-700'}`}>{pago.inmueble}</td>
                    <td className={`px-6 py-4 font-mono text-xs ${pago.anulado ? 'text-gray-400' : 'text-gray-700'}`}>{pago.referencia || '-'}</td>
                    <td className={`px-6 py-4 text-right font-bold ${pago.anulado ? 'text-gray-400 line-through' : 'text-green-600'}`}>${pago.montoUSD.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs truncate">{pago.gestor || 'N/A'}</td>
                    <td className="px-6 py-4 text-center">
                      {pago.anulado ? (
                        <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded font-semibold text-xs">
                          ⛔ Anulado
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setPagoADeshabilitar(pago);
                            setMostrarModalDeshabilitarPago(true);
                          }}
                          className="px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition font-semibold text-xs"
                        >
                          ⛔ Deshabilitar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}

      {/* ── PESTAÑA: REPORTES DE BUGS ── */}
      {pestanaActiva === 'bugs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-gray-800">🐞 Reportes de Bugs</h3>
            <button
              onClick={cargarBugs}
              disabled={cargandoBugs}
              className="px-4 py-2 bg-terra-copper text-white rounded-lg font-semibold hover:bg-terra-copper-dark transition disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {cargandoBugs ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Cargando...</>
              ) : '🔄 Recargar'}
            </button>
          </div>

          {cargandoBugs ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border border-gray-100">
              <div className="w-12 h-12 border-4 border-terra-copper border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-600 font-medium">Cargando reportes...</p>
            </div>
          ) : bugs.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-xl border border-gray-100">
              <p className="text-4xl mb-3">🎉</p>
              <p className="text-lg font-semibold text-gray-700">Sin reportes de bugs</p>
              <p className="text-gray-500 text-sm mt-1">Todo parece estar funcionando bien</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bugs.map((bug) => (
                <div key={bug.n} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                  bug.estado === 'Resuelto' ? 'border-green-200' :
                  bug.estado === 'Descartado' ? 'border-gray-200 opacity-60' :
                  bug.estado === 'En revisión' ? 'border-blue-200' :
                  'border-gray-200'
                }`}>
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400">#{bug.n}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        bug.severidad === 'Crítico'   ? 'bg-red-100 text-red-700' :
                        bug.severidad === 'Molesto'   ? 'bg-orange-100 text-orange-700' :
                        bug.severidad === 'Menor'     ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {bug.severidad === 'Crítico' ? '🔴' : bug.severidad === 'Molesto' ? '🟠' : bug.severidad === 'Menor' ? '🟡' : '🔵'} {bug.severidad}
                      </span>
                      <span className="text-sm font-semibold text-gray-800">{bug.seccion}</span>
                      {bug.elemento && <span className="text-xs text-gray-500">· {bug.elemento}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{bug.fecha} {bug.hora}</span>
                      {puedeGestionarBugs ? (
                        <select
                          value={bug.estado}
                          onChange={e => cambiarEstadoBug(bug.n, e.target.value)}
                          className={`text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                            bug.estado === 'Resuelto'    ? 'bg-green-50 border-green-300 text-green-700' :
                            bug.estado === 'Descartado'  ? 'bg-gray-50 border-gray-300 text-gray-500' :
                            bug.estado === 'En revisión' ? 'bg-blue-50 border-blue-300 text-blue-700' :
                            'bg-gray-50 border-gray-300 text-gray-600'
                          }`}
                        >
                          <option value="Nuevo">Nuevo</option>
                          <option value="En revisión">En revisión</option>
                          <option value="Resuelto">Resuelto</option>
                          <option value="Descartado">Descartado</option>
                        </select>
                      ) : (
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                          bug.estado === 'Resuelto'    ? 'bg-green-100 text-green-700' :
                          bug.estado === 'Descartado'  ? 'bg-gray-100 text-gray-500' :
                          bug.estado === 'En revisión' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{bug.estado}</span>
                      )}
                    </div>
                  </div>
                  <div className="px-5 py-4 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {bug.esperado && (
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Esperado</p>
                          <p className="text-gray-700">{bug.esperado}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-0.5">Qué pasó</p>
                        <p className="text-gray-800">{bug.real}</p>
                      </div>
                    </div>
                    {bug.pasos && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Pasos para reproducir</p>
                        <p className="text-gray-600 text-sm whitespace-pre-line">{bug.pasos}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 border-t border-gray-100 flex-wrap">
                      <span>👤 {bug.usuario} ({bug.rol})</span>
                      {bug.tipo && <span>📌 {bug.tipo}</span>}
                      {bug.dispositivo && <span className="truncate max-w-[300px]" title={bug.dispositivo}>🖥 {bug.dispositivo.split('·')[1]?.trim()}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: LIMPIAR HISTORIAL DE PAGOS */}
      {mostrarModalLimpiar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900">Limpiar Historial de Pagos</h2>
              <p className="text-sm text-gray-600 mt-2">Esta acción eliminará TODOS los registros de pago</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 font-semibold">
                ⚠️ Esta acción es irreversible. Solo usa si sabes qué estás haciendo.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ingresa el PIN de administrador
              </label>
              <input
                type="password"
                placeholder="••••"
                maxLength="6"
                value={pinLimpiar}
                onChange={(e) => setPinLimpiar(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !limpando && limpiarHistorialPagos()}
                disabled={limpando}
                autoFocus
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-xl font-bold tracking-widest focus:outline-none focus:border-red-600 disabled:bg-gray-100"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setMostrarModalLimpiar(false);
                  setPinLimpiar('');
                }}
                disabled={limpando}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
              >
                ✕ Cancelar
              </button>
              <button
                onClick={limpiarHistorialPagos}
                disabled={limpando || !pinLimpiar.trim()}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {limpando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Limpiando...
                  </>
                ) : (
                  <>
                    🗑️ Eliminar Todo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DESHABILITAR PAGO INDIVIDUAL */}
      {mostrarModalDeshabilitarPago && pagoADeshabilitar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">⛔</div>
              <h2 className="text-2xl font-bold text-gray-900">Deshabilitar Pago</h2>
              <p className="text-sm text-gray-600 mt-2">El registro permanecerá visible pero sin efecto financiero</p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 space-y-2">
              <p className="text-sm text-gray-700"><strong>Cliente:</strong> {pagoADeshabilitar.cliente}</p>
              <p className="text-sm text-gray-700"><strong>Fecha:</strong> {pagoADeshabilitar.fecha}</p>
              <p className="text-sm text-gray-700"><strong>Monto:</strong> ${pagoADeshabilitar.montoUSD.toFixed(2)} USD</p>
              <p className="text-sm text-gray-700"><strong>Inmueble:</strong> {pagoADeshabilitar.inmueble}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-blue-800">
                ℹ️ Al deshabilitar, el mes correspondiente volverá a aparecer como pendiente. El registro queda en el historial marcado como "Anulado".
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ingresa PIN para confirmar
              </label>
              <input
                type="password"
                placeholder="••••"
                maxLength="6"
                value={pinDeshabilitarPago}
                onChange={(e) => setPinDeshabilitarPago(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !deshabilitandoPago && deshabilitarPago()}
                disabled={deshabilitandoPago}
                autoFocus
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-xl font-bold tracking-widest focus:outline-none focus:border-orange-500 disabled:bg-gray-100"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setMostrarModalDeshabilitarPago(false);
                  setPinDeshabilitarPago('');
                  setPagoADeshabilitar(null);
                }}
                disabled={deshabilitandoPago}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
              >
                ✕ Cancelar
              </button>
              <button
                onClick={deshabilitarPago}
                disabled={deshabilitandoPago || !pinDeshabilitarPago.trim()}
                className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deshabilitandoPago ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    ⛔ Deshabilitar Pago
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistorialCambios;
