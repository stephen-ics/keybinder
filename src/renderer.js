const { ipcRenderer } = require('electron');

const accelInput   = document.getElementById('accel');
const listenBtn    = document.getElementById('listenBtn');
const stopBtn      = document.getElementById('stopBtn');
const addBtn       = document.getElementById('addBtn');
const appSelect    = document.getElementById('appSelect');
const searchApps   = document.getElementById('searchApps');
const manualToggle = document.getElementById('manualToggle');
const manualApp    = document.getElementById('manualApp');
const listEl       = document.getElementById('list');

let listening     = false;
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
  listening      = true;
  strokeParts.length = 0;
  accelInput.value   = 'Listening...';
  accelInput.classList.add('listening');
});

// Stop listening early
stopBtn.addEventListener('click', () => {
  listening = false;
  accelInput.classList.remove('listening');
});

// Toggle dropdown vs manual input
manualToggle.addEventListener('change', () => {
  const manual = manualToggle.checked;
  manualApp.style.display  = manual ? 'block' : 'none';
  searchApps.style.display = manual ? 'none' : 'block';
  appSelect.style.display  = manual ? 'none' : 'block';
});

// Capture key combo
window.addEventListener('keydown', e => {
  if (!listening) return;
  e.preventDefault();

  // 1) Handle modifier keys
  if (KEY_MAP[e.key]) {
    const name = KEY_MAP[e.key];
    if (!strokeParts.includes(name)) {
      strokeParts.push(name);
      accelInput.value = strokeParts.join('+');
    }
    return;
  }

  // 2) Handle letters, digits, numpad via e.code
  let displayKey;
  if (e.code.startsWith('Key')) {
    displayKey = e.code.slice(3);      // 'KeyA' → 'A'
  } else if (e.code.startsWith('Digit')) {
    displayKey = e.code.slice(5);      // 'Digit2' → '2'
  } else if (e.code.startsWith('Numpad')) {
    displayKey = e.code.slice(6);      // 'Numpad1' → '1'
  } else {
    // fallback (arrows, function keys, etc.)
    displayKey = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  }

  strokeParts.push(displayKey);
  accelInput.value = strokeParts.join('+');

  // Stop listening once we record the non-modifier
  listening = false;
  accelInput.classList.remove('listening');
});

// Populate & filter dropdown of running apps
async function loadAppList() {
  const apps = await ipcRenderer.invoke('get-open-apps');
  appSelect.innerHTML = '';
  apps.forEach(name => {
    const opt = document.createElement('option');
    opt.value       = name;
    opt.textContent = name;
    appSelect.appendChild(opt);
  });
}
loadAppList();

// Filter as you type
searchApps.addEventListener('input', () => {
  const filter = searchApps.value.toLowerCase();
  Array.from(appSelect.options).forEach(opt => {
    opt.hidden = !opt.value.toLowerCase().includes(filter);
  });
});

// Render saved bindings
async function refreshList() {
  const bindings = await ipcRenderer.invoke('get-bindings');
  listEl.innerHTML = '';
  bindings.forEach(b => {
    const li = document.createElement('li');
    li.textContent = `${b.accelerator} — ${b.app} `;

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
  const appName = manualToggle.checked
    ? manualApp.value.trim()
    : appSelect.value;

  if (!accel || !appName) return;  // require both
  await ipcRenderer.invoke('save-binding', {
    accelerator: accel,
    app: appName
  });

  // reset UI
  accelInput.value     = '';
  manualApp.value      = '';
  if (manualToggle.checked) manualToggle.checked = false;
  manualApp.style.display  = 'none';
  searchApps.style.display = 'block';
  appSelect.style.display  = 'block';

  loadAppList();
  refreshList();
});
