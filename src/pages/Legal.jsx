import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { GAS_SCRIPT_URL } from '../services/api';

const TABS = [
  { id: 'expedientes', label: '📁 Expedientes' },
  { id: 'casos',       label: '⚠️ Casos Activos' },
  { id: 'bitacora',    label: '📝 Bitácora' },
  { id: 'archivo',     label: '🗂️ Archivo Digital' },
  { id: 'reportes',    label: '📊 Reportes' },
];

const PRIORIDAD = { 'Para Dar de Baja': 0, 'Moroso': 1, 'Vencido': 2, 'Por Renovar': 3, 'Vigente': 4, 'Inactivo': 99 };

const STATUS_BADGE = {
  'Para Dar de Baja': 'bg-red-100 text-red-700 border border-red-200',
  'Moroso':           'bg-orange-100 text-orange-700 border border-orange-200',
  'Vencido':          'bg-yellow-100 text-yellow-700 border border-yellow-200',
  'Por Renovar':      'bg-blue-100 text-blue-700 border border-blue-200',
  'Vigente':          'bg-green-100 text-green-700 border border-green-200',
  'Inactivo':         'bg-gray-100 text-gray-500 border border-gray-200',
};

function Legal() {
  const [tabActiva, setTabActiva] = useState('expedientes');

  return (
    <div className="content-enter max-w-7xl mx-auto space-y-4 pb-16">
      <div className="relative bg-gradient-to-r from-terra-copper to-terra-navy rounded-2xl p-6 text-white overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-full bg-terra-gold/10 blur-2xl rounded-full" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border border-white/20">⚖️</div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-0.5">Módulo</p>
            <h1 className="text-2xl font-black tracking-tight">Departamento Legal</h1>
            <p className="text-sm text-white/70 mt-0.5">Gestión de expedientes, casos activos, comunicaciones y archivo digital.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-terra-gold/20">
          <div className="flex overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                className={`px-5 py-4 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                  tabActiva === tab.id
                    ? 'border-terra-copper text-terra-copper bg-terra-cream'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-terra-cream/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {tabActiva === 'expedientes' ? (
            <TabExpedientes />
          ) : tabActiva === 'casos' ? (
            <TabCasosActivos />
          ) : tabActiva === 'bitacora' ? (
            <TabBitacora />
          ) : tabActiva === 'archivo' ? (
            <TabArchivoDigital />
          ) : tabActiva === 'reportes' ? (
            <TabReportes />
          ) : (
            <TabProximamente tab={TABS.find(t => t.id === tabActiva)} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab Expedientes ────────────────────────────────────────────────────────

function TabExpedientes() {
  const [inquilinos, setInquilinos]           = useState([]);
  const [cargando, setCargando]               = useState(true);
  const [filtroInmueble, setFiltroInmueble]   = useState('Todos');
  const [filtroEstado, setFiltroEstado]       = useState('Todos');
  const [busqueda, setBusqueda]               = useState('');
  const [modalInquilino, setModalInquilino]   = useState(null);

  useEffect(() => { cargarInquilinos(); }, []);

  const cargarInquilinos = async () => {
    setCargando(true);
    try {
      const res = await axios.get(`${GAS_SCRIPT_URL}?action=getInquilinos`);
      const datos = Array.isArray(res.data) ? res.data : [];
      setInquilinos(datos.filter(i => i.nombre && i.nombre.trim() !== '' && i.status !== 'Inactivo'));
    } catch {
      toast.error('❌ Error al cargar inquilinos');
    } finally {
      setCargando(false);
    }
  };

  const criticos  = inquilinos.filter(i => i.status === 'Para Dar de Baja');
  const enMora    = inquilinos.filter(i => i.status === 'Moroso');
  const alDia     = inquilinos.filter(i => i.estadoPago === 'Al día' && i.status !== 'Para Dar de Baja');
  const atencion  = inquilinos.filter(i => i.estadoPago !== 'Al día' && i.status !== 'Moroso' && i.status !== 'Para Dar de Baja');

  const filtrados = inquilinos
    .filter(i => filtroInmueble === 'Todos' || i.inmueble === filtroInmueble)
    .filter(i => {
      if (filtroEstado === 'Criticos')  return i.status === 'Para Dar de Baja';
      if (filtroEstado === 'Mora')      return i.status === 'Moroso';
      if (filtroEstado === 'Al día')    return i.estadoPago === 'Al día';
      if (filtroEstado === 'Atención')  return i.estadoPago !== 'Al día' && i.status === 'Vigente';
      return true;
    })
    .filter(i => !busqueda || i.nombre.toLowerCase().includes(busqueda.toLowerCase()) || i.unidad?.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => (PRIORIDAD[a.status] ?? 5) - (PRIORIDAD[b.status] ?? 5));

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-terra-copper border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Cargando expedientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total activos" valor={inquilinos.length} color="gray" />
        <KpiCard label="Al día" valor={alDia.length} color="green" />
        <KpiCard label="Con mora" valor={enMora.length} color="orange" />
        <KpiCard label="Críticos" valor={criticos.length} color="red" alerta={criticos.length > 0} />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Buscar inquilino..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper w-52"
        />
        <select
          value={filtroInmueble}
          onChange={e => setFiltroInmueble(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper"
        >
          <option value="Todos">Todos los inmuebles</option>
<option value="Tulipanes">Tulipanes</option>
            <option value="Remanso">Remanso</option>
            <option value="El Morro">El Morro</option>
        </select>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper"
        >
          <option value="Todos">Todos los estados</option>
          <option value="Criticos">🔴 Críticos</option>
          <option value="Mora">🟠 Con mora</option>
          <option value="Atención">🟡 Atención</option>
          <option value="Al día">🟢 Al día</option>
        </select>
        <button
          onClick={cargarInquilinos}
          className="ml-auto text-xs text-terra-copper hover:text-terra-copper-dark border border-terra-copper/30 hover:border-terra-copper/60 px-3 py-2 rounded-lg transition-colors"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Tabla */}
      {filtrados.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm">No hay expedientes que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-terra-cream to-terra-cream-mid text-left text-xs font-bold text-terra-copper-dark uppercase tracking-wider">
                <th className="px-4 py-3">Inquilino</th>
                <th className="px-4 py-3 hidden sm:table-cell">Inmueble</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">Meses sin pagar</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.map(inq => (
                <FilaExpediente
                  key={`${inq.nombre}-${inq.inmueble}`}
                  inq={inq}
                  onVerExpediente={() => setModalInquilino(inq)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalInquilino && (
        <ModalExpediente
          inquilino={modalInquilino}
          onClose={() => setModalInquilino(null)}
        />
      )}
    </div>
  );
}

function KpiCard({ label, valor, color, alerta }) {
  const colores = {
    gray:   'bg-gray-50 border-gray-200 text-gray-700',
    green:  'bg-green-50 border-green-200 text-green-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red:    'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <div className={`rounded-xl border p-4 ${colores[color]}`}>
      <p className="text-2xl font-black flex items-center gap-2">
        {valor}
        {alerta && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />}
      </p>
      <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
    </div>
  );
}

function FilaExpediente({ inq, onVerExpediente }) {
  const nivelRiesgo = inq.status === 'Para Dar de Baja'
    ? 'bg-red-50'
    : inq.status === 'Moroso'
    ? 'bg-orange-50/50'
    : '';

  return (
    <tr
      onClick={onVerExpediente}
      className={`hover:bg-terra-cream/30 transition-colors cursor-pointer ${nivelRiesgo}`}
    >
      <td className="px-4 py-3">
        <p className="font-medium text-gray-800">{inq.nombre}</p>
        <p className="text-xs text-gray-400">{inq.cedula}</p>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <p className="text-gray-700">{inq.inmueble}</p>
        <p className="text-xs text-gray-400">{inq.unidad}</p>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[inq.status] || STATUS_BADGE['Vigente']}`}>
          {inq.status}
        </span>
      </td>
      <td className="px-4 py-3 text-center hidden sm:table-cell">
        {inq.mesesSinPagar > 0 ? (
          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
            inq.mesesSinPagar >= 2 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {inq.mesesSinPagar}
          </span>
        ) : (
          <span className="text-green-600 text-base">✓</span>
        )}
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onVerExpediente}
          className="hidden sm:inline-flex text-xs text-terra-copper hover:text-terra-copper-dark border border-terra-copper/30 hover:border-terra-copper hover:bg-terra-cream px-3 py-1.5 rounded-lg transition-all font-medium"
        >
          Ver expediente →
        </button>
      </td>
    </tr>
  );
}

// ─── Modal Expediente ───────────────────────────────────────────────────────

function ModalExpediente({ inquilino, onClose }) {
  const navigate = useNavigate();
  const [detalle, setDetalle]         = useState(null);
  const [cargando, setCargando]       = useState(true);
  const [abriendo, setAbriendo]       = useState(false);
  const [casoYaExiste, setCasoYaExiste] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [mesesRes, casosRes] = await Promise.all([
          axios.get(`${GAS_SCRIPT_URL}?action=getMesesPendientes&nombre=${encodeURIComponent(inquilino.nombre)}&inmueble=${encodeURIComponent(inquilino.inmueble)}`),
          axios.get(`${GAS_SCRIPT_URL}?action=getCasosLegales`)
        ]);
        setDetalle(mesesRes.data);
        const casos = casosRes.data?.casos || [];
        const tieneAbierto = casos.some(c =>
          c.inquilino?.toLowerCase() === inquilino.nombre?.toLowerCase() &&
          c.inmueble?.toLowerCase() === inquilino.inmueble?.toLowerCase() &&
          (c.estado === 'Abierto' || c.estado === 'En Gestión')
        );
        setCasoYaExiste(tieneAbierto);
      } catch {
        toast.error('❌ Error al cargar el expediente');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [inquilino]);

  const irACobros = () => {
    onClose();
    navigate('/cobros', { state: { cliente: inquilino.nombre, inmueble: inquilino.inmueble } });
  };

  const irADetalle = () => {
    onClose();
    navigate(`/inquilinos/${encodeURIComponent(inquilino.inmueble)}/${encodeURIComponent(inquilino.nombre)}`);
  };

  const abrirCaso = async () => {
    setAbriendo(true);
    try {
      const res = await axios.post(GAS_SCRIPT_URL, JSON.stringify({
        action: 'abrirCasoManual',
        nombre: inquilino.nombre,
        inmueble: inquilino.inmueble,
        unidad: inquilino.unidad || '',
        mesesSinPagar: detalle?.totalMesesPendientes || 0,
        montoAdeudado: detalle?.totalAdeudado || 0
      }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
      if (res.data?.success) {
        toast.success(`✅ Caso Legal #${res.data.nCaso} abierto`);
        setCasoYaExiste(true);
      } else {
        toast.error('❌ ' + (res.data?.error || 'No se pudo abrir el caso'));
      }
    } catch {
      toast.error('❌ Error de conexión');
    } finally {
      setAbriendo(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-lg text-gray-800">📁 Expediente Legal</h3>
            <p className="text-sm text-gray-500 mt-0.5">{inquilino.nombre} · {inquilino.inmueble}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Info básica */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <InfoChip label="Inmueble" valor={inquilino.inmueble} />
            <InfoChip label="Unidad" valor={inquilino.unidad} />
            <InfoChip label="Status" valor={inquilino.status} />
            {inquilino.telefono && <InfoChip label="Teléfono" valor={inquilino.telefono} />}
            {inquilino.correo && <InfoChip label="Correo" valor={inquilino.correo} className="col-span-2" />}
          </div>

          {cargando ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-terra-copper border-t-transparent rounded-full animate-spin" />
            </div>
          ) : detalle?.success ? (
            <>
              {/* Resumen financiero */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <ResumenCard label="Meses pendientes" valor={detalle.totalMesesPendientes} color={detalle.totalMesesPendientes >= 2 ? 'red' : detalle.totalMesesPendientes > 0 ? 'orange' : 'green'} />
                <ResumenCard label="Canon adeudado" valor={`$${Number(detalle.canonAdeudado || 0).toFixed(2)}`} color="gray" />
                <ResumenCard label="Mora acumulada" valor={`$${Number(detalle.moraTotalAcumulada || 0).toFixed(2)}`} color={detalle.moraTotalAcumulada > 0 ? 'orange' : 'green'} />
              </div>

              {/* Total destacado */}
              {detalle.totalAdeudado > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-red-600 font-semibold uppercase tracking-wide">Total adeudado</p>
                    <p className="text-2xl font-black text-red-700">${Number(detalle.totalAdeudado).toFixed(2)} USD</p>
                  </div>
                  {detalle.alertaDesactivacion && (
                    <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded-full font-semibold">
                      ⚠️ Requiere acción legal
                    </span>
                  )}
                </div>
              )}

              {/* Desglose de meses */}
              {detalle.meses?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Desglose por mes</p>
                  <div className="space-y-2">
                    {detalle.meses.map((mes, idx) => (
                      <div key={idx} className={`flex items-center justify-between rounded-lg px-4 py-2.5 text-sm ${mes.pagado ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-center gap-2">
                          <span>{mes.pagado ? '✅' : '❌'}</span>
                          <span className={`font-medium ${mes.pagado ? 'text-green-700' : 'text-red-700'}`}>{mes.mes}</span>
                        </div>
                        {!mes.pagado && (
                          <div className="text-right text-xs text-red-600">
                            {mes.mora > 0 && <span className="mr-3">Mora: ${mes.mora.toFixed(2)}</span>}
                            {mes.diasRetraso > 0 && <span className="text-gray-500">{mes.diasRetraso}d retraso</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detalle.totalMesesPendientes === 0 && (
                <div className="text-center py-6 text-green-600">
                  <p className="text-3xl mb-2">✅</p>
                  <p className="font-medium">Inquilino al día</p>
                  <p className="text-sm text-gray-400">Sin pagos pendientes</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No se pudo cargar el detalle del expediente.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap gap-2 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="py-2.5 px-4 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={irADetalle}
            className="py-2.5 px-4 border border-terra-copper/30 text-terra-copper rounded-xl text-sm font-medium hover:bg-terra-cream transition-colors"
          >
            📋 Ver expediente completo
          </button>
          {!cargando && detalle?.totalMesesPendientes > 0 && !casoYaExiste && (
            <button
              onClick={abrirCaso}
              disabled={abriendo}
              className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            >
              {abriendo ? '⏳ Abriendo...' : '⚖️ Abrir caso legal'}
            </button>
          )}
          {casoYaExiste && (
            <span className="py-2.5 px-4 bg-orange-50 text-orange-700 border border-orange-200 rounded-xl text-sm font-medium">
              ⚖️ Caso abierto
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoChip({ label, valor, className = '' }) {
  return (
    <div className={`bg-gray-50 rounded-lg p-3 ${className}`}>
      <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
      <p className="text-sm text-gray-700 font-semibold truncate">{valor || '—'}</p>
    </div>
  );
}

function ResumenCard({ label, valor, color }) {
  const colores = {
    gray:   'bg-gray-50 text-gray-700',
    green:  'bg-green-50 text-green-700',
    orange: 'bg-orange-50 text-orange-700',
    red:    'bg-red-50 text-red-700',
  };
  return (
    <div className={`rounded-xl p-4 text-center ${colores[color]}`}>
      <p className="text-xl font-black">{valor}</p>
      <p className="text-xs font-medium mt-0.5 opacity-75">{label}</p>
    </div>
  );
}

// ─── Helper: Link al detalle del inquilino ──────────────────────────────────

function LinkInquilino({ nombre, inmueble }) {
  const navigate = useNavigate();
  if (!nombre || !inmueble) return null;
  return (
    <button
      onClick={() => navigate(`/inquilinos/${encodeURIComponent(inmueble)}/${encodeURIComponent(nombre)}`)}
      title="Ver expediente completo"
      className="text-xs text-gray-400 hover:text-terra-copper border border-gray-200 hover:border-terra-copper/40 hover:bg-terra-cream px-2 py-1.5 rounded-lg transition-all"
    >
      👤
    </button>
  );
}

// ─── Tab Casos Activos ──────────────────────────────────────────────────────

const ESTADO_BADGE = {
  'Abierto':     'bg-red-100 text-red-700 border border-red-200',
  'En Gestión':  'bg-orange-100 text-orange-700 border border-orange-200',
  'Cerrado':     'bg-gray-100 text-gray-500 border border-gray-200',
  'Resuelto':    'bg-green-100 text-green-700 border border-green-200',
};

const ESTADOS = ['Abierto', 'En Gestión', 'Cerrado', 'Resuelto'];

function TabCasosActivos() {
  const [casos, setCasos]               = useState([]);
  const [cargando, setCargando]         = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('activos');
  const [busqueda, setBusqueda]         = useState('');
  const [modalCaso, setModalCaso]       = useState(null);

  useEffect(() => { cargarCasos(); }, []);

  const cargarCasos = async () => {
    setCargando(true);
    try {
      const res = await axios.get(`${GAS_SCRIPT_URL}?action=getCasosLegales`);
      setCasos(res.data?.casos || []);
    } catch {
      toast.error('❌ Error al cargar casos legales');
    } finally {
      setCargando(false);
    }
  };

  const abiertos   = casos.filter(c => c.estado === 'Abierto');
  const enGestion  = casos.filter(c => c.estado === 'En Gestión');
  const resueltos  = casos.filter(c => c.estado === 'Resuelto' || c.estado === 'Cerrado');
  const montoTotal = casos
    .filter(c => c.estado === 'Abierto' || c.estado === 'En Gestión')
    .reduce((sum, c) => sum + (c.montoAdeudado || 0), 0);

  const filtrados = casos
    .filter(c => {
      if (filtroEstado === 'activos') return c.estado === 'Abierto' || c.estado === 'En Gestión';
      if (filtroEstado === 'cerrados') return c.estado === 'Cerrado' || c.estado === 'Resuelto';
      return true;
    })
    .filter(c => !busqueda ||
      c.inquilino?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.inmueble?.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => {
      const order = { 'Abierto': 0, 'En Gestión': 1, 'Cerrado': 2, 'Resuelto': 3 };
      return (order[a.estado] ?? 9) - (order[b.estado] ?? 9);
    });

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-terra-copper border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Cargando casos legales...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Casos abiertos"   valor={abiertos.length}  color="red"    alerta={abiertos.length > 0} />
        <KpiCard label="En gestión"        valor={enGestion.length} color="orange" />
        <KpiCard label="Resueltos"         valor={resueltos.length} color="green" />
        <KpiCard label="Monto en riesgo"   valor={`$${montoTotal.toFixed(0)}`} color="gray" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Buscar inquilino o inmueble..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper w-56"
        />
        <div className="flex rounded-lg overflow-hidden border border-gray-200 text-sm">
          {[['activos','Activos'],['cerrados','Cerrados'],['todos','Todos']].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setFiltroEstado(val)}
              className={`px-4 py-2 transition-colors ${filtroEstado === val ? 'bg-terra-copper text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {lbl}
            </button>
          ))}
        </div>
        <button
          onClick={cargarCasos}
          className="ml-auto text-xs text-terra-copper hover:text-terra-copper-dark border border-terra-copper/30 hover:border-terra-copper/60 px-3 py-2 rounded-lg transition-colors"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Tabla */}
      {filtrados.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">{filtroEstado === 'activos' ? '✅' : '📭'}</p>
          <p className="text-sm">
            {filtroEstado === 'activos' ? 'No hay casos activos.' : 'No hay casos que coincidan.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-terra-cream to-terra-cream-mid text-left text-xs font-bold text-terra-copper-dark uppercase tracking-wider">
                <th className="px-4 py-3 hidden sm:table-cell">#</th>
                <th className="px-4 py-3">Inquilino</th>
                <th className="px-4 py-3 hidden sm:table-cell">Inmueble</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">Meses</th>
                <th className="px-4 py-3 text-right hidden sm:table-cell">Monto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 hidden sm:table-cell">Apertura</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.map(caso => (
                <tr
                  key={caso.nCaso}
                  onClick={() => setModalCaso(caso)}
                  className={`hover:bg-terra-cream/30 transition-colors cursor-pointer ${caso.estado === 'Abierto' ? 'bg-red-50/30' : ''}`}
                >
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs hidden sm:table-cell">#{caso.nCaso}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{caso.inquilino}</p>
                    {caso.unidad && <p className="text-xs text-gray-400">{caso.unidad}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{caso.inmueble}</td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      caso.mesesSinPagar >= 3 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {caso.mesesSinPagar}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-700 hidden sm:table-cell">
                    ${Number(caso.montoAdeudado).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_BADGE[caso.estado] || ESTADO_BADGE['Abierto']}`}>
                      {caso.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">{caso.fechaApertura}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <LinkInquilino nombre={caso.inquilino} inmueble={caso.inmueble} />
                      <button
                        onClick={() => setModalCaso(caso)}
                        className="hidden sm:inline-flex text-xs text-terra-copper hover:text-terra-copper-dark border border-terra-copper/30 hover:border-terra-copper hover:bg-terra-cream px-3 py-1.5 rounded-lg transition-all font-medium"
                      >
                        Gestionar →
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal gestión de caso */}
      {modalCaso && (
        <ModalGestionCaso
          caso={modalCaso}
          onClose={() => setModalCaso(null)}
          onActualizado={() => { setModalCaso(null); cargarCasos(); }}
        />
      )}
    </div>
  );
}

function ModalGestionCaso({ caso, onClose, onActualizado }) {
  const navigate = useNavigate();
  const [nuevoEstado, setNuevoEstado] = useState(caso.estado);
  const [notas, setNotas]             = useState(caso.notas || '');
  const [guardando, setGuardando]     = useState(false);

  const guardar = async () => {
    setGuardando(true);
    try {
      const res = await axios.post(
        GAS_SCRIPT_URL,
        JSON.stringify({ action: 'actualizarCasoLegal', nCaso: caso.nCaso, cambios: { estado: nuevoEstado, notas } }),
        { headers: { 'Content-Type': 'text/plain;charset=utf-8' } }
      );
      if (res.data?.success) {
        toast.success('✅ Caso actualizado');
        onActualizado();
      } else {
        toast.error('❌ ' + (res.data?.error || 'Error al actualizar'));
      }
    } catch {
      toast.error('❌ Error de conexión');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-lg text-gray-800">⚖️ Caso Legal #{caso.nCaso}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{caso.inquilino} · {caso.inmueble}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Info del caso */}
          <div className="grid grid-cols-3 gap-3">
            <InfoChip label="Apertura"      valor={caso.fechaApertura} />
            <InfoChip label="Meses sin pagar" valor={caso.mesesSinPagar} />
            <InfoChip label="Monto adeudado" valor={`$${Number(caso.montoAdeudado).toFixed(2)}`} />
          </div>

          {/* Cambiar estado */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Estado del caso</label>
            <div className="flex gap-2 flex-wrap">
              {ESTADOS.map(e => (
                <button
                  key={e}
                  onClick={() => setNuevoEstado(e)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    nuevoEstado === e
                      ? (ESTADO_BADGE[e] || 'bg-terra-cream text-terra-copper border-terra-gold/30')
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            {nuevoEstado === 'En Gestión' && caso.estado !== 'En Gestión' && (
              <p className="mt-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                ⚠️ Para marcar "En Gestión" debes haber registrado al menos una comunicación en la bitácora del caso.
              </p>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notas de gestión</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={3}
              placeholder="Ej: Se envió carta notarial el 15/06. Cliente prometió pagar antes del 30..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            className="flex-1 py-2.5 bg-gradient-to-r from-terra-copper to-terra-copper-dark text-white rounded-xl text-sm font-semibold hover:from-terra-copper-dark hover:to-terra-navy transition-all disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab Bitácora ────────────────────────────────────────────────────────────

const TIPOS_COMUNICACION = [
  '📞 Llamada',
  '📧 Email',
  '✉️ Carta',
  '🤝 Reunión',
  '📋 Acuerdo de Pago',
  '📬 Notificación',
  '💬 WhatsApp',
  '🔖 Otro',
];

const TIPO_BADGE = {
  '📞 Llamada':        'bg-blue-50 text-blue-700',
  '📧 Email':          'bg-purple-50 text-purple-700',
  '✉️ Carta':          'bg-orange-50 text-orange-700',
  '🤝 Reunión':        'bg-green-50 text-green-700',
  '📋 Acuerdo de Pago':'bg-teal-50 text-teal-700',
  '📬 Notificación':   'bg-yellow-50 text-yellow-700',
  '💬 WhatsApp':       'bg-emerald-50 text-emerald-700',
  '🔖 Otro':           'bg-gray-50 text-gray-600',
};

const FORM_VACIO = {
  nCaso: '', inquilino: '', inmueble: '', tipo: '📞 Llamada',
  descripcion: '', resultado: '', proximaAccion: '', fechaProxAccion: ''
};

function TabBitacora() {
  const [entradas, setEntradas]       = useState([]);
  const [casos, setCasos]             = useState([]);
  const [cargando, setCargando]       = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtroTipo, setFiltroTipo]   = useState('Todos');
  const [busqueda, setBusqueda]       = useState('');

  useEffect(() => {
    Promise.all([cargarEntradas(), cargarCasos()]);
  }, []);

  const cargarEntradas = async () => {
    setCargando(true);
    try {
      const res = await axios.get(`${GAS_SCRIPT_URL}?action=getComunicacionesLegales`);
      setEntradas(res.data?.entradas || []);
    } catch {
      toast.error('❌ Error al cargar la bitácora');
    } finally {
      setCargando(false);
    }
  };

  const cargarCasos = async () => {
    try {
      const res = await axios.get(`${GAS_SCRIPT_URL}?action=getCasosLegales`);
      setCasos((res.data?.casos || []).filter(c => c.estado === 'Abierto' || c.estado === 'En Gestión'));
    } catch { /* silencioso */ }
  };

  const filtradas = entradas
    .filter(e => filtroTipo === 'Todos' || e.tipo === filtroTipo)
    .filter(e => !busqueda ||
      e.inquilino?.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.descripcion?.toLowerCase().includes(busqueda.toLowerCase()));

  // Agrupar por fecha para vista timeline
  const porFecha = filtradas.reduce((acc, entrada) => {
    const key = entrada.fecha || 'Sin fecha';
    if (!acc[key]) acc[key] = [];
    acc[key].push(entrada);
    return acc;
  }, {});

  const proximasAcciones = entradas.filter(e => e.proximaAccion && e.fechaProxAccion);

  if (cargando) return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-terra-copper border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Cargando bitácora...</p>
      </div>
    </div>
  );

  return (
    <div>
      {/* KPIs rápidos */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard label="Total entradas"      valor={entradas.length}         color="gray" />
        <KpiCard label="Esta semana"          valor={entradasEstaSemana(entradas)} color="orange" />
        <KpiCard label="Próximas acciones"    valor={proximasAcciones.length} color={proximasAcciones.length > 0 ? 'red' : 'green'} />
      </div>

      {/* Próximas acciones pendientes */}
      {proximasAcciones.length > 0 && (
        <div className="bg-terra-cream border border-terra-gold/30 rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-terra-copper uppercase tracking-wider mb-2">⏰ Próximas acciones pendientes</p>
          <div className="space-y-1">
            {proximasAcciones.slice(0, 3).map((e, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-terra-navy"><span className="font-medium">{e.inquilino}</span> — {e.proximaAccion}</span>
                <span className="text-terra-copper text-xs font-medium">{e.fechaProxAccion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra de acciones */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Buscar inquilino o descripción..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper w-56"
        />
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper"
        >
          <option value="Todos">Todos los tipos</option>
          {TIPOS_COMUNICACION.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          onClick={() => setModalAbierto(true)}
          className="ml-auto bg-gradient-to-r from-terra-copper to-terra-copper-dark text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-terra-copper-dark hover:to-terra-navy transition-all shadow-sm flex items-center gap-2"
        >
          <span>+</span> Nueva entrada
        </button>
      </div>

      {/* Timeline */}
      {filtradas.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">📝</p>
          <p className="text-sm">No hay entradas en la bitácora.</p>
          <button
            onClick={() => setModalAbierto(true)}
            className="mt-4 text-terra-copper hover:text-terra-copper-dark text-sm font-medium underline"
          >
            Registrar primera comunicación
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(porFecha).map(([fecha, entradasFecha]) => (
            <div key={fecha}>
              {/* Separador de fecha */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">{fecha}</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="space-y-3">
                {entradasFecha.map(entrada => (
                  <EntradaBitacora key={entrada.nEntrada} entrada={entrada} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nueva entrada */}
      {modalAbierto && (
        <ModalNuevaEntrada
          casos={casos}
          onClose={() => setModalAbierto(false)}
          onGuardado={() => { setModalAbierto(false); cargarEntradas(); }}
        />
      )}
    </div>
  );
}

function entradasEstaSemana(entradas) {
  const hace7 = new Date();
  hace7.setDate(hace7.getDate() - 7);
  return entradas.filter(e => {
    if (!e.fecha) return false;
    const partes = e.fecha.split('/');
    if (partes.length !== 3) return false;
    const d = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
    return d >= hace7;
  }).length;
}

function EntradaBitacora({ entrada }) {
  const [expandida, setExpandida] = useState(false);
  const tipoBadge = TIPO_BADGE[entrada.tipo] || 'bg-gray-50 text-gray-600';

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:border-terra-gold/20 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Indicador de tipo */}
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${tipoBadge}`}>
            {entrada.tipo}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 text-sm truncate">{entrada.inquilino}
              {entrada.inmueble && <span className="text-gray-400 font-normal"> · {entrada.inmueble}</span>}
              {entrada.nCaso && <span className="text-gray-400 font-normal text-xs"> · Caso #{entrada.nCaso}</span>}
            </p>
            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{entrada.descripcion}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400">{entrada.registradoPor?.split('@')[0]}</span>
          {(entrada.resultado || entrada.proximaAccion) && (
            <button
              onClick={() => setExpandida(!expandida)}
              className="text-xs text-terra-copper hover:text-terra-copper-dark font-medium"
            >
              {expandida ? 'Ocultar' : 'Ver más'}
            </button>
          )}
        </div>
      </div>

      {expandida && (
        <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-2 gap-3 text-sm">
          {entrada.resultado && (
            <div>
              <p className="text-xs text-gray-400 font-medium mb-0.5">Resultado</p>
              <p className="text-gray-700">{entrada.resultado}</p>
            </div>
          )}
          {entrada.proximaAccion && (
            <div>
              <p className="text-xs text-gray-400 font-medium mb-0.5">Próxima acción</p>
              <p className="text-gray-700">{entrada.proximaAccion}
                {entrada.fechaProxAccion && (
                  <span className="ml-2 text-xs text-terra-copper font-medium">{entrada.fechaProxAccion}</span>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ModalNuevaEntrada({ casos, onClose, onGuardado }) {
  const [form, setForm]         = useState({ ...FORM_VACIO });
  const [guardando, setGuardando] = useState(false);

  const set = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }));

  // Al seleccionar un caso, auto-rellena inquilino e inmueble
  const onCasoChange = (nCaso) => {
    set('nCaso', nCaso);
    if (nCaso) {
      const caso = casos.find(c => String(c.nCaso) === String(nCaso));
      if (caso) {
        set('inquilino', caso.inquilino);
        set('inmueble', caso.inmueble);
      }
    }
  };

  const guardar = async () => {
    if (!form.inquilino.trim() || !form.descripcion.trim()) {
      toast.error('❌ Inquilino y descripción son obligatorios');
      return;
    }
    setGuardando(true);
    try {
      const res = await axios.post(
        GAS_SCRIPT_URL,
        JSON.stringify({ action: 'registrarComunicacionLegal', ...form }),
        { headers: { 'Content-Type': 'text/plain;charset=utf-8' } }
      );
      if (res.data?.success) {
        toast.success('✅ Entrada registrada en la bitácora');
        onGuardado();
      } else {
        toast.error('❌ ' + (res.data?.error || 'Error al guardar'));
      }
    } catch {
      toast.error('❌ Error de conexión');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-lg text-gray-800">📝 Nueva entrada en bitácora</h3>
            <p className="text-sm text-gray-500 mt-0.5">Registrar comunicación o gestión legal</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Vincular a caso (opcional) */}
          {casos.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Vincular a caso (opcional)
              </label>
              <select
                value={form.nCaso}
                onChange={e => onCasoChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper"
              >
                <option value="">— Sin caso vinculado —</option>
                {casos.map(c => (
                  <option key={c.nCaso} value={c.nCaso}>
                    Caso #{c.nCaso} — {c.inquilino} ({c.inmueble})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Inquilino + Inmueble */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Inquilino <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.inquilino}
                onChange={e => set('inquilino', e.target.value)}
                placeholder="Nombre completo"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Inmueble</label>
              <select
                value={form.inmueble}
                onChange={e => set('inmueble', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper"
              >
                <option value="">— Seleccionar —</option>
                <option>Tulipanes</option>
                <option>Remanso</option>
                <option>El Morro</option>
              </select>
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tipo de comunicación</label>
            <div className="flex flex-wrap gap-2">
              {TIPOS_COMUNICACION.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('tipo', t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    form.tipo === t
                      ? 'bg-terra-cream border-terra-gold/40 text-terra-copper-dark'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Descripción <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.descripcion}
              onChange={e => set('descripcion', e.target.value)}
              rows={3}
              placeholder="Ej: Se realizó llamada al inquilino. No contestó. Se dejó mensaje en buzón..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper resize-none"
            />
          </div>

          {/* Resultado */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Resultado / Respuesta</label>
            <input
              type="text"
              value={form.resultado}
              onChange={e => set('resultado', e.target.value)}
              placeholder="Ej: Prometió pagar el viernes, acordó plan de pago..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper"
            />
          </div>

          {/* Próxima acción + fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Próxima acción</label>
              <input
                type="text"
                value={form.proximaAccion}
                onChange={e => set('proximaAccion', e.target.value)}
                placeholder="Ej: Enviar carta notarial"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Fecha</label>
              <input
                type="date"
                value={form.fechaProxAccion}
                onChange={e => set('fechaProxAccion', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            className="flex-1 py-2.5 bg-gradient-to-r from-terra-copper to-terra-copper-dark text-white rounded-xl text-sm font-semibold hover:from-terra-copper-dark hover:to-terra-navy transition-all disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : '💾 Guardar entrada'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab Archivo Digital ─────────────────────────────────────────────────────

function iconoArchivo(mime) {
  if (!mime) return '📎';
  if (mime.includes('pdf')) return '📄';
  if (mime.startsWith('image/')) return '🖼️';
  if (mime.includes('word') || mime.includes('document')) return '📝';
  if (mime.includes('sheet') || mime.includes('excel')) return '📊';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return '📊';
  if (mime.startsWith('video/')) return '🎬';
  if (mime.startsWith('audio/')) return '🎵';
  if (mime.includes('zip') || mime.includes('compressed')) return '🗜️';
  if (mime.includes('folder')) return '📁';
  return '📎';
}

function formatearTamano(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function TabArchivoDigital() {
  const [inquilinos, setInquilinos] = useState([]);
  const [resumen, setResumen]       = useState({});
  const [carpetaRaiz, setCarpetaRaiz] = useState(null);
  const [cargando, setCargando]     = useState(true);
  const [errorConfig, setErrorConfig] = useState('');
  const [busqueda, setBusqueda]     = useState('');
  const [filtroInmueble, setFiltroInmueble] = useState('Todos');
  const [filtroArchivos, setFiltroArchivos] = useState('Todos');
  const [modalCliente, setModalCliente] = useState(null);

  useEffect(() => { cargarTodo(); }, []);

  const cargarTodo = async () => {
    setCargando(true);
    setErrorConfig('');
    try {
      const [inqRes, resRes] = await Promise.all([
        axios.get(`${GAS_SCRIPT_URL}?action=getInquilinos`),
        axios.get(`${GAS_SCRIPT_URL}?action=getResumenArchivosLegal`)
      ]);
      const datos = Array.isArray(inqRes.data) ? inqRes.data : [];
      setInquilinos(datos.filter(i => i.nombre && i.nombre.trim() !== '' && i.status !== 'Inactivo'));

      if (resRes.data?.success) {
        setResumen(resRes.data.resumen || {});
        setCarpetaRaiz({ url: resRes.data.folderRaizUrl, id: resRes.data.folderRaizId });
      } else {
        setErrorConfig(resRes.data?.error || 'No se pudo cargar el resumen');
      }
    } catch {
      toast.error('❌ Error al cargar archivos');
    } finally {
      setCargando(false);
    }
  };

  const contarArchivos = (inq) => {
    const key = `${inq.inmueble} - ${inq.nombre}`;
    return resumen[key]?.count || 0;
  };

  const totalDocs = Object.values(resumen).reduce((sum, r) => sum + (r.count || 0), 0);
  const conArchivos = inquilinos.filter(i => contarArchivos(i) > 0).length;
  const sinArchivos = inquilinos.length - conArchivos;

  const filtrados = inquilinos
    .filter(i => filtroInmueble === 'Todos' || i.inmueble === filtroInmueble)
    .filter(i => {
      const count = contarArchivos(i);
      if (filtroArchivos === 'Con archivos') return count > 0;
      if (filtroArchivos === 'Sin archivos') return count === 0;
      return true;
    })
    .filter(i => !busqueda ||
      i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      i.inmueble.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => contarArchivos(b) - contarArchivos(a));

  if (cargando) return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-terra-copper border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Cargando archivo digital...</p>
      </div>
    </div>
  );

  if (errorConfig) return (
    <div className="bg-terra-cream border border-terra-gold/30 rounded-xl p-6 text-center">
      <p className="text-3xl mb-3">⚙️</p>
      <h4 className="font-bold text-terra-navy mb-2">Configuración requerida</h4>
      <p className="text-sm text-terra-copper-dark max-w-md mx-auto mb-3">{errorConfig}</p>
      <div className="text-xs text-terra-copper/80 max-w-lg mx-auto text-left bg-white rounded-lg p-4 border border-terra-gold/20">
        <p className="font-semibold mb-2">📝 Cómo configurar:</p>
        <ol className="list-decimal list-inside space-y-1.5">
          <li>Crea una carpeta en Google Drive (ej: <em>Gestión de Cobros - Archivo Legal</em>)</li>
          <li>Comparte la carpeta con los correos del equipo legal con permiso de Editor</li>
          <li>Copia el ID de la carpeta (parte final de la URL: <code className="bg-terra-cream-mid px-1 rounded">/folders/[ID]</code>)</li>
          <li>En la hoja <strong>⚙️ Config</strong>, agrega una fila con:
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Columna A: <code className="bg-terra-cream-mid px-1 rounded">DRIVE_LEGAL_FOLDER_ID</code></li>
              <li>Columna B: el ID copiado</li>
            </ul>
          </li>
          <li>Recarga esta página</li>
        </ol>
      </div>
    </div>
  );

  return (
    <div>
      {/* KPIs + acceso directo a carpeta raíz */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total inquilinos"      valor={inquilinos.length}  color="gray" />
        <KpiCard label="Con archivos"           valor={conArchivos}        color="green" />
        <KpiCard label="Sin archivos"           valor={sinArchivos}        color="orange" />
        <KpiCard label="Total documentos"       valor={totalDocs}          color="gray" />
      </div>

      {carpetaRaiz?.url && (
        <div className="bg-terra-cream border border-terra-gold/30 rounded-xl p-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📁</span>
            <div>
              <p className="text-sm font-semibold text-terra-navy">Carpeta raíz del archivo legal</p>
              <p className="text-xs text-terra-copper/70">Asegúrate de compartirla con los correos del equipo legal</p>
            </div>
          </div>
          <a
            href={carpetaRaiz.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-terra-copper to-terra-copper-dark text-white text-sm font-semibold px-4 py-2 rounded-lg hover:from-terra-copper-dark hover:to-terra-navy transition-all flex items-center gap-1.5"
          >
            <span>Abrir en Drive</span>
            <span className="text-xs">↗</span>
          </a>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Buscar inquilino..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper w-52"
        />
        <select
          value={filtroInmueble}
          onChange={e => setFiltroInmueble(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper"
        >
          <option value="Todos">Todos los inmuebles</option>
<option value="Tulipanes">Tulipanes</option>
            <option value="Remanso">Remanso</option>
            <option value="El Morro">El Morro</option>
        </select>
        <select
          value={filtroArchivos}
          onChange={e => setFiltroArchivos(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper"
        >
          <option value="Todos">Todos los inquilinos</option>
          <option value="Con archivos">Con archivos</option>
          <option value="Sin archivos">Sin archivos</option>
        </select>
        <button
          onClick={cargarTodo}
          className="ml-auto text-xs text-terra-copper hover:text-terra-copper-dark border border-terra-copper/30 hover:border-terra-copper/60 px-3 py-2 rounded-lg transition-colors"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Grid de tarjetas */}
      {filtrados.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm">No hay inquilinos que coincidan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtrados.map(inq => {
            const count = contarArchivos(inq);
            return (
              <button
                key={`${inq.nombre}-${inq.inmueble}`}
                onClick={() => setModalCliente(inq)}
                className="text-left bg-white border border-gray-100 rounded-xl p-4 hover:border-terra-gold/40 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800 truncate group-hover:text-terra-copper transition-colors">{inq.nombre}</p>
                    <p className="text-xs text-gray-400 truncate">{inq.inmueble} · {inq.unidad}</p>
                  </div>
                  <div className={`flex-shrink-0 ml-2 inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold ${
                    count > 0 ? 'bg-terra-cream-mid text-terra-copper-dark' : 'bg-gray-50 text-gray-300'
                  }`}>
                    {count}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-50">
                  <span>{count === 0 ? 'Sin documentos' : count === 1 ? '1 documento' : `${count} documentos`}</span>
                  <span className="text-terra-copper font-medium group-hover:translate-x-0.5 transition-transform">Abrir →</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal de archivos del cliente */}
      {modalCliente && (
        <ModalArchivosCliente
          inquilino={modalCliente}
          onClose={() => setModalCliente(null)}
          onActualizado={cargarTodo}
        />
      )}
    </div>
  );
}

function ModalArchivosCliente({ inquilino, onClose, onActualizado }) {
  const [data, setData]         = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await axios.get(
          `${GAS_SCRIPT_URL}?action=getArchivosCliente&nombre=${encodeURIComponent(inquilino.nombre)}&inmueble=${encodeURIComponent(inquilino.inmueble)}`
        );
        if (res.data?.success) {
          setData(res.data);
        } else {
          toast.error('❌ ' + (res.data?.error || 'Error al cargar archivos'));
        }
      } catch {
        toast.error('❌ Error de conexión');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [inquilino]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-lg text-gray-800">🗂️ Archivo Digital</h3>
            <p className="text-sm text-gray-500 mt-0.5">{inquilino.nombre} · {inquilino.inmueble}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {cargando ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-terra-copper border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Info de la carpeta */}
              {data?.folder && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-5 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-400 font-medium">Carpeta del inquilino</p>
                    <p className="text-sm font-semibold text-gray-700 truncate">{data.folder.nombre}</p>
                  </div>
                  <a
                    href={data.folder.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 bg-gradient-to-r from-terra-copper to-terra-copper-dark hover:from-terra-copper-dark hover:to-terra-navy text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 flex-shrink-0"
                  >
                    <span>📤 Subir / abrir</span>
                  </a>
                </div>
              )}

              {/* Lista de archivos */}
              {data?.archivos?.length > 0 ? (
                <div className="space-y-2">
                  {data.archivos.map(file => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-terra-gold/30 hover:bg-terra-cream/40 transition-all group"
                    >
                      <span className="text-2xl flex-shrink-0">{iconoArchivo(file.mimeType)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{file.nombre}</p>
                        <p className="text-xs text-gray-400">
                          {formatearTamano(file.tamano)} · Modificado {file.fechaModif}
                        </p>
                      </div>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-terra-copper hover:text-terra-copper-dark border border-terra-copper/30 hover:border-terra-copper hover:bg-white px-3 py-1.5 rounded-lg transition-all font-medium flex-shrink-0"
                      >
                        Ver →
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-sm font-medium mb-1">Sin documentos cargados</p>
                  <p className="text-xs text-gray-300 mb-5">Usa el botón "Subir / abrir" para agregar archivos</p>
                  {data?.folder && (
                    <a
                      href={data.folder.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-gradient-to-r from-terra-copper to-terra-copper-dark hover:from-terra-copper-dark hover:to-terra-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all"
                    >
                      📤 Abrir carpeta en Drive
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={() => { onActualizado(); }}
            className="px-4 py-2.5 border border-terra-copper/30 text-terra-copper rounded-xl text-sm font-medium hover:bg-terra-cream transition-colors"
          >
            🔄 Actualizar lista
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab Reportes ────────────────────────────────────────────────────────────

function parseFechaDDMMYYYY(str) {
  if (!str) return null;
  const partes = str.split('/');
  if (partes.length !== 3) return null;
  const d = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
  return isNaN(d) ? null : d;
}

function TabReportes() {
  const [inquilinos, setInquilinos]       = useState([]);
  const [casos, setCasos]                 = useState([]);
  const [comunicaciones, setComunicaciones] = useState([]);
  const [cargando, setCargando]           = useState(true);
  const [periodo, setPeriodo]             = useState('mes'); // mes | trimestre | año | todo

  useEffect(() => { cargarTodo(); }, []);

  const cargarTodo = async () => {
    setCargando(true);
    try {
      const [inqRes, casosRes, comRes] = await Promise.all([
        axios.get(`${GAS_SCRIPT_URL}?action=getInquilinos`),
        axios.get(`${GAS_SCRIPT_URL}?action=getCasosLegales`),
        axios.get(`${GAS_SCRIPT_URL}?action=getComunicacionesLegales`)
      ]);
      setInquilinos((Array.isArray(inqRes.data) ? inqRes.data : []).filter(i => i.nombre && i.nombre.trim() !== '' && i.status !== 'Inactivo'));
      setCasos(casosRes.data?.casos || []);
      setComunicaciones(comRes.data?.entradas || []);
    } catch {
      toast.error('❌ Error al cargar los reportes');
    } finally {
      setCargando(false);
    }
  };

  if (cargando) return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-terra-copper border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Generando reporte...</p>
      </div>
    </div>
  );

  // ── Filtro por periodo ──
  const desde = (() => {
    const d = new Date();
    if (periodo === 'mes')       d.setMonth(d.getMonth() - 1);
    else if (periodo === 'trimestre') d.setMonth(d.getMonth() - 3);
    else if (periodo === 'año')   d.setFullYear(d.getFullYear() - 1);
    else                          return null;
    return d;
  })();

  const filtrarPorFecha = (items, campo) => {
    if (!desde) return items;
    return items.filter(it => {
      const f = parseFechaDDMMYYYY(it[campo]);
      return f && f >= desde;
    });
  };

  const casosPeriodo  = filtrarPorFecha(casos, 'fechaApertura');
  const comPeriodo    = filtrarPorFecha(comunicaciones, 'fecha');

  // ── KPIs ejecutivos ──
  const casosActivos    = casos.filter(c => c.estado === 'Abierto' || c.estado === 'En Gestión');
  const totalAdeudado   = casosActivos.reduce((s, c) => s + (c.montoAdeudado || 0), 0);
  const inqMora         = inquilinos.filter(i => (i.mesesSinPagar || 0) > 0).length;
  const promedioMeses   = casosActivos.length > 0
    ? (casosActivos.reduce((s, c) => s + (c.mesesSinPagar || 0), 0) / casosActivos.length).toFixed(1)
    : 0;

  // ── Sección 1: Mora por inmueble ──
  const moraPorInmueble = {};
  ['Tulipanes', 'Remanso', 'El Morro'].forEach(inm => {
    moraPorInmueble[inm] = { inquilinosMora: 0, totalAdeudado: 0, totalContratos: 0 };
  });
  inquilinos.forEach(i => {
    if (!moraPorInmueble[i.inmueble]) moraPorInmueble[i.inmueble] = { inquilinosMora: 0, totalAdeudado: 0, totalContratos: 0 };
    moraPorInmueble[i.inmueble].totalContratos++;
    if ((i.mesesSinPagar || 0) > 0) moraPorInmueble[i.inmueble].inquilinosMora++;
  });
  casosActivos.forEach(c => {
    if (moraPorInmueble[c.inmueble]) moraPorInmueble[c.inmueble].totalAdeudado += c.montoAdeudado || 0;
  });
  const maxMora = Math.max(1, ...Object.values(moraPorInmueble).map(d => d.totalAdeudado));

  // ── Sección 2: Top críticos (>= 2 meses, ordenados desc) ──
  const topCriticos = [...inquilinos]
    .filter(i => (i.mesesSinPagar || 0) >= 2)
    .sort((a, b) => (b.mesesSinPagar || 0) - (a.mesesSinPagar || 0))
    .slice(0, 10);

  // ── Sección 3: Estado de casos ──
  const casosPorEstado = { 'Abierto': 0, 'En Gestión': 0, 'Cerrado': 0, 'Resuelto': 0 };
  casos.forEach(c => { if (casosPorEstado[c.estado] !== undefined) casosPorEstado[c.estado]++; });

  // Tiempo promedio en resolver (días entre apertura y cierre)
  const casosResueltos = casos.filter(c => (c.estado === 'Cerrado' || c.estado === 'Resuelto') && c.fechaCierre);
  const promedioResolucion = casosResueltos.length > 0
    ? Math.round(casosResueltos.reduce((s, c) => {
        const fa = parseFechaDDMMYYYY(c.fechaApertura);
        const fc = parseFechaDDMMYYYY(c.fechaCierre);
        if (!fa || !fc) return s;
        return s + Math.max(0, Math.round((fc - fa) / (1000 * 60 * 60 * 24)));
      }, 0) / casosResueltos.length)
    : 0;

  // ── Sección 4: Comunicaciones por tipo ──
  const comPorTipo = {};
  comPeriodo.forEach(e => {
    comPorTipo[e.tipo] = (comPorTipo[e.tipo] || 0) + 1;
  });
  const maxCom = Math.max(1, ...Object.values(comPorTipo));

  const periodoLabel = periodo === 'mes' ? 'Último mes'
    : periodo === 'trimestre' ? 'Último trimestre'
    : periodo === 'año' ? 'Último año'
    : 'Histórico completo';

  return (
    <div>
      {/* Barra de control — oculta al imprimir */}
      <div className="flex flex-wrap gap-3 mb-5 print:hidden">
        <div className="flex rounded-lg overflow-hidden border border-gray-200 text-sm">
          {[['mes','Mes'],['trimestre','Trimestre'],['año','Año'],['todo','Histórico']].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setPeriodo(val)}
              className={`px-4 py-2 transition-colors ${periodo === val ? 'bg-terra-copper text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {lbl}
            </button>
          ))}
        </div>
        <button
          onClick={cargarTodo}
          className="text-xs text-terra-copper hover:text-terra-copper-dark border border-terra-copper/30 hover:border-terra-copper/60 px-3 py-2 rounded-lg transition-colors"
        >
          🔄 Actualizar
        </button>
        <button
          onClick={() => window.print()}
          className="ml-auto bg-gradient-to-r from-terra-copper to-terra-copper-dark text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-terra-copper-dark hover:to-terra-navy transition-all shadow-sm flex items-center gap-2"
        >
          🖨️ Imprimir / PDF
        </button>
      </div>

      {/* Encabezado del reporte (visible en impresión) */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reporte Legal — Gestión de Cobros</h1>
        <p className="text-sm text-gray-500 mt-1">
          {periodoLabel} · Generado el {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Resumen ejecutivo */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 print:text-gray-500">Resumen ejecutivo · {periodoLabel}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <ReporteKpi label="Monto en riesgo"    valor={`$${totalAdeudado.toFixed(2)}`} sub="USD adeudados" color="red" />
          <ReporteKpi label="Inquilinos en mora" valor={inqMora}                       sub={`de ${inquilinos.length} activos`} color="orange" />
          <ReporteKpi label="Casos activos"      valor={casosActivos.length}           sub="Abiertos + En gestión" color="amber" />
          <ReporteKpi label="Meses promedio"     valor={promedioMeses}                 sub="por caso activo" color="gray" />
        </div>
      </div>

      {/* SECCIÓN 1 — Mora por inmueble */}
      <SeccionReporte titulo="📍 Mora por inmueble" subtitulo="Distribución del monto adeudado y número de morosos por propiedad">
        <div className="space-y-3 mb-5">
          {Object.entries(moraPorInmueble).map(([inm, d]) => (
            <div key={inm}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{inm}</span>
                <span className="text-gray-500">
                  {d.inquilinosMora}/{d.totalContratos} morosos ·
                  <span className="font-bold text-red-600 ml-2">${d.totalAdeudado.toFixed(2)}</span>
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all"
                  style={{ width: `${(d.totalAdeudado / maxMora) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[400px]">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="text-left py-2">Inmueble</th>
              <th className="text-center py-2">Contratos</th>
              <th className="text-center py-2">En mora</th>
              <th className="text-right py-2">Total adeudado</th>
              <th className="text-right py-2">% del total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(moraPorInmueble).map(([inm, d]) => (
              <tr key={inm} className="border-b border-gray-50">
                <td className="py-2 font-medium text-gray-700">{inm}</td>
                <td className="text-center text-gray-600">{d.totalContratos}</td>
                <td className="text-center">
                  <span className={`font-semibold ${d.inquilinosMora > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                    {d.inquilinosMora}
                  </span>
                </td>
                <td className="text-right font-semibold text-gray-700">${d.totalAdeudado.toFixed(2)}</td>
                <td className="text-right text-gray-500">
                  {totalAdeudado > 0 ? ((d.totalAdeudado / totalAdeudado) * 100).toFixed(1) : '0.0'}%
                </td>
              </tr>
            ))}
            <tr className="font-bold border-t-2 border-gray-200">
              <td className="py-2">Total</td>
              <td className="text-center">{inquilinos.length}</td>
              <td className="text-center text-orange-700">{inqMora}</td>
              <td className="text-right text-red-700">${totalAdeudado.toFixed(2)}</td>
              <td className="text-right">100%</td>
            </tr>
          </tbody>
        </table>
        </div>
      </SeccionReporte>

      {/* SECCIÓN 2 — Top críticos */}
      <SeccionReporte titulo="⚠️ Inquilinos críticos" subtitulo={`Top ${topCriticos.length} con 2 o más meses sin pagar`}>
        {topCriticos.length === 0 ? (
          <p className="text-center text-gray-400 py-6 text-sm">No hay inquilinos críticos.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="text-left py-2">#</th>
                <th className="text-left py-2">Inquilino</th>
                <th className="text-left py-2">Inmueble</th>
                <th className="text-center py-2">Meses sin pagar</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {topCriticos.map((inq, idx) => (
                <tr key={`${inq.nombre}-${inq.inmueble}`} className="border-b border-gray-50">
                  <td className="py-2 text-gray-400 font-mono text-xs">{idx + 1}</td>
                  <td className="py-2 font-medium text-gray-800">{inq.nombre}</td>
                  <td className="py-2 text-gray-600">{inq.inmueble} · {inq.unidad}</td>
                  <td className="py-2 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      inq.mesesSinPagar >= 3 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {inq.mesesSinPagar}
                    </span>
                  </td>
                  <td className="py-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[inq.status] || STATUS_BADGE['Vigente']}`}>
                      {inq.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </SeccionReporte>

      {/* SECCIÓN 3 — Estado de casos legales */}
      <SeccionReporte titulo="⚖️ Estado de casos legales" subtitulo={`${casos.length} casos totales · ${casosPeriodo.length} abiertos en el periodo`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {Object.entries(casosPorEstado).map(([estado, count]) => (
            <div key={estado} className={`rounded-xl border p-3 sm:p-4 text-center ${ESTADO_BADGE[estado]?.replace('text-', 'border-').split(' ')[1] || ''} ${ESTADO_BADGE[estado] || 'bg-gray-50 text-gray-700'}`}>
              <p className="text-xl sm:text-2xl font-black">{count}</p>
              <p className="text-xs font-medium mt-0.5 opacity-80 leading-tight">{estado}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 font-medium mb-0.5">Tiempo promedio de resolución</p>
            <p className="text-lg font-bold text-gray-700">
              {promedioResolucion > 0 ? `${promedioResolucion} días` : 'Sin datos'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Basado en {casosResueltos.length} casos cerrados/resueltos</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 font-medium mb-0.5">Tasa de resolución</p>
            <p className="text-lg font-bold text-gray-700">
              {casos.length > 0 ? ((casosResueltos.length / casos.length) * 100).toFixed(0) : 0}%
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{casosResueltos.length} resueltos de {casos.length} totales</p>
          </div>
        </div>
      </SeccionReporte>

      {/* SECCIÓN 4 — Comunicaciones */}
      <SeccionReporte titulo="📞 Comunicaciones del periodo" subtitulo={`${comPeriodo.length} entradas registradas en ${periodoLabel.toLowerCase()}`}>
        {Object.keys(comPorTipo).length === 0 ? (
          <p className="text-center text-gray-400 py-6 text-sm">No hay comunicaciones en este periodo.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(comPorTipo)
              .sort((a, b) => b[1] - a[1])
              .map(([tipo, count]) => (
                <div key={tipo}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{tipo}</span>
                    <span className="text-gray-500">{count} {count === 1 ? 'entrada' : 'entradas'}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-terra-gold to-terra-copper transition-all"
                      style={{ width: `${(count / maxCom) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        )}
      </SeccionReporte>

      {/* Pie del reporte impreso */}
      <div className="hidden print:block mt-8 text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
        <p>Gestión de Cobros · Sistema de Gestión de Arrendamientos · Reporte legal generado automáticamente</p>
      </div>
    </div>
  );
}

function ReporteKpi({ label, valor, sub, color }) {
  const colores = {
    gray:   'bg-gray-50 border-gray-200 text-gray-700',
    amber:  'bg-terra-cream border-terra-gold/30 text-terra-copper',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red:    'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <div className={`rounded-xl border p-4 ${colores[color]}`}>
      <p className="text-2xl font-black">{valor}</p>
      <p className="text-xs font-semibold mt-1 opacity-90">{label}</p>
      <p className="text-[10px] mt-0.5 opacity-60">{sub}</p>
    </div>
  );
}

function SeccionReporte({ titulo, subtitulo, children }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 mb-5 print:shadow-none print:break-inside-avoid">
      <div className="mb-4 pb-3 border-b border-gray-100">
        <h4 className="font-bold text-gray-800">{titulo}</h4>
        {subtitulo && <p className="text-xs text-gray-500 mt-0.5">{subtitulo}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Tabs en construcción ───────────────────────────────────────────────────

const TAB_INFO = {
  casos: {
    icono: '⚠️',
    titulo: 'Casos Legales Activos',
    descripcion: 'Casos generados automáticamente cuando un inquilino alcanza ≥2 meses sin pagar. Seguimiento de acciones y notificaciones Telegram al equipo legal.',
  },
  bitacora: {
    icono: '📝',
    titulo: 'Bitácora de Comunicaciones',
    descripcion: 'Registro cronológico de cartas, llamadas, correos y acuerdos de pago. Trazabilidad completa por inquilino.',
  },
  archivo: {
    icono: '🗂️',
    titulo: 'Archivo Digital',
    descripcion: 'Contratos firmados, cartas notariales, cédulas y poderes almacenados en Google Drive compartido con el equipo legal.',
  },
  reportes: {
    icono: '📊',
    titulo: 'Reportes Legales',
    descripcion: 'Informes exportables: mora total por inmueble, clientes con más de N meses adeudados, resumen de casos activos.',
  },
};

function TabProximamente({ tab }) {
  const info = TAB_INFO[tab?.id] || {};
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="text-5xl mb-4">{info.icono || '🔧'}</div>
      <h4 className="text-xl font-bold text-gray-800 mb-3">{info.titulo || tab?.label}</h4>
      <p className="text-gray-500 max-w-md mb-6 leading-relaxed text-sm">{info.descripcion}</p>
      <span className="inline-flex items-center gap-2 px-4 py-2 bg-terra-cream border border-terra-gold/30 text-terra-copper rounded-full text-sm font-medium">
        <span className="w-2 h-2 rounded-full bg-terra-copper animate-pulse" />
        En construcción
      </span>
    </div>
  );
}

export default Legal;
