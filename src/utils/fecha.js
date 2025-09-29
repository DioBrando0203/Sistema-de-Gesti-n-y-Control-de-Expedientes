const dayjs = require("dayjs");

/**
 * Formatea una fecha a DD/MM/YYYY para visualización.
 */
function formatearFecha(fecha) {
  if (!fecha) return '';
  return dayjs(fecha).format("DD/MM/YYYY");
}

/**

 */
/**
 * Convierte fechas desde Excel (número o string) a formato YYYY-MM-DD para SQLite.
 */
function parsearFechaImportada(valor, XLSX) {
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

    for (const formato of formatos) {
      const fecha = dayjs(valor.trim(), formato, true); // true = modo estricto
      if (fecha.isValid()) return fecha.format("YYYY-MM-DD");
    }
    return null;
    
  }

  return null;
}

module.exports = {
  formatearFecha,
  parsearFechaImportada,
};