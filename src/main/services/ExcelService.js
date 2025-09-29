// src/main/services/ExcelService.js
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const dayjs = require("dayjs");

class ExcelService {
  constructor() {
    this.requiredSheets = ["personas", "expedientes", "registros"];
  }

  // Exportar base de datos completa a Excel
  async exportarBaseDatos(db, filePath) {
    const tablas = {
      registros: `
        SELECT 
          r.id AS Registro_ID,
          p.nombre AS Nombre,
          p.numero AS Número,
          p.dni AS DNI,
          e.codigo AS Expediente,
          r.fecha_registro AS "Fecha de Registro",
          s.nombre AS Estado,
          r.fecha_en_caja AS "Fecha en Caja",
          r.eliminado AS Eliminado
        FROM registros r
        JOIN personas p ON r.persona_id = p.id
        JOIN expedientes e ON r.expediente_id = e.id
        JOIN estados s ON r.estado_id = s.id
        ORDER BY r.id ASC
      `,
      personas: `
        SELECT 
          id AS Persona_ID,
          nombre AS Nombre,
          dni AS DNI,
          numero AS Número
        FROM personas
        ORDER BY id ASC
      `,
      expedientes: `
        SELECT 
          id AS Expediente_ID,
          persona_id AS Persona_ID,
          codigo AS Código,
          fecha_solicitud AS "Fecha de Solicitud",
          fecha_entrega AS "Fecha de Entrega",
          observacion AS Observación
        FROM expedientes
        ORDER BY id ASC
      `,
      estados: `
        SELECT 
          id AS Estado_ID,
          nombre AS Nombre
        FROM estados
        ORDER BY id ASC
      `
    };

    const workbook = XLSX.utils.book_new();

    for (const [nombreHoja, sql] of Object.entries(tablas)) {
      const rows = await this.executeQuery(db, sql);
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, nombreHoja);
    }

    XLSX.writeFile(workbook, filePath);
    return { success: true, filePath };
  }

  // Importar desde Excel
  async importarDesdeExcel(filePath, db) {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    // Validar hojas requeridas
    const hojasFaltantes = this.requiredSheets.filter(hoja => !sheetNames.includes(hoja));
    if (hojasFaltantes.length > 0) {
      throw new Error(`Faltan las hojas: ${hojasFaltantes.join(", ")}`);
    }

    // Leer datos de las hojas
    const datos = {};
    for (const hoja of this.requiredSheets) {
      datos[hoja] = XLSX.utils.sheet_to_json(workbook.Sheets[hoja], { defval: "" });
    }

    // Procesar importación
    const resultado = await this.procesarImportacion(datos, db);
    
    // Guardar log
    const logFile = await this.crearArchivoLog(resultado, filePath);
    
    return {
      ...resultado,
      logFile
    };
  }

  async procesarImportacion(datos, db) {
    const logs = [];
    const ignorados = [];
    let totalImportados = 0;

    for (let i = 0; i < datos.registros.length; i++) {
      const row = datos.registros[i];
      const fila = i + 2;

      try {
        const registroData = this.prepararDatosRegistro(row, datos.expedientes);
        
        // Validaciones
        if (!this.validarRegistro(registroData, fila, logs, ignorados)) {
          continue;
        }

        // Verificar duplicados
        if (await this.verificarDuplicados(registroData, db, fila, logs, ignorados)) {
          continue;
        }

        // Insertar registro completo
        await this.insertarRegistroCompleto(registroData, db);
        totalImportados++;

      } catch (error) {
        logs.push(`Error fila ${fila}: ${error.message}`);
        ignorados.push(fila);
      }
    }

    return {
      success: true,
      total: totalImportados,
      ignorados: ignorados.length,
      filasIgnoradas: ignorados,
      log: this.generarResumen(datos.registros.length, totalImportados, ignorados, logs)
    };
  }

  prepararDatosRegistro(row, expedientes) {
    const nombre = String(row.Nombre ?? "").trim() || "---";
    const numero = String(row.Número ?? "").trim() || "---";
    const dni = String(row.DNI ?? "").trim() || "---";
    let expediente = String(row.Expediente ?? "").trim();
    const estado = String(row.Estado ?? "").trim() || "Recibido";

    const fecha_registro = this.convertirFechaExcel(row["Fecha de Registro"]) || this.getFechaLocal();
    const fecha_en_caja = this.convertirFechaExcel(row["Fecha en Caja"]) || "No entregado";

    if (!expediente || expediente === "---") expediente = null;

    // Buscar información adicional del expediente
    const expInfo = expedientes.find(e => String(e.Código ?? "").trim() === (expediente ?? ""));
    const fecha_solicitud = this.convertirFechaExcel(expInfo?.["Fecha de Solicitud"]) || null;
    const fecha_entrega = this.convertirFechaExcel(expInfo?.["Fecha de Entrega"]) || null;
    const observacion = String(expInfo?.Observación ?? "").trim() || null;

    const final_fecha_entrega = estado === "Entregado" && !fecha_entrega ? this.getFechaLocal() : fecha_entrega;

    return {
      nombre, numero, dni, expediente, estado,
      fecha_registro, fecha_en_caja,
      fecha_solicitud, observacion,
      fecha_entrega: final_fecha_entrega
    };
  }

  validarRegistro(data, fila, logs, ignorados) {
    if (data.dni !== "---" && !/^\d{8}$/.test(data.dni)) {
      logs.push(`Fila ${fila}: DNI inválido (${data.dni}), registro ignorado.`);
      ignorados.push(fila);
      return false;
    }
    return true;
  }

  async verificarDuplicados(data, db, fila, logs, ignorados) {
    if (data.expediente) {
      const existe = await this.executeQuery(db, 
        "SELECT id FROM expedientes WHERE codigo = ?", 
        [data.expediente]
      );
      if (existe.length > 0) {
        logs.push(`Fila ${fila}: expediente duplicado (${data.expediente}), registro ignorado.`);
        ignorados.push(fila);
        return true;
      }
    }
    return false;
  }

  convertirFechaExcel(valor) {
    if (!valor || (typeof valor === "string" && valor.trim().toLowerCase() === "no entregado")) {
      return null;
    }

    if (typeof valor === "number") {
      const fecha = XLSX.SSF.parse_date_code(valor);
      if (!fecha) return null;
      return dayjs(new Date(fecha.y, fecha.m - 1, fecha.d)).format("YYYY-MM-DD");
    }

    if (typeof valor === "string") {
      const formatos = [
        "DD/MM/YYYY", "D/M/YYYY", "YYYY-MM-DD", "MM/DD/YYYY",
        "DD-MM-YYYY", "D-M-YYYY", "YYYY/MM/DD"
      ];

      const limpio = valor.replace(/\s/g, "").trim();

      for (const formato of formatos) {
        const fecha = dayjs(limpio, formato, true);
        if (fecha.isValid()) return fecha.format("YYYY-MM-DD");
      }
    }

    return null;
  }

  getFechaLocal() {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");
    return `${año}-${mes}-${dia}`;
  }

  getFechaHoraArchivo() {
    const hoy = new Date();
    const fecha = this.getFechaLocal();
    const hora = `${String(hoy.getHours()).padStart(2, "0")}${String(hoy.getMinutes()).padStart(2, "0")}${String(hoy.getSeconds()).padStart(2, "0")}`;
    return `${fecha}-${hora}`;
  }

  async crearArchivoLog(resultado, filePath) {
    const logNombre = `import_log-${this.getFechaHoraArchivo()}.txt`;
    const logRuta = path.join(path.dirname(filePath), logNombre);
    fs.writeFileSync(logRuta, resultado.log.join("\n"), "utf8");
    return logRuta;
  }

  generarResumen(totalProcesados, totalImportados, ignorados, logs) {
    const resumen = [
      ...logs,
      `Total registros procesados: ${totalProcesados}`,
      `Total importados correctamente: ${totalImportados}`,
      `Total ignorados: ${ignorados.length}`
    ];
    
    if (ignorados.length) {
      resumen.push(`Filas ignoradas: ${ignorados.join(', ')}`);
    }

    return resumen;
  }

  async insertarRegistroCompleto(data, db) {
    // Implementar inserción completa (persona -> expediente -> registro)
    // Esta lógica vendría de tu main.js original
  }

  executeQuery(db, query, params = []) {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = ExcelService;