// src/main/ipc/ExcelIPCHandler.js
const BaseIPCHandler = require('./BaseIPCHandler');

class ExcelIPCHandler extends BaseIPCHandler {
  constructor(excelController) {
    super();
    this.excelController = excelController;
  }

  registerHandlers() {
    // Operaciones principales de Excel
    this.handle("exportar-registros", this.excelController, "exportarRegistros");
    this.handle("importar-registros", this.excelController, "importarRegistros");

    // Operaciones de validación y utilidades
    this.handle("validar-archivo-excel", this.excelController, "validarArchivoExcel");
    this.handle("obtener-vista-previa-excel", this.excelController, "obtenerVistaPrevia");
    this.handle("limpiar-datos-excel", this.excelController, "limpiarDatosImportacion");
    this.handle("generar-plantilla-excel", this.excelController, "generarPlantilla");

    console.log("✅ Handlers de Excel registrados");
  }

  // Métodos específicos con validaciones adicionales

  // Wrapper para exportación con confirmación
  async exportarConConfirmacion() {
    try {
      const resultado = await this.excelController.exportarRegistros();
      
      if (resultado.success) {
        return {
          success: true,
          filePath: resultado.filePath,
          message: "Base de datos exportada exitosamente",
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          success: false,
          message: "Exportación cancelada por el usuario"
        };
      }
    } catch (error) {
      console.error("Error en exportarConConfirmacion:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Wrapper para importación con logging detallado
  async importarConLog() {
    try {
      const resultado = await this.excelController.importarRegistros();
      
      if (resultado.success) {
        // Log detallado para auditoria
        console.log(`📊 Importación completada:
          - Total importados: ${resultado.total}
          - Total ignorados: ${resultado.ignorados}
          - Archivo log: ${resultado.logFile}`);
        
        return {
          success: true,
          total: resultado.total,
          ignorados: resultado.ignorados,
          filasIgnoradas: resultado.filasIgnoradas,
          logFile: resultado.logFile,
          message: `Importación completada: ${resultado.total} registros importados${resultado.ignorados > 0 ? `, ${resultado.ignorados} ignorados` : ''}`,
          log: resultado.log
        };
      } else {
        return {
          success: false,
          message: "Importación cancelada por el usuario"
        };
      }
    } catch (error) {
      console.error("Error en importarConLog:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validar archivo antes de importar (proceso en dos pasos)
  async validarAntesDeTodo(filePath) {
    try {
      if (!filePath) {
        throw new Error("Ruta de archivo requerida");
      }

      const validacion = await this.excelController.validarArchivoExcel(filePath);
      
      if (!validacion.valido) {
        return {
          success: false,
          error: validacion.error,
          valido: false,
          detalles: validacion
        };
      }

      // Si es válido, obtener vista previa
      const preview = await this.excelController.obtenerVistaPrevia(filePath, 3);
      
      return {
        success: true,
        valido: true,
        validacion,
        preview: preview.preview,
        totalRegistros: preview.totalRegistros,
        message: "Archivo válido para importación"
      };
    } catch (error) {
      console.error("Error en validarAntesDeTodo:", error);
      return {
        success: false,
        valido: false,
        error: error.message
      };
    }
  }

  // Procesar archivo paso a paso (para UI progresiva)
  async procesarArchivoPorPasos(filePath) {
    try {
      const pasos = [];

      // Paso 1: Validar
      pasos.push({ paso: 1, descripcion: "Validando archivo...", completado: false });
      const validacion = await this.validarAntesDeTodo(filePath);
      pasos[0].completado = true;
      pasos[0].resultado = validacion;

      if (!validacion.success) {
        return { success: false, pasos, error: "Archivo inválido" };
      }

      // Paso 2: Limpiar datos
      pasos.push({ paso: 2, descripcion: "Limpiando datos...", completado: false });
      const datosLimpios = await this.excelController.limpiarDatosImportacion(filePath);
      pasos[1].completado = true;
      pasos[1].resultado = { totalRegistros: datosLimpios.registros?.length || 0 };

      // Paso 3: Importar
      pasos.push({ paso: 3, descripcion: "Importando registros...", completado: false });
      const resultado = await this.excelController.importarRegistros();
      pasos[2].completado = true;
      pasos[2].resultado = resultado;

      return {
        success: resultado.success,
        pasos,
        resultado_final: resultado
      };
    } catch (error) {
      console.error("Error en procesarArchivoPorPasos:", error);
      return {
        success: false,
        error: error.message,
        pasos
      };
    }
  }

  // Registrar handlers con validaciones adicionales
  registerAdvancedHandlers() {
    this.handle("exportar-con-confirmacion", this, "exportarConConfirmacion");
    this.handle("importar-con-log", this, "importarConLog");
    this.handle("validar-antes-importar", this, "validarAntesDeTodo");
    this.handle("procesar-excel-por-pasos", this, "procesarArchivoPorPasos");
    
    console.log("✅ Handlers avanzados de Excel registrados");
  }
}

module.exports = ExcelIPCHandler;