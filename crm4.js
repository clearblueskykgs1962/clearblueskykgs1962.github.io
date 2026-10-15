function updateCounters() {
  const totalCalled = businesses.filter(b => getBS(b.id).callCount > 0).length;
  const mtgCount = businesses.filter(b => getBS(b.id).stat === 'MTG').length;
  const fuCount = businesses.filter(b => getBS(b.id).stat === 'FU').length;
  const vmCount = businesses.filter(b => getBS(b.id).stat === 'VM').length;

  document.getElementById('call-count').textContent = `${totalCalled}/${businesses.length} called`;
  document.getElementById('zoom-count').textContent = `Zooms: ${mtgCount}`;
  document.getElementById('fu-count').textContent = `FU: ${fuCount}`;
  if(document.getElementById('dash-total')) document.getElementById('dash-total').textContent = filtered.length;
  if(document.getElementById('dash-called')) document.getElementById('dash-called').textContent = totalCalled;
  if(document.getElementById('dash-mtg')) document.getElementById('dash-mtg').textContent = mtgCount;
  if(document.getElementById('dash-fu')) document.getElementById('dash-fu').textContent = fuCount;
  const pct = businesses.length ? (totalCalled / businesses.length * 100).toFixed(1) : 0;
  document.getElementById('dash-fill').style.width = pct + '%';

  const today = new Date().toLocaleDateString('en-US');
  const todayCount = businesses.reduce((n, b) => {
    const log = getBS(b.id).callLog || [];
    return n + log.filter(c => c.date === today).length;
  }, 0);
  document.getElementById('today-val').textContent = `${todayCount}/5`;
  const todayDots = document.getElementById('today-dots');
  todayDots.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const d = document.createElement('span');
    d.className = 'dot' + (i < todayCount ? ' done' : '');
    todayDots.appendChild(d);
  }

  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  let weekCount = 0;
  businesses.forEach(b => {
    const log = getBS(b.id).callLog || [];
    log.forEach(c => {
      const d = new Date(c.date);
      if (d >= startOfWeek) weekCount++;
    });
  });
  document.getElementById('week-val').textContent = `${weekCount}/25`;
  const weekDots = document.getElementById('week-dots');
  weekDots.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const d = document.createElement('span');
    d.className = 'dot' + (i < Math.floor(weekCount / 5) ? ' done' : '');
    weekDots.appendChild(d);
  }

  const curMonth = now.getMonth();
  const curYear = now.getFullYear();
  let monthCount = 0;
  businesses.forEach(b => {
    const log = getBS(b.id).callLog || [];
    log.forEach(c => {
      const d = new Date(c.date);
      if (d.getMonth() === curMonth && d.getFullYear() === curYear) monthCount++;
    });
  });
  document.getElementById('month-val').textContent = `${monthCount}/100`;
  const monthDots = document.getElementById('month-dots');
  monthDots.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const d = document.createElement('span');
    d.className = 'dot' + (i < Math.floor(monthCount / 20) ? ' done' : '');
    monthDots.appendChild(d);
  }
}

function buildTodayDots() {
  const el = document.getElementById('today-dots');
  for (let i = 0; i < 5; i++) {
    const d = document.createElement('span');
    d.className = 'dot';
    el.appendChild(d);
  }
}
function buildWeekDots() {
  const el = document.getElementById('week-dots');
  for (let i = 0; i < 5; i++) {
    const d = document.createElement('span');
    d.className = 'dot';
    el.appendChild(d);
  }
}
function buildMonthDots() {
  const el = document.getElementById('month-dots');
  for (let i = 0; i < 5; i++) {
    const d = document.createElement('span');
    d.className = 'dot';
    el.appendChild(d);
  }
}

function setupEvents() {
  document.getElementById('prev-btn').onclick = () => {
    if (currentIdx > 0) { currentIdx--; render(); }
  };
  document.getElementById('next-btn').onclick = () => {
    if (currentIdx < filtered.length - 1) { currentIdx++; render(); }
  };
  document.getElementById('biz-jump').onchange = e => {
    const n = parseInt(e.target.value) - 1;
    if (n >= 0 && n < filtered.length) { currentIdx = n; render(); }
  };
  document.addEventListener('keydown', e => {
    if (document.getElementById('search-modal').classList.contains('open')) return;
    if (e.key === 'ArrowLeft' && currentIdx > 0) { currentIdx--; render(); }
    if (e.key === 'ArrowRight' && currentIdx < filtered.length - 1) { currentIdx++; render(); }
  });

  document.querySelectorAll('.pill').forEach(p => {
    p.onclick = () => applyFilter(p.dataset.filter);
  });

  let notesTimer;
  document.getElementById('notes-field').oninput = e => {
    clearTimeout(notesTimer);
    notesTimer = setTimeout(() => {
      const biz = filtered[currentIdx];
      getBS(biz.id).notes = e.target.value;
      saveState();
    }, 500);
  };

  function getLogOutcome() {
    const active = document.querySelector('.ob.active');
    return active ? active.dataset.val : '';
  }
  function setLogDate(days) {
    const d = new Date(); d.setDate(d.getDate() + days);
    const el = document.getElementById('log-callback');
    if (el) el.value = d.toISOString().slice(0,10);
  }
  document.querySelectorAll('.ob').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.ob').forEach(function(b2){ b2.classList.remove('active'); });
      btn.classList.add('active');
      const val = btn.dataset.val;
      const cbRow = document.getElementById('callback-row');
      if (cbRow) cbRow.style.display = (val==='CB'||val==='FU') ? 'block' : 'none';
      const naEl = document.getElementById('log-next-action');
      if (naEl && btn.dataset.action) naEl.value = btn.dataset.action;
      if (val==='CB') setLogDate(3);
      if (val==='FU') setLogDate(7);
    });
  });
  document.querySelectorAll('.qs-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const biz = filtered[currentIdx];
      if (!biz) return;
      const bs = getBS(biz.id);
      const val = btn.dataset.val;
      bs.stat = val;
      saveState();
      document.querySelectorAll('.qs-btn').forEach(function(b2){ b2.classList.toggle('active', b2.dataset.val===val); });
    });
  });
  function doLog(goNext) {
    const outcome = getLogOutcome();
    if (!outcome) { alert('Tap an outcome button first (Follow Up, VM, etc.)'); return; }
    const biz = filtered[currentIdx];
    const bs = getBS(biz.id);
    const today = new Date().toLocaleDateString('en-US');
    bs.stat = outcome;
    bs.callCount = (bs.callCount || 0) + 1;
    bs.lastCallDate = today;
    bs.nextAction = document.getElementById('log-next-action').value;
    const cbEl = document.getElementById('log-callback');
    bs.callbackDate = cbEl ? cbEl.value : '';
    bs.callLog = bs.callLog || [];
    bs.callLog.push({
      date: today,
      outcome: outcome,
      notes: document.getElementById('log-notes').value,
      script: 'C' + activeScript
    });
    saveState();
    document.querySelectorAll('.qs-btn').forEach(function(b2){ b2.classList.toggle('active', b2.dataset.val===outcome); });
    document.getElementById('log-success').style.display = 'block';
    setTimeout(function(){ document.getElementById('log-success').style.display='none'; }, 1200);
    renderCallHistory();
    renderDashboard();
    updateCounters();
    const lc = document.getElementById('last-call-info');
    if (lc) lc.textContent = 'Last call: ' + today + '  ·  Total: ' + bs.callCount + ' call' + (bs.callCount===1?'':'s');
    const ctr = document.getElementById('script-call-counter');
    if (ctr) { const r = Math.min(bs.callCount+1,10); ctr.textContent='CALL #'+(bs.callCount+1)+' — Try C'+r; }
    const ccBadge = document.getElementById('biz-call-badge');
    if (ccBadge) { ccBadge.textContent='Called '+bs.callCount+' time'+(bs.callCount===1?'':'s'); ccBadge.style.color='#60a5fa'; ccBadge.style.background='#0d1f3c'; }
    if (goNext && currentIdx < filtered.length - 1) {
      setTimeout(function(){ currentIdx++; render(); }, 600);
    }
  }
  document.getElementById('log-btn').onclick = function(){ doLog(false); };
  document.getElementById('log-next-btn').onclick = function(){ doLog(true); };

  function openExpandModal(scriptNum) {
    const biz = filtered[currentIdx];
    if (!biz) return;
    const modal = document.getElementById('script-expand-modal');
    modal.style.display = 'block';
    document.getElementById('expand-script-title').textContent = `SCRIPT C${scriptNum}`;
    document.getElementById('expand-script-biz').textContent = `${biz.name}  ·  ${biz.contact || biz.principal || ''}  ·  ${biz.category || ''}`;
    document.getElementById('expand-my-number-badge').innerHTML = myNumberBadgeHTML();
    document.getElementById('expand-script-text').textContent = getScript(scriptNum, biz.category || 'Other', biz.contact || biz.principal || '', biz.city || 'Savannah');
    const tabs = document.getElementById('expand-script-tabs');
    tabs.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
      const btn = document.createElement('button');
      btn.textContent = `C${i}`;
      btn.style.cssText = `padding:4px 12px;border-radius:6px;border:1px solid;cursor:pointer;font-size:13px;font-weight:600;${i === scriptNum ? 'background:#7c3aed;border-color:#7c3aed;color:#fff' : 'background:#28395c;border-color:#3f5480;color:#94a3b8'}`;
      btn.onclick = () => openExpandModal(i);
      tabs.appendChild(btn);
    }
  }
  document.getElementById('expand-script-close').onclick = () => {
    document.getElementById('script-expand-modal').style.display = 'none';
  };
  document.getElementById('script-expand-modal').onclick = e => {
    if (e.target.id === 'script-expand-modal') document.getElementById('script-expand-modal').style.display = 'none';
  };
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.getElementById('script-expand-modal').style.display = 'none';
  }, true);

  document.getElementById('reschedule-modal').onclick = e => {
    if (e.target.id === 'reschedule-modal') closeReschedule();
  };
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('reschedule-modal').classList.contains('open')) closeReschedule();
  }, true);

  document.getElementById('city-select').onchange = e => {
    switchCity(e.target.value);
  };

  document.getElementById('search-btn').onclick = openSearch;
  document.getElementById('dash-list').addEventListener('click', function(e) {
    const qi = e.target.closest('.queue-item[data-bizid]');
    if (qi) jumpToQueueItem(qi.dataset.bizid);
  });
  document.getElementById('search-close').onclick = () => document.getElementById('search-modal').classList.remove('open');
  document.getElementById('search-modal').onclick = e => { if (e.target.id === 'search-modal') document.getElementById('search-modal').classList.remove('open'); };
  document.getElementById('search-input').oninput = e => {
    const q = e.target.value.toLowerCase();
    const res = document.getElementById('search-results');
    if (!q) { res.innerHTML = ''; return; }
    const hits = businesses.filter(b =>
      (b.name || '').toLowerCase().includes(q) ||
      (b.contact || '').toLowerCase().includes(q) ||
      (b.phone || '').toLowerCase().includes(q)
    ).slice(0, 20);
    res.innerHTML = hits.map(b => {
      const idx = filtered.findIndex(f => f.id === b.id);
      return `<div class="search-result" data-id="${b.id}" data-idx="${idx}">
        <div class="sr-name">${b.name}</div>
        <div class="sr-meta">${b.contact || ''} · ${b.phone || ''} · ${b.category || ''} ${idx >= 0 ? `· #${idx+1}` : '(filtered out)'}</div>
      </div>`;
    }).join('');
    res.querySelectorAll('.search-result').forEach(el => {
      el.onclick = () => {
        const idx = parseInt(el.dataset.idx);
        if (idx >= 0) { currentIdx = idx; render(); }
        else {
          applyFilter('all');
          const newIdx = filtered.findIndex(f => f.id === el.dataset.id);
          if (newIdx >= 0) { currentIdx = newIdx; render(); }
        }
        document.getElementById('search-modal').classList.remove('open');
      };
    });
  };

  document.getElementById('export-btn').onclick = exportCSV;
}

