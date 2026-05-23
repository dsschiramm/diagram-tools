import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'node:path';
import type { Diagram, MLApiConfig, ProcessImageRequest } from '../types/domain.js';
import { createMarkdownDocument } from '../services/markdown.js';
import { convertImageToDiagram } from '../services/diagram-converter.js';
import { defaultConfig, loadConfig, saveConfig } from '../services/config.js';
import { openMarkdownFile, saveMarkdownFile } from '../services/storage.js';
import { toUserMessage } from '../utils/errors.js';

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

let mainWindow: BrowserWindow | null = null;

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    title: 'Image to Diagram',
    backgroundColor: '#f7f4ef',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL as string);
  } else {
    await mainWindow.loadFile(join(__dirname, '../../dist/index.html'));
  }
}

function registerIpc(): void {
  ipcMain.handle('config:load', async () => {
    try {
      return { ok: true, data: await loadConfig() };
    } catch (error) {
      return { ok: false, error: toUserMessage(error), data: defaultConfig() };
    }
  });

  ipcMain.handle('config:save', async (_event, config: MLApiConfig) => {
    try {
      return { ok: true, data: await saveConfig(config) };
    } catch (error) {
      return { ok: false, error: toUserMessage(error) };
    }
  });

  ipcMain.handle('diagram:convert', async (_event, request: ProcessImageRequest) => {
    try {
      const diagram = await convertImageToDiagram(request);
      return { ok: true, data: diagram };
    } catch (error) {
      return { ok: false, error: toUserMessage(error) };
    }
  });

  ipcMain.handle('markdown:create', (_event, diagrams: Diagram[]) => {
    try {
      return { ok: true, data: createMarkdownDocument(diagrams).content };
    } catch (error) {
      return { ok: false, error: toUserMessage(error) };
    }
  });

  ipcMain.handle('file:save', async (_event, content: string) => {
    try {
      return { ok: true, data: await saveMarkdownFile(content) };
    } catch (error) {
      return { ok: false, error: toUserMessage(error) };
    }
  });

  ipcMain.handle('file:open', async () => {
    try {
      return { ok: true, data: await openMarkdownFile() };
    } catch (error) {
      return { ok: false, error: toUserMessage(error) };
    }
  });
}

registerIpc();

app.whenReady().then(async () => {
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
