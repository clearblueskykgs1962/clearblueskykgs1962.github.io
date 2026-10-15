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
