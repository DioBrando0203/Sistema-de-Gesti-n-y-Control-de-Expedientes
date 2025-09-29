// src/main/models/ExpedienteModel.js
const BaseModel = require('./BaseModel');

class ExpedienteModel extends BaseModel {
  // Crear nuevo expediente
  async crear(personaId, codigo, fechaSolicitud = null, fechaEntrega = null, observacion = null) {
    return this.executeRun(
      `INSERT INTO expedientes (persona_id, codigo, fecha_solicitud, fecha_entrega, observacion) 
       VALUES (?, NULLIF(?, ''), ?, ?, ?)`,
      [personaId, codigo, fechaSolicitud, fechaEntrega, observacion]
    );
  }

  // Buscar expediente por código
  async buscarPorCodigo(codigo) {
    return this.executeGet(
      "SELECT * FROM expedientes WHERE codigo = ?",
      [codigo]
    );
  }

  // Buscar expediente por ID
  async buscarPorId(id) {
    return this.executeGet(
      "SELECT * FROM expedientes WHERE id = ?",
      [id]
    );
  }

  // Actualizar expediente
  async actualizar(id, datos) {
    const { codigo, fechaSolicitud, fechaEntrega, observacion } = datos;
    return this.executeRun(
      `UPDATE expedientes 
       SET codigo = NULLIF(?, ''), fecha_solicitud = ?, fecha_entrega = ?, observacion = ?
       WHERE id = ?`,
      [codigo, fechaSolicitud, fechaEntrega, observacion, id]
    );
  }

  // Actualizar información específica (para vista de información)
  async actualizarInformacion(id, datos) {
    const { observacion, fechaSolicitud, fechaEntrega } = datos;
    return this.executeRun(
      `UPDATE expedientes
       SET observacion = ?, fecha_solicitud = ?, fecha_entrega = ?
       WHERE id = ?`,
      [observacion || null, fechaSolicitud || null, fechaEntrega || null, id]
    );
  }

  // Obtener expedientes por persona
  async obtenerPorPersona(personaId) {
    return this.executeQuery(
      `SELECT e.*, p.nombre, p.dni 
       FROM expedientes e
       JOIN personas p ON e.persona_id = p.id
       WHERE e.persona_id = ?
       ORDER BY e.id DESC`,
      [personaId]
    );
  }

  // Obtener todos los expedientes con información de persona
  async obtenerTodos() {
    return this.executeQuery(
      `SELECT e.*, p.nombre, p.dni, p.numero
       FROM expedientes e
       JOIN personas p ON e.persona_id = p.id
       ORDER BY e.id DESC`
    );
  }

  // Verificar si código ya existe
  async codigoExiste(codigo, excludeId = null) {
    if (!codigo || codigo.trim() === '') {
      return false;
    }

    let query = "SELECT id FROM expedientes WHERE codigo = ?";
    let params = [codigo];

    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }

    const result = await this.executeGet(query, params);
    return !!result;
  }

  // Eliminar expediente (solo si no tiene registros)
  async eliminar(id) {
    // Verificar si tiene registros asociados
    const tieneRegistros = await this.contar("registros", "expediente_id = ?", [id]);
    
    if (tieneRegistros > 0) {
      throw new Error("No se puede eliminar el expediente porque tiene registros asociados");
    }

    const result = await this.executeRun(
      "DELETE FROM expedientes WHERE id = ?",
      [id]
    );

    if (result.changes === 0) {
      throw new Error("Expediente no encontrado");
    }

    return { success: true };
  }

  // Buscar expedientes por rango de fechas
  async buscarPorFecha(fechaInicio, fechaFin, tipofecha = 'solicitud') {
    const campoFecha = tipofecha === 'entrega' ? 'fecha_entrega' : 'fecha_solicitud';
    
    return this.executeQuery(
      `SELECT e.*, p.nombre, p.dni
       FROM expedientes e
       JOIN personas p ON e.persona_id = p.id
       WHERE ${campoFecha} BETWEEN ? AND ?
       ORDER BY ${campoFecha} DESC`,
      [fechaInicio, fechaFin]
    );
  }

  // Obtener expedientes entregados
  async obtenerEntregados() {
    return this.executeQuery(
      `SELECT e.*, p.nombre, p.dni
       FROM expedientes e
       JOIN personas p ON e.persona_id = p.id
       WHERE e.fecha_entrega IS NOT NULL
       ORDER BY e.fecha_entrega DESC`
    );
  }

  // Obtener expedientes pendientes de entrega
  async obtenerPendientes() {
    return this.executeQuery(
      `SELECT e.*, p.nombre, p.dni
       FROM expedientes e
       JOIN personas p ON e.persona_id = p.id
       WHERE e.fecha_entrega IS NULL
       ORDER BY e.fecha_solicitud ASC`
    );
  }

  // Marcar como entregado
  async marcarComoEntregado(id, fechaEntrega = null) {
    const fecha = fechaEntrega || this.getFechaLocal();
    
    return this.executeRun(
      "UPDATE expedientes SET fecha_entrega = ? WHERE id = ?",
      [fecha, id]
    );
  }

  // Obtener estadísticas de expedientes
  async obtenerEstadisticas() {
    const total = await this.contar("expedientes");
    const entregados = await this.contar("expedientes", "fecha_entrega IS NOT NULL");
    const pendientes = total - entregados;

    // Estadísticas por año
    const porAnio = await this.executeQuery(`
      SELECT 
        strftime('%Y', fecha_solicitud) as anio,
        COUNT(*) as total
      FROM expedientes 
      WHERE fecha_solicitud IS NOT NULL
      GROUP BY strftime('%Y', fecha_solicitud)
      ORDER BY anio DESC
    `);

    return {
      total,
      entregados,
      pendientes,
      porAnio
    };
  }

  getFechaLocal() {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }
}

module.exports = ExpedienteModel;