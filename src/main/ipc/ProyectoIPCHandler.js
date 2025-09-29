const { ipcMain } = require("electron");

class ProyectoIPCHandler {
  constructor(proyectoController) {
    this.proyectoController = proyectoController;
    this.registeredChannels = [];
  }

  registerHandlers() {
    console.log("📂 Registrando handlers de proyectos...");

    // Crear proyecto
    ipcMain.handle("proyecto-crear", async (event, { datos, usuario }) => {
      try {
        return await this.proyectoController.crear(datos, usuario);
      } catch (error) {
        console.error("Error en proyecto-crear:", error);
        return { success: false, error: error.message };
      }
    });

    // Obtener mis proyectos
    ipcMain.handle("proyecto-obtener-mis-proyectos", async (event, { usuarioId, usuario }) => {
      try {
        return await this.proyectoController.obtenerMisProyectos(usuarioId, usuario);
      } catch (error) {
        console.error("Error en proyecto-obtener-mis-proyectos:", error);
        return { success: false, error: error.message };
      }
    });

    // Obtener proyectos públicos
    ipcMain.handle("proyecto-obtener-publicos", async (event) => {
      try {
        return await this.proyectoController.obtenerProyectosPublicos();
      } catch (error) {
        console.error("Error en proyecto-obtener-publicos:", error);
        return { success: false, error: error.message };
      }
    });

    // Obtener proyecto por ID
    ipcMain.handle("proyecto-obtener-por-id", async (event, { id, usuario }) => {
      try {
        return await this.proyectoController.obtenerPorId(id, usuario);
      } catch (error) {
        console.error("Error en proyecto-obtener-por-id:", error);
        return { success: false, error: error.message };
      }
    });

    // Actualizar proyecto
    ipcMain.handle("proyecto-actualizar", async (event, { id, datos, usuario }) => {
      try {
        return await this.proyectoController.actualizar(id, datos, usuario);
      } catch (error) {
        console.error("Error en proyecto-actualizar:", error);
        return { success: false, error: error.message };
      }
    });

    // Eliminar proyecto
    ipcMain.handle("proyecto-eliminar", async (event, { id, usuario }) => {
      try {
        return await this.proyectoController.eliminar(id, usuario);
      } catch (error) {
        console.error("Error en proyecto-eliminar:", error);
        return { success: false, error: error.message };
      }
    });

    // Hacer público
    ipcMain.handle("proyecto-hacer-publico", async (event, { id, usuario }) => {
      try {
        return await this.proyectoController.hacerPublico(id, usuario);
      } catch (error) {
        console.error("Error en proyecto-hacer-publico:", error);
        return { success: false, error: error.message };
      }
    });

    // Hacer privado
    ipcMain.handle("proyecto-hacer-privado", async (event, { id, usuario }) => {
      try {
        return await this.proyectoController.hacerPrivado(id, usuario);
      } catch (error) {
        console.error("Error en proyecto-hacer-privado:", error);
        return { success: false, error: error.message };
      }
    });

    // Verificar acceso
    ipcMain.handle("proyecto-verificar-acceso", async (event, { proyectoId, usuarioId, tipoAcceso }) => {
      try {
        return await this.proyectoController.verificarAcceso(proyectoId, usuarioId, tipoAcceso);
      } catch (error) {
        console.error("Error en proyecto-verificar-acceso:", error);
        return { success: false, error: error.message };
      }
    });

    // Buscar proyectos
    ipcMain.handle("proyecto-buscar", async (event, { termino, usuario }) => {
      try {
        return await this.proyectoController.buscar(termino, usuario);
      } catch (error) {
        console.error("Error en proyecto-buscar:", error);
        return { success: false, error: error.message };
      }
    });

    // Duplicar proyecto
    ipcMain.handle("proyecto-duplicar", async (event, { id, nuevoNombre, usuario }) => {
      try {
        return await this.proyectoController.duplicar(id, nuevoNombre, usuario);
      } catch (error) {
        console.error("Error en proyecto-duplicar:", error);
        return { success: false, error: error.message };
      }
    });

    this.registeredChannels = [
      "proyecto-crear",
      "proyecto-obtener-mis-proyectos",
      "proyecto-obtener-publicos",
      "proyecto-obtener-por-id",
      "proyecto-actualizar",
      "proyecto-eliminar",
      "proyecto-hacer-publico",
      "proyecto-hacer-privado",
      "proyecto-verificar-acceso",
      "proyecto-buscar",
      "proyecto-duplicar"
    ];

    console.log("✅ Handlers básicos de proyectos registrados");
  }

  registerAdvancedHandlers() {
    console.log("📊 Registrando handlers avanzados de proyectos...");

    // Obtener estadísticas
    ipcMain.handle("proyecto-obtener-estadisticas", async (event, { usuario, proyectoId = null }) => {
      try {
        return await this.proyectoController.obtenerEstadisticas(usuario);
      } catch (error) {
        console.error("Error en proyecto-obtener-estadisticas:", error);
        return { success: false, error: error.message };
      }
    });

    // Exportar proyecto a Excel
    ipcMain.handle("proyecto-exportar-excel", async (event, { proyectoId, nombreProyecto, usuario }) => {
      try {
        // Este handler necesitará acceso al ExcelController también
        // Por ahora retorno un placeholder
        return {
          success: true,
          message: "Funcionalidad de exportación en desarrollo",
          ruta: "pendiente"
        };
      } catch (error) {
        console.error("Error en proyecto-exportar-excel:", error);
        return { success: false, error: error.message };
      }
    });

    const advancedChannels = [
      "proyecto-obtener-estadisticas",
      "proyecto-exportar-excel"
    ];

    this.registeredChannels.push(...advancedChannels);
    console.log("✅ Handlers avanzados de proyectos registrados");
  }

  registerAdminHandlers() {
    console.log("👑 Registrando handlers de administración de proyectos...");

    // Obtener todos los proyectos (solo admin)
    ipcMain.handle("proyecto-obtener-todos", async (event, { usuario }) => {
      try {
        return await this.proyectoController.obtenerTodos(usuario);
      } catch (error) {
        console.error("Error en proyecto-obtener-todos:", error);
        return { success: false, error: error.message };
      }
    });

    const adminChannels = [
      "proyecto-obtener-todos"
    ];

    this.registeredChannels.push(...adminChannels);
    console.log("✅ Handlers de administración de proyectos registrados");
  }

  listHandlers() {
    return this.registeredChannels.map(channel => `  • ${channel}`);
  }

  removeAllHandlers() {
    this.registeredChannels.forEach(channel => {
      ipcMain.removeHandler(channel);
    });
    this.registeredChannels = [];
    console.log("🧹 Handlers de proyectos removidos");
  }
}

module.exports = ProyectoIPCHandler;