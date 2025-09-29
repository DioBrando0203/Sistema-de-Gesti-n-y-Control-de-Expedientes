// src/main/models/PersonaModel.js
const BaseModel = require('./BaseModel');

class PersonaModel extends BaseModel {
  // Crear nueva persona
  async crear(nombre, dni, numero) {
    return this.executeRun(
      "INSERT INTO personas (nombre, dni, numero) VALUES (?, ?, ?)",
      [nombre, dni, numero]
    );
  }

  // Buscar persona por DNI
  async buscarPorDni(dni) {
    return this.executeGet(
      "SELECT * FROM personas WHERE dni = ?",
      [dni]
    );
  }

  // Buscar persona por ID
  async buscarPorId(id) {
    return this.executeGet(
      "SELECT * FROM personas WHERE id = ?",
      [id]
    );
  }

  // Actualizar datos de persona
  async actualizar(id, datos) {
    const { nombre, numero, dni } = datos;
    return this.executeRun(
      "UPDATE personas SET nombre = ?, numero = ?, dni = ? WHERE id = ?",
      [nombre, numero, dni, id]
    );
  }

  // Obtener todas las personas
  async obtenerTodas() {
    return this.executeQuery(
      "SELECT * FROM personas ORDER BY nombre ASC"
    );
  }

  // Verificar si DNI ya existe
  async dniExiste(dni, excludeId = null) {
    let query = "SELECT id FROM personas WHERE dni = ?";
    let params = [dni];

    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }

    const result = await this.executeGet(query, params);
    return !!result;
  }

  // Eliminar persona (solo si no tiene registros)
  async eliminar(id) {
    // Verificar si tiene registros asociados
    const tieneRegistros = await this.contar("registros", "persona_id = ?", [id]);
    
    if (tieneRegistros > 0) {
      throw new Error("No se puede eliminar la persona porque tiene registros asociados");
    }

    const result = await this.executeRun(
      "DELETE FROM personas WHERE id = ?",
      [id]
    );

    if (result.changes === 0) {
      throw new Error("Persona no encontrada");
    }

    return { success: true };
  }

  // Buscar personas por nombre (búsqueda parcial)
  async buscarPorNombre(nombre) {
    return this.executeQuery(
      "SELECT * FROM personas WHERE nombre LIKE ? ORDER BY nombre ASC",
      [`%${nombre}%`]
    );
  }

  // Obtener estadísticas de personas
  async obtenerEstadisticas() {
    const total = await this.contar("personas");
    const conRegistros = await this.executeGet(`
      SELECT COUNT(DISTINCT persona_id) as total
      FROM registros 
      WHERE eliminado = 0
    `);

    return {
      total,
      conRegistros: conRegistros.total,
      sinRegistros: total - conRegistros.total
    };
  }
}

module.exports = PersonaModel;