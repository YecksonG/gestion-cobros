import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ModalPIN, ModalDesactivar, ModalReactivar, ModalEliminar, ModalAuditoria } from './ClienteModals';
import { GAS_SCRIPT_URL } from '../services/api';

function DetalleClienteModal({ isOpen, onClose, nombreCliente, inmueble }) {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [cambiandoStatus, setCambiandoStatus] = useState(false);
  const [nuevoStatus, setNuevoStatus] = useState('');

  // Estados para modales
  const [mostrarModalDesactivar, setMostrarModalDesactivar] = useState(false);
  const [mostrarModalReactivar, setMostrarModalReactivar] = useState(false);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [mostrarModalAuditoria, setMostrarModalAuditoria] = useState(false);
  const [enviandoEstadoCuenta, setEnviandoEstadoCuenta] = useState(false);

  useEffect(() => {
    if (isOpen && nombreCliente && inmueble) {
      cargarDetalles();
    }
  }, [isOpen, nombreCliente, inmueble]);

  const formatearFecha = (fecha) => {
    if (!fecha) return '—';
    // Si GAS ya la envió como DD/MM/YYYY, devolverla directamente
    if (typeof fecha === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) return fecha;
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return String(fecha);
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const año = date.getFullYear();
      return `${dia}/${mes}/${año}`;
    } catch (err) {
      return String(fecha);
    }
  };

  const calcularMesesDesdeInicio = (fechaInicio) => {
    if (!fechaInicio) return '—';
    try {
      const fecha = new Date(fechaInicio);
      const hoy = new Date();
      let meses = (hoy.getFullYear() - fecha.getFullYear()) * 12;
      meses += (hoy.getMonth() - fecha.getMonth());
      meses = Math.max(0, meses);
      return meses;
    } catch (err) {
      return '—';
    }
  };

  const cargarDetalles = async () => {
    setCargando(true);
    setError('');
    try {
      const response = await axios.get(
        `${GAS_SCRIPT_URL}?action=getClienteDetalles&nombre=${encodeURIComponent(nombreCliente)}&inmueble=${encodeURIComponent(inmueble)}`
      );

      if (response.data && !response.data.error) {
        setCliente(response.data);
      } else {
        setError(response.data?.error || 'Error al cargar detalles');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  const irARegistroCobrosRenovacion = () => {
    if (!cliente) return;

    navigate('/cobros', {
      state: {
        renovacion: true,
        numeroContrato: cliente.id,
        nombreCliente: cliente.nombre,
        inmueble: inmueble,
        unidad: cliente.unidad,
        montoRenovacion: cliente.costoRenovacion || 50
      }
    });
    onClose();
  };

  const mostrarBotonRenovar = () => {
    if (!cliente) return false;
    const status = cliente.statusContrato;
    if (status === 'Por Renovar' || status === 'Vencido') return true;
    return cliente.diasParaVencer !== undefined &&
           cliente.diasParaVencer !== null &&
           cliente.diasParaVencer <= 45;
  };

  const cambiarStatusCliente = async (nuevoStts) => {
    if (!cliente) return;

    setCambiandoStatus(true);
    try {
      const response = await axios.post(GAS_SCRIPT_URL, JSON.stringify({
        action: 'cambiarStatusCliente',
        nombre: cliente.nombre,
        inmueble: inmueble,
        nuevoStatus: nuevoStts
      }), {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });

      if (response.data.success) {
        toast.success(`✅ Status cambiado a "${nuevoStts}"`);
        // Recargar detalles
        setTimeout(() => {
          cargarDetalles();
        }, 500);
      } else {
        toast.error(`❌ ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('❌ Error al cambiar status');
    } finally {
      setCambiandoStatus(false);
    }
  };

  const enviarEstadoCuenta = async () => {
    if (!cliente) return;

    setEnviandoEstadoCuenta(true);
    try {
      const response = await axios.post(GAS_SCRIPT_URL, JSON.stringify({
        action: 'enviarEstadoCuentaCliente',
        nombre: cliente.nombre,
        inmueble: cliente.inmueble
      }), {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });

      if (response.data.success) {
        toast.success(`✅ ${response.data.message}`);
      } else {
        toast.error(`❌ ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('❌ Error al enviar estado de cuenta');
    } finally {
      setEnviandoEstadoCuenta(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* ENCABEZADO */}
        <div className="bg-gradient-to-r from-terra-copper to-terra-navy text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">🔍 Detalles del Cliente</h2>
            <p className="text-sm opacity-90 mt-1">{inmueble} • {cliente?.unidad || ''}</p>
          </div>
          <button
            onClick={onClose}
            className="text-3xl hover:opacity-75 transition w-10 h-10 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* CONTENIDO CON SCROLL */}
        <div className="flex-1 overflow-y-auto p-8">
          {cargando && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terra-copper mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Cargando datos...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              <p className="text-red-800 font-semibold">❌ {error}</p>
            </div>
          )}

          {cliente && !cargando && (
            <div className="space-y-8">
              {/* INFORMACIÓN PERSONAL */}
              <div>
                <h3 className="font-bold text-lg text-terra-copper mb-4 pb-3 border-b-2 border-terra-copper">
                  👤 INFORMACIÓN PERSONAL
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Nombre</p>
                    <p className="text-gray-900 font-medium">{cliente.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Cédula</p>
                    <p className="text-gray-900 font-medium">{cliente.cedula}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase mb-1">RIF</p>
                    <p className="text-gray-900 font-medium">{cliente.rif || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Teléfono</p>
                    <p className="text-gray-900 font-medium">{cliente.telefono || '—'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Correo</p>
                    <p className="text-gray-900 font-medium">{cliente.correo || '—'}</p>
                  </div>
                </div>
              </div>

              {/* INFORMACIÓN DEL INMUEBLE */}
              <div>
                <h3 className="font-bold text-lg text-terra-copper mb-4 pb-3 border-b-2 border-terra-copper">
                  🏢 INFORMACIÓN DEL INMUEBLE
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Inmueble</p>
                    <p className="text-gray-900 font-medium">{cliente.inmueble}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Ubicación</p>
                    <p className="text-gray-900 font-medium">{cliente.ubicacion}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Unidad</p>
                    <p className="text-gray-900 font-medium">{cliente.unidad}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Estacionamiento</p>
                    <p className="text-gray-900 font-medium">
                      {(cliente.estacionamiento?.trim?.() === 'Sí' || cliente.estacionamiento === 'Sí') ? '✅ Sí ($20/mes)' : '❌ No'}
                    </p>
                  </div>
                </div>
              </div>

              {/* DEUDA POR MORA (SI LA HAY) */}
              {cliente.moraActual > 0 && (
                <div>
                  <h3 className="font-bold text-lg text-red-600 mb-4 pb-3 border-b-2 border-red-600">
                    ⚠️ DEUDA POR MORA
                  </h3>
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-red-900 font-semibold">Mora Acumulada:</span>
                      <span className="font-bold text-red-600 text-lg">${cliente.moraActual.toFixed(2)}</span>
                    </div>
                    {cliente.mesesSinPagar > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-red-900 font-semibold">Meses sin Pagar:</span>
                        <span className="font-bold text-red-600">{cliente.mesesSinPagar}</span>
                      </div>
                    )}
                    {cliente.debeDesactivar && (
                      <div className="bg-red-100 border border-red-300 rounded p-3 mt-3">
                        <p className="text-sm text-red-800 font-semibold">🔴 ⚠️ Requiere atención: 2+ meses sin pagar</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DESGLOSE DE CANON */}
              <div>
                <h3 className="font-bold text-lg text-terra-copper mb-4 pb-3 border-b-2 border-terra-copper">
                  💰 DESGLOSE DEL CANON MENSUAL
                </h3>
                <div className="bg-gradient-to-r from-terra-cream to-terra-cream-mid border-l-4 border-terra-copper rounded-lg p-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Canon Base (USD):</span>
                    <span className="font-bold text-gray-900">${(parseFloat(cliente.canonBaseUSD) || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Plan Contingencia:</span>
                    <span className="font-bold text-gray-900">${(parseFloat(cliente.planContingenciaUSD) || 0).toFixed(2)}/mes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Depósito (cuota 1/4):</span>
                    <span className="font-bold text-gray-900">${((parseFloat(cliente.depositoTotalUSD) || 0) / 4).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Estacionamiento:</span>
                    <span className="font-bold text-gray-900">{(cliente.estacionamiento?.trim?.() === 'Sí' || cliente.estacionamiento === 'Sí') ? '$20.00' : '$0.00'}</span>
                  </div>
                  <div className="border-t-2 border-blue-200 pt-3 flex justify-between items-center">
                    <span className="font-bold text-terra-copper text-lg">TOTAL A COBRAR:</span>
                    <span className="font-bold text-terra-copper text-lg">
                      ${(
                        (parseFloat(cliente.canonBaseUSD) || 0) +
                        (parseFloat(cliente.planContingenciaUSD) || 0) +
                        ((parseFloat(cliente.depositoTotalUSD) || 0) / 4) +
                        ((cliente.estacionamiento?.trim?.() === 'Sí' || cliente.estacionamiento === 'Sí') ? 20 : 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* CONDICIONES DE PAGO */}
              <div>
                <h3 className="font-bold text-lg text-terra-copper mb-4 pb-3 border-b-2 border-terra-copper">
                  📅 CONDICIONES DE PAGO
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Día de Pago</p>
                    <p className="text-gray-900 font-medium">{cliente.diaPago || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Frecuencia</p>
                    <p className="text-gray-900 font-medium">{cliente.frecuenciaPago || 'Mensual'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Método de Pago</p>
                    <p className="text-gray-900 font-medium">{cliente.metodoPago || '—'}</p>
                  </div>
                </div>
              </div>

              {/* FECHAS DEL CONTRATO */}
              <div>
                <h3 className="font-bold text-lg text-terra-copper mb-4 pb-3 border-b-2 border-terra-copper">
                  📋 CONTRATO
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Inicio</p>
                    <p className="text-gray-900 font-medium">{formatearFecha(cliente.fechaInicioContrato)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Vencimiento</p>
                    <p className="text-gray-900 font-medium">{formatearFecha(cliente.fechaVencimiento)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900 font-medium">{cliente.statusContrato || 'Vigente'}</p>
                      <button
                        onClick={() => setNuevoStatus(nuevoStatus === '' ? 'toggle' : '')}
                        className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        Cambiar
                      </button>
                    </div>
                    {nuevoStatus === 'toggle' && (
                      <div className="mt-2 space-y-2">
                        <button
                          onClick={() => cambiarStatusCliente('Vigente')}
                          disabled={cambiandoStatus}
                          className="w-full text-sm px-3 py-1 bg-green-100 text-green-900 rounded hover:bg-green-200 disabled:opacity-50"
                        >
                          ✅ Vigente
                        </button>
                        <button
                          onClick={() => cambiarStatusCliente('Para Dar de Baja')}
                          disabled={cambiandoStatus}
                          className="w-full text-sm px-3 py-1 bg-red-100 text-red-900 rounded hover:bg-red-200 disabled:opacity-50"
                        >
                          🚫 Para Dar de Baja
                        </button>
                        <button
                          onClick={() => cambiarStatusCliente('Inactivo')}
                          disabled={cambiandoStatus}
                          className="w-full text-sm px-3 py-1 bg-gray-100 text-gray-900 rounded hover:bg-gray-200 disabled:opacity-50"
                        >
                          ⏸ Inactivo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RELACIÓN ARRENDATARIA */}
              <div>
                <h3 className="font-bold text-lg text-terra-copper mb-4 pb-3 border-b-2 border-terra-copper">
                  🤝 RELACIÓN ARRENDATARIA
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Tipo de Relación</p>
                    <p className="text-gray-900 font-medium">{cliente.tipoRelacion || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Fecha Inicio</p>
                    <p className="text-gray-900 font-medium">{formatearFecha(cliente.fechaInicioRelacion)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Meses en Relación</p>
                    <p className="text-gray-900 font-medium">{calcularMesesDesdeInicio(cliente.fechaInicioRelacion)} meses</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTONES (footer) */}
        <div className="bg-gray-100 border-t border-gray-200 p-6">
          {/* Botones principales */}
          <div className="flex gap-3 justify-end mb-3">
            {mostrarBotonRenovar() && (
              <button
                onClick={irARegistroCobrosRenovacion}
                className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition"
              >
                🔄 Renovar Contrato (${cliente?.costoRenovacion || 50})
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
            >
              Cerrar
            </button>
          </div>

          {/* Botones de administración (segunda fila) */}
          <div className="flex gap-2 justify-end flex-wrap">
            <button
              onClick={() => setMostrarModalAuditoria(true)}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition text-sm"
            >
              📋 Ver Historial
            </button>
            <button
              onClick={enviarEstadoCuenta}
              disabled={enviandoEstadoCuenta}
              className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg font-semibold hover:bg-cyan-200 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviandoEstadoCuenta ? '⏳ Enviando...' : '📱 Estado de Cuenta'}
            </button>
            {cliente && (cliente.statusContrato === 'Inactivo' || cliente.statusContrato === 'Para Dar de Baja') && (
              <button
                onClick={() => setMostrarModalReactivar(true)}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200 transition text-sm"
              >
                ▶️ Reactivar
              </button>
            )}
            {cliente && cliente.statusContrato !== 'Inactivo' && (
              <button
                onClick={() => setMostrarModalDesactivar(true)}
                className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-semibold hover:bg-orange-200 transition text-sm"
              >
                ⏸️ Desactivar
              </button>
            )}
            <button
              onClick={() => setMostrarModalEliminar(true)}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition text-sm"
            >
              🗑️ Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* MODALES DE ADMINISTRACIÓN */}
      <ModalDesactivar
        isOpen={mostrarModalDesactivar}
        cliente={cliente?.nombre}
        inmueble={inmueble}
        onConfirm={() => {
          setMostrarModalDesactivar(false);
          setTimeout(() => cargarDetalles(), 500);
        }}
        onCancel={() => setMostrarModalDesactivar(false)}
      />

      <ModalReactivar
        isOpen={mostrarModalReactivar}
        cliente={cliente?.nombre}
        inmueble={inmueble}
        onConfirm={() => {
          setMostrarModalReactivar(false);
          setTimeout(() => cargarDetalles(), 500);
        }}
        onCancel={() => setMostrarModalReactivar(false)}
      />

      <ModalEliminar
        isOpen={mostrarModalEliminar}
        cliente={cliente?.nombre}
        inmueble={inmueble}
        onConfirm={() => {
          setMostrarModalEliminar(false);
          onClose();
        }}
        onCancel={() => setMostrarModalEliminar(false)}
      />

      <ModalAuditoria
        isOpen={mostrarModalAuditoria}
        cliente={cliente?.nombre}
        inmueble={inmueble}
        onClose={() => setMostrarModalAuditoria(false)}
      />
    </div>,
    document.body
  );
}

export default DetalleClienteModal;
