// main.js
const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const Store = require('electron-store');
const { exec } = require('child_process');
const store = new Store({ name: 'bindings' });

// Helper: register only valid shortcuts
function registerShortcuts() {
  globalShortcut.unregisterAll();
  const bindings = store.get('bindings', []);
  console.log('Registering shortcuts:', bindings);

  bindings.forEach(({ accelerator, app: appName }) => {
    // Skip invalid or placeholder accelerators
    if (typeof accelerator !== 'string' || !/^[A-Za-z0-9+]+(?:\+[A-Za-z0-9+]+)*$/.test(accelerator)) {
      console.warn(`Skipping invalid accelerator: "${accelerator}"`);
      return;
    }

    const success = globalShortcut.register(accelerator, () => {
      let command;
      if (process.platform === 'darwin') {
        command = `open -a "${appName}"`;
      } else if (process.platform === 'linux') {
        command = `${appName}`;
      } else if (process.platform === 'win32') {
        command = `start "" "${appName}"`;
      }
      console.log(`Executing command for ${accelerator}:`, command);
      exec(command, err => {
        if (err) console.error(`Error launching ${appName}:`, err);
      });
    });

    console.log(`  ${accelerator}: ${success ? 'OK' : 'FAIL'}`);
  });
}

// Create the settings window
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

  // Return current bindings
  ipcMain.handle('get-bindings', () => {
    return store.get('bindings', []);
  });

  // Save or update a binding
  ipcMain.handle('save-binding', (event, binding) => {
    const { accelerator, app: appName } = binding;
    // Validate accelerator format
    if (typeof accelerator !== 'string' || !accelerator.includes('+')) {
      throw new Error('Invalid accelerator format');
    }
    const existing = store.get('bindings', []).filter(b => b.accelerator !== accelerator);
    existing.push(binding);
    store.set('bindings', existing);
    registerShortcuts();
  });

  // Remove a binding by its accelerator
  ipcMain.handle('remove-binding', (event, accelerator) => {
    const filtered = (store.get('bindings', [])).filter(b => b.accelerator !== accelerator);
    store.set('bindings', filtered);
    registerShortcuts();
  });
});

// Catch any unhandled promise rejections
process.on('unhandledRejection', err => {
  console.error('Unhandled promise rejection:', err);
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
