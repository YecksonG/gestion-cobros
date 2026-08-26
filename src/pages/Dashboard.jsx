import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { GAS_SCRIPT_URL } from '../services/api';
import { INMUEBLES_CON_TODOS as INMUEBLES } from '../config/inmuebles';
const PERIODOS = [
  { value: 'Dia',     label: 'Hoy' },
  { value: 'Semana',  label: 'Esta Semana' },
  { value: 'Mes',     label: 'Este Mes' },
  { value: 'General', label: 'Histórico' },
];

function Dashboard() {
  // ── Datos ─────────────────────────────────────────────────────────────────
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [inmueble, setInmueble] = useState('Todos');
  const [periodo, setPeriodo] = useState('Mes');

  useEffect(() => {
    cargarDatos();
  }, [inmueble, periodo]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const res = await axios.get(
        `${GAS_SCRIPT_URL}?action=getDashboardCompleto&inmueble=${encodeURIComponent(inmueble)}&periodo=${periodo}`
      );
      if (res.data.success) {
        setDatos(res.data);
      } else {
        toast.error('❌ Error cargando dashboard');
      }
    } catch {
      toast.error('❌ Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-terra-copper to-terra-navy text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">📊 Dashboard Administrativo</h1>
            <p className="text-sm opacity-90 mt-1">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={cargarDatos}
            disabled={cargando}
            className="px-5 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {cargando ? '⏳ Actualizando...' : '🔄 Actualizar'}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">🏢 Inmueble</label>
            <select
              value={inmueble}
              onChange={(e) => setInmueble(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper focus:border-transparent outline-none bg-white text-sm"
            >
              {INMUEBLES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">📅 Período</label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper focus:border-transparent outline-none bg-white text-sm"
            >
              {PERIODOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {cargando && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-terra-copper border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Calculando métricas...</p>
        </div>
      )}

      {datos && !cargando && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard color="border-terra-copper" label="💰 Canon Esperado" value={`$${parseFloat(datos.totalEsperado || 0).toFixed(2)}`} sub="Total a cobrar" />
            <KpiCard color="border-green-500"  label="✅ Cobrado"       value={`$${parseFloat(datos.totalCobrado || 0).toFixed(2)}`}  sub="Monto recaudado" />
            <KpiCard color="border-amber-400"  label="⏳ Pendiente"    value={`$${parseFloat(datos.totalPendiente || 0).toFixed(2)}`} sub="Falta cobrar" />
            <KpiCard color="border-blue-500"   label="📈 Eficiencia"   value={`${datos.porcentaje || 0}%`}                            sub="Meta alcanzada" />
            <KpiCard color="border-red-500"    label="⚠️ Mora Total"  value={`$${parseFloat(datos.totalMora || 0).toFixed(2)}`}      sub="Cargos aplicados" />
            <KpiCard color="border-orange-500" label="📅 Por Vencer"  value={datos.contratosVenciendo || 0}                           sub="Próximos 60 días" />
          </div>

          {/* Gráficas */}
          {/* Gráficas Proporcionales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DonutChart
              title="💰 Distribución Financiera"
              segments={[
                { label: 'Cobrado',   value: parseFloat(datos.totalCobrado || 0),   color: '#22c55e' },
                { label: 'Pendiente', value: parseFloat(datos.totalPendiente || 0), color: '#fbbf24' },
                { label: 'Mora',      value: parseFloat(datos.totalMora || 0),      color: '#ef4444' },
              ]}
              fmt={(v) => `$${v.toFixed(0)}`}
            />
            <DonutChart
              title="📋 Estado de Contratos"
              segments={[
                { label: 'Al Día',    value: datos.cantidadPagado    || 0, color: '#22c55e' },
                { label: 'Pendiente', value: datos.cantidadPendiente || 0, color: '#fbbf24' },
                { label: 'Moroso',    value: datos.cantidadMoroso    || 0, color: '#ef4444' },
              ]}
              fmt={(v) => `${v}`}
            />
          </div>

          {/* Comparativa por Inmueble */}
          <div className="w-full">
            <BarComparison
              title="🏢 Recaudación por Inmueble: Esperado vs Cobrado"
              data={datos.porInmuebleCobros || {}}
            />
          </div>

          {/* Tablas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">📊 Métricas Operacionales</h3>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-50">
                  <MetricRow label="📌 Contratos Vigentes"   value={datos.cantidadContratos || 0}                                 note="Total activos" />
                  <MetricRow label="💵 Promedio / Contrato"  value={`$${parseFloat(datos.promedioPorContrato || 0).toFixed(2)}`} note="Canon medio" />
                  <MetricRow label="🔴 Tasa de Morosidad"   value={`${datos.tasaMorosidad || 0}%`}                               note="% de morosos" />
                  <MetricRow label="📝 Pagos en el período" value={datos.pagosUltimos30 || 0}                                    note="Registrados" />
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">📋 Estado de Cobros</h3>
              </div>
              <div className="p-4 space-y-4">
                {(() => {
                  const total = (datos.cantidadPagado || 0) + (datos.cantidadPendiente || 0) + (datos.cantidadMoroso || 0);
                  return (
                    <>
                      <StatusBar label="✅ Al Día"    count={datos.cantidadPagado || 0}    total={total} color="bg-green-500" />
                      <StatusBar label="⏳ Pendiente" count={datos.cantidadPendiente || 0} total={total} color="bg-amber-400" />
                      <StatusBar label="❌ Moroso"    count={datos.cantidadMoroso || 0}    total={total} color="bg-red-500" />
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Desglose por inmueble */}
          {datos.porInmuebleCobros && Object.keys(datos.porInmuebleCobros).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">🏢 Desglose por Inmueble</h3>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(datos.porInmuebleCobros).map(([nombre, cobros]) => {
                  const esperado = parseFloat(cobros.esperado || 0);
                  const cobrado = parseFloat(cobros.cobrado || 0);
                  const pendiente = cobros.pendiente !== undefined ? parseFloat(cobros.pendiente) : Math.max(0, esperado - cobrado);
                  const eff = esperado > 0 ? (cobrado / esperado) * 100 : 0;
                  const barColor = eff >= 85 ? 'bg-green-500' : eff >= 50 ? 'bg-amber-400' : 'bg-red-500';
                  const contratos = datos.porInmueble?.[nombre];

                  return (
                    <div key={nombre} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
                      <h4 className="font-bold text-terra-copper text-base mb-3">{nombre}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Contratos</span>
                          <span className="font-semibold text-gray-900">{contratos?.count || cobros.count || 0}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Canon Esperado</span>
                          <span className="font-semibold text-gray-900">${esperado.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Cobrado</span>
                          <span className="font-semibold text-green-700">${cobrado.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Pendiente + Morosidad</span>
                          <span className="font-semibold text-red-600">${pendiente.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Eficiencia de cobro</span>
                          <span className="font-bold">{eff.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${barColor} rounded-full transition-all duration-700`}
                            style={{ width: `${Math.min(eff, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {!datos && !cargando && (
        <div className="text-center py-16 text-gray-400">
          <p>No hay datos disponibles para este período</p>
        </div>
      )}
    </div>
  );
}

function KpiCard({ color, label, value, sub }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border-t-4 ${color} p-4 hover:-translate-y-1 transition-transform`}>
      <p className="text-xs text-gray-500 font-bold uppercase mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function MetricRow({ label, value, note }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-gray-700">{label}</td>
      <td className="px-4 py-3 font-bold text-gray-900">{value}</td>
      <td className="px-4 py-3 text-xs text-gray-400">{note}</td>
    </tr>
  );
}

function StatusBar({ label, count, total, color }) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{count} ({pct}%)</span>
      </div>
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DonutChart({ title, segments, fmt }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  let cumulativeDeg = 0;
  const stops = segments.map((seg) => {
    const pct = total > 0 ? (seg.value / total) * 100 : 0;
    const startDeg = cumulativeDeg;
    cumulativeDeg += (pct / 100) * 360;
    return { ...seg, pct, startDeg, endDeg: cumulativeDeg };
  });

  const gradient =
    total === 0
      ? '#e5e7eb 0deg 360deg'
      : stops.map((s) => `${s.color} ${s.startDeg}deg ${s.endDeg}deg`).join(', ');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between h-full">
      <h3 className="font-bold text-gray-800 text-base mb-4">{title}</h3>
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-auto">
        {/* Donut Circle Proporcional */}
        <div className="relative flex-shrink-0 w-32 h-32 sm:w-36 sm:h-36 shadow-inner rounded-full p-0.5">
          <div
            className="w-full h-full rounded-full transition-all duration-700 shadow-md"
            style={{ background: `conic-gradient(${gradient})` }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-white shadow-sm flex flex-col items-center justify-center p-1 text-center">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Total</span>
              <span className="text-xs sm:text-sm font-black text-gray-800">{total > 0 ? fmt(total) : '—'}</span>
            </div>
          </div>
        </div>

        {/* Leyenda y Desglose */}
        <div className="flex-1 w-full sm:w-auto space-y-2.5 min-w-0">
          {stops.map((s) => (
            <div key={s.label} className="flex items-center justify-between gap-3 text-xs p-2 rounded-lg bg-gray-50/80 hover:bg-amber-50/40 border border-gray-100 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex-shrink-0 w-3 h-3 rounded-full shadow-sm" style={{ background: s.color }} />
                <span className="text-gray-700 font-medium truncate">{s.label}</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-gray-900 whitespace-nowrap">
                <span>{fmt(s.value)}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
                  {s.pct.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BarComparison({ title, data }) {
  const entries = Object.entries(data);
  const maxVal = entries.reduce((m, [, c]) => Math.max(m, parseFloat(c.esperado || 0)), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
        <h3 className="font-bold text-gray-800 text-base">{title}</h3>
        <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Esperado</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Cobrado</span>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Sin datos</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map(([nombre, c]) => {
            const esperado = parseFloat(c.esperado || 0);
            const cobrado = parseFloat(c.cobrado || 0);
            const espPct = maxVal > 0 ? (esperado / maxVal) * 100 : 0;
            const cobPct = maxVal > 0 ? (cobrado / maxVal) * 100 : 0;
            const eff = esperado > 0 ? ((cobrado / esperado) * 100).toFixed(0) : 0;

            return (
              <div key={nombre} className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 hover:border-terra-gold/40 hover:bg-amber-50/20 transition-all">
                <div className="flex justify-between items-center mb-2.5">
                  <p className="text-sm font-bold text-terra-copper">{nombre}</p>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700">
                    {eff}% Efic.
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Esperado</span>
                      <span className="font-semibold text-gray-800">${esperado.toFixed(0)}</span>
                    </div>
                    <div className="h-2 bg-gray-200/80 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${espPct}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Cobrado</span>
                      <span className="font-semibold text-green-700">${cobrado.toFixed(0)}</span>
                    </div>
                    <div className="h-2 bg-gray-200/80 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all duration-700" style={{ width: `${cobPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
