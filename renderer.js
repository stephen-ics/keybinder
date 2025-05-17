// renderer.js
const { ipcRenderer } = require('electron');

const accelInput = document.getElementById('accel');
const listenBtn  = document.getElementById('listenBtn');
const stopBtn    = document.getElementById('stopBtn');
const addBtn     = document.getElementById('addBtn');
const appSelect  = document.getElementById('appSelect');
const listEl     = document.getElementById('list');

let listening    = false;
const strokeParts = [];

// Map DOM KeyboardEvent.key to display names for modifiers
const KEY_MAP = {
  Control: 'Ctrl',
  Shift:   'Shift',
  Alt:     'Alt',
  Meta:    'Command'
};

// Start listening
listenBtn.addEventListener('click', () => {
  listening = true;
  strokeParts.length = 0;
  accelInput.value = 'Listening...';
  accelInput.classList.add('listening');
});

// Stop listening
stopBtn.addEventListener('click', () => {
  listening = false;
  accelInput.classList.remove('listening');
});

window.addEventListener('keydown', e => {
  if (!listening) return;
  e.preventDefault();

  const key = e.key;

  // 1) Handle modifier keys
  if (KEY_MAP[key]) {
    const name = KEY_MAP[key];
    if (!strokeParts.includes(name)) {
      strokeParts.push(name);
      accelInput.value = strokeParts.join('+');
    }
    return;
  }

  // 2) Handle letter and digit keys by e.code
  let displayKey;
  if (e.code.startsWith('Key')) {
    // 'KeyA' → 'A'
    displayKey = e.code.slice(3);
  } else if (e.code.startsWith('Digit')) {
    // 'Digit2' → '2'
    displayKey = e.code.slice(5);
  } else if (e.code.startsWith('Numpad')) {
    // 'Numpad1' → '1'
    displayKey = e.code.slice(6);
  } else {
    // Fallback for other keys (arrows, F1, etc.)
    displayKey = key.length === 1 ? key.toUpperCase() : key;
  }

  strokeParts.push(displayKey);
  accelInput.value = strokeParts.join('+');

  // Stop listening once a non-modifier is recorded
  listening = false;
  accelInput.classList.remove('listening');
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
    btn.addEventListener('click', async () => {
      await ipcRenderer.invoke('remove-binding', b.accelerator);
      refreshList();
    });
    li.appendChild(btn);
    listEl.appendChild(li);
  });
}
refreshList();

// Add new binding
addBtn.addEventListener('click', async () => {
  const accel   = accelInput.value;
  const appName = appSelect.value;
  if (!accel) return;
  await ipcRenderer.invoke('save-binding', { accelerator: accel, app: appName });
  accelInput.value = '';
  loadAppList();
  refreshList();
});
