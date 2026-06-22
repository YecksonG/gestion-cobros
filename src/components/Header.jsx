import React from 'react';

function Header({ title, subtitle, onMenuClick }) {
  const mes = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const mesCap = mes.charAt(0).toUpperCase() + mes.slice(1);

  return (
    <header className="bg-white shadow-sm p-4 lg:p-6 flex justify-between items-center gap-3 z-0 border-b border-gray-100">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden flex-shrink-0 p-2 -ml-1 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Abrir menú"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">{title}</h2>
          {subtitle && <p className="text-xs sm:text-sm text-gray-500 truncate">{subtitle}</p>}
        </div>
      </div>
      <span className="hidden sm:inline-flex flex-shrink-0 text-sm font-semibold text-terra-copper bg-terra-cream py-2 px-4 rounded-full border border-terra-gold/30 shadow-sm whitespace-nowrap">
        📅 Período: {mesCap}
      </span>
    </header>
  );
}

export default Header;
