import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { GAS_SCRIPT_URL } from '../services/api';

/**
 * Modal: Validación de PIN para acciones críticas
 */
export function ModalPIN({ isOpen, titulo, descripcion, onSubmit, onCancel }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async () => {
    if (!pin.trim()) {
      setError('Por favor ingresa el PIN');
      return;
    }

    setCargando(true);
    try {
      const response = await axios.post(GAS_SCRIPT_URL, JSON.stringify({
        action: 'validarPIN',
        pin: pin
      }), {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });

      if (response.data.success) {
        setError('');
        setPin('');
        onSubmit(pin);
      } else {
        setError('PIN incorrecto. Intenta de nuevo.');
        setPin('');
      }
    } catch (err) {
      setError('Error al validar PIN');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900">{titulo}</h2>
          <p className="text-sm text-gray-600 mt-2">{descripcion}</p>
        </div>

        {/* Input PIN */}
        <div className="mb-4">
          <input
            type="password"
            placeholder="••••"
            maxLength="6"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError('');
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
            disabled={cargando}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-lg font-bold tracking-widest focus:outline-none focus:border-red-500 disabled:bg-gray-100"
          />
          {error && (
            <p className="mt-2 text-sm font-semibold text-red-600 bg-red-50 p-2 rounded">
              ❌ {error}
            </p>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={cargando || !pin.trim()}
            className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando ? '⏳ Validando...' : '🔓 Desbloquear'}
          </button>
          <button
            onClick={() => {
              setPin('');
              setError('');
              onCancel();
            }}
            disabled={cargando}
            className="flex-1 bg-gray-300 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-400 transition disabled:opacity-50"
          >
            ❌ Cancelar
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Acción bloqueada por seguridad. Solo administradores.
        </p>
      </div>
    </div>
  );
}

/**
 * Modal: Confirmación de desactivación
 */
export function ModalDesactivar({ isOpen, cliente, inmueble, onConfirm, onCancel }) {
  const [cargando, setCargando] = useState(false);

  const handleDesactivar = async () => {
    setCargando(true);
    try {
      const response = await axios.post(GAS_SCRIPT_URL, JSON.stringify({
        action: 'cambiarStatusCliente',
        nombre: cliente,
        inmueble: inmueble,
        nuevoStatus: 'Inactivo'
      }), {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });

      if (response.data.success) {
        toast.success(`✅ ${cliente} ha sido desactivado`);
        onConfirm();
      } else {
        toast.error(`❌ ${response.data.error}`);
      }
    } catch (error) {
      toast.error('❌ Error al desactivar cliente');
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">⏸️</div>
          <h2 className="text-2xl font-bold text-gray-900">Desactivar Cliente</h2>
        </div>

        {/* Mensaje */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-900 mb-3">
            <strong>¿Desactivar a {cliente}?</strong>
          </p>
          <ul className="text-xs text-yellow-800 space-y-1">
            <li>✓ El cliente se marcará como inactivo</li>
            <li>✓ No aparecerá en cobros futuros</li>
            <li>✓ El historial se preserva completamente</li>
            <li>✓ Puedes reactivarlo después</li>
          </ul>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={handleDesactivar}
            disabled={cargando}
            className="flex-1 bg-orange-500 text-white font-bold py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando ? '⏳ Procesando...' : '⏸️ Desactivar'}
          </button>
          <button
            onClick={onCancel}
            disabled={cargando}
            className="flex-1 bg-gray-300 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-400 transition disabled:opacity-50"
          >
            ❌ Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal: Confirmación de eliminación (CON PIN)
 */
export function ModalEliminar({ isOpen, cliente, inmueble, onConfirm, onCancel }) {
  const [mostrarPin, setMostrarPin] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleEliminarConfirmado = async () => {
    setCargando(true);
    try {
      const response = await axios.post(GAS_SCRIPT_URL, JSON.stringify({
        action: 'eliminarCliente',
        nombre: cliente,
        inmueble: inmueble
      }), {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });

      if (response.data.success) {
        toast.success(`✅ ${cliente} ha sido eliminado del sistema`);
        setMostrarPin(false);
        onConfirm();
      } else {
        toast.error(`❌ ${response.data.error}`);
      }
    } catch (error) {
      toast.error('❌ Error al eliminar cliente');
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <ModalPIN
        isOpen={mostrarPin}
        titulo="Eliminar Cliente"
        descripcion="Ingresa el PIN de administrador para confirmar la eliminación"
        onSubmit={handleEliminarConfirmado}
        onCancel={() => setMostrarPin(false)}
      />

      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🗑️</div>
          <h2 className="text-2xl font-bold text-red-600">Eliminar Cliente</h2>
        </div>

        {/* Advertencia CRÍTICA */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-bold text-red-900 mb-3">
            ⚠️ ESTA ACCIÓN ES IRREVERSIBLE
          </p>
          <ul className="text-xs text-red-800 space-y-2">
            <li>❌ Se eliminará: {cliente}</li>
            <li>❌ Se borrará TODO el historial</li>
            <li>❌ Se perderán registros de auditoría</li>
            <li>❌ No se puede deshacer</li>
            <li className="mt-3 font-bold border-t border-red-300 pt-2">
              ✅ Usa SOLO para clientes de prueba
            </li>
          </ul>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={() => setMostrarPin(true)}
            disabled={cargando}
            className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando ? '⏳ Eliminando...' : '🗑️ Eliminar'}
          </button>
          <button
            onClick={onCancel}
            disabled={cargando}
            className="flex-1 bg-gray-300 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-400 transition disabled:opacity-50"
          >
            ❌ Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal: Confirmación de reactivación
 */
export function ModalReactivar({ isOpen, cliente, inmueble, onConfirm, onCancel }) {
  const [cargando, setCargando] = useState(false);

  const handleReactivar = async () => {
    setCargando(true);
    try {
      const response = await axios.post(GAS_SCRIPT_URL, JSON.stringify({
        action: 'cambiarStatusCliente',
        nombre: cliente,
        inmueble: inmueble,
        nuevoStatus: 'Vigente'
      }), {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });

      if (response.data.success) {
        toast.success(`✅ ${cliente} ha sido reactivado`);
        onConfirm();
      } else {
        toast.error(`❌ ${response.data.error}`);
      }
    } catch (error) {
      toast.error('❌ Error al reactivar cliente');
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">▶️</div>
          <h2 className="text-2xl font-bold text-gray-900">Reactivar Cliente</h2>
        </div>

        {/* Mensaje */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-900 mb-3">
            <strong>¿Reactivar a {cliente}?</strong>
          </p>
          <ul className="text-xs text-green-800 space-y-1">
            <li>✓ El contrato volverá al status "Vigente"</li>
            <li>✓ Aparecerá nuevamente en cobros futuros</li>
            <li>✓ El historial se preserva completamente</li>
          </ul>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={handleReactivar}
            disabled={cargando}
            className="flex-1 bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando ? '⏳ Procesando...' : '▶️ Reactivar'}
          </button>
          <button
            onClick={onCancel}
            disabled={cargando}
            className="flex-1 bg-gray-300 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-400 transition disabled:opacity-50"
          >
            ❌ Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal: Ver auditoría/historial de cambios
 */
export function ModalAuditoria({ isOpen, cliente, inmueble, onClose }) {
  const [auditoria, setAuditoria] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen && cliente && inmueble) {
      cargarAuditoria();
    }
  }, [isOpen, cliente, inmueble]);

  const cargarAuditoria = async () => {
    setCargando(true);
    setError('');
    try {
      const response = await axios.get(
        `${GAS_SCRIPT_URL}?action=getAuditoria&nombre=${encodeURIComponent(cliente)}&inmueble=${encodeURIComponent(inmueble)}`
      );

      if (response.data.success) {
        setAuditoria(response.data.registros || []);
      } else {
        setError('No hay registros de auditoría');
      }
    } catch (err) {
      setError('Error al cargar auditoría');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-terra-copper to-terra-navy text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">📋 Historial de Cambios</h2>
            <p className="text-sm opacity-90 mt-1">{cliente} • {inmueble}</p>
          </div>
          <button
            onClick={onClose}
            className="text-3xl hover:opacity-75 transition"
          >
            ✕
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {cargando && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-terra-copper border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Cargando historial...</p>
            </div>
          )}

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-yellow-800 font-semibold">⚠️ {error}</p>
            </div>
          )}

          {!cargando && !error && auditoria.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No hay registros de cambios</p>
            </div>
          )}

          {!cargando && auditoria.length > 0 && (
            <div className="space-y-3">
              {auditoria.map((registro, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{registro.accion}</p>
                      <p className="text-xs text-gray-500">
                        {registro.fecha} {registro.hora}
                      </p>
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {registro.usuario}
                    </span>
                  </div>

                  {registro.campo && (
                    <div className="bg-gray-50 rounded p-2 mt-2 text-xs">
                      <p className="text-gray-600">
                        <strong>{registro.campo}:</strong>
                      </p>
                      <p className="text-gray-700 mt-1">
                        {registro.valorAnterior} → {registro.valorNuevo}
                      </p>
                    </div>
                  )}

                  {registro.detalles && (
                    <p className="text-xs text-gray-600 mt-2 italic">
                      💬 {registro.detalles}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
