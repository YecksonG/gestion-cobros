import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { validarCorreo } from '../utils/validaciones';

function Login() {
  const { login, cargando, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recordarme, setRecordarme] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorLocal('');

    if (!email.trim() || !password) {
      setErrorLocal('Email y contraseña son obligatorios');
      return;
    }
    if (!validarCorreo(email)) {
      setErrorLocal('Email inválido o dominio no permitido');
      return;
    }

    const resultado = await login(email.trim(), password, recordarme);
    if (resultado.success) {
      navigate(destino, { replace: true });
    } else {
      setErrorLocal(resultado.message || 'Error al iniciar sesión');
    }
  };

  const error = errorLocal || authError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-terra-navy via-terra-navy-mid to-terra-navy-deep flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* LOGO Y TÍTULO */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-[#d4a373] tracking-wider mb-2">TERRAVIA</h1>
          <p className="text-gray-400 text-sm">Sistema de Gestión de Arrendamientos</p>
        </div>

        {/* CARD DE LOGIN */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Iniciar Sesión</h2>
          <p className="text-sm text-gray-500 mb-6">Ingresa tus credenciales para continuar</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm font-medium">❌ {error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@dominio.com"
                autoComplete="email"
                autoFocus
                required
                disabled={cargando}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper focus:border-transparent outline-none disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={cargando}
                  className="w-full p-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terra-copper focus:border-transparent outline-none disabled:bg-gray-100"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {mostrarPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recordarme"
                checked={recordarme}
                onChange={(e) => setRecordarme(e.target.checked)}
                disabled={cargando}
                className="w-4 h-4 accent-terra-copper"
              />
              <label htmlFor="recordarme" className="text-sm text-gray-700 cursor-pointer select-none">
                Recordarme por 7 días
              </label>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-gradient-to-r from-terra-copper to-terra-navy text-white py-3 rounded-lg font-semibold hover:from-terra-copper-dark hover:to-terra-navy-deep disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {cargando ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verificando...
                </>
              ) : (
                <>🔓 Iniciar Sesión</>
              )}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-6">
            ¿Problemas para acceder? Contacta al administrador.
          </p>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          © 2026 Terravia · Sistema interno de gestión
        </p>
      </div>
    </div>
  );
}

export default Login;
