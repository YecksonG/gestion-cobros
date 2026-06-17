import { useState, useEffect } from 'react';

const SESSION_MS = 20 * 60 * 1000; // 20 minutos

/**
 * Sesión de PIN persistente entre navegaciones.
 *
 * Mientras el componente está montado (usuario en la página):
 *   - Sesión activa, sin temporizador.
 *
 * Al desmontar (usuario sale de la página):
 *   - Guarda expiresAt = ahora + 20 min en sessionStorage.
 *
 * Al volver a montar:
 *   - Si expiresAt no ha pasado → retoma sesión y borra el temporizador.
 *   - Si expiresAt ya pasó       → bloquea, requiere PIN nuevamente.
 */
export function usePinSession(key) {
  const storageKey = `pin_session_${key}`;

  const [authenticated, setAuthenticated] = useState(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return false;
      const { authenticated: auth, expiresAt } = JSON.parse(raw);
      if (!auth) return false;
      if (expiresAt && Date.now() > expiresAt) {
        sessionStorage.removeItem(storageKey);
        return false;
      }
      // Sesión vigente — estamos en la página, borramos el temporizador
      sessionStorage.setItem(storageKey, JSON.stringify({ authenticated: true, expiresAt: null }));
      return true;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!authenticated) return;

    // En página: sesión activa sin expiración
    sessionStorage.setItem(storageKey, JSON.stringify({ authenticated: true, expiresAt: null }));

    return () => {
      // Al salir: iniciar cuenta regresiva de 20 min
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({ authenticated: true, expiresAt: Date.now() + SESSION_MS })
      );
    };
  }, [authenticated, storageKey]);

  const login  = () => setAuthenticated(true);
  const logout = () => { sessionStorage.removeItem(storageKey); setAuthenticated(false); };

  return { authenticated, login, logout };
}
