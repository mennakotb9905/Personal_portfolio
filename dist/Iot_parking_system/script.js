const AUTH_KEY = 'smartParkingAuth';
const THEME_KEY = 'smartParkingTheme';
const allowedUsers = Array.isArray(window.ALLOWED_USERS) ? window.ALLOWED_USERS : [];
let currentUser = null;

function applyTheme(theme) {
  const nextTheme = theme === 'light' ? 'light' : 'dark';
  document.body.dataset.theme = nextTheme;
  localStorage.setItem(THEME_KEY, nextTheme);
}

function toggleTheme() {
  applyTheme(document.body.dataset.theme === 'light' ? 'dark' : 'light');
}

function setLoginMessage(text, state = 'ready') {
  const msg = document.getElementById('loginMessage');
  if (!msg) return;
  msg.textContent = text;
  msg.className = `login-message ${state}`;
}

function showDashboard(user) {
  currentUser = user;
  const login = document.getElementById('loginScreen');
  const app = document.getElementById('appPage');
  if (login) login.classList.add('is-hidden');
  if (app) app.hidden = false;
  addLog('system', `Secure login accepted - ${user.name || user.username}`);
}

function showLogin() {
  currentUser = null;
  sessionStorage.removeItem(AUTH_KEY);
  const login = document.getElementById('loginScreen');
  const app = document.getElementById('appPage');
  if (login) login.classList.remove('is-hidden');
  if (app) app.hidden = true;
  setLoginMessage('Logged out. System ready for authentication.');
}

function setupLogin() {
  applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  document.getElementById('appThemeToggle')?.addEventListener('click', toggleTheme);
  document.getElementById('logoutBtn')?.addEventListener('click', showLogin);

  const savedUsername = sessionStorage.getItem(AUTH_KEY);
  const savedUser = allowedUsers.find(user => user.username === savedUsername);
  if (savedUser) showDashboard(savedUser);

  document.getElementById('loginForm')?.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    const username = form.username.value.trim();
    const password = form.password.value;
    const button = document.getElementById('loginBtn');
    const user = allowedUsers.find(item => item.username === username && item.password === password);

    button.disabled = true;
    button.classList.add('is-loading');
    setLoginMessage('Automation scan running... checking operator identity.', 'busy');

    window.setTimeout(() => {
      button.disabled = false;
      button.classList.remove('is-loading');
      if (!user) {
        setLoginMessage('Access denied. Check username/password in credentials.js.', 'error');
        form.classList.remove('shake');
        void form.offsetWidth;
        form.classList.add('shake');
        return;
      }
      sessionStorage.setItem(AUTH_KEY, user.username);
      setLoginMessage('Access granted. Loading dashboard...', 'success');
      window.setTimeout(() => showDashboard(user), 650);
    }, 1150);
  });
}

const TOTAL = 4;
const slotNames = ['A1','A2','B1','B2'];
let slots = [false,false,false,false];
let gateOpen = false;
const logs = [];

function now() {
  const d = new Date();
  return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0')+':'+d.getSeconds().toString().padStart(2,'0');
}

function addLog(type, text) {
  logs.unshift({type, text, time: now()});
  if(logs.length > 8) logs.pop();
  const colors = {entry:'#38bdf8',exit:'#fb7185',system:'#9fb4ce',mqtt:'#35d399',error:'#fb7185'};
  const list = document.getElementById('logList');
  list.innerHTML = '';
  logs.forEach(l => {
    const row = document.createElement('div');
    row.className = 'log-row';
    row.innerHTML = `<span class="log-dot" style="background:${colors[l.type]||'#9fb4ce'}"></span><span>${l.text}</span><span class="log-time">${l.time}</span>`;
    list.appendChild(row);
  });
}

function renderLot() {
  const g = document.getElementById('lotGrid');
  g.innerHTML = '';
  slots.forEach((occ,i) => {
    const d = document.createElement('div');
    d.className = 'slot '+(occ?'taken':'free');
    d.innerHTML = `<i class="ti ${occ?'ti-car':'ti-parking'}"></i><div class="slot-num">Slot ${slotNames[i]}</div><div class="slot-badge">${occ?'Occupied':'Free'}</div>`;
    g.appendChild(d);
  });
  const occ = slots.filter(Boolean).length;
  document.getElementById('fullBadge').style.display = occ===TOTAL ? 'inline-block' : 'none';
}

function updateUI(data) {
  const total = Number(data.total) || TOTAL;
  const rawAvailable = Number(data.available);
  const currentAvailable = total - slots.filter(Boolean).length;
  const available = Number.isFinite(rawAvailable) ? Math.max(0, Math.min(total, rawAvailable)) : currentAvailable;
  const gate = data.gate || 'Closed';
  const occ = total - available;
  document.getElementById('kAvail').textContent = available;
  document.getElementById('kOcc').textContent   = occ;
  document.getElementById('kCap').textContent   = Math.round(occ/total*100)+'%';
  document.getElementById('kGate').textContent  = gate;

  gateOpen = gate === 'Open';
  const ring = document.getElementById('gateRing');
  const lbl  = document.getElementById('gateLbl');
  const ico  = document.getElementById('gateIco');
  const hint = document.getElementById('gateHint');
  ring.className = 'gate-ring '+(gateOpen?'open':'closed');
  lbl.className  = 'gate-lbl ' +(gateOpen?'open':'closed');
  lbl.textContent  = gate;
  ico.className    = 'ti '+(gateOpen?'ti-gate':'ti-barrier-block');
  hint.textContent = gateOpen?'Vehicle passing through...':'Barrier secured';

  for(let i=0;i<TOTAL;i++) slots[i] = i >= available;
  renderLot();
  updateAssistant(available, total, gate);
}

function setConn(state, text) {
  const pill = document.getElementById('connPill');
  pill.className = 'conn-pill '+state;
  document.getElementById('connText').textContent = text;
}


addLog('system','Dashboard started - waiting for ESP32 data');

if (!window.mqtt) {
  setConn('error','MQTT library missing');
  addLog('error','MQTT library failed to load');
} else {
const client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', {
  clientId: 'parking_dash_'+Math.random().toString(16).slice(2,8),
  clean: true,
  reconnectPeriod: 3000,
  connectTimeout: 10000,
});

client.on('connect', () => {
  setConn('connected','Live - MQTT');
  addLog('system','Connected to HiveMQ broker');
  client.subscribe('parking/data', err => {
    if(!err) addLog('mqtt','Subscribed to parking/data');
    else addLog('error','Subscribe failed: '+err.message);
  });
});

client.on('message', (topic, message) => {
  const raw = message.toString();
  const mqttEl = document.getElementById('mqttPayload');
  if(mqttEl) mqttEl.textContent = raw;
  try {
    const data = JSON.parse(raw);
    updateUI(data);
    const total = Number(data.total) || TOTAL;
    const rawAvailable = Number(data.available);
    const available = Number.isFinite(rawAvailable) ? Math.max(0, Math.min(total, rawAvailable)) : total - slots.filter(Boolean).length;
    const gate = data.gate || 'Closed';
    addLog('mqtt','Data received - '+available+' slots free, gate '+gate);
  } catch(e) {
    addLog('error','Invalid JSON: '+raw);
  }
});

client.on('reconnect', () => setConn('connecting','Reconnecting...'));
client.on('error', (err) => {
  setConn('error','Connection error');
  addLog('error', err.message);
});
client.on('offline', () => setConn('error','Offline'));
}

function updateAssistant(available, total, gate) {
  const bestSlot = document.getElementById('bestSlot');
  const trafficMood = document.getElementById('trafficMood');
  const nextAction = document.getElementById('nextAction');
  if (!bestSlot || !trafficMood || !nextAction) return;

  const freeIndexes = slots.map((occupied, index) => occupied ? null : index).filter(index => index !== null);
  const usage = Math.round(((total - available) / total) * 100);
  bestSlot.textContent = freeIndexes.length ? `Slot ${slotNames[freeIndexes[0]]}` : 'No slot';
  trafficMood.textContent = usage >= 90 ? 'Critical' : usage >= 65 ? 'Busy soon' : 'Smooth';
  nextAction.textContent = available === 0 ? 'Hold entrance' : gate === 'Open' ? 'Guide vehicle now' : 'Ready for next car';
}

updateAssistant(TOTAL, TOTAL, 'Closed');
setupLogin();



