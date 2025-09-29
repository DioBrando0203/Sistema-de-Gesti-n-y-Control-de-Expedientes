// src/main/ipc/FileIPCHandler.js
const BaseIPCHandler = require('./BaseIPCHandler');

class FileIPCHandler extends BaseIPCHandler {
  constructor(fileController) {
    super();
    this.fileController = fileController;
  }

  registerHandlers() {
    // Operaciones de archivos
    this.handle("guardar-pdf", this.fileController, "guardarPDF");
    this.handle("leer-archivo", this.fileController, "leerArchivo");
    this.handle("escribir-archivo", this.fileController, "escribirArchivo");
    this.handle("copiar-archivo", this.fileController, "copiarArchivo");
    this.handle("validar-archivo", this.fileController, "validarArchivo");

    // Aplicaciones externas
    this.handle("abrir-whatsapp", this.fileController, "abrirWhatsapp");
    this.handle("abrir-correo", this.fileController, "abrirCorreo");

    // Diálogos del sistema
    this.handle("mostrar-error", this.fileController, "mostrarError");
    this.handle("mostrar-informacion", this.fileController, "mostrarInformacion");
    this.handle("mostrar-confirmacion", this.fileController, "mostrarConfirmacion");

    // Información del sistema
    this.handle("obtener-info-sistema", this.fileController, "obtenerInfoSistema");

    // Listener para menú contextual (no retorna respuesta)
    this.on("abrir-menu-contextual", this.fileController, "mostrarMenuContextual");

    console.log("✅ Handlers de File registrados");
  }

  // Métodos específicos con validaciones adicionales

  // Wrapper para guardar PDF con validaciones específicas
  async guardarPDFValidado(data) {
    try {
      const { buffer, nombreArchivo } = data;

      // Validaciones específicas para PDF
      if (!buffer) {
        throw new Error("Buffer del PDF requerido");
      }

      if (!nombreArchivo) {
        throw new Error("Nombre de archivo requerido");
      }

      // Verificar que el nombre termine en .pdf
      let nombre = nombreArchivo;
      if (!nombre.toLowerCase().endsWith('.pdf')) {
        nombre += '.pdf';
      }

      const resultado = await this.fileController.guardarPDF(buffer, nombre);

      return {
        success: resultado.success,
        filePath: resultado.filePath,
        message: resultado.success ? "PDF guardado correctamente" : "Guardado cancelado"
      };
    } catch (error) {
      console.error("Error en guardarPDFValidado:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Wrapper para abrir correo con validaciones
  async abrirCorreoValidado(data) {
    try {
      const { subject, body } = data;

      if (!subject) {
        throw new Error("Asunto del correo requerido");
      }

      if (!body) {
        throw new Error("Contenido del correo requerido");
      }

      const resultado = await this.fileController.abrirCorreo(subject, body);

      return {
        success: true,
        message: "Cliente de correo abierto correctamente"
      };
    } catch (error) {
      console.error("Error en abrirCorreoValidado:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Wrapper para WhatsApp con fallbacks
  async abrirWhatsappConFallback() {
    try {
      const resultado = await this.fileController.abrirWhatsapp();

      let mensaje = "WhatsApp abierto correctamente";
      
      switch (resultado.method) {
        case "exe":
          mensaje = "WhatsApp desktop abierto";
          break;
        case "uwp":
          mensaje = "WhatsApp UWP abierto";
          break;
        case "web":
          mensaje = "WhatsApp Web abierto en navegador";
          break;
      }

      return {
        success: true,
        method: resultado.method,
        message: mensaje
      };
    } catch (error) {
      console.error("Error en abrirWhatsappConFallback:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validar múltiples archivos a la vez
  async validarMultiplesArchivos(archivos) {
    try {
      if (!Array.isArray(archivos)) {
        throw new Error("Se esperaba un array de archivos");
      }

      const resultados = [];

      for (const archivo of archivos) {
        try {
          const { ruta, tiposPermitidos = [] } = archivo;
          const validacion = await this.fileController.validarArchivo(ruta, tiposPermitidos);
          
          resultados.push({
            ruta,
            valido: validacion.valido,
            error: validacion.error,
            message: validacion.message
          });
        } catch (error) {
          resultados.push({
            ruta: archivo.ruta || "desconocida",
            valido: false,
            error: error.message
          });
        }
      }

      const validos = resultados.filter(r => r.valido).length;
      const invalidos = resultados.length - validos;

      return {
        success: true,
        total: resultados.length,
        validos,
        invalidos,
        resultados
      };
    } catch (error) {
      console.error("Error en validarMultiplesArchivos:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obtener información extendida del sistema
  async obtenerInfoSistemaExtendida() {
    try {
      const infoBasica = await this.fileController.obtenerInfoSistema();
      
      if (!infoBasica.success) {
        throw new Error("No se pudo obtener información básica del sistema");
      }

      // Información adicional específica para la aplicación
      const { app } = require("electron");
      
      const infoExtendida = {
        ...infoBasica.info,
        aplicacion: {
          nombre: app.getName(),
          version: app.getVersion(),
          esDevelopment: !app.isPackaged,
          rutaUsuario: app.getPath("userData"),
          rutaTemp: app.getPath("temp"),
          rutaDesktop: app.getPath("desktop"),
          rutaDocumentos: app.getPath("documents")
        },
        timestamp: new Date().toISOString()
      };

      return {
        success: true,
        info: infoExtendida
      };
    } catch (error) {
      console.error("Error en obtenerInfoSistemaExtendida:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Registrar handlers con validaciones adicionales
  registerAdvancedHandlers() {
    this.handle("guardar-pdf-validado", this, "guardarPDFValidado");
    this.handle("abrir-correo-validado", this, "abrirCorreoValidado");
    this.handle("abrir-whatsapp-con-fallback", this, "abrirWhatsappConFallback");
    this.handle("validar-multiples-archivos", this, "validarMultiplesArchivos");
    this.handle("obtener-info-sistema-extendida", this, "obtenerInfoSistemaExtendida");
    
    console.log("✅ Handlers avanzados de File registrados");
  }
}

module.exports = FileIPCHandler;