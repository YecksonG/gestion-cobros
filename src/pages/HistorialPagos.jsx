import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { GAS_SCRIPT_URL } from '../services/api';

function formatearFechaSegura(fecha) {
  if (fecha === null || fecha === undefined || fecha === '') return '—';
  const s = String(fecha);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  } catch { return s; }
}

export default function HistorialPagos() {
  const [registros, setRegistros] = useState([]);
  const [registrosFiltrados, setRegistrosFiltrados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Datos dinámicos
  const [clientes, setClientes] = useState([]);
  const [arrendatariosPorInmueble, setArrendatariosPorInmueble] = useState({});

  // Filtros
  const [filtroInmueble, setFiltroInmueble] = useState('');
  const [filtroArrendatario, setFiltroArrendatario] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');

  const INMUEBLES = ['Miko', 'Federación', 'La Candelaria'];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);

      // Cargar historial de pagos
      const historialResponse = await axios.get(`${GAS_SCRIPT_URL}?action=getHistorialPagosCompleto`);
      if (historialResponse.data.success) {
        setRegistros(historialResponse.data.registros || []);
        setRegistrosFiltrados(historialResponse.data.registros || []);
      }

      // Cargar clientes
      const clientesResponse = await axios.get(`${GAS_SCRIPT_URL}?action=getInquilinos`);
      const clientesValidos = (clientesResponse.data || []).filter(
        (c) => c.nombre && c.nombre.trim() !== '' &&
               c.status !== 'Inactivo' && c.status !== 'Para Dar de Baja'
      );
      setClientes(clientesValidos);

      // Agrupar arrendatarios por inmueble
      const agrupadosPorInmueble = {};
      INMUEBLES.forEach((inmueble) => {
        agrupadosPorInmueble[inmueble] = clientesValidos
          .filter((c) => c.inmueble === inmueble)
          .map((c) => c.nombre)
          .sort();
      });
      setArrendatariosPorInmueble(agrupadosPorInmueble);

      setError('');
    } catch (err) {
      setError('Error de conexión');
      toast.error('Error al cargar datos');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    aplicarFiltros();
  }, [
    filtroInmueble,
    filtroArrendatario,
    filtroMetodo,
    filtroFechaInicio,
    filtroFechaFin,
    filtroBusqueda,
    registros,
  ]);

  const aplicarFiltros = () => {
    let resultado = registros;

    if (filtroInmueble) {
      resultado = resultado.filter((r) => r.inmueble === filtroInmueble);
    }

    if (filtroArrendatario) {
      resultado = resultado.filter((r) => r.arrendatario === filtroArrendatario);
    }

    if (filtroMetodo) {
      resultado = resultado.filter((r) => r.metodoPago === filtroMetodo);
    }

    if (filtroBusqueda) {
      resultado = resultado.filter(
        (r) =>
          r.referencia.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
          r.mesCorrespondiente.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
          r.gestor.toLowerCase().includes(filtroBusqueda.toLowerCase())
      );
    }

    if (filtroFechaInicio) {
      const inicio = parsearFechaFiltro(filtroFechaInicio);
      if (inicio) {
        resultado = resultado.filter((r) => {
          const fecha = parsearFecha(r.fecha);
          return fecha >= inicio;
        });
      }
    }

    if (filtroFechaFin) {
      const fin = parsearFechaFiltro(filtroFechaFin);
      if (fin) {
        fin.setHours(23, 59, 59, 999);
        resultado = resultado.filter((r) => {
          const fecha = parsearFecha(r.fecha);
          return fecha <= fin;
        });
      }
    }

    setRegistrosFiltrados(resultado);
  };

  const parsearFecha = (fechaStr) => {
    if (!fechaStr) return new Date('1900-01-01');
    const [dia, mes, año] = fechaStr.split('/');
    return new Date(año, mes - 1, dia);
  };

  const parsearFechaFiltro = (fechaStr) => {
    if (!fechaStr) return null;
    const [dia, mes, año] = fechaStr.split('/');
    return new Date(año, mes - 1, dia);
  };

  const obtenerMetodos = () => {
    const metodos = [...new Set(registros.map((r) => r.metodoPago))];
    return metodos.filter((m) => m).sort();
  };

  const calcularTotales = () => {
    return {
      cantidad: registrosFiltrados.length,
      totalUSD: registrosFiltrados.reduce((sum, r) => sum + (r.montoUSD || 0), 0),
      totalEUR: registrosFiltrados.reduce((sum, r) => sum + (r.montoEUR || 0), 0),
    };
  };

  const limpiarFiltros = () => {
    setFiltroInmueble('');
    setFiltroArrendatario('');
    setFiltroMetodo('');
    setFiltroBusqueda('');
    setFiltroFechaInicio('');
    setFiltroFechaFin('');
  };

  const totales = calcularTotales();

  const INPUT_CLS = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper transition-colors bg-white';
  const SELECT_DIS = 'w-full px-3 py-2.5 border border-gray-100 rounded-lg text-sm text-gray-400 bg-gray-50 cursor-not-allowed';

  return (
    <div className="content-enter max-w-7xl mx-auto pb-16 space-y-4">

      {/* Header */}
      <div className="relative bg-gradient-to-r from-terra-copper to-terra-navy rounded-2xl p-6 text-white overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-56 h-56 bg-terra-gold/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl pointer-events-none" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">📝</span>
              <h1 className="text-2xl font-black">Historial de Pagos</h1>
            </div>
            <p className="text-white/60 text-sm">
              {registrosFiltrados.length !== registros.length
                ? `${registrosFiltrados.length} de ${registros.length} registros`
                : `${registros.length} registros en total`}
            </p>
          </div>
        </div>
      </div>

      {/* Cards de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 bg-terra-navy/8 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-terra-navy/50 uppercase tracking-wider">Registros</div>
            <div className="text-2xl font-black text-terra-navy">{totales.cantidad}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 bg-terra-copper/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-xl">💵</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-terra-copper/60 uppercase tracking-wider">Total USD</div>
            <div className="text-2xl font-black text-terra-copper">${totales.totalUSD.toFixed(2)}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 bg-terra-gold/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-xl">💶</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-terra-gold/80 uppercase tracking-wider">Total EUR</div>
            <div className="text-2xl font-black text-terra-gold">€{totales.totalEUR.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-terra-cream to-terra-cream-mid border-b border-terra-gold/20 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🔍</span>
            <span className="text-sm font-bold text-terra-copper-dark uppercase tracking-wide">Filtros</span>
          </div>
          <button
            onClick={limpiarFiltros}
            className="text-xs text-terra-copper hover:text-terra-copper-dark font-semibold transition-colors"
          >
            ✕ Limpiar
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Inmueble */}
          <div>
            <label className="block text-[10px] font-bold text-terra-copper/70 mb-1.5 uppercase tracking-wider">
              Inmueble
            </label>
            <select
              value={filtroInmueble}
              onChange={(e) => { setFiltroInmueble(e.target.value); setFiltroArrendatario(''); }}
              className={INPUT_CLS}
            >
              <option value="">Todos los inmuebles</option>
              {INMUEBLES.map((inmueble) => (
                <option key={inmueble} value={inmueble}>{inmueble}</option>
              ))}
            </select>
          </div>

          {/* Arrendatario */}
          <div>
            <label className="block text-[10px] font-bold text-terra-copper/70 mb-1.5 uppercase tracking-wider">
              Arrendatario
            </label>
            {filtroInmueble ? (
              <select
                value={filtroArrendatario}
                onChange={(e) => setFiltroArrendatario(e.target.value)}
                className={INPUT_CLS}
              >
                <option value="">Todos los arrendatarios</option>
                {arrendatariosPorInmueble[filtroInmueble]?.map((arrendatario) => (
                  <option key={arrendatario} value={arrendatario}>{arrendatario}</option>
                ))}
              </select>
            ) : (
              <input type="text" disabled placeholder="Selecciona inmueble primero" className={SELECT_DIS} />
            )}
          </div>

          {/* Búsqueda */}
          <div>
            <label className="block text-[10px] font-bold text-terra-copper/70 mb-1.5 uppercase tracking-wider">
              Búsqueda
            </label>
            <input
              type="text"
              placeholder="Referencia, mes o gestor (ej: 2490, junio...)"
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              className={INPUT_CLS}
            />
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-[10px] font-bold text-terra-copper/70 mb-1.5 uppercase tracking-wider">
              Método de Pago
            </label>
            <select
              value={filtroMetodo}
              onChange={(e) => setFiltroMetodo(e.target.value)}
              className={INPUT_CLS}
            >
              <option value="">Todos los métodos</option>
              {obtenerMetodos().map((metodo) => (
                <option key={metodo} value={metodo}>{metodo}</option>
              ))}
            </select>
          </div>

          {/* Fecha Inicio */}
          <div>
            <label className="block text-[10px] font-bold text-terra-copper/70 mb-1.5 uppercase tracking-wider">
              Desde (DD/MM/AAAA)
            </label>
            <input
              type="text"
              placeholder="ej: 01/01/2026"
              value={filtroFechaInicio}
              onChange={(e) => setFiltroFechaInicio(e.target.value)}
              className={INPUT_CLS}
            />
          </div>

          {/* Fecha Fin */}
          <div>
            <label className="block text-[10px] font-bold text-terra-copper/70 mb-1.5 uppercase tracking-wider">
              Hasta (DD/MM/AAAA)
            </label>
            <input
              type="text"
              placeholder="ej: 31/12/2026"
              value={filtroFechaFin}
              onChange={(e) => setFiltroFechaFin(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
            <div className="w-10 h-10 border-4 border-terra-copper/20 border-t-terra-copper rounded-full animate-spin" />
            <p className="text-sm font-medium animate-pulse">Cargando historial...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-red-500 font-medium">{error}</p>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">No hay registros que coincidan con los filtros activos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-terra-cream to-terra-cream-mid border-b border-terra-gold/20 text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-bold text-terra-copper-dark">Fecha</th>
                  <th className="px-4 py-3 text-left font-bold text-terra-copper-dark">Inmueble</th>
                  <th className="px-4 py-3 text-left font-bold text-terra-copper-dark">Unidad</th>
                  <th className="px-4 py-3 text-left font-bold text-terra-copper-dark">Arrendatario</th>
                  <th className="px-4 py-3 text-left font-bold text-terra-copper-dark">Mes</th>
                  <th className="px-4 py-3 text-right font-bold text-terra-copper-dark">USD</th>
                  <th className="px-4 py-3 text-right font-bold text-terra-copper-dark">EUR</th>
                  <th className="px-4 py-3 text-left font-bold text-terra-copper-dark">Método</th>
                  <th className="px-4 py-3 text-left font-bold text-terra-copper-dark">Referencia</th>
                  <th className="px-4 py-3 text-left font-bold text-terra-copper-dark">Gestor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {registrosFiltrados.map((reg, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-terra-cream/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap">{formatearFechaSegura(reg.fecha)}</td>
                    <td className="px-4 py-3 font-semibold text-terra-navy text-xs">{reg.inmueble}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{reg.unidad}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium text-xs">{reg.arrendatario}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{reg.mesCorrespondiente}</td>
                    <td className="px-4 py-3 text-right font-bold text-terra-copper text-xs whitespace-nowrap">
                      ${reg.montoUSD.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-terra-gold text-xs whitespace-nowrap">
                      €{reg.montoEUR.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{reg.metodoPago}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{reg.referencia}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{reg.gestor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
