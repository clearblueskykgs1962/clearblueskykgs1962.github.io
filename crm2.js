function myNumberBadgeHTML() {
  return '<a href="tel:+1' + MY_CALLBACK_NUMBER + '" style="color:#4ade80;font-weight:700;text-decoration:none;background:#0d2218;border:1px solid #166534;padding:3px 12px;border-radius:10px;font-size:11px;white-space:nowrap">📞 Your line: ' + MY_CALLBACK_DISPLAY + ' (tap to call)</a>';
}

let activeScript = 1;
let state = {};

function loadState() {
  try { state = JSON.parse(localStorage.getItem('cj_state') || '{}'); } catch(e) { state = {}; }
}
function saveState() {
  localStorage.setItem('cj_state', JSON.stringify(state));
}
function getBS(id) {
  if (!state[id]) state[id] = {stat:'',notes:'',callLog:[],nextAction:'',callbackDate:'',lastCallDate:'',callCount:0};
  return state[id];
}

async function init() {
  loadState();
  buildTodayDots();
  buildWeekDots();
  buildMonthDots();
  try {
    const r = await fetch('./businesses.json');
    allBusinesses = await r.json();
  } catch(e) {
    document.getElementById('biz-name').textContent = 'Error loading businesses.json';
    return;
  }
  populateCitySelect();
  switchCity('Savannah');
  setupEvents();
  render();
}

function switchCity(city) {
  currentCity = city;
  businesses = allBusinesses.filter(b => b.city === city);
  const sampleBiz = businesses[0];
  const state = sampleBiz ? sampleBiz.state : '';
  const cityLabel = state ? `${city.toUpperCase()}, ${state.toUpperCase()}` : city.toUpperCase();
  document.getElementById('biz-panel-header').querySelector('span').textContent = '🏢 ' + cityLabel + ' — BUSINESS';
  document.getElementById('biz-jump').max = businesses.length;
  applyFilter('all');
}

function populateCitySelect() {
  const sel = document.getElementById('city-select');
  sel.innerHTML = '';
  const cityMeta = {};
  allBusinesses.forEach(b => {
    if (!b.city) return;
    if (!cityMeta[b.city]) cityMeta[b.city] = { state: b.state || '', count: 0 };
    cityMeta[b.city].count++;
  });
  const stateOrder = ['GA', 'ID'];
  const states = Object.keys(
    Object.values(cityMeta).reduce((acc, m) => { acc[m.state || 'Other'] = true; return acc; }, {})
  ).sort((a, b) => {
    const ai = stateOrder.indexOf(a), bi = stateOrder.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
  const stateNames = { GA: 'Georgia', ID: 'Idaho', UT: 'Utah' };
  states.forEach(st => {
    const citiesInState = Object.keys(cityMeta)
      .filter(c => (cityMeta[c].state || 'Other') === st)
      .sort((a, b) => cityMeta[b].count - cityMeta[a].count);
    const optgroup = document.createElement('optgroup');
    optgroup.label = stateNames[st] || st;
    citiesInState.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = `${c}, ${st} (${cityMeta[c].count})`;
      optgroup.appendChild(opt);
    });
    sel.appendChild(optgroup);
  });
}

function applyFilter(f) {
  currentFilter = f;
  document.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p.dataset.filter === f));
  if (f === 'all') {
    filtered = [...businesses];
  } else if (f === '') {
    filtered = businesses.filter(b => !getBS(b.id).stat);
  } else {
    filtered = businesses.filter(b => getBS(b.id).stat === f);
  }
  currentIdx = 0;
  render();
}

function render() {
  if (!filtered.length) { document.getElementById('biz-name').textContent = 'No businesses'; return; }
  const biz = filtered[currentIdx];
  const bs = getBS(biz.id);

  document.getElementById('biz-jump').value = currentIdx + 1;
  document.getElementById('biz-position').textContent = `${currentIdx + 1} / ${filtered.length}`;

  const categoryDisplay = biz.city === 'Rexburg' && biz.scriptBucket 
    ? `${(biz.category || 'Other').toUpperCase()} · ${(biz.scriptBucket).toUpperCase()}`
    : (biz.category || 'Other').toUpperCase();
  document.getElementById('biz-category-badge').textContent = categoryDisplay;
  document.getElementById('biz-name').textContent = biz.name || '(No Name)';
  document.getElementById('biz-num-display').textContent = `${currentIdx + 1} / ${filtered.length}`;
  const contactName = biz.contact || biz.principal || '';
  document.getElementById('biz-contact-row').textContent = contactName ? `${contactName} · ${biz.title || ''}` : '';

  const phoneArea = document.getElementById('phone-area');
  const rawPhone = (biz.phone || '').replace(/\D/g, '');
  if (rawPhone.length >= 10) {
    const digits = rawPhone.length === 11 ? rawPhone.slice(1) : rawPhone;
    phoneArea.innerHTML = `<a class="phone-btn" href="zoomphonecall:+1${digits}">
      📞 ${biz.phone} <span class="gvoice">Zoom →</span>
    </a>`;
  } else {
    phoneArea.innerHTML = `<div class="no-phone">📞 ${biz.phone || 'No phone on file'}</div>`;
  }

  const ccBadge = document.getElementById('biz-call-badge');
  if (ccBadge) {
    const cc2 = bs.callCount || 0;
    ccBadge.textContent = cc2 === 0 ? 'NEW — Never Called' : 'Called ' + cc2 + ' time' + (cc2===1?'':'s');
    ccBadge.style.background = cc2 === 0 ? '#0d2218' : '#0d1f3c';
    ccBadge.style.color = cc2 === 0 ? '#4ade80' : '#60a5fa';
  }
  const intelEl = document.getElementById('biz-intel');
  if (intelEl) {
    const chips = [];
    if (biz.credit_score) chips.push('<span class="intel-chip blue">Credit: ' + biz.credit_score + '</span>');
    if (biz.employee_size) chips.push('<span class="intel-chip">Employees: ' + biz.employee_size + '</span>');
    if (biz.sales_volume) chips.push('<span class="intel-chip green">Sales: $' + Number(biz.sales_volume).toLocaleString() + '</span>');
    intelEl.innerHTML = chips.join('');
  }
  document.querySelectorAll('.qs-btn').forEach(function(b2) {
    b2.classList.toggle('active', b2.dataset.val === (bs.stat || ''));
  });
  document.getElementById('notes-field').value = bs.notes || '';
  const lc = document.getElementById('last-call-info');
  if (lc) {
    if (bs.lastCallDate) {
      lc.textContent = 'Last call: ' + bs.lastCallDate + '  ·  Total: ' + (bs.callCount || 0) + ' call' + ((bs.callCount||0)===1?'':'s');
    } else {
      lc.textContent = 'Not yet called';
    }
  }

  activeScript = Math.min((bs.callCount || 0) + 1, 10);
  renderScriptTabs();
  renderScript();

  document.querySelectorAll('.ob').forEach(function(b2){ b2.classList.remove('active'); });
  const cbRow = document.getElementById('callback-row');
  if (cbRow) cbRow.style.display = 'none';
  document.getElementById('log-notes').value = '';
  document.getElementById('log-next-action').value = bs.nextAction || '';
  const cbEl = document.getElementById('log-callback');
  if (cbEl) cbEl.value = bs.callbackDate || '';
  document.getElementById('log-success').style.display = 'none';
  renderCallHistory();
  const todayBadge = document.getElementById('log-today-count');
  if (todayBadge) {
    const todayStr = new Date().toLocaleDateString('en-US');
    let cnt = 0;
    allBusinesses.forEach(function(b2){ const s2=getBS(b2.id); if(s2.lastCallDate===todayStr) cnt++; });
    if (cnt > 0) { todayBadge.textContent = cnt + ' logged today'; todayBadge.style.display = 'inline'; }
    else { todayBadge.style.display = 'none'; }
  }

  renderDashboard();
  updateCounters();
}

function renderScriptTabs() {
  const biz = filtered[currentIdx];
  const bs = biz ? getBS(biz.id) : null;
  const recommended = bs ? Math.min((bs.callCount || 0) + 1, 10) : 1;
  const tabs = document.getElementById('script-tabs');
  tabs.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.className = 'stab' + (i === activeScript ? ' active' : '');
    btn.textContent = i === recommended ? 'C' + i + '★' : 'C' + i;
    if (i === recommended) { btn.style.borderColor = '#a78bfa'; btn.style.color = '#a78bfa'; }
    btn.onclick = () => { activeScript = i; renderScriptTabs(); renderScript(); };
    tabs.appendChild(btn);
  }
}

function renderScript() {
  const biz = filtered[currentIdx];
  if (!biz) return;
  const bs = getBS(biz.id);
  const cc = bs.callCount || 0;
  const recommended = Math.min(cc + 1, 10);
  document.getElementById('script-num-label').textContent = 'SCRIPT C' + activeScript;
  document.getElementById('my-number-badge').innerHTML = myNumberBadgeHTML();
  document.getElementById('rec-badge').style.display = (activeScript === recommended) ? 'inline' : 'none';
  document.getElementById('script-text').textContent = getScript(activeScript, biz.category || 'Other', biz.contact || biz.principal || '', biz.city || 'Savannah');
  const ctr = document.getElementById('script-call-counter');
  if (ctr) {
    ctr.textContent = cc === 0 ? 'FIRST CALL — Use C1' : 'CALL #' + (cc + 1) + ' — Try C' + recommended;
  }
  const catLbl = document.getElementById('script-category-label');
  if (catLbl) catLbl.textContent = biz.category || 'Other';
  const hookBar = document.getElementById('script-hook-bar');
  if (hookBar) {
    const hd = HOOKS[biz.category] || HOOKS['Other'];
    if (hd && hd.hook) { hookBar.textContent = '📌 ' + hd.hook; hookBar.style.display = 'block'; }
    else { hookBar.style.display = 'none'; }
  }
}

