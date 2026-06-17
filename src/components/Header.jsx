import React from 'react';

function Header({ title, subtitle }) {
  const mes = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const mesCap = mes.charAt(0).toUpperCase() + mes.slice(1);

  return (
    <header className="bg-white shadow-sm p-6 flex justify-between items-center z-0 border-b border-gray-100">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <span className="text-sm font-semibold text-terra-copper bg-terra-cream py-2 px-4 rounded-full border border-terra-gold/30 shadow-sm">
        📅 Período: {mesCap}
      </span>
    </header>
  );
}

export default Header;
