// main.js
const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const Store = require('electron-store');
const { exec } = require('child_process');

const store = new Store({ name: 'bindings' });

function registerShortcuts() {
  globalShortcut.unregisterAll();
  const bindings = store.get('bindings', []);
  console.log('Registering shortcuts:', bindings);

  bindings.forEach(({ accelerator, app: appName }) => {
    // Ensure accelerator is a single string with '+' separators
    const accel = accelerator.replace(/\s+/g, '+');
    const ok = globalShortcut.register(accel, () => {
      let cmd;
      if (process.platform === 'darwin') {
        cmd = `open -a "${appName}"`;
      } else if (process.platform === 'linux') {
        cmd = `${appName}`;
      } else if (process.platform === 'win32') {
        cmd = `start "" "${appName}"`;
      }
      console.log(`Executing: ${cmd}`);
      exec(cmd, err => {
        if (err) console.error(`Launch error for ${appName}:`, err);
      });
    });

    console.log(`  ${accel}: ${ok ? 'OK' : 'FAILED'}`);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  registerShortcuts();

  ipcMain.handle('get-bindings', () => {
    return store.get('bindings', []);
  });

  ipcMain.handle('save-binding', (event, binding) => {
    const list = store.get('bindings', []);
    // remove any existing entry for this accelerator
    const filtered = list.filter(b => b.accelerator !== binding.accelerator);
    filtered.push(binding);
    store.set('bindings', filtered);
    registerShortcuts();
    return true;
  });

  ipcMain.handle('remove-binding', (event, accelerator) => {
    const list = store.get('bindings', []);
    store.set(
      'bindings',
      list.filter(b => b.accelerator !== accelerator)
    );
    registerShortcuts();
    return true;
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
