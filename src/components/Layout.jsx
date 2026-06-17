import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useInactivity } from '../hooks/useInactivity';

function Layout({ children, title, subtitle }) {
  useInactivity(600_000);

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        {/* Aquí se inyectará el contenido de cada página de forma dinámica */}
        <div className="content-enter p-8 overflow-auto flex-1 bg-[#f4f7f6]">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;