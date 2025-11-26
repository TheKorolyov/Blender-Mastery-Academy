const disp = document.getElementById('disp');
const out = document.getElementById('out'); // v .log-messages je element s id="out"
const outContainer = document.querySelector('.log-messages');
let buffer = '';
let ws = null;

// Pomocná struktura pro timeouts
const _pendingTimeouts = new Set();

// format času HH:MM:SS
function nowTime() {
  const d = new Date();
  return d.toLocaleTimeString();
}

// log(message, {type:'UI'|'WS'|'INFO'|'ERR', persist:false})
function log(message, opts = {}) {
  const type = opts.type || 'INFO';
  const persist = !!opts.persist;
  const line = document.createElement('div');
  line.className = 'log-line';
  line.dataset.type = type;
  line.innerHTML = `<span class="log-time">[${nowTime()}]</span> <span class="log-type">${type}</span> — <span class="log-msg">${escapeHtml(String(message))}</span>`;
  out.appendChild(line);
  // scroll kontejneru
  outContainer.scrollTop = outContainer.scrollHeight;
  if (!persist) {
    const tid = setTimeout(() => {
      if (line.parentNode) line.remove();
      _pendingTimeouts.delete(tid);
    }, 5000);
    line.dataset.tid = String(tid);
    _pendingTimeouts.add(tid);
  }
}

// jednoduché escapování pro bezpečnost
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// Vyčistit log: zruší timeouty a smaže obsah
document.getElementById('clearLog').addEventListener('click', () => {
  // zrušit naplánované timeouty
  for (const el of Array.from(out.children)) {
    if (el.dataset && el.dataset.tid) {
      clearTimeout(Number(el.dataset.tid));
    }
  }
  for (const tid of _pendingTimeouts) clearTimeout(tid);
  _pendingTimeouts.clear();
  out.innerHTML = '';
  log('Log vyčištěn', { type: 'INFO', persist: true });
});

// tlačítka keypad (pokud existují)
document.querySelectorAll('.key').forEach(k => {
  k.addEventListener('click', () => {
    const v = k.textContent.trim();
    k.classList.add('active');
    setTimeout(() => k.classList.remove('active'), 120);
    log(`Tlačítko: ${v}`, { type: 'UI' });
    if (v === 'CLR') {
      buffer = '';
      disp.textContent = buffer.padEnd(10, '-').substring(0, 10);
    } else if (v === 'ENT') {
      log(`ENTER → "${buffer}"`, { type: 'UI' });
      ws?.readyState === 1 && ws.send(JSON.stringify({ type: 'enter', value: buffer }));
      buffer = '';
      disp.textContent = ''.padEnd(10, '-');
    } else if (/^[0-9]$/.test(v)) {
      buffer += v;
      disp.textContent = buffer.padEnd(10, '-').substring(0, 10);
    } else {
      ws?.readyState === 1 && ws.send(JSON.stringify({ type: 'button', name: v }));
    }
  });
});

// malé tlačítka (panel-ops)
document.querySelectorAll('.panel-ops .btn.small, .btn.small').forEach(b => {
  b.addEventListener('click', () => {
    b.classList.add('pressed');
    setTimeout(() => b.classList.remove('pressed'), 140);
    const name = b.textContent.trim();
    log(`Panel button: ${name}`, { type: 'UI' });
    ws?.readyState === 1 && ws.send(JSON.stringify({ type: 'button', name }));
  });
});

// páčky (lever)
document.querySelectorAll('.lever').forEach(l => {
  l.addEventListener('click', () => {
    const on = l.classList.toggle('on');
    log(`Páčka ${l.id} → ${on ? 'ON' : 'OFF'}`, { type: 'UI' });
    ws?.readyState === 1 && ws.send(JSON.stringify({ type: 'lever', name: l.id, value: on }));
  });
});

// knoby (wheel)
function makeKnob(el, spanId, name) {
  let val = 0;
  const span = document.getElementById(spanId);
  el.addEventListener('wheel', e => {
    e.preventDefault();
    val = (val + (e.deltaY > 0 ? 10 : -10) + 360) % 360;
    if (span) span.textContent = String(val).padStart(3, '0');
    log(`${name} → ${val}°`, { type: 'UI' });
    ws?.readyState === 1 && ws.send(JSON.stringify({ type: 'knob', name: name.toLowerCase(), value: val }));
  });
}
const hdgEl = document.getElementById('hdg');
const crsEl = document.getElementById('crs');
if (hdgEl) makeKnob(hdgEl, 'hdgv', 'HDG');
if (crsEl) makeKnob(crsEl, 'crsv', 'CRS');

// WebSocket ovládání
document.getElementById('connect').onclick = () => {
  if (ws) {
    ws.close();
    ws = null;
    log('WS odpojen (manuálně)', { type: 'INFO' });
    return;
  }
  const url = document.getElementById('ws').value.trim();
  if (!url) { log('WS URL prázdné', { type: 'ERR' }); return; }
  try {
    ws = new WebSocket(url);
  } catch (err) {
    log(`Chyba při vytváření WS: ${err.message}`, { type: 'ERR', persist: true });
    return;
  }
  ws.onopen = () => log(`WS připojen: ${url}`, { type: 'WS', persist: true });
  ws.onmessage = e => {
    log(`DCS → ${e.data}`, { type: 'WS' });
    // pokus o parsování JSON pro lepší zobrazení
    try {
      const j = JSON.parse(e.data);
      // volitelně můžeme zvýraznit určité typy
      if (j.type) log(`(obj) type=${j.type} value=${JSON.stringify(j)}`, { type: 'WS' });
    } catch (err) { /* není JSON */ }
  };
  ws.onclose = () => { log('WS odpojen', { type: 'WS' }); ws = null; };
  ws.onerror = e => log('WS error', { type: 'ERR', persist: true });
};

// inicialní zpráva v logu
log('Panel připraven', { type: 'INFO', persist: true });
