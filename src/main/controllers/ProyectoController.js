const BaseController = require('./BaseController');

class ProyectoController extends BaseController {
  constructor(proyectoModel, auditoriaModel) {
    super();
    this.proyectoModel = proyectoModel;
    this.auditoriaModel = auditoriaModel;
  }

  // Crear nuevo proyecto
  async crear(datos, usuarioActual) {
    try {
      const datosCompletos = {
        ...datos,
        usuario_creador_id: usuarioActual.id
      };

      const proyectoId = await this.proyectoModel.crear(datosCompletos);

      // Registrar en auditoría
      await this.auditoriaModel.registrarCreacion(
        usuarioActual.id,
        'proyectos_registros',
        proyectoId,
        proyectoId,
        { nombre: datos.nombre }
      );

      const proyecto = await this.proyectoModel.obtenerPorId(proyectoId);

      return {
        success: true,
        proyecto
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obtener proyectos del usuario
  async obtenerMisProyectos(usuarioId, usuario = null) {
    try {
      let proyectos;

      // Si el usuario es administrador, mostrar todos los proyectos
      if (usuario && usuario.rol === 'administrador') {
        proyectos = await this.proyectoModel.listarTodos();
      } else {
        // Para trabajadores, mostrar solo proyectos accesibles (propios + públicos)
        proyectos = await this.proyectoModel.listarAccesiblesPorUsuario(usuarioId);
      }

      return {
        success: true,
        proyectos
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obtener proyectos públicos
  async obtenerProyectosPublicos() {
    try {
      const proyectos = await this.proyectoModel.listarPublicos();

      return {
        success: true,
        proyectos
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obtener todos los proyectos (solo admin)
  async obtenerTodos(usuarioActual) {
    try {
      if (usuarioActual.rol !== 'administrador') {
        throw new Error('No tienes permisos para ver todos los proyectos');
      }

      const proyectos = await this.proyectoModel.listarTodos();

      return {
        success: true,
        proyectos
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obtener proyecto por ID
  async obtenerPorId(id, usuarioActual) {
    try {
      const proyecto = await this.proyectoModel.obtenerPorId(id);

      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }

      // Verificar permisos de acceso
      const tieneAcceso = usuarioActual.rol === 'administrador' ||
                          proyecto.usuario_creador_id === usuarioActual.id ||
                          proyecto.es_publico === 1;

      if (!tieneAcceso) {
        throw new Error('No tienes permisos para acceder a este proyecto');
      }

      return {
        success: true,
        proyecto
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Actualizar proyecto
  async actualizar(id, datos, usuarioActual) {
    try {
      const proyecto = await this.proyectoModel.obtenerPorId(id);

      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }

      // Solo el creador o admin pueden actualizar
      const puedeActualizar = usuarioActual.rol === 'administrador' ||
                              proyecto.usuario_creador_id === usuarioActual.id;

      if (!puedeActualizar) {
        throw new Error('No tienes permisos para actualizar este proyecto');
      }

      const proyectoActualizado = await this.proyectoModel.actualizar(id, datos, usuarioActual.id);

      // Registrar en auditoría
      await this.auditoriaModel.registrarEdicion(
        usuarioActual.id,
        'proyectos_registros',
        id,
        id,
        datos
      );

      return {
        success: true,
        proyecto: proyectoActualizado
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Hacer público un proyecto
  async hacerPublico(id, usuarioActual) {
    try {
      const proyecto = await this.proyectoModel.hacerPublico(id, usuarioActual.id);

      // Registrar en auditoría
      await this.auditoriaModel.registrarPublicacion(usuarioActual.id, id);

      return {
        success: true,
        proyecto
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Hacer privado un proyecto
  async hacerPrivado(id, usuarioActual) {
    try {
      const proyecto = await this.proyectoModel.hacerPrivado(id, usuarioActual.id);

      // Registrar en auditoría
      await this.auditoriaModel.registrarAccion({
        usuario_id: usuarioActual.id,
        accion: 'hacer_privado',
        tabla_afectada: 'proyectos_registros',
        registro_id: id,
        proyecto_id: id
      });

      return {
        success: true,
        proyecto
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Eliminar proyecto
  async eliminar(id, usuarioActual) {
    try {
      const proyecto = await this.proyectoModel.obtenerPorId(id);

      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }

      // Solo el creador o admin pueden eliminar
      const puedeEliminar = usuarioActual.rol === 'administrador' ||
                           proyecto.usuario_creador_id === usuarioActual.id;

      if (!puedeEliminar) {
        throw new Error('No tienes permisos para eliminar este proyecto');
      }

      await this.proyectoModel.eliminar(id, usuarioActual.id);

      // Registrar en auditoría
      await this.auditoriaModel.registrarEliminacion(
        usuarioActual.id,
        'proyectos_registros',
        id,
        id,
        { nombre: proyecto.nombre }
      );

      return {
        success: true,
        message: 'Proyecto eliminado correctamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verificar permisos de acceso
  async verificarAcceso(proyectoId, usuarioId, tipoAcceso = 'ver') {
    try {
      const acceso = await this.proyectoModel.verificarAcceso(proyectoId, usuarioId, tipoAcceso);

      return {
        success: true,
        acceso
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obtener estadísticas de proyectos
  async obtenerEstadisticas(usuarioActual) {
    try {
      let estadisticas;

      if (usuarioActual.rol === 'administrador') {
        // Admin ve estadísticas generales
        estadisticas = await this.proyectoModel.obtenerEstadisticas();
      } else {
        // Trabajador ve solo sus estadísticas
        estadisticas = await this.proyectoModel.obtenerEstadisticas(usuarioActual.id);
      }

      return {
        success: true,
        estadisticas
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Buscar proyectos
  async buscar(termino, usuarioActual) {
    try {
      let proyectos;

      if (usuarioActual.rol === 'administrador') {
        // Admin puede buscar en todos los proyectos
        proyectos = await this.proyectoModel.buscar(termino);
      } else {
        // Trabajador busca solo en proyectos accesibles
        proyectos = await this.proyectoModel.buscar(termino, usuarioActual.id);
      }

      return {
        success: true,
        proyectos
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Duplicar proyecto
  async duplicar(id, nuevoNombre, usuarioActual) {
    try {
      const proyectoOriginal = await this.proyectoModel.obtenerPorId(id);

      if (!proyectoOriginal) {
        throw new Error('Proyecto no encontrado');
      }

      // Verificar permisos de acceso al proyecto original
      const tieneAcceso = usuarioActual.rol === 'administrador' ||
                          proyectoOriginal.usuario_creador_id === usuarioActual.id ||
                          proyectoOriginal.es_publico === 1;

      if (!tieneAcceso) {
        throw new Error('No tienes permisos para duplicar este proyecto');
      }

      // Crear nuevo proyecto
      const datosNuevoProyecto = {
        nombre: nuevoNombre || `${proyectoOriginal.nombre} (Copia)`,
        descripcion: proyectoOriginal.descripcion,
        usuario_creador_id: usuarioActual.id,
        es_publico: 0, // Siempre crear como privado
        permite_edicion: proyectoOriginal.permite_edicion
      };

      const nuevoProyectoId = await this.proyectoModel.crear(datosNuevoProyecto);

      // Registrar en auditoría
      await this.auditoriaModel.registrarAccion({
        usuario_id: usuarioActual.id,
        accion: 'duplicar',
        tabla_afectada: 'proyectos_registros',
        registro_id: nuevoProyectoId,
        proyecto_id: nuevoProyectoId,
        detalles: { proyecto_original: id, nombre_original: proyectoOriginal.nombre }
      });

      const nuevoProyecto = await this.proyectoModel.obtenerPorId(nuevoProyectoId);

      return {
        success: true,
        proyecto: nuevoProyecto
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = ProyectoController;