// main.js
const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const Store = require('electron-store');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const store = new Store({ name: 'bindings' });

/** 1. Register IPC handlers immediately */
ipcMain.handle('get-bindings', () => {
  return store.get('bindings', []);
});

ipcMain.handle('get-open-apps', async () => {
  if (process.platform !== 'darwin') return [];
  const appsDir = '/Applications';
  try {
    const entries = await fs.promises.readdir(appsDir, { withFileTypes: true });
    return entries
      .filter(d => d.isDirectory() && d.name.endsWith('.app'))
      .map(d => path.basename(d.name, '.app'))
      .sort();
  } catch (e) {
    console.error('Failed to read /Applications:', e);
    return [];
  }
});

ipcMain.handle('save-binding', (event, { accelerator, app: appName }) => {
  if (!accelerator.includes('+')) throw new Error('Invalid accelerator');
  const updated = store
    .get('bindings', [])
    .filter(b => b.accelerator !== accelerator);
  updated.push({ accelerator, app: appName });
  store.set('bindings', updated);
  registerShortcuts();
});

ipcMain.handle('remove-binding', (event, accel) => {
  const remaining = store
    .get('bindings', [])
    .filter(b => b.accelerator !== accel);
  store.set('bindings', remaining);
  registerShortcuts();
});

/** 2. Shortcut registration logic */
function registerShortcuts() {
  globalShortcut.unregisterAll();
  const bindings = store.get('bindings', []);
  console.log('Registering shortcuts:', bindings);

  for (const { accelerator, app: appName } of bindings) {
    if (
      typeof accelerator !== 'string' ||
      !accelerator.includes('+') ||
      accelerator.startsWith('Listening')
    ) {
      console.warn(`Skipping invalid accelerator: "${accelerator}"`);
      continue;
    }

    const ok = globalShortcut.register(accelerator, () => {
      let cmd;
      if (process.platform === 'darwin') {
        cmd = `open -a "${appName}"`;
      } else if (process.platform === 'linux') {
        cmd = `${appName}`;
      } else {
        cmd = `start "" "${appName}"`;
      }
      console.log(`Executing ${accelerator}: ${cmd}`);
      exec(cmd, err => err && console.error('Launch error:', err));
    });

    console.log(`  ${accelerator}: ${ok ? 'OK' : 'FAIL'}`);
  }
}

/** 3. Create the BrowserWindow */
function createWindow() {
  const win = new BrowserWindow({
    width: 450,
    height: 360,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  win.loadFile('index.html');
}

/** 4. App lifecycle */
app.whenReady().then(() => {
  createWindow();
  registerShortcuts();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

process.on('unhandledRejection', err => {
  console.error('Unhandled promise rejection:', err);
});
