// src/main/window/WindowManager.js
const { BrowserWindow } = require("electron");
const path = require("path");
const waitOn = require("wait-on");

class WindowManager {
  constructor() {
    this.mainWindow = null;
    this.isDev = !require("electron").app.isPackaged;
    this.serverURL = "http://localhost:8083";
  }

  async createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1300,
      height: 1000,
      minWidth: 1300,
      minHeight: 1000,
      show: true,
      icon: path.join(__dirname, "../../../public", "icono.ico"),
      backgroundColor: "#ffffff",
      webPreferences: {
        preload: path.join(__dirname, "../../../preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    await this.loadContent();
    this.setupWindowEvents();
    
    return this.mainWindow;
  }

  async loadContent() {
    if (this.isDev) {
      await this.loadDevelopmentContent();
    } else {
      await this.loadProductionContent();
    }
  }

  async loadDevelopmentContent() {
    try {
      await waitOn({ resources: [this.serverURL], timeout: 10000 });
      await this.mainWindow.loadURL(this.serverURL);
      this.mainWindow.webContents.openDevTools();
    } catch (err) {
      const { dialog } = require("electron");
      dialog.showErrorBox("Servidor Dev no disponible", "¿Ejecutaste `npm run dev`?");
    }
  }

  async loadProductionContent() {
    const fs = require("fs");
    const htmlPath = path.join(require("electron").app.getAppPath(), "dist", "index.html");

    console.log("Cargando HTML desde:", htmlPath);

    if (!fs.existsSync(htmlPath)) {
      const { dialog } = require("electron");
      dialog.showErrorBox("HTML no encontrado", htmlPath);
      return;
    }

    try {
      await this.mainWindow.loadFile(htmlPath);
      console.log("index.html cargado correctamente");

      // Forzar hash routing
      this.mainWindow.webContents.on("did-finish-load", () => {
        this.mainWindow.webContents.executeJavaScript(`
          if (!location.hash) {
            location.replace(location.href + "#/");
          }
        `);
      });
    } catch (err) {
      const { dialog } = require("electron");
      dialog.showErrorBox("Error al cargar HTML", err.message);
    }
  }

  setupWindowEvents() {
    // Mostrar ventana cuando esté lista
    this.mainWindow.once("ready-to-show", () => {
      console.log("Ventana lista para mostrar");
      this.mainWindow.show();
      this.mainWindow.focus();
      this.mainWindow.setAlwaysOnTop(true);
      setTimeout(() => {
        this.mainWindow.setAlwaysOnTop(false);
      }, 500);
    });

    // Cleanup al cerrar
    this.mainWindow.on("closed", () => {
      this.mainWindow = null;
    });
  }

  getMainWindow() {
    return this.mainWindow;
  }

  closeMainWindow() {
    if (this.mainWindow) {
      this.mainWindow.close();
    }
  }
}

module.exports = WindowManager;