import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerInquilinos } from '../services/api';

const COLORES_INMUEBLE = {
  'Federación':    { bg: 'bg-blue-600',   light: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  'La Candelaria': { bg: 'bg-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Miko':          { bg: 'bg-violet-600',  light: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700',  dot: 'bg-violet-500'  },
};

const COLOR_DEFAULT = { bg: 'bg-gray-600', light: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', dot: 'bg-gray-400' };

function StatusBadge({ status }) {
  if (status === 'Inactivo')        return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">Inactivo</span>;
  if (status === 'Para Dar de Baja') return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Para Dar de Baja</span>;
  if (status === 'Moroso')          return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Moroso</span>;
  if (status === 'Vencido')         return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Vencido</span>;
  if (status === 'Por Renovar')     return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Por Renovar</span>;
  return null;
}

function EstadoPagoBadge({ estadoPago }) {
  if (!estadoPago) return null;
  if (estadoPago === 'Al día')            return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ Al día</span>;
  if (estadoPago === 'Moroso')            return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">⚠ Moroso</span>;
  if (estadoPago === 'Pendiente este mes') return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⏳ Pendiente</span>;
  return null;
}

function FilaInquilino({ inq, onVerDetalle, onEditar }) {
  const esInactivo  = inq.status === 'Inactivo';
  const esParaBaja  = inq.status === 'Para Dar de Baja';

  return (
    <tr
      onClick={() => onVerDetalle(inq)}
      className={`transition-colors text-sm cursor-pointer ${
        esInactivo  ? 'bg-gray-50 opacity-60' :
        esParaBaja  ? 'bg-red-50'             :
        'hover:bg-gray-50'
      }`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center flex-wrap gap-1.5">
          <span className={`font-medium ${esInactivo ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
            {inq.nombre}
          </span>
          {/* Inactivo / Para Dar de Baja: solo su badge */}
          {(inq.status === 'Inactivo' || inq.status === 'Para Dar de Baja') && (
            <StatusBadge status={inq.status} />
          )}
          {/* Vencido: siempre muestra su badge; si tiene mora también la muestra; NUNCA muestra "Al día" */}
          {inq.status === 'Vencido' && (
            <>
              <StatusBadge status="Vencido" />
              {inq.estadoPago === 'Moroso' && <EstadoPagoBadge estadoPago="Moroso" />}
            </>
          )}
          {/* Por Renovar: badge de contrato + estado de pago */}
          {inq.status === 'Por Renovar' && (
            <>
              <StatusBadge status="Por Renovar" />
              <EstadoPagoBadge estadoPago={inq.estadoPago} />
            </>
          )}
          {/* Moroso (col Z): si pagó todo → "Al día"; si sigue con mora → "Moroso" */}
          {inq.status === 'Moroso' && (
            inq.estadoPago === 'Al día'
              ? <EstadoPagoBadge estadoPago="Al día" />
              : <StatusBadge status="Moroso" />
          )}
          {/* Vigente: solo estado de pago */}
          {inq.status === 'Vigente' && (
            <EstadoPagoBadge estadoPago={inq.estadoPago} />
          )}
        </div>
      </td>
      <td className={`px-4 py-3 hidden sm:table-cell ${esInactivo ? 'text-gray-400' : 'text-gray-600'}`}>{inq.cedula}</td>
      <td className={`px-4 py-3 hidden sm:table-cell ${esInactivo ? 'text-gray-400' : 'text-gray-600'}`}>{inq.telefono}</td>
      <td className={`px-4 py-3 text-xs hidden sm:table-cell ${esInactivo ? 'text-gray-400' : 'text-gray-500'}`}>{inq.unidad}</td>
      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onVerDetalle(inq)}
          className="hidden sm:inline-flex text-blue-600 hover:text-blue-800 font-medium text-xs transition-colors border border-transparent hover:border-blue-200 px-2.5 py-1 rounded mr-1"
        >
          👁️ Ver
        </button>
        <button
          onClick={() => onEditar(inq)}
          className="hidden sm:inline-flex text-terra-copper hover:text-orange-700 font-medium text-xs transition-colors border border-transparent hover:border-orange-200 px-2.5 py-1 rounded"
        >
          ✏️ Editar
        </button>
      </td>
    </tr>
  );
}

function SeccionInmueble({ inmueble, clientes, abierto, onToggle, onVerDetalle, onEditar }) {
  const colores = COLORES_INMUEBLE[inmueble] || COLOR_DEFAULT;
  const vigentes = clientes.filter(c => c.status !== 'Inactivo' && c.status !== 'Para Dar de Baja').length;
  const inactivos = clientes.length - vigentes;

  return (
    <div className={`border rounded-xl overflow-hidden mb-3 ${colores.border}`}>

      {/* CABECERA DESPLEGABLE */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-5 py-3.5 ${colores.light} hover:brightness-95 transition-all`}
      >
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${colores.dot} flex-shrink-0`}></span>
          <span className={`font-bold text-base ${colores.text}`}>{inmueble}</span>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colores.bg} text-white`}>
            {clientes.length} {clientes.length === 1 ? 'inquilino' : 'inquilinos'}
          </span>
          {inactivos > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
              {inactivos} inactivo{inactivos > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden sm:block">
            {vigentes} activo{vigentes !== 1 ? 's' : ''}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 ${colores.text} transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* TABLA DE CLIENTES */}
      {abierto && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="px-4 py-2.5 font-semibold">Arrendatario</th>
                <th className="px-4 py-2.5 font-semibold hidden sm:table-cell">Cédula</th>
                <th className="px-4 py-2.5 font-semibold hidden sm:table-cell">Teléfono</th>
                <th className="px-4 py-2.5 font-semibold hidden sm:table-cell">Unidad</th>
                <th className="px-4 py-2.5 font-semibold text-center">Opciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.map(inq => (
                <FilaInquilino
                  key={inq.id}
                  inq={inq}
                  onVerDetalle={onVerDetalle}
                  onEditar={onEditar}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Inquilinos() {
  const navigate = useNavigate();
  const [inquilinos, setInquilinos]       = useState([]);
  const [busqueda, setBusqueda]           = useState('');
  const [cargando, setCargando]           = useState(true);
  const [seccionesAbiertas, setSeccionesAbiertas] = useState(new Set());

  useEffect(() => {
    obtenerInquilinos().then((data) => {
      setInquilinos(data);
      // Abrir todas las secciones por defecto
      const inmuebles = [...new Set(data.map(i => i.inmueble))];
      setSeccionesAbiertas(new Set(inmuebles));
      setCargando(false);
    });
  }, []);

  // Al buscar, expandir automáticamente todas las secciones con coincidencias
  useEffect(() => {
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const conResultados = [...new Set(
        inquilinos
          .filter(i =>
            i.nombre.toLowerCase().includes(q) ||
            i.inmueble.toLowerCase().includes(q) ||
            (i.cedula || '').toLowerCase().includes(q) ||
            (i.unidad || '').toLowerCase().includes(q)
          )
          .map(i => i.inmueble)
      )];
      setSeccionesAbiertas(new Set(conResultados));
    }
  }, [busqueda, inquilinos]);

  const toggleSeccion = (inmueble) => {
    setSeccionesAbiertas(prev => {
      const next = new Set(prev);
      next.has(inmueble) ? next.delete(inmueble) : next.add(inmueble);
      return next;
    });
  };

  const expandirTodo = () => {
    const todos = [...new Set(inquilinos.map(i => i.inmueble))];
    setSeccionesAbiertas(new Set(todos));
  };

  const colapsarTodo = () => setSeccionesAbiertas(new Set());

  // Filtrar por búsqueda
  const q = busqueda.toLowerCase();
  const filtrados = busqueda.trim()
    ? inquilinos.filter(i =>
        i.nombre.toLowerCase().includes(q) ||
        i.inmueble.toLowerCase().includes(q) ||
        (i.cedula || '').toLowerCase().includes(q) ||
        (i.unidad || '').toLowerCase().includes(q)
      )
    : inquilinos;

  // Agrupar por inmueble (preservar orden de aparición)
  const ordenInmuebles = [...new Set(inquilinos.map(i => i.inmueble))];
  const porInmueble = {};
  ordenInmuebles.forEach(inm => {
    const grupo = filtrados.filter(i => i.inmueble === inm);
    if (grupo.length > 0) porInmueble[inm] = grupo;
  });

  const inmueblesMostrados = Object.keys(porInmueble);
  const totalFiltrados = filtrados.length;

  const handleVerDetalle = (inq) => {
    navigate(`/inquilinos/${encodeURIComponent(inq.inmueble)}/${encodeURIComponent(inq.nombre)}`);
  };

  const handleEditar = (inq) => {
    navigate(`/editar-cliente/${encodeURIComponent(inq.inmueble)}/${encodeURIComponent(inq.nombre)}`);
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20">
        <div className="w-12 h-12 border-4 border-terra-copper border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-medium animate-pulse">Cargando directorio...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

      {/* ENCABEZADO */}
      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="font-bold text-lg text-gray-800">Directorio de Arrendatarios</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {totalFiltrados} inquilino{totalFiltrados !== 1 ? 's' : ''} en {inmueblesMostrados.length} inmueble{inmueblesMostrados.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Buscador */}
          <div className="relative flex-1 sm:w-80">
            <input
              type="text"
              placeholder="Buscar nombre, cédula, unidad..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terra-copper focus:border-transparent transition-all"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Expandir / Colapsar */}
          <button
            onClick={expandirTodo}
            title="Expandir todo"
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors text-xs font-medium"
          >
            ＋ Todo
          </button>
          <button
            onClick={colapsarTodo}
            title="Colapsar todo"
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors text-xs font-medium"
          >
            − Todo
          </button>
        </div>
      </div>

      {/* SECCIONES POR INMUEBLE */}
      <div className="p-4">
        {inmueblesMostrados.length > 0 ? (
          inmueblesMostrados.map(inmueble => (
            <SeccionInmueble
              key={inmueble}
              inmueble={inmueble}
              clientes={porInmueble[inmueble]}
              abierto={seccionesAbiertas.has(inmueble)}
              onToggle={() => toggleSeccion(inmueble)}
              onVerDetalle={handleVerDetalle}
              onEditar={handleEditar}
            />
          ))
        ) : (
          <div className="py-16 text-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">No hay inquilinos que coincidan con <strong>"{busqueda}"</strong></p>
          </div>
        )}
      </div>

    </div>
  );
}

export default Inquilinos;
