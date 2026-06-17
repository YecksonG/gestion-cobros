import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AgendaCobros from './pages/AgendaCobros';
import Bienvenida from './pages/Bienvenida';
import Dashboard from './pages/Dashboard';
import Inquilinos from './pages/Inquilinos';
import RegistroCobros from './pages/RegistroCobros';
import HistorialCambios from './pages/HistorialCambios';
import HistorialPagos from './pages/HistorialPagos';
import TasasMonitor from './pages/TasasMonitor';
import AgregarCliente from './pages/AgregarCliente';
import EditarCliente from './pages/EditarCliente';
import Usuarios from './pages/Usuarios';
import Legal from './pages/Legal';
import InquilinoDetalle from './pages/InquilinoDetalle';
import EditarClienteDetalle from './pages/EditarClienteDetalle';

function App() {
  return (
    <>
      <Toaster position="bottom-right" />
      <BrowserRouter>
      <Routes>

        {/* Ruta pública: Login */}
        <Route path="/login" element={<Login />} />

        {/* Ruta 1: Panel de Bienvenida (Home) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Bienvenida />
            </ProtectedRoute>
          }
        />

        {/* Ruta 1b: Agenda de Cobros */}
        <Route
          path="/agenda"
          element={
            <ProtectedRoute>
              <Layout title="Agenda de Cobros" subtitle="Visualiza y gestiona los cobros del mes">
                <AgendaCobros />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Ruta 2: Dashboard Administrativo (protegido por PIN) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout title="Dashboard Administrativo" subtitle="Métricas financieras — Acceso restringido">
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Ruta 3: Inquilinos */}
        <Route
          path="/inquilinos"
          element={
            <ProtectedRoute>
              <Layout title="Gestión de Inquilinos" subtitle="Directorio y control de arrendatarios">
                <Inquilinos />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Ruta 4: Registro de Cobros */}
        <Route
          path="/cobros"
          element={
            <ProtectedRoute>
              <Layout title="Registro de Cobros" subtitle="Ingreso manual de pagos y transferencias">
                <RegistroCobros />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Ruta 5: Historial de Cambios (protegido por PIN) */}
        <Route
          path="/historial"
          element={
            <ProtectedRoute>
              <Layout title="Historial Completo de Cambios" subtitle="Auditoría del sistema — Acceso protegido">
                <HistorialCambios />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Ruta 5b: Historial de Pagos */}
        <Route
          path="/historial-pagos"
          element={
            <ProtectedRoute>
              <Layout title="Historial de Pagos" subtitle="Registro completo de transacciones y cobros">
                <HistorialPagos />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Ruta 6: Monitor de Tasas BCV */}
        <Route
          path="/tasas"
          element={
            <ProtectedRoute>
              <Layout title="Monitor de Tasas BCV" subtitle="Control y actualización de tasas de cambio">
                <TasasMonitor />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Ruta 7: Agregar Cliente */}
        <Route
          path="/agregar-cliente"
          element={
            <ProtectedRoute>
              <Layout title="Agregar Nuevo Cliente" subtitle="Registro de nuevo arrendatario y datos del contrato">
                <AgregarCliente />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Ruta 8: Editar Cliente */}
        <Route
          path="/editar-cliente"
          element={
            <ProtectedRoute>
              <Layout title="Editar Cliente" subtitle="Actualización de datos del arrendatario">
                <EditarCliente />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Ruta 9: Gestión de Usuarios (solo admin) */}
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute>
              <Layout title="Gestión de Usuarios" subtitle="Administrar accesos al sistema — Solo Admin">
                <Usuarios />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Ruta 10: Departamento Legal (admin + legal) */}
        <Route
          path="/legal"
          element={
            <ProtectedRoute>
              <Layout title="Departamento Legal" subtitle="Expedientes, casos activos y archivo digital">
                <Legal />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Ruta 11: Detalle de Inquilino (admin + gestor + legal) */}
        <Route
          path="/inquilinos/:inmueble/:nombre"
          element={
            <ProtectedRoute>
              <Layout title="Expediente de Inquilino" subtitle="Datos completos, pagos y contrato">
                <InquilinoDetalle />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Ruta 12: Editar Cliente (página dedicada) */}
        <Route
          path="/editar-cliente/:inmueble/:nombre"
          element={
            <ProtectedRoute>
              <Layout title="Editar Cliente" subtitle="Modificar datos del arrendatario">
                <EditarClienteDetalle />
              </Layout>
            </ProtectedRoute>
          }
        />

      </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
