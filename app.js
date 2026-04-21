/* ═══════════════════════════════════════
   N3T::PROXY — app.js
   ═══════════════════════════════════════ */

'use strict';

/* ── Config ── */
const PROXY = 'https://proxy.ikunbeautiful.workers.dev/?url=';

const QUICK_TARGETS = [
  { label: '> GOOGLE',      url: 'https://google.com' },
  { label: '> YOUTUBE',     url: 'https://youtube.com' },
  { label: '> GITHUB',      url: 'https://github.com' },
  { label: '> ZAPGAMES',    url: 'https://zapgames.io' },
  { label: '> REDDIT',      url: 'https://reddit.com' },
  { label: '> PROXYORB',    url: 'https://proxyorb.com/tr/proxy-site' },
  { label: '> ZEN BROWSER', url: 'https://github.com/zen-browser/desktop/releases/latest/download/zen.installer.exe' },
  { label: '> WIKIPEDIA',   url: 'https://wikipedia.org' },
  { label: '> CHATGPT',     url: 'https://chat.openai.com' },
];

const DEFAULT_BOOKMARKS = [
  { name: 'Google',    url: 'https://google.com',    icon: '🔍' },
  { name: 'YouTube',   url: 'https://youtube.com',   icon: '▶' },
  { name: 'GitHub',    url: 'https://github.com',    icon: '◈' },
  { name: 'Reddit',    url: 'https://reddit.com',    icon: '◉' },
  { name: 'Wikipedia', url: 'https://wikipedia.org', icon: '◎' },
];

/* ── Storage helpers ── */
const store = {
  get: (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set: (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch {}
  },
};

/* ── State ── */
let history   = store.get('n3t_hist', []);
let bookmarks = store.get('n3t_bm',   DEFAULT_BOOKMARKS);

/* ── DOM refs ── */
const urlInput   = document.getElementById('url-input');
const goBtn      = document.getElementById('go-btn');
const cmdHint    = document.getElementById('cmd-hint');
const quickGrid  = document.getElementById('quick-grid');
const logBox     = document.getElementById('log-box');
const bmGrid     = document.getElementById('bm-grid');
const bmNameInp  = document.getElementById('bm-name');
const bmUrlInp   = document.getElementById('bm-url');
const bmAddBtn   = document.getElementById('bm-add-btn');
const histList   = document.getElementById('hist-list');
const histCount  = document.getElementById('hist-count');
const histClear  = document.getElementById('hist-clear');
const sbVisits   = document.getElementById('sb-visits');
const sbBmarks   = document.getElementById('sb-bookmarks');
const sysTime    = document.getElementById('sys-time');
const toast      = document.getElementById('toast');
const tabsNav    = document.querySelectorAll('.nav-btn');

/* ── Clock ── */
function updateClock() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  sysTime.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
setInterval(updateClock, 1000);
updateClock();

/* ── Toast ── */
let toastTimer;
function showToast(msg, isErr = false) {
  toast.textContent = msg;
  toast.className = 'toast show' + (isErr ? ' err-toast' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 2800);
}

/* ── Log ── */
function addLog(type, msg) {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = msg;
  logBox.appendChild(entry);
  logBox.scrollTop = logBox.scrollHeight;
  if (logBox.children.length > 40) logBox.children[0].remove();
}

/* ── Navigation ── */
function navigate(rawUrl) {
  let url = rawUrl.trim();
  if (!url) {
    addLog('warn', '[WARN] No target specified.');
    showToast('[WARN] URL boş bırakılamaz', true);
    return;
  }
  if (!url.startsWith('http')) url = 'https://' + url;

  let host = url;
  try { host = new URL(url).hostname; } catch {}

  addLog('nav', `[CONNECT] >> ${url}`);

  /* Save history */
  history = history.filter(h => h.url !== url);
  history.unshift({ url, ts: Date.now() });
  history = history.slice(0, 50);
  store.set('n3t_hist', history);

  renderHistory();
  updateStatusBar();

  /* Hint update */
  cmdHint.textContent = `> Last target: ${host} — connection routed`;

  /* Open */
  window.open(PROXY + encodeURIComponent(url), '_blank', 'noopener');

  setTimeout(() => {
    addLog('ok', `[OK] Tunnel opened → ${host}`);
  }, 320);

  showToast(`[OK] Routing to ${host}`);
}

/* ── Set URL input ── */
function setUrl(url) {
  urlInput.value = url;
  urlInput.focus();
  addLog('info', `[SELECT] Target set: ${url}`);
}

/* ── Quick targets ── */
function renderQuickTargets() {
  quickGrid.innerHTML = '';
  QUICK_TARGETS.forEach(qt => {
    const btn = document.createElement('button');
    btn.className = 'qt-btn';
    btn.textContent = qt.label;
    btn.addEventListener('click', () => setUrl(qt.url));
    quickGrid.appendChild(btn);
  });
}

/* ── Bookmarks ── */
function renderBookmarks() {
  bmGrid.innerHTML = '';

  if (!bookmarks.length) {
    bmGrid.innerHTML = '<div class="bm-empty">> No bookmarks registered. Add one above.</div>';
    return;
  }

  bookmarks.forEach((bm, i) => {
    let host = bm.url;
    try { host = new URL(bm.url).hostname; } catch {}

    const card = document.createElement('div');
    card.className = 'bm-card';
    card.innerHTML = `
      <div class="bm-icon">${bm.icon || '◈'}</div>
      <div class="bm-info">
        <div class="bm-name">${bm.name}</div>
        <div class="bm-host">${host}</div>
      </div>
      <button class="bm-del" title="Remove" data-i="${i}">✕</button>
    `;

    card.addEventListener('click', e => {
      if (e.target.classList.contains('bm-del')) return;
      navigate(bm.url);
    });

    card.querySelector('.bm-del').addEventListener('click', e => {
      e.stopPropagation();
      bookmarks.splice(i, 1);
      store.set('n3t_bm', bookmarks);
      renderBookmarks();
      updateStatusBar();
      addLog('warn', `[DEL] Bookmark removed: ${bm.name}`);
      showToast(`[DEL] ${bm.name} silindi`);
    });

    bmGrid.appendChild(card);
  });
}

function addBookmark() {
  const name = bmNameInp.value.trim();
  let   url  = bmUrlInp.value.trim();

  if (!name || !url) {
    showToast('[ERR] Name and URL required', true);
    addLog('err', '[ERR] Bookmark save failed: missing fields');
    return;
  }
  if (!url.startsWith('http')) url = 'https://' + url;

  /* Deduplicate */
  if (bookmarks.some(b => b.url === url)) {
    showToast('[WARN] Already bookmarked', true);
    return;
  }

  const icons = ['◈','◉','◎','◆','◇','▲','▶','★','✦','⬡'];
  const icon  = icons[bookmarks.length % icons.length];

  bookmarks.push({ name, url, icon });
  store.set('n3t_bm', bookmarks);
  renderBookmarks();
  updateStatusBar();

  bmNameInp.value = '';
  bmUrlInp.value  = '';

  addLog('ok', `[SAVE] Bookmark added: ${name}`);
  showToast(`[SAVE] ${name} kaydedildi`);
}

/* ── History ── */
function formatTime(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return 'NOW';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

function renderHistory() {
  histList.innerHTML = '';
  histCount.textContent = `${history.length} records`;

  if (!history.length) {
    histList.innerHTML = '<div class="hist-empty">> No connections logged.</div>';
    return;
  }

  history.forEach((item, i) => {
    let host = item.url;
    try { host = new URL(item.url).hostname; } catch {}
    const favicon = `https://www.google.com/s2/favicons?domain=${host}&sz=32`;

    const li = document.createElement('li');
    li.className = 'hist-item';
    li.innerHTML = `
      <span class="hist-idx">${String(i + 1).padStart(2, '0')}</span>
      <div class="hist-fav"><img src="${favicon}" onerror="this.style.display='none'" alt="" /></div>
      <a class="hist-link" href="${PROXY + encodeURIComponent(item.url)}" target="_blank" rel="noopener">${item.url}</a>
      <span class="hist-time">${formatTime(item.ts)}</span>
      <button class="hist-del" data-i="${i}">✕</button>
    `;

    li.querySelector('.hist-del').addEventListener('click', () => {
      history.splice(i, 1);
      store.set('n3t_hist', history);
      renderHistory();
      updateStatusBar();
    });

    histList.appendChild(li);
  });
}

/* ── Status bar ── */
function updateStatusBar() {
  sbVisits.textContent  = history.length;
  sbBmarks.textContent  = bookmarks.length;
}

/* ── Tab switching ── */
tabsNav.forEach(btn => {
  btn.addEventListener('click', () => {
    tabsNav.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`panel-${btn.dataset.panel}`).classList.add('active');
  });
});

/* ── Events ── */
goBtn.addEventListener('click', () => navigate(urlInput.value));
urlInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') navigate(urlInput.value);
});

bmAddBtn.addEventListener('click', addBookmark);
bmUrlInp.addEventListener('keydown', e => { if (e.key === 'Enter') addBookmark(); });
bmNameInp.addEventListener('keydown', e => { if (e.key === 'Enter') bmUrlInp.focus(); });

histClear.addEventListener('click', () => {
  if (!history.length) return;
  history = [];
  store.set('n3t_hist', history);
  renderHistory();
  updateStatusBar();
  addLog('warn', '[PURGE] Connection log cleared');
  showToast('[PURGE] Geçmiş temizlendi');
});

/* ── Keyboard shortcut ── */
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    /* Switch to search tab */
    tabsNav.forEach(b => b.classList.remove('active'));
    tabsNav[0].classList.add('active');
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-search').classList.add('active');
    urlInput.focus();
  }
});

/* ── Canvas background grid ── */
(function initGrid() {
  const canvas = document.getElementById('grid-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  let offset = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const spacing = 40;
    ctx.strokeStyle = 'rgba(0,255,65,0.06)';
    ctx.lineWidth   = 0.5;

    /* Vertical lines */
    for (let x = 0; x < canvas.width; x += spacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    /* Horizontal lines with scroll offset */
    for (let y = (offset % spacing) - spacing; y < canvas.height; y += spacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    /* Moving scan line */
    const scanY = (offset * 0.4) % canvas.height;
    const grad  = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60);
    grad.addColorStop(0,   'rgba(0,255,65,0)');
    grad.addColorStop(0.5, 'rgba(0,255,65,0.06)');
    grad.addColorStop(1,   'rgba(0,255,65,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, scanY - 60, canvas.width, 120);

    offset += 0.4;
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ── Init ── */
renderQuickTargets();
renderBookmarks();
renderHistory();
updateStatusBar();

addLog('info', `[INIT] Session started — ${new Date().toLocaleTimeString()}`);
