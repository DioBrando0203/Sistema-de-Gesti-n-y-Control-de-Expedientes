// src/main/services/DatabaseService.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class DatabaseService {
  constructor() {
    this.db = null;
  }

  async connect() {
    const dbPath = path.join(__dirname, "../../../database.sqlite");

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          console.error("❌ Error al conectar BD:", err.message);
          return reject(err);
        }

        this.configurePragmas();
        console.log("✅ Conectado a SQLite en", dbPath);
        resolve(this.db);
      });
    });
  }

  configurePragmas() {
    this.db.run("PRAGMA foreign_keys = ON;");
    this.db.run("PRAGMA journal_mode = WAL;");
    this.db.run("PRAGMA synchronous = NORMAL;");
  }

  getDatabase() {
    return this.db;
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error("Error al cerrar la base de datos:", err.message);
        } else {
          console.log("Conexión a la base de datos cerrada.");
        }
      });
    }
  }

  // Método utilitario para transacciones
  async runTransaction(operations) {
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
}

module.exports = DatabaseService;