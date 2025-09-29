import React, { useState, useEffect } from 'react';
import { FaTrash, FaUndo, FaSearch, FaUser, FaCalendarAlt, FaFileAlt, FaExclamationTriangle } from 'react-icons/fa';
import { MdRestore, MdDeleteForever } from 'react-icons/md';
import { mostrarConfirmacion, mostrarExito, mostrarError } from '../utils/alertas';

function Papeleria() {
  const [registrosEliminados, setRegistrosEliminados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  useEffect(() => {
    cargarRegistrosEliminados();
  }, []);

  const cargarRegistrosEliminados = async () => {
    try {
      setCargando(true);

      // Cargar registros eliminados desde la base de datos:
      const response = await window.electronAPI?.registros.obtenerBorrados();
      if (response && response.success) {
        setRegistrosEliminados(response.registros || []);
      } else {
        setRegistrosEliminados([]);
        if (response && response.error) {
          mostrarError('Error al cargar registros eliminados', response.error);
        }
      }
      setCargando(false);
    } catch (error) {
      mostrarError('Error de conexión', 'No se pudieron cargar los registros eliminados');
      console.error('Error cargando registros eliminados:', error);
      setCargando(false);
    }
  };

  const registrosFiltrados = registrosEliminados.filter(registro =>
    registro.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
    registro.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
    registro.dni.includes(busqueda) ||
    registro.expediente.toLowerCase().includes(busqueda.toLowerCase()) ||
    (registro.expediente || registro.codigo || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPaginas = Math.ceil(registrosFiltrados.length / registrosPorPagina);
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const registrosPaginados = registrosFiltrados.slice(indiceInicio, indiceInicio + registrosPorPagina);

  const restaurarRegistro = async (registro) => {
    const confirmado = await mostrarConfirmacion({
      titulo: '¿Restaurar registro?',
      texto: `Se restaurará el registro de ${registro.nombres} ${registro.apellidos}`,
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmado) {
      setTimeout(() => {
        setRegistrosEliminados(prev => prev.filter(r => r.id !== registro.id));
        mostrarExito('Registro restaurado correctamente');
      }, 500);
    }
  };

  const eliminarDefinitivamente = async (registro) => {
    const confirmado = await mostrarConfirmacion({
      titulo: '¿Eliminar definitivamente?',
      texto: `Se eliminará permanentemente el registro de ${registro.nombres} ${registro.apellidos}. Esta acción NO se puede deshacer.`,
      confirmButtonText: 'Sí, eliminar definitivamente',
      cancelButtonText: 'Cancelar'
    });

    if (confirmado) {
      setTimeout(() => {
        setRegistrosEliminados(prev => prev.filter(r => r.id !== registro.id));
        mostrarExito('Registro eliminado definitivamente');
      }, 500);
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-red-700">Papelería de Reciclaje</h1>
          <p className="text-gray-600 mt-1">
            Registros eliminados del sistema - pueden ser restaurados o eliminados definitivamente
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Registros Eliminados</p>
              <p className="text-2xl font-bold text-red-600">{registrosEliminados.length}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <FaTrash className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Esta Semana</p>
              <p className="text-2xl font-bold text-orange-600">
                {registrosEliminados.filter(r => {
                  const fechaEliminacion = new Date(r.fecha_eliminacion);
                  const haceUnaSemana = new Date();
                  haceUnaSemana.setDate(haceUnaSemana.getDate() - 7);
                  return fechaEliminacion > haceUnaSemana;
                }).length}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <FaCalendarAlt className="text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recuperables</p>
              <p className="text-2xl font-bold text-green-600">{registrosEliminados.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <MdRestore className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="relative max-w-md">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Buscar en registros eliminados..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-full"
          />
        </div>
      </div>

      {/* Tabla de registros eliminados */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-red-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                  Persona
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                  Expediente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                  Eliminado por
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                  Fecha Eliminación
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-red-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {registrosPaginados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <FaTrash className="mx-auto text-4xl text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {registrosEliminados.length === 0 ? 'Papelería vacía' : 'No se encontraron registros'}
                    </h3>
                    <p className="text-gray-600">
                      {registrosEliminados.length === 0
                        ? 'No hay registros eliminados en el sistema'
                        : 'Intenta con diferentes términos de búsqueda'
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                registrosPaginados.map((registro) => (
                  <tr key={registro.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <FaUser className="text-red-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {registro.nombres} {registro.apellidos}
                          </div>
                          <div className="text-sm text-gray-500">
                            DNI: {registro.dni}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-900">
                        {registro.expediente}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {registro.estado || '---'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{registro.eliminado_por}</div>
                      {registro.motivo && (
                        <div className="text-xs text-gray-500">Motivo: {registro.motivo}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(registro.fecha_eliminacion).toLocaleDateString()}
                      <div className="text-xs text-gray-400">
                        {new Date(registro.fecha_eliminacion).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => restaurarRegistro(registro)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Restaurar registro"
                        >
                          <FaUndo className="text-sm" />
                        </button>
                        <button
                          onClick={() => eliminarDefinitivamente(registro)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Eliminar definitivamente"
                        >
                          <MdDeleteForever className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {indiceInicio + 1} a {Math.min(indiceInicio + registrosPorPagina, registrosFiltrados.length)} de {registrosFiltrados.length} registros
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Anterior
            </button>
            <span className="px-3 py-2 text-sm text-gray-600">
              {paginaActual} / {totalPaginas}
            </span>
            <button
              onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Advertencia */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FaExclamationTriangle className="text-red-600 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-medium mb-1">Advertencia importante</p>
            <ul className="space-y-1">
              <li>• Los registros eliminados pueden ser restaurados al sistema principal</li>
              <li>• La eliminación definitiva es <strong>irreversible</strong></li>
              <li>• Se recomienda crear un backup antes de eliminar definitivamente</li>
              <li>• Los registros aquí mostrados son de la vista legacy del sistema</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Papeleria;