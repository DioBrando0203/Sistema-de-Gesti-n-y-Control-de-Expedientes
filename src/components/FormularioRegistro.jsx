import React, { useState } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import { mostrarExito, mostrarError } from '../utils/alertas';

function FormularioRegistro({ mostrar, onCerrar, onRegistroCreado, registroEditar = null }) {
  const [formData, setFormData] = useState({
    nombre: registroEditar?.nombre || '',
    dni: registroEditar?.dni || '',
    numero: registroEditar?.numero || '',
    expediente: registroEditar?.expediente || '',
    estado: registroEditar?.estado || 'Recibido',
    fecha_registro: registroEditar?.fecha_registro || new Date().toISOString().split('T')[0],
    fecha_en_caja: registroEditar?.fecha_en_caja || ''
  });

  const [guardando, setGuardando] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      let response;

      if (registroEditar) {
        // Actualizar registro existente
        response = await window.electronAPI?.registros.actualizar({
          ...formData,
          id: registroEditar.id,
          persona_id: registroEditar.persona_id,
          expediente_id: registroEditar.expediente_id
        });
      } else {
        // Crear nuevo registro
        response = await window.electronAPI?.registros.agregar({
          ...formData,
          proyecto_id: 1, // Proyecto por defecto
          usuario_creador_id: 1 // Usuario por defecto
        });
      }

      console.log('Respuesta del servidor:', response);

      if (response && (response.success || response.registro)) {
        mostrarExito(registroEditar ? 'Registro actualizado correctamente' : 'Registro creado correctamente');
        onRegistroCreado && onRegistroCreado();
        onCerrar();

        // Limpiar formulario si es nuevo registro
        if (!registroEditar) {
          setFormData({
            nombre: '',
            dni: '',
            numero: '',
            expediente: '',
            estado: 'Recibido',
            fecha_registro: new Date().toISOString().split('T')[0],
            fecha_en_caja: ''
          });
        }
      } else {
        mostrarError('Error', response?.error || 'No se pudo guardar el registro');
      }
    } catch (error) {
      console.error('Error guardando registro:', error);
      mostrarError('Error', 'No se pudo guardar el registro');
    } finally {
      setGuardando(false);
    }
  };

  if (!mostrar) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {registroEditar ? 'Editar Registro' : 'Nuevo Registro'}
          </h3>
          <button
            onClick={onCerrar}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese el nombre completo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DNI
              </label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleInputChange}
                maxLength="8"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="12345678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número
              </label>
              <input
                type="text"
                name="numero"
                value={formData.numero}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Número"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expediente
            </label>
            <input
              type="text"
              name="expediente"
              value={formData.expediente}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Número de expediente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Recibido">Recibido</option>
              <option value="En Caja">En Caja</option>
              <option value="Entregado">Entregado</option>
              <option value="Tesoreria">Tesorería</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de registro
              </label>
              <input
                type="date"
                name="fecha_registro"
                value={formData.fecha_registro}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha en caja
              </label>
              <input
                type="date"
                name="fecha_en_caja"
                value={formData.fecha_en_caja}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <FaSave className="text-sm" />
              <span>{guardando ? 'Guardando...' : (registroEditar ? 'Actualizar' : 'Crear')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FormularioRegistro;