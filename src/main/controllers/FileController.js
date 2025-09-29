// src/main/controllers/FileController.js
const BaseController = require('./BaseController');

class FileController extends BaseController {
  constructor(fileService) {
    super(null); // No necesita modelo específico
    this.fileService = fileService;
  }

  // Guardar PDF en disco
  async guardarPDF(buffer, nombreArchivo) {
    try {
      this.validateRequired({ buffer, nombreArchivo }, ['buffer', 'nombreArchivo']);
      
      if (!Buffer.isBuffer(buffer)) {
        throw new Error("El buffer del PDF no es válido");
      }

      const resultado = await this.fileService.guardarPDF(buffer, nombreArchivo);
      
      if (resultado.success) {
        return {
          success: true,
          filePath: resultado.filePath,
          message: "PDF guardado correctamente"
        };
      } else {
        return {
          success: false,
          message: "Guardado de PDF cancelado"
        };
      }
    } catch (error) {
      this.handleError(error, "Error al guardar PDF");
    }
  }

  // Abrir aplicaciones externas
  async abrirWhatsapp() {
    try {
      const os = require("os");
      const fs = require("fs");
      const path = require("path");
      const { execFile, exec } = require("child_process");
      const { shell } = require("electron");

      const whatsappPath = path.join(os.homedir(), "AppData", "Local", "WhatsApp", "WhatsApp.exe");

      return new Promise((resolve) => {
        if (fs.existsSync(whatsappPath)) {
          execFile(whatsappPath, (error) => {
            if (error) {
              console.error("Error abriendo WhatsApp.exe:", error);
              this.abrirWhatsAppUWP(resolve);
            } else {
              resolve({ success: true, method: "exe" });
            }
          });
        } else {
          this.abrirWhatsAppUWP(resolve);
        }
      });
    } catch (error) {
      this.handleError(error, "Error al abrir WhatsApp");
    }
  }

  async abrirCorreo(subject, body) {
    try {
      this.validateRequired({ subject, body }, ['subject', 'body']);
      
      const { shell } = require("electron");
      const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      await shell.openExternal(mailto);
      
      return {
        success: true,
        message: "Cliente de correo abierto"
      };
    } catch (error) {
      this.handleError(error, "Error al abrir correo");
    }
  }

  // Manejo de menú contextual
  async mostrarMenuContextual(event, dni) {
    try {
      this.validateRequired({ dni }, ['dni']);
      
      const { BrowserWindow, Menu } = require("electron");
      const win = BrowserWindow.fromWebContents(event.sender);
      
      const menu = Menu.buildFromTemplate([
        {
          label: "Ver Información",
          click: () => {
            setTimeout(() => {
              win.webContents.send("navegar-a-informacion", dni);
            }, 200);
          },
        },
        {
          type: 'separator'
        },
        {
          label: "Buscar registros",
          click: () => {
            win.webContents.send("buscar-por-dni", dni);
          }
        }
      ]);
      
      menu.popup({ window: win });
      
      return { success: true };
    } catch (error) {
      this.handleError(error, "Error mostrando menú contextual");
    }
  }

  // Operaciones de archivo genéricas
  async leerArchivo(ruta, encoding = 'utf8') {
    try {
      this.validateRequired({ ruta }, ['ruta']);
      
      const contenido = this.fileService.leerArchivoTexto(ruta, encoding);
      return {
        success: true,
        contenido,
        ruta
      };
    } catch (error) {
      this.handleError(error, "Error al leer archivo");
    }
  }

  async escribirArchivo(ruta, contenido, encoding = 'utf8') {
    try {
      this.validateRequired({ ruta, contenido }, ['ruta', 'contenido']);
      
      const resultado = this.fileService.escribirArchivoTexto(ruta, contenido, encoding);
      return {
        ...resultado,
        message: "Archivo escrito correctamente"
      };
    } catch (error) {
      this.handleError(error, "Error al escribir archivo");
    }
  }

  async copiarArchivo(origen, destino) {
    try {
      this.validateRequired({ origen, destino }, ['origen', 'destino']);
      
      const resultado = this.fileService.copiarArchivo(origen, destino);
      return {
        ...resultado,
        message: "Archivo copiado correctamente"
      };
    } catch (error) {
      this.handleError(error, "Error al copiar archivo");
    }
  }

  // Diálogos de usuario
  async mostrarError(titulo, mensaje) {
    try {
      this.validateRequired({ titulo, mensaje }, ['titulo', 'mensaje']);
      
      this.fileService.mostrarError(titulo, mensaje);
      return { success: true };
    } catch (error) {
      this.handleError(error, "Error mostrando diálogo de error");
    }
  }

  async mostrarInformacion(titulo, mensaje) {
    try {
      this.validateRequired({ titulo, mensaje }, ['titulo', 'mensaje']);
      
      const resultado = await this.fileService.mostrarInfo(titulo, mensaje);
      return {
        success: true,
        response: resultado.response
      };
    } catch (error) {
      this.handleError(error, "Error mostrando diálogo de información");
    }
  }

  async mostrarConfirmacion(titulo, mensaje) {
    try {
      this.validateRequired({ titulo, mensaje }, ['titulo', 'mensaje']);
      
      const confirmado = await this.fileService.mostrarConfirmacion(titulo, mensaje);
      return {
        success: true,
        confirmado
      };
    } catch (error) {
      this.handleError(error, "Error mostrando diálogo de confirmación");
    }
  }

  // Validación de archivos
  async validarArchivo(ruta, tiposPermitidos = []) {
    try {
      this.validateRequired({ ruta }, ['ruta']);
      
      if (!this.fileService.existeArchivo(ruta)) {
        return {
          valido: false,
          error: "El archivo no existe"
        };
      }

      if (tiposPermitidos.length > 0) {
        const path = require("path");
        const extension = path.extname(ruta).toLowerCase();
        
        if (!tiposPermitidos.includes(extension)) {
          return {
            valido: false,
            error: `Tipo de archivo no permitido. Permitidos: ${tiposPermitidos.join(', ')}`
          };
        }
      }

      return {
        valido: true,
        message: "Archivo válido"
      };
    } catch (error) {
      return {
        valido: false,
        error: error.message
      };
    }
  }

  // Métodos auxiliares privados

  abrirWhatsAppUWP(resolve) {
    const { exec } = require("child_process");
    const { shell } = require("electron");

    exec('start shell:AppsFolder\\5319275A.WhatsAppDesktop_cv1g1gvanyjgm!App', (error) => {
      if (error) {
        console.error("No se pudo abrir WhatsApp UWP. Abriendo WhatsApp Web...");
        shell.openExternal("https://web.whatsapp.com/");
        resolve({ success: true, method: "web" });
      } else {
        resolve({ success: true, method: "uwp" });
      }
    });
  }

  // Obtener información del sistema
  async obtenerInfoSistema() {
    try {
      const os = require("os");
      const path = require("path");
      
      return {
        success: true,
        info: {
          plataforma: os.platform(),
          arquitectura: os.arch(),
          version: os.release(),
          homeDir: os.homedir(),
          tmpDir: os.tmpdir(),
          memoria: {
            total: os.totalmem(),
            libre: os.freemem()
          }
        }
      };
    } catch (error) {
      this.handleError(error, "Error obteniendo información del sistema");
    }
  }
}

module.exports = FileController;