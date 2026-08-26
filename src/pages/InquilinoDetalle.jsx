import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { GAS_SCRIPT_URL } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { COLORES_INMUEBLE } from '../config/inmuebles';

// ── Constantes ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'datos',    label: 'Datos',    icon: '📋' },
  { id: 'pagos',    label: 'Pagos',    icon: '💰' },
  { id: 'contrato', label: 'Contrato', icon: '📜' },
  { id: 'legal',    label: 'Legal',    icon: '⚖️', requireRol: ['admin', 'legal'] },
  { id: 'archivos', label: 'Archivos', icon: '🗂️' },
];

const COLOR_STATUS = {
  'Vigente':          'bg-green-100 text-green-700  border-green-200',
  'Por Renovar':      'bg-blue-100  text-blue-700   border-blue-200',
  'Moroso':           'bg-orange-100 text-orange-700 border-orange-200',
  'Vencido':          'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Para Dar de Baja': 'bg-red-100   text-red-700    border-red-200',
  'Inactivo':         'bg-gray-100  text-gray-500   border-gray-200',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(f) {
  if (!f) return '—';
  try {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(f)) return f;
    const d = new Date(f);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  } catch { return f; }
}

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

function Campo({ label, value, mono }) {
  return (
    <div>
      <p className="text-[10px] text-terra-copper/70 font-semibold uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm text-gray-800 font-medium ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  );
}

function SeccionCard({ titulo, icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-terra-cream to-terra-cream-mid px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <h4 className="text-xs font-bold text-terra-copper-dark uppercase tracking-wider">{titulo}</h4>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        {children}
      </div>
    </div>
  );
}

function SpinnerTab() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-terra-copper border-t-transparent rounded-full animate-spin" />
      <p className="mt-3 text-xs text-gray-400 animate-pulse">Cargando...</p>
    </div>
  );
}

// ── Tab: Datos ────────────────────────────────────────────────────────────────

function TabDatos({ cliente }) {
  if (!cliente) return <SpinnerTab />;
  return (
    <div className="space-y-4">
      <SeccionCard titulo="Información Personal" icon="👤">
        <Campo label="Nombre completo"  value={cliente.nombre} />
        <Campo label="Cédula"           value={cliente.cedula} mono />
        <Campo label="RIF"              value={cliente.rif} mono />
        <Campo label="Teléfono"         value={cliente.telefono} />
        <Campo label="Correo"           value={cliente.correo} />
      </SeccionCard>

      <SeccionCard titulo="Inmueble" icon="🏠">
        <Campo label="Inmueble"         value={cliente.inmueble} />
        <Campo label="Ubicación"        value={cliente.ubicacion} />
        <Campo label="Unidad"           value={cliente.unidad} />
        <Campo label="Estacionamiento"  value={cliente.estacionamiento} />
      </SeccionCard>

      <SeccionCard titulo="Condiciones de Pago" icon="💳">
        <Campo label="Día de pago"      value={cliente.diaPago} />
        <Campo label="Frecuencia"       value={cliente.frecuenciaPago} />
        <Campo label="Método principal" value={cliente.metodoPago} />
        <Campo label="Días gracia mora" value={cliente.diasGraciaMora ? `${cliente.diasGraciaMora} días` : '—'} />
      </SeccionCard>

      <SeccionCard titulo="Relación Arrendataria" icon="🤝">
        <Campo label="Tipo de relación"    value={cliente.tipoRelacion} />
        <Campo label="Inicio de relación"  value={formatFecha(cliente.fechaInicioRelacion)} />
        <Campo label="Duración"            value={cliente.duracionRelacion ? `${cliente.duracionRelacion} meses` : '—'} />
      </SeccionCard>
    </div>
  );
}

// ── Tab: Pagos ────────────────────────────────────────────────────────────────

function TabPagos({ nombre, inmueble, navigate }) {
  const [meses, setMeses]     = useState(null);
  const [historial, setHistorial] = useState(null);
  const [cargando, setCargando]   = useState(true);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      setCargando(true);
      try {
        const [resMeses, resHistorial] = await Promise.all([
          axios.get(`${GAS_SCRIPT_URL}?action=getMesesPendientes&nombre=${encodeURIComponent(nombre)}&inmueble=${encodeURIComponent(inmueble)}`),
          axios.get(`${GAS_SCRIPT_URL}?action=getHistorialPagosCompleto`),
        ]);
        if (!activo) return;
        if (resMeses.data?.success) setMeses(resMeses.data);
        const todosLosPagos = resHistorial.data?.registros || [];
        const filtrados = todosLosPagos.filter(
          p => p.arrendatario === nombre && p.inmueble === inmueble
        );
        setHistorial(filtrados);
      } catch (e) {
        toast.error('Error al cargar historial de pagos');
      } finally {
        if (activo) setCargando(false);
      }
    };
    cargar();
    return () => { activo = false; };
  }, [nombre, inmueble]);

  if (cargando) return <SpinnerTab />;

  const pendientes = meses?.meses?.filter(m => !m.pagado) || [];

  return (
    <div className="space-y-5">
      {/* Meses pendientes — banner cálido con borde */}
      {pendientes.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-200/60 flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Meses pendientes · {pendientes.length}
            </h4>
          </div>
          <div className="p-3 space-y-2">
            {pendientes.map((m, i) => (
              <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100 hover:border-amber-300 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span className="text-sm font-semibold text-gray-800">{m.mes}</span>
                  {m.mora > 0 && (
                    <span className="text-xs text-orange-600 font-semibold bg-orange-100 px-2 py-0.5 rounded-full">
                      +${m.mora.toFixed(2)} mora
                    </span>
                  )}
                </div>
                <button
                  onClick={() => navigate('/cobros', { state: { cliente: nombre, inmueble, mesCobro: m.mes } })}
                  className="text-xs font-bold text-white bg-gradient-to-r from-terra-copper to-terra-copper-dark hover:from-terra-copper-dark hover:to-[#6a3a22] px-4 py-1.5 rounded-lg shadow-sm transition-all"
                >
                  Pagar
                </button>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 bg-white/60 border-t border-amber-200/60 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-gray-500">Canon adeudado</p>
              <p className="font-bold text-gray-900 text-sm mt-0.5">${meses.canonAdeudado?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500">Mora acumulada</p>
              <p className="font-bold text-orange-600 text-sm mt-0.5">${meses.moraTotalAcumulada?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500">Total</p>
              <p className="font-bold text-terra-copper text-sm mt-0.5">${meses.totalAdeudado?.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {pendientes.length === 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-sm font-bold text-green-800">Cliente al día</p>
            <p className="text-xs text-green-700/70">No hay meses pendientes</p>
          </div>
        </div>
      )}

      {/* Historial */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-terra-cream to-terra-cream-mid px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
          <span className="text-sm">📜</span>
          <h4 className="text-xs font-bold text-terra-copper-dark uppercase tracking-wider">
            Historial de pagos · {historial?.length || 0}
          </h4>
        </div>
        {historial?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/60 text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-100">
                  <th className="px-3 py-2.5 text-left font-semibold">Fecha</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Mes pagado</th>
                  <th className="px-3 py-2.5 text-right font-semibold">USD</th>
                  <th className="px-3 py-2.5 text-left font-semibold hidden sm:table-cell">Método</th>
                  <th className="px-3 py-2.5 text-left font-semibold hidden md:table-cell">Referencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {historial.map((p, i) => (
                  <tr key={i} className="hover:bg-terra-cream/30 transition-colors">
                    <td className="px-3 py-2.5 text-gray-600">{formatearFechaSegura(p.fecha)}</td>
                    <td className="px-3 py-2.5 text-gray-700 font-medium">{p.mesCorrespondiente}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-green-700">${(p.montoUSD || 0).toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-gray-500 hidden sm:table-cell">{p.metodoPago}</td>
                    <td className="px-3 py-2.5 text-gray-400 font-mono text-xs hidden md:table-cell">{p.referencia || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-10 text-center">Sin pagos registrados</p>
        )}
      </div>
    </div>
  );
}

// ── Tab: Contrato ─────────────────────────────────────────────────────────────

function TabContrato({ cliente, onEditarClick, onRenovarClick }) {
  if (!cliente) return <SpinnerTab />;
  const mostrarRenovar = ['Por Renovar', 'Vencido'].includes(cliente.statusContrato) ||
                         (cliente.diasParaVencer !== undefined && cliente.diasParaVencer <= 45);
  return (
    <div className="space-y-4">
      <SeccionCard titulo="Fechas del Contrato" icon="🗓️">
        <Campo label="Inicio de contrato"  value={formatFecha(cliente.fechaInicioContrato)} />
        <Campo label="Vencimiento"         value={formatFecha(cliente.fechaVencimiento)} />
        <Campo label="Status"              value={cliente.statusContrato} />
        <Campo label="Tipo de contingencia" value={cliente.tipoContingencia} />
      </SeccionCard>

      <SeccionCard titulo="Canon y Montos" icon="💵">
        <Campo label="Canon base USD"        value={cliente.canonBaseUSD ? `$${cliente.canonBaseUSD}` : '—'} />
        <Campo label="Canon base EUR"        value={cliente.canonBaseEUR ? `€${cliente.canonBaseEUR}` : '—'} />
        <Campo label="Plan contingencia USD" value={cliente.planContingenciaUSD ? `$${cliente.planContingenciaUSD}` : '—'} />
        <Campo label="Canon total USD"       value={cliente.canonTotalUSD ? `$${cliente.canonTotalUSD}` : '—'} />
      </SeccionCard>

      <SeccionCard titulo="Depósito" icon="🏦">
        <Campo label="Depósito total USD"  value={cliente.depositoTotalUSD ? `$${cliente.depositoTotalUSD}` : '—'} />
        <Campo label="Depósito total EUR"  value={cliente.depositoTotalEUR ? `€${cliente.depositoTotalEUR}` : '—'} />
        <Campo label="Cuotas depósito"     value={cliente.depositoMeses ? `${cliente.depositoMeses} cuotas` : '—'} />
        <Campo label="Cargo mora USD"      value={cliente.cargoMoraUSD ? `$${cliente.cargoMoraUSD}/día` : '—'} />
      </SeccionCard>

      {cliente.observaciones && (
        <div className="bg-gradient-to-br from-terra-cream to-terra-cream-mid rounded-xl border-l-4 border-terra-copper p-4 shadow-sm">
          <h4 className="text-xs font-bold text-terra-copper-dark uppercase tracking-wider mb-2 flex items-center gap-2">
            <span>📝</span> Observaciones
          </h4>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{cliente.observaciones}</p>
        </div>
      )}

      {mostrarRenovar && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-amber-800">
              🔄 Renovación disponible
            </p>
            <p className="text-xs text-amber-700/70 mt-0.5">
              {cliente.statusContrato === 'Vencido'
                ? 'Contrato vencido — debe renovarse'
                : `Vence en ${cliente.diasParaVencer} días`}
              {' · '}Costo: <strong>${cliente.costoRenovacion || 50}</strong>
            </p>
          </div>
          <button
            onClick={onRenovarClick}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all whitespace-nowrap"
          >
            🔄 Renovar (${cliente.costoRenovacion || 50})
          </button>
        </div>
      )}

      <div className="flex justify-end pt-1">
        <button
          onClick={onEditarClick}
          className="flex items-center gap-2 bg-gradient-to-r from-terra-copper to-terra-copper-dark hover:from-terra-copper-dark hover:to-[#6a3a22] text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-sm transition-all"
        >
          ✏️ Editar contrato
        </button>
      </div>
    </div>
  );
}

// ── Tab: Legal ────────────────────────────────────────────────────────────────

function TabLegal({ nombre, inmueble }) {
  const [casos, setCasos]           = useState(null);
  const [comunicaciones, setComunicaciones] = useState(null);
  const [cargando, setCargando]     = useState(true);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      setCargando(true);
      try {
        const [resCasos, resComs] = await Promise.all([
          axios.get(`${GAS_SCRIPT_URL}?action=getCasosLegales`),
          axios.get(`${GAS_SCRIPT_URL}?action=getComunicacionesLegales&inquilino=${encodeURIComponent(nombre)}`),
        ]);
        if (!activo) return;
        const todosLosCasos = resCasos.data?.casos || [];
        const casosFiltrados = todosLosCasos.filter(
          c => c.nombre === nombre && c.inmueble === inmueble
        );
        setCasos(casosFiltrados);
        setComunicaciones(resComs.data?.comunicaciones || []);
      } catch (e) {
        toast.error('Error al cargar datos legales');
      } finally {
        if (activo) setCargando(false);
      }
    };
    cargar();
    return () => { activo = false; };
  }, [nombre, inmueble]);

  if (cargando) return <SpinnerTab />;

  const COLOR_CASO = {
    'Abierto':    'bg-red-100    text-red-700    border-red-200',
    'En Proceso': 'bg-orange-100 text-orange-700 border-orange-200',
    'Resuelto':   'bg-green-100  text-green-700  border-green-200',
    'Cerrado':    'bg-gray-100   text-gray-500   border-gray-200',
  };

  const TIPO_ICON = {
    'llamada':  '📞',
    'email':    '📧',
    'visita':   '🚪',
    'telegram': '💬',
    'carta':    '📄',
  };

  return (
    <div className="space-y-5">
      {/* Casos */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-terra-cream to-terra-cream-mid px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
          <span className="text-sm">⚖️</span>
          <h4 className="text-xs font-bold text-terra-copper-dark uppercase tracking-wider">
            Casos legales · {casos?.length || 0}
          </h4>
        </div>
        <div className="p-4">
          {casos?.length > 0 ? (
            <div className="space-y-3">
              {casos.map((c, i) => (
                <div key={i} className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-100 p-3.5 hover:border-terra-copper/30 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-800">Caso #{c.nCaso || i + 1}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${COLOR_CASO[c.estado] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {c.estado}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{c.fechaCreacion}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>Meses sin pagar: <strong className="text-gray-800">{c.mesesSinPagar}</strong></span>
                    <span>Monto: <strong className="text-orange-700">${parseFloat(c.montoAdeudado || 0).toFixed(2)}</strong></span>
                  </div>
                  {c.notas && <p className="mt-2 text-xs text-gray-600 italic border-l-2 border-terra-copper/30 pl-2">{c.notas}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-6 text-center">Sin casos legales activos</p>
          )}
        </div>
      </div>

      {/* Bitácora */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-terra-cream to-terra-cream-mid px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
          <span className="text-sm">📞</span>
          <h4 className="text-xs font-bold text-terra-copper-dark uppercase tracking-wider">
            Bitácora · {comunicaciones?.length || 0}
          </h4>
        </div>
        <div className="p-4">
          {comunicaciones?.length > 0 ? (
            <div className="space-y-2">
              {comunicaciones.slice(0, 20).map((c, i) => (
                <div key={i} className="flex gap-3 bg-gray-50/60 rounded-lg p-3 border border-gray-100 hover:bg-terra-cream/40 transition-colors">
                  <span className="text-xl flex-shrink-0">{TIPO_ICON[c.tipo?.toLowerCase()] || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-terra-copper-dark capitalize">{c.tipo}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">{c.fecha}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-snug">{c.descripcion}</p>
                    {c.gestor && <p className="text-xs text-gray-400 mt-1">— {c.gestor}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-6 text-center">Sin comunicaciones registradas</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Archivos ─────────────────────────────────────────────────────────────

function TabArchivos({ nombre, inmueble }) {
  const [archivos, setArchivos] = useState(null);
  const [carpetaUrl, setCarpetaUrl] = useState('');
  const [cargando, setCargando]   = useState(true);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      setCargando(true);
      try {
        const res = await axios.get(
          `${GAS_SCRIPT_URL}?action=getArchivosCliente&nombre=${encodeURIComponent(nombre)}&inmueble=${encodeURIComponent(inmueble)}`
        );
        if (!activo) return;
        if (res.data?.success) {
          setArchivos(res.data.archivos || []);
          setCarpetaUrl(res.data.carpetaUrl || '');
        } else {
          setArchivos([]);
        }
      } catch (e) {
        toast.error('Error al cargar archivos');
        if (activo) setArchivos([]);
      } finally {
        if (activo) setCargando(false);
      }
    };
    cargar();
    return () => { activo = false; };
  }, [nombre, inmueble]);

  if (cargando) return <SpinnerTab />;

  const ICON_TIPO = {
    'pdf':   '📄',
    'image': '🖼️',
    'doc':   '📝',
    'sheet': '📊',
    'video': '🎥',
  };

  const formatTamano = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-terra-cream to-terra-cream-mid px-4 py-2.5 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">🗂️</span>
          <h4 className="text-xs font-bold text-terra-copper-dark uppercase tracking-wider">
            Archivos · {archivos?.length || 0}
          </h4>
        </div>
        {carpetaUrl && (
          <a
            href={carpetaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-white bg-gradient-to-r from-terra-copper to-terra-copper-dark px-3 py-1.5 rounded-lg shadow-sm hover:from-terra-copper-dark hover:to-[#6a3a22] transition-all flex items-center gap-1.5"
          >
            <span>📂</span> Abrir en Drive
          </a>
        )}
      </div>

      {archivos?.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/60 text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-100">
                <th className="px-3 py-2.5 text-left font-semibold">Archivo</th>
                <th className="px-3 py-2.5 text-right font-semibold hidden sm:table-cell">Tamaño</th>
                <th className="px-3 py-2.5 text-left font-semibold hidden md:table-cell">Fecha</th>
                <th className="px-3 py-2.5 text-center font-semibold">Abrir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {archivos.map((a, i) => (
                <tr key={i} className="hover:bg-terra-cream/30 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{ICON_TIPO[a.tipo] || '📎'}</span>
                      <span className="text-gray-700 font-medium truncate max-w-[220px]">{a.nombre}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-400 hidden sm:table-cell">{formatTamano(a.tamano)}</td>
                  <td className="px-3 py-2.5 text-gray-400 hidden md:table-cell">{a.fecha || '—'}</td>
                  <td className="px-3 py-2.5 text-center">
                    {a.url && (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-terra-copper hover:text-terra-copper-dark transition-colors"
                      >
                        Ver ↗
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-14 text-center px-6">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500 text-sm font-medium mb-1">No hay archivos en esta carpeta</p>
          {carpetaUrl && (
            <a
              href={carpetaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-terra-copper hover:text-terra-copper-dark hover:underline font-semibold"
            >
              Abrir carpeta en Drive para subir archivos →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── Card KPI con borde lateral semántico ──────────────────────────────────────

function KpiCard({ icon, label, value, color = 'border-terra-copper', valueColor = 'text-gray-900' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 ${color} p-3.5 flex items-center gap-3`}>
      <span className="text-2xl">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{label}</p>
        <p className={`text-lg font-bold leading-tight mt-0.5 ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function InquilinoDetalle() {
  const { inmueble, nombre } = useParams();
  const navigate   = useNavigate();
  const { usuario } = useAuth();

  const [tab, setTab]         = useState('datos');
  const [cliente, setCliente] = useState(null);
  const [mesesResumen, setMesesResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError]     = useState('');
  const tabsVisibles = TABS.filter(t => !t.requireRol || t.requireRol.includes(usuario?.rol));

  const cargarDatosBase = useCallback(async () => {
    if (!nombre || !inmueble) return;
    setCargando(true);
    setError('');
    try {
      const [resCliente, resMeses] = await Promise.all([
        axios.get(`${GAS_SCRIPT_URL}?action=getClienteDetalles&nombre=${encodeURIComponent(nombre)}&inmueble=${encodeURIComponent(inmueble)}`),
        axios.get(`${GAS_SCRIPT_URL}?action=getMesesPendientes&nombre=${encodeURIComponent(nombre)}&inmueble=${encodeURIComponent(inmueble)}`),
      ]);
      if (resCliente.data?.error) {
        setError(resCliente.data.error);
      } else {
        setCliente(resCliente.data);
      }
      if (resMeses.data?.success) {
        setMesesResumen(resMeses.data);
      }
    } catch (e) {
      setError('Error de conexión al cargar los datos del inquilino');
      toast.error('Error al cargar datos del inquilino');
    } finally {
      setCargando(false);
    }
  }, [nombre, inmueble]);

  useEffect(() => {
    cargarDatosBase();
  }, [cargarDatosBase]);

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-24">
        <div className="w-12 h-12 border-4 border-terra-copper border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-500 animate-pulse">Cargando expediente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-24 text-center px-6">
        <p className="text-5xl mb-4">⚠️</p>
        <p className="text-gray-700 font-semibold text-lg">{error}</p>
        <button
          onClick={() => navigate('/inquilinos')}
          className="mt-5 px-5 py-2 bg-gradient-to-r from-terra-copper to-terra-copper-dark text-white font-bold rounded-lg shadow-sm hover:from-terra-copper-dark hover:to-terra-navy transition-all"
        >
          ← Volver al directorio
        </button>
      </div>
    );
  }

  const badgeInmueble = COLORES_INMUEBLE[inmueble]?.bg || 'bg-slate-600';
  const badgeStatus   = COLOR_STATUS[cliente?.statusContrato] || 'bg-gray-100 text-gray-600 border-gray-200';
  const mesesPendientes = mesesResumen?.meses?.filter(m => !m.pagado).length || 0;
  const moraTotal       = mesesResumen?.moraTotalAcumulada || cliente?.moraActual || 0;
  const credito         = cliente?.creditoDisponible || 0;

  return (
    <div className="content-enter max-w-5xl mx-auto pb-12 space-y-5">

      {/* ── Breadcrumb ── */}
      <button
        onClick={() => navigate('/inquilinos')}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-terra-copper transition-colors font-semibold uppercase tracking-wider group"
      >
        <span className="transition-transform group-hover:-translate-x-0.5">←</span> Inquilinos
      </button>

      {/* ── Header principal con gradiente ── */}
      <div className="bg-gradient-to-r from-terra-copper to-terra-navy rounded-2xl shadow-lg overflow-hidden relative">
        {/* Decoración sutil */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-terra-gold rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        </div>

        <div className="relative p-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] text-terra-gold-light/80 font-bold uppercase tracking-[0.2em] mb-1">
              Expediente del Inquilino
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{nombre}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={`text-xs font-bold text-white px-3 py-1 rounded-full ${badgeInmueble} shadow-sm`}>
                🏠 {inmueble}
              </span>
              {cliente?.unidad && (
                <span className="text-xs text-white/80 bg-white/10 px-3 py-1 rounded-full">
                  {cliente.ubicacion} · {cliente.unidad}
                </span>
              )}
              {cliente?.statusContrato && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badgeStatus} bg-white shadow-sm`}>
                  {cliente.statusContrato}
                </span>
              )}
            </div>
          </div>

          {/* Acciones header */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => navigate(`/editar-cliente/${encodeURIComponent(inmueble)}/${encodeURIComponent(nombre)}`)}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-sm font-semibold rounded-lg transition-all border border-white/20 flex items-center gap-1.5"
            >
              ✏️ Editar
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards resumen financiero ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon="💰"
          label="Canon mensual"
          value={cliente?.canonBaseUSD ? `$${cliente.canonBaseUSD}` : '—'}
          color="border-terra-copper"
          valueColor="text-terra-copper-dark"
        />
        <KpiCard
          icon="⚠️"
          label="Mora acumulada"
          value={`$${moraTotal.toFixed(2)}`}
          color={moraTotal > 0 ? 'border-orange-500' : 'border-gray-200'}
          valueColor={moraTotal > 0 ? 'text-orange-600' : 'text-gray-900'}
        />
        <KpiCard
          icon="⏳"
          label="Meses pdte."
          value={mesesPendientes}
          color={mesesPendientes > 0 ? 'border-amber-500' : 'border-gray-200'}
          valueColor={mesesPendientes > 0 ? 'text-amber-600' : 'text-gray-900'}
        />
        <KpiCard
          icon="✅"
          label="Crédito"
          value={`$${credito.toFixed(2)}`}
          color={credito > 0 ? 'border-green-500' : 'border-gray-200'}
          valueColor={credito > 0 ? 'text-green-600' : 'text-gray-900'}
        />
      </div>

      {/* ── Tabs nav (estilo pills con underline) ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex gap-1 px-2 overflow-x-auto border-b border-gray-100">
          {tabsVisibles.map(t => {
            const activo = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap transition-all relative ${
                  activo
                    ? 'text-terra-copper'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <span className="text-base">{t.icon}</span>
                {t.label}
                {activo && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-terra-copper to-terra-copper-dark rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Contenido del tab activo */}
        <div className="p-5 bg-gradient-to-br from-gray-50/40 to-white">
          {tab === 'datos'    && <TabDatos    cliente={cliente} />}
          {tab === 'pagos'    && <TabPagos    nombre={nombre} inmueble={inmueble} navigate={navigate} />}
          {tab === 'contrato' && <TabContrato
            cliente={cliente}
            onEditarClick={() => navigate(`/editar-cliente/${encodeURIComponent(inmueble)}/${encodeURIComponent(nombre)}`)}
            onRenovarClick={() => navigate('/cobros', { state: {
              cliente: nombre,
              inmueble,
              renovacion: true,
              montoRenovacion: cliente?.costoRenovacion || 50
            }})}
          />}
          {tab === 'legal'    && <TabLegal    nombre={nombre} inmueble={inmueble} />}
          {tab === 'archivos' && <TabArchivos nombre={nombre} inmueble={inmueble} />}
        </div>
      </div>

    </div>
  );
}
