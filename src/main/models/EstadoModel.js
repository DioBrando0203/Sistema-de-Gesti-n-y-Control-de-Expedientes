// src/main/models/EstadoModel.js
const BaseModel = require('./BaseModel');

class EstadoModel extends BaseModel {
  // Obtener todos los estados
  async obtenerTodos() {
    return this.executeQuery(
      "SELECT * FROM estados ORDER BY id ASC"
    );
  }

  // Buscar estado por nombre
  async buscarPorNombre(nombre) {
    return this.executeGet(
      "SELECT * FROM estados WHERE nombre = ?",
      [nombre]
    );
  }

  // Buscar estado por ID
  async buscarPorId(id) {
    return this.executeGet(
      "SELECT * FROM estados WHERE id = ?",
      [id]
    );
  }

  // Obtener ID de estado por nombre (método utilitario)
  async obtenerIdPorNombre(nombre) {
    const estado = await this.buscarPorNombre(nombre);
    return estado ? estado.id : null;
  }

  // Crear nuevo estado
  async crear(nombre) {
    // Verificar si ya existe
    const existe = await this.buscarPorNombre(nombre);
    if (existe) {
      throw new Error("El estado ya existe");
    }

    return this.executeRun(
      "INSERT INTO estados (nombre) VALUES (?)",
      [nombre]
    );
  }

  // Actualizar estado
  async actualizar(id, nombre) {
    // Verificar que no exista otro con el mismo nombre
    const existe = await this.executeGet(
      "SELECT id FROM estados WHERE nombre = ? AND id != ?",
      [nombre, id]
    );

    if (existe) {
      throw new Error("Ya existe otro estado con ese nombre");
    }

    const result = await this.executeRun(
      "UPDATE estados SET nombre = ? WHERE id = ?",
      [nombre, id]
    );

    if (result.changes === 0) {
      throw new Error("Estado no encontrado");
    }

    return { success: true };
  }

  // Eliminar estado (solo si no tiene registros asociados)
  async eliminar(id) {
    // Verificar si tiene registros asociados
    const tieneRegistros = await this.contar("registros", "estado_id = ?", [id]);
    
    if (tieneRegistros > 0) {
      throw new Error("No se puede eliminar el estado porque tiene registros asociados");
    }

    const result = await this.executeRun(
      "DELETE FROM estados WHERE id = ?",
      [id]
    );

    if (result.changes === 0) {
      throw new Error("Estado no encontrado");
    }

    return { success: true };
  }

  // Obtener estadísticas por estado
  async obtenerEstadisticas() {
    return this.executeQuery(`
      SELECT 
        e.nombre,
        COUNT(r.id) as total_registros,
        COUNT(CASE WHEN r.eliminado = 0 THEN 1 END) as activos,
        COUNT(CASE WHEN r.eliminado = 1 THEN 1 END) as eliminados
      FROM estados e
      LEFT JOIN registros r ON r.estado_id = e.id
      GROUP BY e.id, e.nombre
      ORDER BY e.id ASC
    `);
  }

  // Inicializar estados por defecto
  async inicializarEstadosDefecto() {
    const estadosDefecto = ['Recibido', 'En Caja', 'Entregado', 'Tesoreria'];
    
    for (const estado of estadosDefecto) {
      const existe = await this.buscarPorNombre(estado);
      if (!existe) {
        await this.executeRun(
          "INSERT OR IGNORE INTO estados (nombre) VALUES (?)",
          [estado]
        );
      }
    }
  }
}

module.exports = EstadoModel;