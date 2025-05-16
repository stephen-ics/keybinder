const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store({ name: 'bindings' });
const listEl = document.getElementById('list');

function refreshList() {
  const bindings = store.get('bindings', []);
  listEl.innerHTML = '';
  bindings.forEach(b => {
    const li = document.createElement('li');
    li.textContent = `${b.accelerator} → ${b.app}`;
    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.onclick = () => ipcRenderer.invoke('remove-binding', b.accelerator).then(refreshList);
    li.appendChild(btn);
    listEl.appendChild(li);
  });
}

document.getElementById('addBtn').onclick = () => {
  const accel = document.getElementById('accel').value;
  const appName = document.getElementById('appName').value;
  ipcRenderer.invoke('save-binding', { accelerator: accel, app: appName }).then(refreshList);
};

refreshList();