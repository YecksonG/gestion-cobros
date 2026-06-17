import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { GAS_SCRIPT_URL } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const SECCIONES_BUG = [
  'Panel de Bienvenida', 'Agenda de Cobros', 'Agregar Cliente', 'Inquilinos',
  'Registro de Cobros', 'Historial de Pagos', 'Tasas BCV', 'Departamento Legal',
  'Historial de Cambios', 'Dashboard', 'Gestión de Usuarios', 'Login', 'Otra'
];

const TIPOS_ELEMENTO = [
  'Botón', 'Campo de texto', 'Menú desplegable', 'Cálculo automático',
  'Visualización / diseño', 'Navegación', 'Carga de datos', 'Otro'
];

const SEVERIDADES = [
  { v: 'Crítico',   label: '🔴 Crítico',   desc: 'No puedo trabajar' },
  { v: 'Molesto',   label: '🟠 Molesto',   desc: 'Estorba pero puedo seguir' },
  { v: 'Menor',     label: '🟡 Menor',     desc: 'Detalle pequeño' },
  { v: 'Cosmético', label: '🔵 Cosmético', desc: 'Solo visual' },
];

const INPUT = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-terra-copper/20 focus:border-terra-copper transition-colors bg-white';
const TEXTAREA = `${INPUT} resize-none`;

function ReportarBugModal({ abierto, onCerrar }) {
  const { usuario } = useAuth();
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState({
    seccion: '', tipo: '', elemento: '',
    severidad: 'Menor', esperado: '', real: '', pasos: ''
  });
  const [enviando, setEnviando] = useState(false);

  if (!abierto) return null;

  const set = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }));

  const cerrar = () => {
    setPaso(1);
    setForm({ seccion: '', tipo: '', elemento: '', severidad: 'Menor', esperado: '', real: '', pasos: '' });
    onCerrar();
  };

  const enviar = async () => {
    setEnviando(true);
    try {
      const dispositivo = `${navigator.userAgent} · ${window.innerWidth}x${window.innerHeight}`;
      const payload = JSON.stringify({
        action: 'reportarBug',
        ...form,
        usuario: usuario?.nombre || '',
        email: usuario?.email || '',
        rol: usuario?.rol || '',
        dispositivo
      });
      const res = await axios.post(GAS_SCRIPT_URL, payload, {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        timeout: 30000
      });
      if (res.data?.success) {
        toast.success(`✅ ${res.data.message}`);
        cerrar();
      } else {
        toast.error(`❌ ${res.data?.error || res.data?.message || 'Error al enviar'}`);
      }
    } catch (err) {
      toast.error('❌ Error de conexión al enviar el reporte');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-terra-navy to-terra-navy-mid px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐞</span>
            <div>
              <h2 className="text-white font-bold text-base">Reportar un Problema</h2>
              <p className="text-gray-400 text-xs">Paso {paso} de 3</p>
            </div>
          </div>
          <button onClick={cerrar} className="text-gray-400 hover:text-white transition text-xl leading-none">✕</button>
        </div>

        {/* Indicador de pasos */}
        <div className="flex px-6 pt-4 gap-2">
          {[1, 2, 3].map(p => (
            <div key={p} className={`flex-1 h-1.5 rounded-full transition-colors ${p <= paso ? 'bg-terra-copper' : 'bg-gray-200'}`} />
          ))}
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* ── PASO 1: ¿Dónde ocurrió? ── */}
          {paso === 1 && (
            <>
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider text-terra-copper">¿Dónde ocurrió el problema?</h3>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Sección <span className="text-red-400">*</span></label>
                <select className={INPUT} value={form.seccion} onChange={e => set('seccion', e.target.value)}>
                  <option value="">Seleccionar sección...</option>
                  {SECCIONES_BUG.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Tipo de elemento</label>
                <select className={INPUT} value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                  <option value="">Seleccionar tipo...</option>
                  {TIPOS_ELEMENTO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">¿Cuál exactamente? <span className="text-gray-400 font-normal normal-case">(ej: "Botón Guardar", "Campo Canon USD")</span></label>
                <input className={INPUT} type="text" placeholder="Nombre del botón, campo o función..." value={form.elemento} onChange={e => set('elemento', e.target.value)} />
              </div>
            </>
          )}

          {/* ── PASO 2: ¿Qué pasó? ── */}
          {paso === 2 && (
            <>
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider text-terra-copper">¿Qué pasó?</h3>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Severidad</label>
                <div className="grid grid-cols-2 gap-2">
                  {SEVERIDADES.map(s => (
                    <button
                      key={s.v}
                      type="button"
                      onClick={() => set('severidad', s.v)}
                      className={`flex flex-col items-start p-3 rounded-lg border-2 transition text-left ${
                        form.severidad === s.v
                          ? 'border-terra-copper bg-terra-cream'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="font-bold text-sm">{s.label}</span>
                      <span className="text-xs text-gray-500 mt-0.5">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Qué esperabas que pasara</label>
                <textarea className={TEXTAREA} rows={2} placeholder="Ej: El pago debería guardarse y mostrar confirmación..." value={form.esperado} onChange={e => set('esperado', e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Qué pasó realmente <span className="text-red-400">*</span></label>
                <textarea className={TEXTAREA} rows={3} placeholder="Describe con detalle lo que ocurrió..." value={form.real} onChange={e => set('real', e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Pasos para reproducirlo <span className="text-gray-400 font-normal normal-case">(opcional)</span></label>
                <textarea className={TEXTAREA} rows={2} placeholder="1. Fui a... 2. Hice clic en... 3. Pasó..." value={form.pasos} onChange={e => set('pasos', e.target.value)} />
              </div>
            </>
          )}

          {/* ── PASO 3: Confirmar ── */}
          {paso === 3 && (
            <>
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider text-terra-copper">Resumen del reporte</h3>

              <div className="space-y-2 text-sm">
                <div className="bg-terra-cream rounded-lg p-4 space-y-2">
                  <Row label="Sección" value={form.seccion} />
                  {form.tipo && <Row label="Tipo" value={form.tipo} />}
                  {form.elemento && <Row label="Elemento" value={form.elemento} />}
                  <Row label="Severidad" value={form.severidad} />
                </div>

                {form.esperado && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Esperado</p>
                    <p className="text-gray-700 text-sm">{form.esperado}</p>
                  </div>
                )}

                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Qué pasó</p>
                  <p className="text-gray-700 text-sm">{form.real}</p>
                </div>

                {form.pasos && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pasos</p>
                    <p className="text-gray-700 text-sm whitespace-pre-line">{form.pasos}</p>
                  </div>
                )}
              </div>

              <div className="bg-terra-navy/5 border border-terra-navy/10 rounded-lg p-3 flex items-start gap-2 text-xs text-gray-500">
                <span>🔒</span>
                <div>
                  <p><strong>Capturado automáticamente:</strong> {usuario?.nombre || 'Usuario'} ({usuario?.rol || 'rol'}) · {new Date().toLocaleDateString('es-ES')}</p>
                  <p className="mt-0.5 truncate">Dispositivo: {window.innerWidth}×{window.innerHeight}px</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer con botones de navegación */}
        <div className="px-6 pb-6 flex gap-3">
          {paso > 1 && (
            <button
              onClick={() => setPaso(p => p - 1)}
              disabled={enviando}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition disabled:opacity-50"
            >
              ← Atrás
            </button>
          )}
          <div className="flex-1" />
          {paso < 3 ? (
            <button
              onClick={() => setPaso(p => p + 1)}
              disabled={paso === 1 ? !form.seccion : !form.real}
              className="px-6 py-2.5 bg-terra-copper text-white rounded-xl font-bold text-sm hover:bg-terra-copper-dark transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={enviar}
              disabled={enviando}
              className="px-6 py-2.5 bg-gradient-to-r from-terra-copper to-terra-copper-dark text-white rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {enviando ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : '🐞 Enviar Reporte'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 font-semibold min-w-[80px]">{label}:</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}

export default ReportarBugModal;
