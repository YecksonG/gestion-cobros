import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { GAS_SCRIPT_URL } from '../services/api';

const STORAGE_KEY = 'terravia-auth-session';

/**
 * Hook de autenticación global.
 *
 * Sesión persistida en localStorage con formato:
 *   { email, nombre, rol, expiraEn (timestamp ms) }
 *
 * Si expiraEn < Date.now(), la sesión se considera vencida.
 *
 * API:
 *   const { autenticado, usuario, cargando, login, logout, error } = useAuth();
 *   await login(email, password, recordarme)
 *   logout()
 */
export function useAuth() {
  const [usuario, setUsuario] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (!session.expiraEn || Date.now() > session.expiraEn) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  });

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Limpiar sesión expirada al montar (defensa adicional contra tabs viejos)
  useEffect(() => {
    if (usuario && usuario.expiraEn && Date.now() > usuario.expiraEn) {
      localStorage.removeItem(STORAGE_KEY);
      setUsuario(null);
    }
  }, []);

  const login = useCallback(async (email, password, recordarme = false) => {
    setCargando(true);
    setError('');
    try {
      const response = await axios.post(
        GAS_SCRIPT_URL,
        JSON.stringify({ action: 'loginUsuario', email, password, recordarme }),
        {
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          timeout: 20000
        }
      );

      if (response.data && response.data.success) {
        const session = {
          email: response.data.usuario.email,
          nombre: response.data.usuario.nombre,
          rol: response.data.usuario.rol,
          expiraEn: response.data.expiraEn,
          recordarme: !!response.data.recordarme
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        setUsuario(session);
        return { success: true };
      } else {
        const msg = response.data?.message || 'Error desconocido';
        setError(msg);
        return { success: false, message: msg };
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error de conexión';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setCargando(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUsuario(null);
    setError('');
  }, []);

  const autenticado = !!usuario && !!usuario.expiraEn && Date.now() < usuario.expiraEn;

  return { autenticado, usuario, cargando, login, logout, error };
}
