const { ipcRenderer } = require('electron');

const accelInput = document.getElementById('accel');
const listenBtn  = document.getElementById('listenBtn');
const stopBtn    = document.getElementById('stopBtn');
const addBtn     = document.getElementById('addBtn');
const appSelect  = document.getElementById('appSelect');
const listEl     = document.getElementById('list');

let listening   = false;
let strokeParts = [];
let nonModCount = 0;
const MAX_KEYS  = 3;

// Start listening
listenBtn.onclick = () => {
  listening   = true;
  strokeParts = [];
  nonModCount = 0;
  accelInput.value = 'Listening…';
  accelInput.classList.add('listening');
};

// Stop listening
stopBtn.onclick = () => {
  listening = false;
  accelInput.classList.remove('listening');
};

// Capture key combo
window.addEventListener('keydown', e => {
  if (!listening) return;
  const mods = ['Control','Shift','Alt','Meta'];
  if (mods.includes(e.key)) return;
  e.preventDefault();

  if (nonModCount === 0) {
    if (e.ctrlKey)  strokeParts.push('Ctrl');
    if (e.shiftKey) strokeParts.push('Shift');
    if (e.altKey)   strokeParts.push('Alt');
    if (e.metaKey)  strokeParts.push('Command');
  }

  strokeParts.push(e.key.toUpperCase());
  nonModCount++;
  accelInput.value = strokeParts.join('+');

  if (nonModCount >= MAX_KEYS) {
    listening = false;
    accelInput.classList.remove('listening');
  }
});

// Populate dropdown of running apps
async function loadAppList() {
  const apps = await ipcRenderer.invoke('get-open-apps');
  appSelect.innerHTML = '';
  apps.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    appSelect.appendChild(opt);
  });
}
loadAppList();

// Render saved bindings
async function refreshList() {
  const bindings = await ipcRenderer.invoke('get-bindings');
  listEl.innerHTML = '';
  bindings.forEach(b => {
    const li = document.createElement('li');
    li.textContent = `${b.accelerator} - ${b.app} `;
    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.onclick = async () => {
      await ipcRenderer.invoke('remove-binding', b.accelerator);
      refreshList();
    };
    li.appendChild(btn);
    listEl.appendChild(li);
  });
}
refreshList();

// Add binding
addBtn.onclick = async () => {
  const accel   = accelInput.value;
  const appName = appSelect.value;
  await ipcRenderer.invoke('save-binding', { accelerator: accel, app: appName });
  accelInput.value = '';
  loadAppList();
  refreshList();
};