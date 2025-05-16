const { ipcRenderer } = require('electron');

// UI elements
const accelInput = document.getElementById('accel');
const listenBtn  = document.getElementById('listenBtn');
const stopBtn    = document.getElementById('stopBtn');
const addBtn     = document.getElementById('addBtn');
const appInput   = document.getElementById('appName');
const listEl     = document.getElementById('list');

let listening     = false;
let strokeParts   = [];
let nonModCount   = 0;
const MAX_KEYS    = 3;

// Start listening
listenBtn.onclick = () => {
  listening   = true;
  strokeParts = [];
  nonModCount = 0;
  accelInput.value = 'Listening...';
  accelInput.classList.add('listening');
};

// Stop listening manually
stopBtn.onclick = () => {
  listening = false;
  accelInput.classList.remove('listening');
};

// Capture key combo
window.addEventListener('keydown', e => {
  if (!listening) return;

  const mods = ['Control','Shift','Alt','Meta'];
  if (mods.includes(e.key)) return;  // ignore pure modifier presses

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

  // Stop automatically after MAX_KEYS
  if (nonModCount >= MAX_KEYS) {
    listening = false;
    accelInput.classList.remove('listening');
  }
});

// Fetch & render bindings list
async function refreshList() {
  const bindings = await ipcRenderer.invoke('get-bindings');
  listEl.innerHTML = '';
  bindings.forEach(b => {
    const li = document.createElement('li');
    li.textContent = `${b.accelerator} -> ${b.app} `;
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

// Add binding
addBtn.onclick = async () => {
  const accel   = accelInput.value;
  const appName = appInput.value;
  await ipcRenderer.invoke('save-binding', { accelerator: accel, app: appName });
  accelInput.value = '';
  appInput.value   = '';
  refreshList();
};

// Initial load
refreshList();
