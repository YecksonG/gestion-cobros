import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { NAV_POR_ROL } from '../config/permisos';
import ReportarBugModal from '../components/ReportarBugModal';

const SECCIONES = [
  { to: '/agenda',          icon: '📅', title: 'Agenda de Cobros',     desc: 'Calendario mensual de pagos' },
  { to: '/agregar-cliente', icon: '➕', title: 'Agregar Cliente',      desc: 'Registro de nuevo arrendatario' },
  { to: '/inquilinos',      icon: '👥', title: 'Inquilinos',           desc: 'Directorio de arrendatarios' },
  { to: '/cobros',          icon: '💰', title: 'Registro de Cobros',   desc: 'Ingreso de pagos y transferencias' },
  { to: '/tasas',           icon: '💱', title: 'Tasas BCV',            desc: 'Control de tasas de cambio' },
  { to: '/legal',           icon: '⚖️',  title: 'Departamento Legal',  desc: 'Expedientes y casos legales' },
  { to: '/historial',       icon: '📋', title: 'Historial de Cambios', desc: 'Auditoría del sistema' },
  { to: '/dashboard',       icon: '📊', title: 'Dashboard',            desc: 'Métricas financieras' },
  { to: '/usuarios',        icon: '🔧', title: 'Gestión de Usuarios',  desc: 'Administrar accesos al sistema' },
  { to: '/manual.html',     icon: '📖', title: 'Manual de Uso',        desc: 'Guía completa del sistema', external: true },
  { to: '/historial-pagos', icon: '💳', title: 'Historial de Pagos',   desc: 'Registro de todas las transacciones' },
  { to: '__bug__',          icon: '🐞', title: 'Reportar un Problema', desc: 'Cuéntanos qué salió mal' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Buenos días ☀️';
  if (h >= 12 && h < 19) return 'Buenas tardes 🌤️';
  return 'Buenas noches 🌙';
}

function Bienvenida() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [now, setNow] = useState(new Date());
  const [modalBug, setModalBug] = useState(false);

  const seccionesFiltradas = SECCIONES.filter(s => {
    if (s.external || s.to === '__bug__') return true;
    const rolesPermitidos = NAV_POR_ROL[s.to];
    if (!rolesPermitidos) return true;
    return rolesPermitidos.includes(usuario?.rol);
  });

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fecha = now.toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const hora = now.toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'America/Caracas',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-terra-navy via-terra-navy-mid to-terra-navy-deep flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">

      {/* Decoración de fondo */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-terra-copper/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-terra-gold/5 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-terra-gold/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-terra-gold/20 to-transparent" />
      </div>

      {/* Encabezado */}
      <div className="relative text-center mb-14 welcome-header">
        <div className="inline-flex items-center gap-3 mb-3">
          <div className="w-10 h-px bg-gradient-to-r from-transparent to-terra-gold/60" />
          <p className="text-terra-gold/70 text-xs uppercase tracking-[0.3em] font-medium">Sistema de Gestión</p>
          <div className="w-10 h-px bg-gradient-to-l from-transparent to-terra-gold/60" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-[0.1em] sm:tracking-[0.2em] text-terra-gold mb-1 drop-shadow-lg">GESTIÓN DE COBROS</h1>
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-8">Arrendamientos · Cobros · Control</p>

        <div className="flex flex-col items-center gap-1">
          <p className="text-white text-2xl sm:text-4xl font-extralight tabular-nums tracking-widest">{hora}</p>
          <p className="text-gray-400 text-sm capitalize mt-1">{fecha}</p>
          <p className="text-terra-gold text-sm font-medium mt-2">{getGreeting()}</p>
        </div>
      </div>

      {/* Grid de secciones */}
      <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl w-full welcome-cards">
        {seccionesFiltradas.map((s, i) => (
          <button
            key={s.to}
            onClick={() => {
              if (s.to === '__bug__') return setModalBug(true);
              if (s.external) return (window.location.href = s.to);
              navigate(s.to);
            }}
            style={{
              animationDelay: `${i * 60}ms`,
              backgroundImage: `linear-gradient(135deg, rgba(212,163,115,0.12) 0%, rgba(212,163,115,0.04) 100%)`
            }}
            className={`
              group relative flex flex-col items-center gap-3 p-5
              bg-white/[0.05] hover:bg-white/[0.10]
              border border-terra-gold/25 hover:border-terra-gold/60
              rounded-2xl backdrop-blur-md
              shadow-lg shadow-black/20 hover:shadow-terra-gold/15 transition-all duration-300 cursor-pointer
              hover:-translate-y-2 hover:shadow-2xl hover:shadow-terra-gold/20
              card-pop overflow-hidden
            `}
          >
            {/* Satinado dorado de fondo */}
            <div className="absolute inset-0 bg-gradient-to-br from-terra-gold/0 via-terra-gold/5 to-terra-gold/0 pointer-events-none" />

            {s.lock && (
              <span className="absolute top-3 right-3 text-[10px] opacity-50">🔒</span>
            )}
            <span className="text-3xl group-hover:scale-110 transition-transform duration-200 relative z-10">{s.icon}</span>
            <div className="text-center relative z-10">
              <p className="text-white font-semibold text-sm leading-tight">{s.title}</p>
              <p className="text-gray-300 text-xs mt-0.5 leading-tight">{s.desc}</p>
            </div>
            <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-terra-gold/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full" />
          </button>
        ))}
      </div>

      {/* Tagline */}
      <p className="relative mt-12 text-gray-700 text-xs tracking-[0.2em] uppercase text-center welcome-footer">
        Gestión eficiente · Cobros organizados · Arrendamientos bajo control
      </p>

      <ReportarBugModal abierto={modalBug} onCerrar={() => setModalBug(false)} />
    </div>
  );
}

export default Bienvenida;
