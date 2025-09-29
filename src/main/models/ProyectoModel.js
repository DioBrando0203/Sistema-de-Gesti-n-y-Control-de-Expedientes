const BaseModel = require('./BaseModel');

class ProyectoModel extends BaseModel {
  constructor(db) {
    super(db);
  }

  // Crear nuevo proyecto
  async crear(datos) {
    const { nombre, descripcion, usuario_creador_id, es_publico = 0, permite_edicion = 1 } = datos;

    const sql = `
      INSERT INTO proyectos_registros (nombre, descripcion, usuario_creador_id, es_publico, permite_edicion)
      VALUES (?, ?, ?, ?, ?)
    `;

    try {
      const result = await this.executeRun(sql, [nombre, descripcion, usuario_creador_id, es_publico, permite_edicion]);
      return result.lastID;
    } catch (error) {
      throw new Error('Error al crear proyecto: ' + error.message);
    }
  }

  // Obtener proyecto por ID
  async obtenerPorId(id) {
    const sql = `
      SELECT p.*, u.nombre as nombre_creador
      FROM proyectos_registros p
      LEFT JOIN usuarios u ON p.usuario_creador_id = u.id
      WHERE p.id = ? AND p.activo = 1
    `;
    return await this.executeGet(sql, [id]);
  }

  // Listar proyectos por usuario (solo sus propios proyectos)
  async listarPorUsuario(usuarioId) {
    const sql = `
      SELECT p.*, u.nombre as nombre_creador,
        (SELECT COUNT(*) FROM registros r WHERE r.proyecto_id = p.id AND r.eliminado = 0) as total_registros
      FROM proyectos_registros p
      LEFT JOIN usuarios u ON p.usuario_creador_id = u.id
      WHERE p.usuario_creador_id = ? AND p.activo = 1
      ORDER BY p.fecha_creacion DESC
    `;
    return await this.executeQuery(sql, [usuarioId]);
  }

  // Listar proyectos accesibles por usuario (propios + públicos)
  async listarAccesiblesPorUsuario(usuarioId) {
    const sql = `
      SELECT p.*, u.nombre as nombre_creador,
        (SELECT COUNT(*) FROM registros r WHERE r.proyecto_id = p.id AND r.eliminado = 0) as total_registros,
        CASE
          WHEN p.usuario_creador_id = ? THEN 'propio'
          ELSE 'publico'
        END as tipo_acceso
      FROM proyectos_registros p
      LEFT JOIN usuarios u ON p.usuario_creador_id = u.id
      WHERE p.activo = 1 AND (p.usuario_creador_id = ? OR p.es_publico = 1)
      ORDER BY
        CASE WHEN p.usuario_creador_id = ? THEN 0 ELSE 1 END,
        p.fecha_creacion DESC
    `;
    return await this.executeQuery(sql, [usuarioId, usuarioId, usuarioId]);
  }

  // Listar proyectos públicos
  async listarPublicos() {
    const sql = `
      SELECT p.*, u.nombre as nombre_creador,
        (SELECT COUNT(*) FROM registros r WHERE r.proyecto_id = p.id AND r.eliminado = 0) as total_registros
      FROM proyectos_registros p
      LEFT JOIN usuarios u ON p.usuario_creador_id = u.id
      WHERE p.es_publico = 1 AND p.activo = 1
      ORDER BY p.fecha_publicacion DESC, p.fecha_creacion DESC
    `;
    return await this.executeQuery(sql);
  }

  // Listar todos los proyectos (solo admin)
  async listarTodos() {
    const sql = `
      SELECT p.*, u.nombre as nombre_creador,
        (SELECT COUNT(*) FROM registros r WHERE r.proyecto_id = p.id AND r.eliminado = 0) as total_registros
      FROM proyectos_registros p
      LEFT JOIN usuarios u ON p.usuario_creador_id = u.id
      WHERE p.activo = 1
      ORDER BY p.fecha_creacion DESC
    `;
    return await this.executeQuery(sql);
  }

  // Actualizar proyecto
  async actualizar(id, datos, usuarioId) {
    // Verificar que el usuario sea el creador o admin
    const proyecto = await this.obtenerPorId(id);
    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    const camposPermitidos = ['nombre', 'descripcion', 'permite_edicion'];
    const campos = [];
    const valores = [];

    for (const [key, value] of Object.entries(datos)) {
      if (camposPermitidos.includes(key)) {
        campos.push(`${key} = ?`);
        valores.push(value);
      }
    }

    if (campos.length === 0) {
      throw new Error('No hay campos válidos para actualizar');
    }

    valores.push(id);
    const sql = `UPDATE proyectos_registros SET ${campos.join(', ')} WHERE id = ?`;

    await this.executeRun(sql, valores);
    return await this.obtenerPorId(id);
  }

  // Hacer público un proyecto
  async hacerPublico(id, usuarioId) {
    const proyecto = await this.obtenerPorId(id);
    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    if (proyecto.usuario_creador_id !== usuarioId) {
      throw new Error('Solo el creador puede hacer público el proyecto');
    }

    const sql = `
      UPDATE proyectos_registros
      SET es_publico = 1, fecha_publicacion = datetime('now')
      WHERE id = ?
    `;

    await this.executeRun(sql, [id]);
    return await this.obtenerPorId(id);
  }

  // Hacer privado un proyecto
  async hacerPrivado(id, usuarioId) {
    const proyecto = await this.obtenerPorId(id);
    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    if (proyecto.usuario_creador_id !== usuarioId) {
      throw new Error('Solo el creador puede hacer privado el proyecto');
    }

    const sql = `
      UPDATE proyectos_registros
      SET es_publico = 0, fecha_publicacion = NULL
      WHERE id = ?
    `;

    await this.executeRun(sql, [id]);
    return await this.obtenerPorId(id);
  }

  // Eliminar proyecto (lógico)
  async eliminar(id, usuarioId) {
    const proyecto = await this.obtenerPorId(id);
    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    if (proyecto.usuario_creador_id !== usuarioId) {
      throw new Error('Solo el creador puede eliminar el proyecto');
    }

    await this.executeRun(
      `UPDATE proyectos_registros SET activo = 0 WHERE id = ?`,
      [id]
    );
    return true;
  }

  // Verificar permisos de acceso
  async verificarAcceso(proyectoId, usuarioId, tipoAcceso = 'ver') {
    const proyecto = await this.obtenerPorId(proyectoId);
    if (!proyecto) {
      return false;
    }

    // El creador siempre tiene acceso total
    if (proyecto.usuario_creador_id === usuarioId) {
      return true;
    }

    // Si es público, verificar permisos
    if (proyecto.es_publico) {
      if (tipoAcceso === 'ver') {
        return true; // Cualquiera puede ver proyectos públicos
      }
      if (tipoAcceso === 'editar') {
        return proyecto.permite_edicion === 1;
      }
    }

    return false; // Proyecto privado, sin acceso
  }

  // Obtener estadísticas de proyectos
  async obtenerEstadisticas(usuarioId = null) {
    let whereClause = 'WHERE p.activo = 1';
    let params = [];

    if (usuarioId) {
      whereClause += ' AND p.usuario_creador_id = ?';
      params.push(usuarioId);
    }

    const sql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN p.es_publico = 1 THEN 1 ELSE 0 END) as publicos,
        SUM(CASE WHEN p.es_publico = 0 THEN 1 ELSE 0 END) as privados,
        (SELECT COUNT(*) FROM registros r
         JOIN proyectos_registros pr ON r.proyecto_id = pr.id
         WHERE pr.activo = 1 AND r.eliminado = 0
         ${usuarioId ? 'AND pr.usuario_creador_id = ?' : ''}) as total_registros
      FROM proyectos_registros p
      ${whereClause}
    `;

    if (usuarioId) {
      params.push(usuarioId);
    }

    return await this.executeGet(sql, params);
  }

  // Buscar proyectos
  async buscar(termino, usuarioId = null) {
    let whereClause = 'WHERE p.activo = 1 AND (p.nombre LIKE ? OR p.descripcion LIKE ?)';
    let params = [`%${termino}%`, `%${termino}%`];

    if (usuarioId) {
      whereClause += ' AND (p.es_publico = 1 OR p.usuario_creador_id = ?)';
      params.push(usuarioId);
    } else {
      whereClause += ' AND p.es_publico = 1';
    }

    const sql = `
      SELECT p.*, u.nombre as nombre_creador,
        (SELECT COUNT(*) FROM registros r WHERE r.proyecto_id = p.id AND r.eliminado = 0) as total_registros
      FROM proyectos_registros p
      LEFT JOIN usuarios u ON p.usuario_creador_id = u.id
      ${whereClause}
      ORDER BY p.fecha_creacion DESC
    `;

    return await this.executeQuery(sql, params);
  }
}

module.exports = ProyectoModel;