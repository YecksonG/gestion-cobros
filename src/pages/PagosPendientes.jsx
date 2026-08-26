import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { GAS_SCRIPT_URL } from '../services/api';
import { LISTA_INMUEBLES as INMUEBLES } from '../config/inmuebles';

function PagosPendientes() {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [inmueble, setInmueble] = useState('');
  const [clientesDisponibles, setClientesDisponibles] = useState([]);
  const [mesesData, setMesesData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [filtroInmueble, setFiltroInmueble] = useState('');
  const [procesandoDarDeBaja, setProcesandoDarDeBaja] = useState(false);

  // Cargar clientes disponibles
  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const response = await axios.get(`${GAS_SCRIPT_URL}?action=getInquilinos`);

        // Filtro: descartar vacíos e inactivos
        const clientesValidos = (response.data || []).filter(
          (cliente) =>
            cliente.nombre &&
            typeof cliente.nombre === 'string' &&
            cliente.nombre.trim() !== '' &&
            cliente.status !== 'Inactivo' &&
            cliente.status !== 'Para Dar de Baja'
        );

        // Filtrar por inmueble si está seleccionado
        const filtrados = filtroInmueble
          ? clientesValidos.filter(c => c.inmueble === filtroInmueble)
          : clientesValidos;

        setClientesDisponibles(filtrados);
      } catch (error) {
        console.error('Error cargando clientes:', error);
        toast.error('❌ Error cargando clientes');
      }
    };

    cargarClientes();
  }, [filtroInmueble]);

  // Cargar meses pendientes cuando se selecciona cliente
  const handleSeleccionarCliente = async (nombreCliente, inmuebleCliente) => {
    setCliente(nombreCliente);
    setInmueble(inmuebleCliente);
    setCargando(true);

    try {
      const response = await axios.get(
        `${GAS_SCRIPT_URL}?action=getMesesPendientes&nombre=${encodeURIComponent(nombreCliente)}&inmueble=${encodeURIComponent(inmuebleCliente)}`
      );

      if (response.data.success) {
        setMesesData(response.data);
      } else {
        toast.error('❌ Error cargando meses pendientes');
        setMesesData(null);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('❌ Error cargando meses pendientes');
      setMesesData(null);
    } finally {
      setCargando(false);
    }
  };

  // Navegar a Registro de Cobros para pagar un mes específico
  const irARegistroCobros = (mesCobro) => {
    navigate('/cobros', {
      state: {
        cliente: cliente,
        inmueble: inmueble,
        mesCobro: mesCobro
      }
    });
  };

  // Dar de baja al cliente
  const darDeBajaCliente = async () => {
    setProcesandoDarDeBaja(true);
    try {
      const response = await axios.post(GAS_SCRIPT_URL, JSON.stringify({
        action: 'cambiarStatusCliente',
        nombre: cliente,
        inmueble: inmueble,
        nuevoStatus: 'Para Dar de Baja'
      }), {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });

      if (response.data.success) {
        toast.success(`✅ ${cliente} ha sido marcado como "Para Dar de Baja"`);
        // Recargar datos
        setTimeout(() => {
          handleSeleccionarCliente(cliente, inmueble);
        }, 500);
      } else {
        toast.error(`❌ ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('❌ Error al cambiar status');
    } finally {
      setProcesandoDarDeBaja(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ENCABEZADO */}
      <div className="bg-gradient-to-r from-terra-copper to-terra-navy text-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-2">📅 Pagos Pendientes por Mes</h1>
        <p className="text-sm opacity-90">Visualiza qué meses faltan por registrar pagos para cada cliente</p>
      </div>

      {/* FILTRO POR INMUEBLE */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Filtrar por Inmueble</label>
        <select
          value={filtroInmueble}
          onChange={(e) => {
            setFiltroInmueble(e.target.value);
            setCliente(null);
            setMesesData(null);
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terra-copper focus:border-transparent"
        >
          <option value="">Todos los inmuebles</option>
          {INMUEBLES.map((imm) => (
            <option key={imm} value={imm}>
              {imm}
            </option>
          ))}
        </select>
      </div>

      {/* SELECTOR DE CLIENTE */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Seleccionar Cliente</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {clientesDisponibles.length > 0 ? (
            clientesDisponibles.map((cli) => (
              <button
                key={`${cli.nombre}-${cli.inmueble}`}
                onClick={() => handleSeleccionarCliente(cli.nombre, cli.inmueble)}
                className={`p-4 rounded-lg border-2 text-left transition ${
                  cliente === cli.nombre && inmueble === cli.inmueble
                    ? 'border-terra-copper bg-terra-copper/10'
                    : 'border-gray-200 hover:border-terra-copper'
                }`}
              >
                <p className="font-bold text-gray-900">{cli.nombre}</p>
                <p className="text-xs text-gray-500">{cli.inmueble} • {cli.cedula}</p>
              </button>
            ))
          ) : (
            <p className="text-gray-500 text-center col-span-2">No hay clientes disponibles</p>
          )}
        </div>
      </div>

      {/* MESES PENDIENTES */}
      {cargando && (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-12 h-12 border-4 border-terra-copper border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-medium animate-pulse">Cargando datos...</p>
        </div>
      )}

      {mesesData && !cargando && (
        <div className="space-y-6">
          {/* ALERTA CRÍTICA: Desactivación */}
          {mesesData.alertaDesactivacion && (
            <div className="bg-red-100 border-l-4 border-red-600 p-6 rounded-lg">
              <p className="text-red-900 font-bold text-lg">🚨 {mesesData.alertaDesactivacion}</p>
              <p className="text-red-800 mt-2">
                Días sin pagar: {mesesData.estadoCliente.diasUltimoPago}.
                Este cliente debe ser DESACTIVADO y RETIRADO del inmueble inmediatamente.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={darDeBajaCliente}
                  disabled={procesandoDarDeBaja}
                  className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {procesandoDarDeBaja ? '⏳ Procesando...' : '🚫 Dar de Baja Inmediatamente'}
                </button>
              </div>
            </div>
          )}

          {/* RESUMEN FINANCIERO */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm text-gray-500 font-semibold uppercase">Total de Meses</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{mesesData.totalMeses}</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
              <p className="text-sm text-gray-500 font-semibold uppercase">Meses Pagados</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {mesesData.totalMeses - mesesData.totalMesesPendientes}
              </p>
            </div>
            <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
              <p className="text-sm text-gray-500 font-semibold uppercase">Meses Pendientes</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{mesesData.totalMesesPendientes}</p>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
              <p className="text-sm text-gray-500 font-semibold uppercase">Mora Acumulada</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                ${mesesData.moraTotalAcumulada.toFixed(2)}
              </p>
            </div>
          </div>

          {/* DEUDA TOTAL */}
          <div className="bg-gradient-to-r from-red-100 to-orange-100 border-l-4 border-red-600 p-6 rounded-lg">
            <h3 className="font-bold text-lg text-red-900 mb-3">💰 DEUDA TOTAL ACUMULADA</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-red-700">Canon Adeudado</p>
                <p className="text-2xl font-bold text-red-900">${mesesData.canonAdeudado.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-orange-700">Mora Acumulada</p>
                <p className="text-2xl font-bold text-orange-900">${mesesData.moraTotalAcumulada.toFixed(2)}</p>
              </div>
              <div className="border-l-2 border-red-300 pl-4">
                <p className="text-sm text-red-700 font-semibold">TOTAL A PAGAR</p>
                <p className="text-3xl font-bold text-red-900">${mesesData.totalAdeudado.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* TABLA DE MESES */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-800">
                📋 {mesesData.cliente} • {mesesData.inmueble}
              </h3>
            </div>

            <div className="divide-y divide-gray-100">
              {mesesData.meses.length > 0 ? (
                mesesData.meses.map((mes, idx) => (
                  <div
                    key={idx}
                    className={`p-4 flex items-center justify-between hover:bg-gray-50 transition ${
                      mes.pagado ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          mes.pagado ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      >
                        {mes.pagado ? '✅' : '⏳'}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{mes.mes}</p>
                        <p className="text-xs text-gray-500">
                          {mes.pagado ? 'Pagado' : `${mes.diasRetraso} días de retraso`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right mr-4">
                      {(() => {
                        const canonMes = mesesData.totalMesesPendientes > 0
                          ? mesesData.canonAdeudado / mesesData.totalMesesPendientes
                          : 0;
                        return (
                          <>
                            <p className="font-semibold text-gray-800">Canon: ${canonMes.toFixed(2)}</p>
                            {!mes.pagado && mes.mora > 0 && (
                              <p className="text-sm font-bold text-red-600">
                                Mora: ${mes.mora.toFixed(2)} ({mes.diasRetraso} días × $3)
                              </p>
                            )}
                            {!mes.pagado && (
                              <p className="text-xs text-gray-600 mt-1">
                                Total: ${(canonMes + mes.mora).toFixed(2)}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {!mes.pagado && (
                      <button
                        onClick={() => irARegistroCobros(mes.mes)}
                        className="ml-4 px-4 py-2 bg-terra-copper text-white rounded-lg font-semibold hover:bg-terra-copper-dark transition whitespace-nowrap"
                      >
                        Pagar
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="p-6 text-center text-gray-500">No hay información de meses</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!cliente && !cargando && (
        <div className="text-center p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">👆 Selecciona un cliente para visualizar sus pagos pendientes</p>
        </div>
      )}
    </div>
  );
}

export default PagosPendientes;
