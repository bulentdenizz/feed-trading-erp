import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initDb } from './db/index';
import { registerAuthHandlers } from './handlers/auth.handler';
import { registerEntityHandlers } from './handlers/entities.handler';
import { registerItemHandlers } from './handlers/items.handler';
import { registerInventoryHandlers } from './handlers/inventory.handler';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
    preload: path.join(__dirname, '../preload/index.js'),
    contextIsolation: true,
    nodeIntegration: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.on('ready', async () => {
  await initDb();
  registerAuthHandlers();
  registerEntityHandlers();
  registerItemHandlers();
  registerInventoryHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
