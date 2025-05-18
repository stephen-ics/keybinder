// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getOpenApps:   () => ipcRenderer.invoke('get-open-apps'),
  getBindings:   () => ipcRenderer.invoke('get-bindings'),
  saveBinding:   (b) => ipcRenderer.invoke('save-binding', b),
  removeBinding: (a) => ipcRenderer.invoke('remove-binding', a),
});
