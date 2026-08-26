import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { NAV_POR_ROL } from '../config/permisos';

const NAV_ITEMS = [
  { to: '/agenda',           icon: '📅', label: 'Agenda de Cobros' },
  { to: '/agregar-cliente',  icon: '➕', label: 'Agregar Cliente' },
  { to: '/inquilinos',       icon: '👥', label: 'Inquilinos' },
  { to: '/cobros',           icon: '💰', label: 'Registro de Cobros' },
  { to: '/historial-pagos',  icon: '💳', label: 'Historial de Pagos' },
  { to: '/tasas',            icon: '💱', label: 'Tasas BCV' },
  { to: '/legal',            icon: '⚖️',  label: 'Departamento Legal' },
  { to: '/historial',        icon: '📋', label: 'Historial de Cambios' },
  { to: '/dashboard',        icon: '📊', label: 'Dashboard' },
  { to: '/usuarios',         icon: '🔧', label: 'Usuarios' },
];

function Sidebar({ isOpen = false, onClose = () => {} }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside
      className={`sidebar-enter fixed lg:static inset-y-0 left-0 z-50 w-64 max-w-[80vw]
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        bg-gradient-to-b from-terra-navy via-terra-navy-mid to-terra-navy-deep text-white
        flex flex-col shadow-2xl border-r border-terra-gold/20`}
      style={{backgroundImage: 'linear-gradient(180deg, rgba(212,163,115,0.08) 0%, rgba(212,163,115,0.03) 100%), linear-gradient(to bottom, var(--color-terra-navy), var(--color-terra-navy-mid), var(--color-terra-navy-deep))'}}
    >
      <button
        onClick={onClose}
        className="lg:hidden absolute top-4 right-4 z-10 p-1.5 rounded-lg text-terra-gold hover:bg-white/10 transition-colors"
        aria-label="Cerrar menú"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <Link to="/" onClick={onClose} className="block p-6 border-b border-terra-gold/20 hover:bg-white/5 transition-colors duration-200 group">
        <h1 className="text-lg font-black tracking-[0.1em] text-terra-gold group-hover:text-terra-gold-soft transition-colors duration-200">GESTIÓN DE COBROS</h1>
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-semibold">Sistema de Gestión</p>
        <div className="h-px bg-gradient-to-r from-terra-gold/0 via-terra-gold/30 to-terra-gold/0 mt-3"></div>
      </Link>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.filter(item => {
          const rolesPermitidos = NAV_POR_ROL[item.to];
          if (!rolesPermitidos) return true;
          return rolesPermitidos.includes(usuario?.rol);
        }).map(({ to, icon, label, lock }) => {
          const activo = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={`relative flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                activo
                  ? 'bg-gradient-to-r from-terra-gold/20 to-terra-copper/15 text-terra-gold-light border-l-2 border-terra-gold shadow-lg shadow-terra-gold/15'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white hover:border-l-2 hover:border-terra-gold/60'
              }`}
            >
              <span className={`transition-transform duration-200 ${activo ? 'scale-110' : 'group-hover:scale-105'}`}>
                {icon}
              </span>
              <span className="flex-1 ml-2 text-sm font-medium">{label}</span>
              {lock && (
                <span className={`text-xs transition-opacity duration-200 ${activo ? 'opacity-100' : 'opacity-50 group-hover:opacity-75'}`}>🔒</span>
              )}
              {activo && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-terra-gold to-terra-copper rounded-r-lg"></div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-terra-gold/20">
        <a
          href="/manual.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-terra-gold/40 text-terra-gold hover:bg-gradient-to-r hover:from-terra-gold/15 hover:to-terra-gold-muted/10 hover:border-terra-gold/70 hover:text-terra-gold-light transition-all duration-200 text-xs font-medium tracking-wide group shadow-sm shadow-terra-gold/10 hover:shadow-terra-gold/20"
        >
          <span className="group-hover:scale-110 transition-transform">📖</span>
          <span>Manual</span>
        </a>
      </div>

      <div className="px-4 pb-3">
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-terra-gold/40 text-terra-gold hover:bg-gradient-to-r hover:from-terra-gold/15 hover:to-terra-gold-muted/10 hover:border-terra-gold/70 hover:text-terra-gold-light transition-all duration-200 text-xs font-medium tracking-wide group shadow-sm shadow-terra-gold/10 hover:shadow-terra-gold/20"
        >
          <span className="group-hover:scale-110 transition-transform">⌂</span>
          <span>Inicio</span>
        </Link>
      </div>

      {/* USUARIO + LOGOUT */}
      {usuario && (
        <div className="px-4 pb-3 border-t border-terra-gold/20 pt-3">
          <div className="text-xs text-gray-400 mb-2 px-1">
            <p className="font-semibold text-terra-gold truncate" title={usuario.nombre}>{usuario.nombre}</p>
            <p className="text-[10px] uppercase tracking-wider mt-0.5 truncate" title={usuario.email}>{usuario.email}</p>
            <p className="text-[10px] text-terra-gold/70 mt-0.5">Rol: {usuario.rol}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 hover:bg-red-900/50 hover:text-red-100 hover:border-red-500 transition-all duration-200 text-xs font-medium tracking-wide"
          >
            <span>🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}

      <div className="px-4 pb-3 border-t border-terra-gold/15 text-xs text-terra-gold/60 text-center font-semibold tracking-wider">
        V 2.0 React
      </div>
    </aside>
  );
}

export default Sidebar;
