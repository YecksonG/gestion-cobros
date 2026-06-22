import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { GAS_SCRIPT_URL } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { validarCorreo } from '../utils/validaciones';

const ROLES = [
  { value: 'admin',    label: '🔧 Administrador', desc: 'Acceso completo + gestión de usuarios' },
  { value: 'gestor',   label: '📋 Gestor',         desc: 'Puede gestionar clientes y cobros' },
  { value: 'cobrador', label: '💰 Cobrador',        desc: 'Solo registro de pagos y agenda' },
  { value: 'legal',    label: '⚖️ Legal',           desc: 'Acceso a inquilinos, agenda, tasas y sección legal' }
];

const rolBadge = (rol) => {
  switch (rol) {
    case 'admin':    return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'gestor':   return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'cobrador': return 'bg-green-100 text-green-700 border-green-200';
    case 'legal':    return 'bg-amber-100 text-amber-700 border-amber-200';
    default:         return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

function Usuarios() {
  const { usuario: usuarioActual } = useAuth();
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [vistaCrear, setVistaCrear] = useState(false);
  const [modalResetear, setModalResetear] = useState(null); // email del usuario
  const [modalEliminar, setModalEliminar] = useState(null); // email

  // Bloqueo si no es admin
  useEffect(() => {
    if (usuarioActual && usuarioActual.rol !== 'admin') {
      toast.error('❌ Solo administradores pueden acceder');
      navigate('/', { replace: true });
    }
  }, [usuarioActual, navigate]);

  const cargarUsuarios = async () => {
    setCargando(true);
    setError('');
    try {
      const response = await axios.get(`${GAS_SCRIPT_URL}?action=getUsuarios`);
      if (response.data?.success) {
        setUsuarios(response.data.usuarios || []);
      } else {
        setError(response.data?.message || 'Error al cargar usuarios');
      }
    } catch (err) {
      setError(err.message || 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const cambiarRol = async (email, nuevoRol) => {
    try {
      const response = await axios.post(
        GAS_SCRIPT_URL,
        JSON.stringify({ action: 'actualizarUsuario', email, cambios: { rol: nuevoRol } }),
        { headers: { 'Content-Type': 'text/plain;charset=utf-8' } }
      );
      if (response.data?.success) {
        toast.success(`✅ Rol actualizado a ${nuevoRol}`);
        cargarUsuarios();
      } else {
        toast.error(`❌ ${response.data?.message || 'Error'}`);
      }
    } catch (err) {
      toast.error(`❌ ${err.message}`);
    }
  };

  const toggleActivo = async (email, nuevoActivo) => {
    try {
      const response = await axios.post(
        GAS_SCRIPT_URL,
        JSON.stringify({ action: 'actualizarUsuario', email, cambios: { activo: nuevoActivo } }),
        { headers: { 'Content-Type': 'text/plain;charset=utf-8' } }
      );
      if (response.data?.success) {
        toast.success(nuevoActivo ? '✅ Usuario activado' : '🔒 Usuario desactivado');
        cargarUsuarios();
      } else {
        toast.error(`❌ ${response.data?.message || 'Error'}`);
      }
    } catch (err) {
      toast.error(`❌ ${err.message}`);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-terra-copper border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (vistaCrear) {
    return (
      <FormCrearUsuario
        onClose={() => setVistaCrear(false)}
        onCreado={() => { setVistaCrear(false); cargarUsuarios(); }}
      />
    );
  }

  return (
    <div className="content-enter max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="relative bg-gradient-to-r from-terra-copper to-terra-navy rounded-2xl p-6 text-white overflow-hidden shadow-lg mb-6">
        <div className="absolute top-0 right-0 w-56 h-56 bg-terra-gold/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl pointer-events-none" />
        <div className="relative flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xl">👥</span>
              <h1 className="text-xl font-black">Gestión de Usuarios</h1>
            </div>
            <p className="text-white/60 text-sm">
              Administra accesos al sistema · {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setVistaCrear(true)}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 border border-white/20"
          >
            <span>➕</span> Agregar Usuario
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">❌ {error}</p>
        </div>
      )}

      {/* TABLA DE USUARIOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-gradient-to-r from-terra-cream to-terra-cream-mid border-b border-terra-gold/20">
              <th className="text-left p-4 text-[11px] font-bold text-terra-copper-dark uppercase tracking-wider">Usuario</th>
              <th className="text-left p-4 text-[11px] font-bold text-terra-copper-dark uppercase tracking-wider">Rol</th>
              <th className="text-left p-4 text-[11px] font-bold text-terra-copper-dark uppercase tracking-wider">Estado</th>
              <th className="text-left p-4 text-[11px] font-bold text-terra-copper-dark uppercase tracking-wider">Último Login</th>
              <th className="text-center p-4 text-[11px] font-bold text-terra-copper-dark uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map((u) => {
              const esMiMismo = u.email === usuarioActual?.email;
              return (
                <tr key={u.email} className={`hover:bg-terra-cream/30 transition ${!u.activo ? 'opacity-60 bg-gray-50' : ''}`}>
                  <td className="p-4">
                    <div className="font-semibold text-gray-900">{u.nombre || '(Sin nombre)'}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                    {esMiMismo && <span className="inline-block mt-1 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">TÚ</span>}
                  </td>
                  <td className="p-4">
                    <select
                      value={u.rol}
                      onChange={(e) => cambiarRol(u.email, e.target.value)}
                      disabled={esMiMismo}
                      className={`text-xs font-semibold px-2 py-1 rounded border outline-none cursor-pointer ${rolBadge(u.rol)} disabled:cursor-not-allowed disabled:opacity-70`}
                      title={esMiMismo ? 'No puedes cambiar tu propio rol' : 'Cambiar rol'}
                    >
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => !esMiMismo && toggleActivo(u.email, !u.activo)}
                      disabled={esMiMismo}
                      className={`text-xs font-semibold px-3 py-1 rounded-full border transition ${
                        u.activo
                          ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                          : 'bg-gray-200 text-gray-600 border-gray-300 hover:bg-gray-300'
                      } disabled:cursor-not-allowed disabled:opacity-70`}
                      title={esMiMismo ? 'No puedes desactivarte a ti mismo' : (u.activo ? 'Desactivar' : 'Activar')}
                    >
                      {u.activo ? '🟢 Activo' : '⚫ Inactivo'}
                    </button>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {u.ultimoLogin || <span className="text-gray-400 italic">Nunca</span>}
                  </td>
                  <td className="p-4 text-center space-x-2">
                    <button
                      onClick={() => setModalResetear(u.email)}
                      className="text-xs text-terra-copper hover:text-terra-copper-dark font-medium px-2 py-1 rounded border border-terra-copper/30 hover:bg-terra-cream transition"
                      title="Resetear contraseña"
                    >
                      🔑 Reset
                    </button>
                    {!esMiMismo && (
                      <button
                        onClick={() => setModalEliminar(u.email)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded border border-red-200 hover:bg-red-50 transition"
                        title="Eliminar usuario"
                      >
                        🗑️ Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan="5" className="p-12 text-center text-gray-500">
                  No hay usuarios registrados aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* MODALES */}
      {modalResetear && <ModalResetearPassword email={modalResetear} onClose={() => setModalResetear(null)} />}
      {modalEliminar && <ModalEliminarUsuario email={modalEliminar} onClose={() => setModalEliminar(null)} onEliminado={cargarUsuarios} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// FORMULARIO INLINE: Crear Usuario (mismo patrón que AgregarCliente)
// ════════════════════════════════════════════════════════════════════════
function FormCrearUsuario({ onClose, onCreado }) {
  const [form, setForm] = useState({ email: '', password: '', nombre: '', rol: 'cobrador' });
  const [guardando, setGuardando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password || !form.nombre.trim()) {
      toast.error('❌ Todos los campos son obligatorios');
      return;
    }
    if (!validarCorreo(form.email)) {
      toast.error('❌ Correo inválido o dominio no permitido');
      return;
    }
    if (form.password.length < 6) {
      toast.error('❌ La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setGuardando(true);
    try {
      const response = await axios.post(
        GAS_SCRIPT_URL,
        JSON.stringify({
          action: 'crearUsuarioApi',
          email: form.email.trim(),
          password: form.password,
          nombre: form.nombre.trim(),
          rol: form.rol
        }),
        { headers: { 'Content-Type': 'text/plain;charset=utf-8' } }
      );
      if (response.data?.success) {
        toast.success(`✅ Usuario ${form.email} creado`);
        onCreado();
      } else {
        toast.error(`❌ ${response.data?.message || 'Error al crear'}`);
      }
    } catch (err) {
      toast.error(`❌ ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="content-enter max-w-2xl mx-auto">
      {/* HEADER */}
      <div className="relative bg-gradient-to-r from-terra-copper to-terra-navy rounded-2xl p-6 text-white overflow-hidden shadow-lg mb-6">
        <div className="absolute top-0 right-0 w-56 h-56 bg-terra-gold/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl pointer-events-none" />
        <div className="relative flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xl">➕</span>
              <h1 className="text-xl font-black">Nuevo Usuario</h1>
            </div>
            <p className="text-white/60 text-sm">Completa los datos para crear el acceso al sistema</p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 border border-white/20"
          >
            ← Volver
          </button>
        </div>
      </div>

      {/* FORMULARIO */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre Completo</label>
              <input
                type="text" value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required disabled={guardando}
                placeholder="Ej: María Cobradora"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Correo Electrónico</label>
              <input
                type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value.toLowerCase() })}
                required disabled={guardando}
                placeholder="ejemplo@dominio.com"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none disabled:bg-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña Inicial</label>
            <div className="relative max-w-sm">
              <input
                type={mostrarPassword ? 'text' : 'password'} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required disabled={guardando}
                placeholder="Mínimo 6 caracteres"
                className="w-full p-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none disabled:bg-gray-100"
              />
              <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" tabIndex={-1}>
                {mostrarPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">El usuario podrá cambiarla en su perfil</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Rol del Usuario</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ROLES.map(r => (
                <label key={r.value} className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                  form.rol === r.value
                    ? 'border-terra-copper bg-terra-copper/5'
                    : 'border-gray-200 hover:border-terra-copper/40'
                }`}>
                  <input
                    type="radio" name="rol" value={r.value}
                    checked={form.rol === r.value}
                    onChange={(e) => setForm({ ...form, rol: e.target.value })}
                    className="mt-0.5 accent-terra-copper"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-800">{r.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              type="button" onClick={onClose} disabled={guardando}
              className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={guardando}
              className="flex-1 py-3 bg-gradient-to-r from-terra-copper to-terra-navy text-white rounded-xl font-semibold hover:from-terra-copper-dark disabled:opacity-50 flex items-center justify-center gap-2 transition"
            >
              {guardando
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creando...</>
                : '✅ Crear Usuario'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MODAL: Resetear Password
// ════════════════════════════════════════════════════════════════════════
function ModalResetearPassword({ email, onClose }) {
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('❌ Mínimo 6 caracteres');
      return;
    }
    setGuardando(true);
    try {
      const response = await axios.post(
        GAS_SCRIPT_URL,
        JSON.stringify({ action: 'resetearPassword', email, passwordNueva: password }),
        { headers: { 'Content-Type': 'text/plain;charset=utf-8' } }
      );
      if (response.data?.success) {
        toast.success(`🔑 Password reseteado para ${email}`);
        onClose();
      } else {
        toast.error(`❌ ${response.data?.message || 'Error'}`);
      }
    } catch (err) {
      toast.error(`❌ ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="bg-gradient-to-r from-terra-navy to-terra-navy-deep text-white p-5 rounded-t-xl flex justify-between items-center">
          <h3 className="text-lg font-bold">🔑 Resetear Contraseña</h3>
          <button onClick={onClose} className="text-white hover:text-gray-300 text-2xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-terra-cream border border-terra-gold/30 rounded-lg p-3 text-sm text-terra-copper-dark">
            Reseteando password de: <strong>{email}</strong>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nueva Contraseña</label>
            <div className="relative">
              <input type={mostrarPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required disabled={guardando} autoFocus
                placeholder="Mínimo 6 caracteres"
                className="w-full p-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper outline-none disabled:bg-gray-100" />
              <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" tabIndex={-1}>
                {mostrarPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Comparte esta password con el usuario por un canal seguro</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={guardando} className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={guardando} className="flex-1 py-3 bg-terra-copper text-white rounded-lg font-semibold hover:bg-terra-copper-dark disabled:opacity-50 flex items-center justify-center gap-2">
              {guardando ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Guardando...</> : '🔑 Resetear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MODAL: Eliminar Usuario
// ════════════════════════════════════════════════════════════════════════
function ModalEliminarUsuario({ email, onClose, onEliminado }) {
  const [confirmacion, setConfirmacion] = useState('');
  const [eliminando, setEliminando] = useState(false);

  const handleEliminar = async () => {
    if (confirmacion !== email) {
      toast.error('❌ La confirmación no coincide');
      return;
    }
    setEliminando(true);
    try {
      const response = await axios.post(
        GAS_SCRIPT_URL,
        JSON.stringify({ action: 'eliminarUsuario', email }),
        { headers: { 'Content-Type': 'text/plain;charset=utf-8' } }
      );
      if (response.data?.success) {
        toast.success(`🗑️ Usuario ${email} eliminado`);
        onEliminado();
        onClose();
      } else {
        toast.error(`❌ ${response.data?.message || 'Error'}`);
      }
    } catch (err) {
      toast.error(`❌ ${err.message}`);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="bg-red-600 text-white p-5 rounded-t-xl flex justify-between items-center">
          <h3 className="text-lg font-bold">🗑️ Eliminar Usuario</h3>
          <button onClick={onClose} className="text-white hover:text-gray-300 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            <strong>⚠️ Acción permanente.</strong> Recomendado: desactivar en lugar de eliminar.
          </div>
          <p className="text-sm text-gray-700">
            Para confirmar, escribe el email exacto: <strong className="block mt-1 font-mono text-gray-900">{email}</strong>
          </p>
          <input type="text" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} disabled={eliminando} autoFocus
            placeholder="Escribe el email aquí"
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none disabled:bg-gray-100 font-mono text-sm" />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={eliminando} className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
            <button type="button" onClick={handleEliminar} disabled={eliminando || confirmacion !== email} className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {eliminando ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Eliminando...</> : '🗑️ Eliminar Definitivamente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Usuarios;
