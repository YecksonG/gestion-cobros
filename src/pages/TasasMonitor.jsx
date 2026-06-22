import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { GAS_SCRIPT_URL } from '../services/api';

const TASAS_DEFAULT = { usd: '—', eur: '—', bcv: '—', promedio: '—', fecha: 'Cargando...' };

const CARDS = [
  { key: 'usd',      label: 'USDT Binance', sub: 'VEF por USD · P2P',    icon: '🟡', bg: 'from-yellow-50 to-yellow-100',   border: 'border-yellow-200',  text: 'text-yellow-900',  badge: 'bg-yellow-100 text-yellow-700',  badgeLabel: 'Mercado P2P' },
  { key: 'bcv',      label: 'BCV Oficial',  sub: 'VEF por USD · oficial', icon: '🏦', bg: 'from-blue-50 to-blue-100',       border: 'border-blue-200',    text: 'text-blue-900',    badge: 'bg-blue-100 text-blue-700',      badgeLabel: 'Tasa Oficial' },
  { key: 'eur',      label: 'Euro / VEF',   sub: 'VEF por EUR',           icon: '💶', bg: 'from-emerald-50 to-emerald-100', border: 'border-emerald-200', text: 'text-emerald-900', badge: 'bg-emerald-100 text-emerald-700', badgeLabel: 'Calculado BCV' },
  { key: 'promedio', label: 'Promedio',     sub: '(BCV + USDT) ÷ 2',     icon: '📊', bg: 'from-purple-50 to-purple-100',   border: 'border-purple-200',  text: 'text-purple-900',  badge: 'bg-purple-100 text-purple-700',  badgeLabel: 'Referencial' },
];

function TasasMonitor() {
  const [tasas, setTasas]               = useState(TASAS_DEFAULT);
  const [actualizando, setActualizando] = useState(false);
  const [cargando, setCargando]         = useState(true);
  const [historial, setHistorial]       = useState([]);
  const [error, setError]               = useState('');

  useEffect(() => { cargarTasas(); }, []);
  useEffect(() => {
    const id = setInterval(cargarTasas, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const cargarTasas = async () => {
    setCargando(true); setError('');
    try {
      const res = await axios.get(`${GAS_SCRIPT_URL}?action=getTasasActuales`);
      if (res.data.success) aplicarTasas(res.data, 'carga');
      else setError('No se pudieron cargar las tasas');
    } catch { setError('Error de conexión'); }
    finally { setCargando(false); }
  };

  const actualizarTasas = async () => {
    setActualizando(true); setError('');
    try {
      const res = await axios.post(GAS_SCRIPT_URL,
        JSON.stringify({ action: 'actualizarTasasDesdeAPI' }),
        { headers: { 'Content-Type': 'text/plain;charset=utf-8' } }
      );
      if (res.data.success) {
        aplicarTasas({ ...res.data, fecha: new Date().toLocaleString('es-ES') }, 'actualización');
        toast.success('✅ Tasas actualizadas desde Binance');
      } else {
        setError(res.data.error || 'Error al actualizar');
        toast.error(`❌ ${res.data.error || 'Error'}`);
      }
    } catch (err) {
      setError(err.message); toast.error(`❌ ${err.message}`);
    } finally { setActualizando(false); }
  };

  const aplicarTasas = (data, tipo) => {
    const nuevo = {
      usd:      data.usd      || '—',
      eur:      data.eur      || '—',
      bcv:      data.bcv      || '—',
      promedio: data.promedio || '—',
      fecha:    data.fecha    || new Date().toLocaleString('es-ES'),
    };
    setTasas(nuevo);
    setHistorial(prev => [{ ...nuevo, tipo, hora: new Date().toLocaleTimeString('es-ES') }, ...prev.slice(0, 4)]);
  };

  return (
    <div className="content-enter max-w-5xl mx-auto space-y-4 pb-16">

      {/* ── HEADER ── */}
      <div className="relative bg-gradient-to-r from-terra-copper to-terra-navy rounded-2xl p-6 text-white overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-full bg-terra-gold/10 blur-2xl rounded-full" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-1">Monitor</p>
            <h1 className="text-2xl font-black tracking-tight">Tasas BCV</h1>
            <p className="text-sm text-white/70 mt-1">Binance P2P + BCV Oficial · Auto-actualiza cada 30 min</p>
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap sm:flex-shrink-0">
            <button onClick={cargarTasas} disabled={cargando}
              className="flex-1 sm:flex-none bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-white/20 disabled:opacity-50">
              ↻ Recargar
            </button>
            <button onClick={actualizarTasas} disabled={actualizando || cargando}
              className="flex-1 sm:flex-none bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-white/20 disabled:opacity-50">
              {actualizando ? '⏳ Actualizando...' : '🔄 Actualizar desde Binance'}
            </button>
          </div>
        </div>
        <div className="relative z-10 mt-3">
          <p className="text-xs text-white/60">Última actualización: <span className="text-white/80 font-medium">{tasas.fecha}</span></p>
        </div>
      </div>

      {/* ── 4 TARJETAS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map(({ key, label, sub, icon, bg, border, text, badge, badgeLabel }) => (
          <div key={key} className={`bg-gradient-to-br ${bg} rounded-xl border ${border} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl">{icon}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>{badgeLabel}</span>
            </div>
            <p className={`text-3xl font-bold ${text} tabular-nums`}>
              {cargando ? <span className="text-lg opacity-40">···</span> : tasas[key]}
            </p>
            <p className={`text-xs font-semibold mt-1 ${text} opacity-70`}>{label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm font-medium">❌ {error}</div>
      )}

      {/* ── CALCULADORA ── */}
      <Calculadora tasas={tasas} />

      {/* ── HISTORIAL ── */}
      {historial.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-terra-gold/20 bg-gradient-to-r from-terra-cream to-terra-cream-mid flex items-center gap-2">
            <h3 className="font-bold text-terra-navy text-sm">📋 Historial de esta sesión</h3>
            <span className="text-xs text-terra-copper/60">({historial.length} registros)</span>
          </div>
          <div className="divide-y divide-gray-50">
            {historial.map((item, i) => (
              <div key={i} className="px-5 py-3 hover:bg-gray-50 flex items-center gap-4">
                <span className="text-xs font-semibold text-gray-600 w-24 flex-shrink-0">
                  {item.tipo === 'actualización' ? '✅ Actualiz.' : '🔄 Recarga'} {item.hora}
                </span>
                <div className="grid grid-cols-4 gap-4 flex-1 text-xs">
                  <div><span className="text-gray-400">USDT </span><span className="font-bold">{item.usd}</span></div>
                  <div><span className="text-gray-400">BCV </span><span className="font-bold">{item.bcv}</span></div>
                  <div><span className="text-gray-400">EUR </span><span className="font-bold">{item.eur}</span></div>
                  <div><span className="text-gray-400">Prom </span><span className="font-bold">{item.promedio}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── INFO ── */}
      <div className="bg-terra-cream border border-terra-gold/30 rounded-xl p-4 text-sm text-terra-copper-dark">
        <strong className="text-terra-copper">ℹ️ Fuentes:</strong> USDT desde Binance P2P · BCV Oficial desde open.er-api.com ·
        Promedio = (BCV + USDT) ÷ 2 · Euro calculado desde la tasa BCV oficial
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CALCULADORA COMPLETA
// ═══════════════════════════════════════════════════════════════════

const TABS = [
  { id: 0, label: '💵 → Bs.',      title: 'Divisa a Bolívares' },
  { id: 1, label: 'Bs. → 💵',      title: 'Bolívares a Divisa' },
  { id: 2, label: '📊 Comparar',   title: 'Comparar Tasas' },
  { id: 3, label: '🔁 Bs. ↔ Bs.', title: 'Convertir entre Tasas' },
];

function fmt(n) {
  if (!n && n !== 0) return '—';
  return parseFloat(n).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function DeltaBadge({ delta }) {
  if (!delta) return null;
  const pos = delta > 0;
  return (
    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${pos ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {pos ? '+' : ''}{fmt(delta)}
    </span>
  );
}

function Calculadora({ tasas }) {
  const [tab, setTab]     = useState(0);
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda]   = useState('USD');  // tab 0
  const [rateOrigen, setRateOrigen] = useState('usd');  // tab 3
  const [rateDestino, setRateDestino] = useState('bcv'); // tab 3

  const t = {
    usd:  parseFloat(tasas.usd)      || 0,
    eur:  parseFloat(tasas.eur)      || 0,
    bcv:  parseFloat(tasas.bcv)      || 0,
    prom: parseFloat(tasas.promedio) || 0,
  };
  const n = parseFloat(monto) || 0;
  const tasasDisponibles = t.usd > 0 || t.eur > 0;

  const rateMap = { usd: t.usd, bcv: t.bcv, prom: t.prom, eur: t.eur };
  const rateLabel = { usd: 'USDT Binance', bcv: 'BCV Oficial', prom: 'Promedio', eur: 'EUR/VEF' };

  // Tab 0: divisa → VEF
  const resultadosHaciaVef = () => {
    if (!n || !tasasDisponibles) return [];
    if (moneda === 'USD') {
      const base = n * t.usd;
      return [
        { icon: '🟡', label: 'USDT Binance', vef: n * t.usd,  rate: t.usd,  delta: 0 },
        { icon: '🏦', label: 'BCV Oficial',  vef: n * t.bcv,   rate: t.bcv,   delta: (n * t.bcv)  - base },
        { icon: '📊', label: 'Promedio',     vef: n * t.prom,  rate: t.prom,  delta: (n * t.prom) - base },
        { icon: '💶', label: 'Equiv. EUR',   vef: t.eur > 0 ? (n * t.usd) / t.eur : null, rate: t.eur, isEur: true },
      ];
    }
    // EUR → VEF
    return [
      { icon: '💶', label: 'EUR/VEF BCV', vef: n * t.eur, rate: t.eur, delta: 0 },
      { icon: '💵', label: 'Equiv. USD',  vef: t.usd > 0 ? (n * t.eur) / t.usd : null, rate: t.usd, isUsd: true },
    ];
  };

  // Tab 1: VEF → divisa
  const resultadosDesdeVef = () => {
    if (!n || !tasasDisponibles) return [];
    const base = t.usd > 0 ? n / t.usd : 0;
    return [
      { icon: '🟡', label: 'USDT Binance', usd: t.usd > 0 ? n / t.usd  : null, delta: 0 },
      { icon: '🏦', label: 'BCV Oficial',  usd: t.bcv > 0 ? n / t.bcv  : null, delta: t.bcv > 0 && t.usd > 0 ? (n / t.bcv) - base : 0 },
      { icon: '📊', label: 'Promedio',     usd: t.prom > 0 ? n / t.prom : null, delta: t.prom > 0 && t.usd > 0 ? (n / t.prom) - base : 0 },
      { icon: '💶', label: 'EUR/VEF BCV',  eur: t.eur > 0 ? n / t.eur : null },
    ];
  };

  // Tab 2: comparar (USD → VEF con todas las tasas)
  const resultadosComparar = () => {
    if (!n || !tasasDisponibles) return [];
    const base = n * t.usd;
    return [
      { label: 'USDT Binance', rate: t.usd,  vef: n * t.usd,  delta: 0,                   pct: 0 },
      { label: 'BCV Oficial',  rate: t.bcv,   vef: n * t.bcv,   delta: (n * t.bcv) - base,  pct: t.usd > 0 ? ((t.bcv - t.usd) / t.usd * 100) : 0 },
      { label: 'Promedio',     rate: t.prom,  vef: n * t.prom,  delta: (n * t.prom) - base, pct: t.usd > 0 ? ((t.prom - t.usd) / t.usd * 100) : 0 },
    ];
  };
  const spreadTotal = n > 0 && t.usd > 0 && t.bcv > 0 ? Math.abs(n * t.usd - n * t.bcv) : null;
  const spreadPct   = t.usd > 0 && t.bcv > 0 ? Math.abs((t.usd - t.bcv) / t.usd * 100) : 0;

  // Tab 3: Bs. de una tasa → Bs. de otra tasa
  // "Tengo X Bs. valuados a tasa A, ¿cuántos son a tasa B?"
  // Equivalente USD intermedio: n / rateA * rateB
  const rO = rateMap[rateOrigen]  || 1;
  const rD = rateMap[rateDestino] || 1;
  const conversionCruzada = n > 0 && rO > 0 && rD > 0 ? (n / rO) * rD : null;
  const usdIntermedio     = n > 0 && rO > 0 ? n / rO : null;

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-terra-copper focus:border-transparent tabular-nums";
  const selectClass = "px-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terra-copper bg-white font-medium";

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-terra-gold/20 bg-gradient-to-r from-terra-cream to-terra-cream-mid">
        <h3 className="font-bold text-terra-navy">🧮 Calculadora de Tasas</h3>
        <p className="text-xs text-terra-copper/60 mt-0.5">Conversiones en tiempo real con las tasas actuales</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setMonto(''); }}
            className={`flex-1 min-w-[80px] py-3 text-xs font-bold transition-colors whitespace-nowrap ${tab === t.id
              ? 'bg-terra-navy text-white'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">

        {/* ── TAB 0: Divisa → VEF ── */}
        {tab === 0 && (
          <>
            <div className="flex gap-3">
              <input type="number" min="0" placeholder="0.00" value={monto}
                onChange={e => setMonto(e.target.value)} className={`flex-1 ${inputClass}`} autoFocus />
              <select value={moneda} onChange={e => setMoneda(e.target.value)} className={selectClass}>
                <option value="USD">USD $</option>
                <option value="EUR">EUR €</option>
              </select>
            </div>
            {n > 0 ? (
              <div className="space-y-2">
                {resultadosHaciaVef().map((r, i) => (
                  <div key={i} className={`flex items-center justify-between rounded-lg px-4 py-3 ${r.isEur || r.isUsd ? 'bg-gray-50 border border-dashed border-gray-200' : 'bg-gray-50'}`}>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{r.icon} {r.label}</p>
                      <p className="text-xs text-gray-400">@ {fmt(r.rate)} VEF/{r.isEur ? 'EUR' : r.isUsd ? 'USD' : moneda}</p>
                    </div>
                    <div className="text-right">
                      {r.isEur ? (
                        <p className="text-lg font-bold text-emerald-700 tabular-nums">€ {fmt(r.vef)}</p>
                      ) : r.isUsd ? (
                        <p className="text-lg font-bold text-blue-700 tabular-nums">$ {fmt(r.vef)}</p>
                      ) : (
                        <>
                          <p className="text-xl font-bold text-gray-900 tabular-nums">Bs. {fmt(r.vef)}</p>
                          {r.delta !== 0 && <DeltaBadge delta={r.delta} />}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">Ingresa un monto en {moneda} para ver la conversión</p>
            )}
          </>
        )}

        {/* ── TAB 1: VEF → Divisa ── */}
        {tab === 1 && (
          <>
            <div className="flex gap-3 items-center">
              <input type="number" min="0" placeholder="0.00" value={monto}
                onChange={e => setMonto(e.target.value)} className={`flex-1 ${inputClass}`} autoFocus />
              <span className="text-sm font-bold text-gray-500 px-2">Bs.</span>
            </div>
            {n > 0 ? (
              <div className="space-y-2">
                {resultadosDesdeVef().map((r, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{r.icon} {r.label}</p>
                      <p className="text-xs text-gray-400">@ {fmt(r.eur != null ? t.eur : (rateMap[['usd','bcv','prom','eur'][i]] || 0))} VEF/divisa</p>
                    </div>
                    <div className="text-right">
                      {r.eur != null ? (
                        <p className="text-xl font-bold text-emerald-700 tabular-nums">€ {fmt(r.eur)}</p>
                      ) : (
                        <>
                          <p className="text-xl font-bold text-gray-900 tabular-nums">$ {fmt(r.usd)}</p>
                          {r.delta !== 0 && <DeltaBadge delta={r.delta} />}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">Ingresa un monto en Bs. para ver la equivalencia</p>
            )}
          </>
        )}

        {/* ── TAB 2: Comparar tasas ── */}
        {tab === 2 && (
          <>
            <div className="flex gap-3 items-center">
              <input type="number" min="0" placeholder="Canon o monto en USD" value={monto}
                onChange={e => setMonto(e.target.value)} className={`flex-1 ${inputClass}`} autoFocus />
              <span className="text-sm font-bold text-gray-500 px-2">USD</span>
            </div>
            {n > 0 ? (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-xs text-gray-400 font-medium">Tasa</th>
                      <th className="text-right py-2 text-xs text-gray-400 font-medium">Rate</th>
                      <th className="text-right py-2 text-xs text-gray-400 font-medium">Resultado Bs.</th>
                      <th className="text-right py-2 text-xs text-gray-400 font-medium">vs. Binance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {resultadosComparar().map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="py-3 font-semibold text-gray-800">{r.label}</td>
                        <td className="py-3 text-right text-gray-500 tabular-nums">{fmt(r.rate)}</td>
                        <td className="py-3 text-right font-bold text-gray-900 tabular-nums">Bs. {fmt(r.vef)}</td>
                        <td className="py-3 text-right">
                          {i === 0 ? <span className="text-xs text-gray-400">referencia</span> : <DeltaBadge delta={r.delta} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {spreadTotal !== null && (
                  <div className="bg-terra-cream border border-terra-gold/30 rounded-lg px-4 py-3 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-terra-navy">Spread Binance vs BCV</p>
                      <p className="text-xs text-terra-copper/70 mt-0.5">Diferencia entre tasas para {fmt(n)} USD</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-terra-copper tabular-nums">Bs. {fmt(spreadTotal)}</p>
                      <p className="text-xs text-terra-copper/70">{spreadPct.toFixed(2)}%</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">Ingresa un monto en USD para comparar resultados con cada tasa</p>
            )}
          </>
        )}

        {/* ── TAB 3: Bs. ↔ Bs. (cruce de tasas) ── */}
        {tab === 3 && (
          <>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Monto en Bs.</label>
                <input type="number" min="0" placeholder="0.00" value={monto}
                  onChange={e => setMonto(e.target.value)} className={inputClass} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Valuados a tasa</label>
                  <select value={rateOrigen} onChange={e => setRateOrigen(e.target.value)} className={`w-full ${selectClass}`}>
                    <option value="usd">USDT Binance</option>
                    <option value="bcv">BCV Oficial</option>
                    <option value="prom">Promedio</option>
                    <option value="eur">EUR/VEF</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Convertir a tasa</label>
                  <select value={rateDestino} onChange={e => setRateDestino(e.target.value)} className={`w-full ${selectClass}`}>
                    <option value="bcv">BCV Oficial</option>
                    <option value="usd">USDT Binance</option>
                    <option value="prom">Promedio</option>
                    <option value="eur">EUR/VEF</option>
                  </select>
                </div>
              </div>
            </div>

            {n > 0 && conversionCruzada !== null ? (
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Origen: {rateLabel[rateOrigen]}</p>
                      <p className="text-2xl font-bold text-gray-700 tabular-nums">Bs. {fmt(n)}</p>
                    </div>
                    <span className="text-2xl text-gray-300">→</span>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Destino: {rateLabel[rateDestino]}</p>
                      <p className="text-2xl font-bold text-terra-copper tabular-nums">Bs. {fmt(conversionCruzada)}</p>
                    </div>
                  </div>
                  <div className="h-px bg-gray-200 my-3" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Equivalente USD intermedio</span>
                    <span className="font-bold text-gray-700">$ {fmt(usdIntermedio)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Diferencia neta</span>
                    <DeltaBadge delta={conversionCruzada - n} />
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  {fmt(n)} Bs. ÷ {fmt(rO)} ({rateLabel[rateOrigen]}) × {fmt(rD)} ({rateLabel[rateDestino]}) = Bs. {fmt(conversionCruzada)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">
                Ingresa un monto en Bs. y selecciona las tasas de origen y destino
              </p>
            )}
          </>
        )}

      </div>
    </div>
  );
}

export default TasasMonitor;
