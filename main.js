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
    const success = globalShortcut.register(accelerator, () => {
      let command;
      if (process.platform === 'darwin') {
        // macOS
        command = `open -a "${appName}"`;
      } else if (process.platform === 'linux') {
        // Linux (assuming .desktop file or executable in PATH)
        command = `${appName}`; 
      } else if (process.platform === 'win32') {
        // Windows
        command = `start "" "${appName}"`;
      }

      console.log(`Executing command for ${accelerator}:`, command);

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error launching ${appName}:`, error);
        }
      });
    });

    console.log(`  ${accelerator}: ${success ? 'OK' : 'FAIL'}`);
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
  // win.webContents.openDevTools(); // Uncomment to debug renderer
}

app.whenReady().then(() => {
  createWindow();
  registerShortcuts();

  ipcMain.handle('save-binding', (event, binding) => {
    const bindings = store.get('bindings', []);
    const filtered = bindings.filter(b => b.accelerator !== binding.accelerator);
    filtered.push(binding);
    store.set('bindings', filtered);
    registerShortcuts();
  });

  ipcMain.handle('remove-binding', (event, accelerator) => {
    const bindings = store.get('bindings', []);
    store.set('bindings', bindings.filter(b => b.accelerator !== accelerator));
    registerShortcuts();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
