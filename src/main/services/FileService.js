// src/main/services/FileService.js
const fs = require("fs");
const { dialog, shell } = require("electron");

class FileService {
  // Guardar PDF en disco
  async guardarPDF(buffer, nombreArchivo) {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: nombreArchivo,
      filters: [{ name: "Archivos PDF", extensions: ["pdf"] }]
    });

    if (!canceled && filePath) {
      fs.writeFileSync(filePath, buffer);
      await shell.openPath(filePath);
      return { success: true, filePath };
    }

    return { success: false };
  }

  // Abrir diálogo para seleccionar archivo Excel
  async seleccionarArchivoExcel() {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: "Importar base de datos desde Excel",
      filters: [{ name: "Excel", extensions: ["xlsx"] }],
      properties: ["openFile"],
    });

    if (canceled || !filePaths.length) {
      return { success: false };
    }

    return { success: true, filePath: filePaths[0] };
  }

  // Abrir diálogo para guardar archivo Excel
  async seleccionarRutaGuardado(nombrePorDefecto = "base_completa.xlsx") {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Exportar base de datos completa",
      defaultPath: nombrePorDefecto,
      filters: [{ name: "Excel", extensions: ["xlsx"] }],
    });

    if (canceled || !filePath) {
      return { success: false };
    }

    return { success: true, filePath };
  }

  // Verificar si archivo existe
  existeArchivo(ruta) {
    return fs.existsSync(ruta);
  }

  // Leer archivo de texto
  leerArchivoTexto(ruta, encoding = 'utf8') {
    try {
      return fs.readFileSync(ruta, encoding);
    } catch (error) {
      throw new Error(`No se pudo leer el archivo: ${error.message}`);
    }
  }

  // Escribir archivo de texto
  escribirArchivoTexto(ruta, contenido, encoding = 'utf8') {
    try {
      fs.writeFileSync(ruta, contenido, encoding);
      return { success: true };
    } catch (error) {
      throw new Error(`No se pudo escribir el archivo: ${error.message}`);
    }
  }

  // Copiar archivo
  copiarArchivo(origen, destino) {
    try {
      fs.copyFileSync(origen, destino);
      return { success: true };
    } catch (error) {
      throw new Error(`No se pudo copiar el archivo: ${error.message}`);
    }
  }

  // Mostrar diálogo de error
  mostrarError(titulo, mensaje) {
    dialog.showErrorBox(titulo, mensaje);
  }

  // Mostrar diálogo de información
  async mostrarInfo(titulo, mensaje) {
    return dialog.showMessageBox({
      type: 'info',
      title: titulo,
      message: mensaje,
      buttons: ['OK']
    });
  }

  // Mostrar diálogo de confirmación
  async mostrarConfirmacion(titulo, mensaje) {
    const result = await dialog.showMessageBox({
      type: 'question',
      title: titulo,
      message: mensaje,
      buttons: ['Sí', 'No'],
      defaultId: 0,
      cancelId: 1
    });

    return result.response === 0; // true si eligió "Sí"
  }
}

module.exports = FileService;