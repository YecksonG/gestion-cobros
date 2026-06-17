import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLES_POR_RUTA } from '../config/permisos';

function ProtectedRoute({ children }) {
  const { autenticado, usuario } = useAuth();
  const location = useLocation();

  if (!autenticado) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Soporte para rutas dinámicas: heredan permisos de su ruta base
  let routeKey = location.pathname;
  if (location.pathname.startsWith('/inquilinos/')) routeKey = '/inquilinos';
  else if (location.pathname.startsWith('/editar-cliente/')) routeKey = '/editar-cliente';
  const rolesPermitidos = ROLES_POR_RUTA[routeKey];
  if (rolesPermitidos && !rolesPermitidos.includes(usuario?.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
