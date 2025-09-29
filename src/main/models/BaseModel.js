// src/main/models/BaseModel.js
class BaseModel {
  constructor(db) {
    this.db = db;
  }

  // Ejecutar consulta que retorna filas
  executeQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          console.error(`Error en consulta SQL: ${query}`, err);
          reject(err.message);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Ejecutar operación que modifica datos
  executeRun(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function (err) {
        if (err) {
          console.error(`Error en operación SQL: ${query}`, err);
          reject(err.message);
        } else {
          resolve({ 
            lastID: this.lastID, 
            changes: this.changes 
          });
        }
      });
    });
  }

  // Obtener un solo registro
  executeGet(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) {
          console.error(`Error en consulta GET: ${query}`, err);
          reject(err.message);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Ejecutar transacción
  executeTransaction(operations) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run("BEGIN TRANSACTION");

        Promise.all(operations)
          .then(results => {
            this.db.run("COMMIT", (err) => {
              if (err) {
                this.db.run("ROLLBACK");
                return reject(err);
              }
              resolve(results);
            });
          })
          .catch(error => {
            this.db.run("ROLLBACK");
            reject(error);
          });
      });
    });
  }

  // Verificar si existe un registro
  async existe(tabla, campo, valor) {
    const result = await this.executeGet(
      `SELECT 1 FROM ${tabla} WHERE ${campo} = ? LIMIT 1`,
      [valor]
    );
    return !!result;
  }

  // Contar registros
  async contar(tabla, condicion = "", params = []) {
    const whereClause = condicion ? `WHERE ${condicion}` : "";
    const result = await this.executeGet(
      `SELECT COUNT(*) as total FROM ${tabla} ${whereClause}`,
      params
    );
    return result.total;
  }
}

module.exports = BaseModel;