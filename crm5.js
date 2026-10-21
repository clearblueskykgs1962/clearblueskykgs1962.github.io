function openSearch() {
  document.getElementById('search-modal').classList.add('open');
  setTimeout(() => document.getElementById('search-input').focus(), 50);
}

function exportCSV() {
  const rows = [['ID','Name','Phone','Contact','Title','Category','Status','Last Call','Call Count','Notes','Next Action','Callback Date']];
  businesses.forEach(b => {
    const bs = getBS(b.id);
    rows.push([b.id, b.name, b.phone, b.contact, b.title, b.category,
      bs.stat || '', bs.lastCallDate || '', bs.callCount || 0,
      (bs.notes || '').replace(/,/g,''), bs.nextAction || '', bs.callbackDate || '']);
  });
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
  a.download = `savannah-caller-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

function toggleExpandPanel(panelId) {
  const panels = document.getElementById('panels');
  const panel = document.getElementById(panelId);
  const isAlreadyExpanded = panel.classList.contains('panel-expanded');
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('panel-expanded'));
  panels.classList.remove('panel-expand-mode');
  document.getElementById('collapse-btn').style.display = 'none';
  if (!isAlreadyExpanded) {
    panel.classList.add('panel-expanded');
    panels.classList.add('panel-expand-mode');
    document.getElementById('collapse-btn').style.display = 'flex';
  }
}
function collapsePanel() {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('panel-expanded'));
  document.getElementById('panels').classList.remove('panel-expand-mode');
  document.getElementById('collapse-btn').style.display = 'none';
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('panels').classList.contains('panel-expand-mode')) {
    collapsePanel();
  }
});

init();

// Zoom Phone click-to-call helper.
// Business phone links use zoomphonecall:+1XXXXXXXXXX which the Zoom desktop app registers.
// On every click we show a small confirmation bar with a Copy button and a plain tel: fallback,
// so a click never silently does nothing (e.g. Zoom not installed / not signed in on this device).
(function () {
  var bar, timer;
  var ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ENT[c]; }); }
  function pretty(num) {
    var d = num.replace(/\D/g, '').slice(-10);
    return d.length === 10 ? d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6) : num;
  }
  function hide() { if (bar) { bar.style.display = 'none'; } }
  function show(num) {
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'zoom-call-bar';
      bar.setAttribute('role', 'status');
      bar.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99999;' +
        'background:#1e293b;color:#f8fafc;border:2px solid #22c55e;border-radius:12px;padding:10px 14px;' +
        'font:600 14px system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.45);display:flex;gap:10px;' +
        'align-items:center;flex-wrap:wrap;max-width:94vw';
      document.body.appendChild(bar);
    }
    var pn = pretty(num);
    bar.innerHTML = '<span>📞 Opening Zoom Phone for ' + esc(pn) + '…</span>' +
      '<button type="button" id="zcb-copy" style="background:#22c55e;color:#04210f;border:0;border-radius:8px;padding:6px 10px;font-weight:700;cursor:pointer">Copy number</button>' +
      '<a href="tel:+1' + esc(pn.replace(/\D/g, '')) + '" style="color:#7dd3fc;font-size:12px">Not opening? Use phone app</a>' +
      '<button type="button" id="zcb-x" aria-label="Close" style="background:none;border:0;color:#94a3b8;font-size:18px;cursor:pointer">×</button>';
    bar.style.display = 'flex';
    bar.querySelector('#zcb-x').onclick = hide;
    bar.querySelector('#zcb-copy').onclick = function () {
      var t = pn, b = this;
      function done() { b.textContent = 'Copied ✓'; }
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).then(done, done); } else { done(); }
    };
    clearTimeout(timer);
    timer = setTimeout(hide, 9000);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="zoomphonecall:"]');
    if (a) { show(a.getAttribute('href').replace('zoomphonecall:', '')); }
  }, true);
})();
