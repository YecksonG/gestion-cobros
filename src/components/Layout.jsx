import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useInactivity } from '../hooks/useInactivity';

function Layout({ children, title, subtitle }) {
  useInactivity(600_000);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Cerrar el drawer al cambiar de ruta (navegación en móvil)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Bloquear el scroll del body mientras el drawer está abierto (móvil)
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  // Cerrar con la tecla Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Overlay oscuro — solo móvil, cierra al tocar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header title={title} subtitle={subtitle} onMenuClick={() => setSidebarOpen(true)} />
        <div className="content-enter p-4 sm:p-6 lg:p-8 overflow-auto flex-1 bg-gradient-to-br from-slate-50 via-gray-50 to-amber-50/30">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;
