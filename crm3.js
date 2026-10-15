function renderCallHistory() {
  const biz = filtered[currentIdx];
  const bs = getBS(biz.id);
  const el = document.getElementById('call-history-mini');
  if (!bs.callLog || !bs.callLog.length) { el.innerHTML = '<div style="color:#64748b;font-size:12px">No call history yet</div>'; return; }
  const recent = [...bs.callLog].reverse().slice(0, 3);
  el.innerHTML = '<div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Recent Calls</div>' +
    recent.map(c => `<div style="font-size:12px;color:#94a3b8;padding:3px 0;border-bottom:1px solid #28395c">
      <strong style="color:#e2e8f0">${c.outcome}</strong> · ${c.date} ${c.notes ? '· '+c.notes.slice(0,40) : ''}
    </div>`).join('');
}

function renderDashboard() { renderTickler(); }

function defaultAction(stat) {
  const m = {FU:'Follow up',CB:'Call back',VM:'Left voicemail — follow up',MTG:'Zoom scheduled',NA:'No answer — try again',DNC:'Do not call'};
  return m[stat] || '';
}

function todayStr() {
  return new Date().toLocaleDateString('en-US');
}

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str.includes('-') ? str : str.split('/').reduce((a,v,i)=>i===2?v+'-'+(a||''):a+'/'+v, ''));
  return isNaN(d.getTime()) ? null : d;
}

function daysBetween(dateStr) {
  if (!dateStr) return null;
  const d = parseDate(dateStr);
  if (!d) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  d.setHours(0,0,0,0);
  return Math.round((d - today) / 86400000);
}

let _rescheduleId = null;
function showReschedule(bizId) {
  _rescheduleId = bizId;
  const b = allBusinesses.find(x => x.id === bizId);
  const bs = getBS(bizId);
  document.getElementById('reschedule-biz-name').textContent = b ? b.name : bizId;
  let iso = '';
  if (bs.callbackDate) {
    const d = parseDate(bs.callbackDate);
    if (d) iso = d.toISOString().split('T')[0];
  }
  if (!iso) {
    const t = new Date(); iso = t.toISOString().split('T')[0];
  }
  document.getElementById('reschedule-date').value = iso;
  document.getElementById('reschedule-modal').classList.add('open');
}
function setRescheduleDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  document.getElementById('reschedule-date').value = d.toISOString().split('T')[0];
}
function closeReschedule() {
  document.getElementById('reschedule-modal').classList.remove('open');
  _rescheduleId = null;
}
function saveReschedule() {
  if (!_rescheduleId) return;
  const iso = document.getElementById('reschedule-date').value;
  if (!iso) { closeReschedule(); return; }
  const d = new Date(iso);
  const bs = getBS(_rescheduleId);
  bs.callbackDate = d.toLocaleDateString('en-US');
  saveState();
  renderTickler();
  updateCounters();
  closeReschedule();
}
function ticklerDismiss() {
  if (!_rescheduleId) return;
  const bs = getBS(_rescheduleId);
  bs.callbackDate = '';
  bs.nextAction = '';
  saveState();
  renderTickler();
  updateCounters();
  closeReschedule();
}
function ticklerDone(bizId, e) {
  if (e) e.stopPropagation();
  const bs = getBS(bizId);
  bs.callbackDate = '';
  bs.nextAction = '';
  saveState();
  renderTickler();
  updateCounters();
}

function jumpToQueueItem(bizId) {
  const filtIdx = filtered.findIndex(function(f){ return f.id === bizId; });
  if (filtIdx >= 0) { currentIdx = filtIdx; collapsePanel(); render(); return; }
  applyFilter('all');
  setTimeout(function() {
    const ni = filtered.findIndex(function(f){ return f.id === bizId; });
    if (ni >= 0) { currentIdx = ni; render(); }
  }, 50);
}
function renderTickler() {
  const SKIP = new Set(['DEAD','DNC']);
  const cityBiz = allBusinesses.filter(b => b.city === currentCity);
  const today = new Date(); today.setHours(0,0,0,0);

  const overdue=[], dueToday=[], upcoming=[], needsDate=[], fresh=[];

  cityBiz.forEach(b => {
    const bs = getBS(b.id);
    if (SKIP.has(bs.stat)) return;
    const days = daysBetween(bs.callbackDate);

    if (bs.callbackDate && days !== null) {
      if (days < 0)      overdue.push({b,bs,days});
      else if (days===0) dueToday.push({b,bs,days});
      else               upcoming.push({b,bs,days});
    } else if (bs.stat && bs.stat !== '') {
      needsDate.push({b,bs,days:null});
    } else {
      fresh.push({b,bs,days:null});
    }
  });

  overdue.sort((a,b)=>a.days-b.days);
  upcoming.sort((a,b)=>a.days-b.days);

  const total = overdue.length+dueToday.length+upcoming.length+needsDate.length+fresh.length;
  const sumEl = document.getElementById('tickler-summary');
  if (sumEl) sumEl.innerHTML =
    `<span style="color:#f87171">${overdue.length} overdue</span> &nbsp;|&nbsp;
     <span style="color:#fbbf24">${dueToday.length} today</span> &nbsp;|&nbsp;
     <span style="color:#4ade80">${upcoming.length} upcoming</span> &nbsp;|&nbsp;
     <span style="color:#94a3b8">${needsDate.length} needs date</span> &nbsp;|&nbsp;
     <span style="color:#60a5fa">${fresh.length} new</span>`;

  const qAll = cityBiz.filter(function(b){ const s=getBS(b.id); return s.stat!=='DEAD'&&s.stat!=='DNC'; });
  const qSorted = qAll.map(function(b) {
    const bs2 = getBS(b.id);
    let score = 9999;
    if (bs2.callbackDate) {
      const d = parseDate(bs2.callbackDate);
      if (d) { const t=new Date(); t.setHours(0,0,0,0); score=Math.floor((d-t)/86400000); }
    } else if (!bs2.callCount || bs2.callCount===0) {
      score = 8888;
    }
    return { b: b, bs: bs2, score: score };
  }).sort(function(a,z){ return a.score-z.score; }).slice(0,5);
  const todayLocStr = new Date().toLocaleDateString('en-US');
  let todayCallsDone = 0;
  cityBiz.forEach(function(b){ const s=getBS(b.id); if(s.lastCallDate===todayLocStr) todayCallsDone++; });

  const dl = document.getElementById('dash-list');
  let queueHtml = '<div class="queue-section"><div class="queue-hdr">🎯 TODAY&#39;S QUEUE <span class="queue-done-badge">' + todayCallsDone + ' done today</span></div>';
  if (qSorted.length === 0) {
    queueHtml += '<div style="color:#64748b;font-size:12px;padding:6px 0">No calls pending — great work!</div>';
  } else {
    qSorted.forEach(function(item) {
      const b = item.b; const s = item.score;
      const label = s < 0 ? Math.abs(s)+'d LATE' : s===0 ? 'TODAY' : s===8888 ? 'FIRST CALL' : 'in '+s+'d';
      const lc = s<0 ? '#ef4444' : s===0 ? '#fbbf24' : s===8888 ? '#4ade80' : '#94a3b8';
      const rawPh = (b.phone||'').replace(/\D/g,'');
      const ph = rawPh.length>=10 ? '<a class="queue-call" href="tel:+1'+(rawPh.length===11?rawPh.slice(1):rawPh)+'" onclick="event.stopPropagation()">☎ Call</a>' : '';
      queueHtml += '<div class="queue-item" data-bizid="' + b.id + '">'
        + '<span class="queue-label" style="color:'+lc+'">'+label+'</span>'
        + '<span class="queue-name">'+b.name+'</span>'
        + ph + '</div>';
    });
  }
  queueHtml += '</div><hr class="queue-divider">';
  dl.innerHTML = queueHtml;

  function phoneLink(b) {
    const raw = (b.phone||'').replace(/\D/g,'');
    if (raw.length >= 10) {
      const d = raw.length===11 ? raw.slice(1) : raw;
      return `<a class="t-phone" href="tel:+1${d}" onclick="event.stopPropagation()">📞 ${b.phone}</a>`;
    }
    return `<span class="t-phone-none">No phone</span>`;
  }

  function makeSection(icon, title, color, list, limit) {
    if (!list.length) return;
    const show = limit ? list.slice(0,limit) : list;
    const sec = document.createElement('div');
    sec.className = 'tickler-section';
    sec.innerHTML = `<div class="tickler-section-header" style="color:${color}">${icon} ${title} <span style="font-weight:400;color:#475569">(${list.length})</span></div>`;

    show.forEach(({b,bs,days}) => {
      const filtIdx = filtered.findIndex(f=>f.id===b.id);
      const isCurrent = filtIdx>=0 && filtIdx===currentIdx;
      const div = document.createElement('div');
      div.className = 'tickler-item'+(isCurrent?' t-current':'');

      const statColors={FU:'#fbbf24',CB:'#60a5fa',VM:'#94a3b8',MTG:'#4ade80',NA:'#64748b'};
      const sc = statColors[bs.stat]||'#475569';
      const action = bs.nextAction || defaultAction(bs.stat) || 'First call — introduce yourself';

      let ageHtml='';
      if (days===null)    ageHtml=`<span style="color:#475569">—</span>`;
      else if (days<0)    ageHtml=`<span style="color:#f87171">${Math.abs(days)}d late</span>`;
      else if (days===0)  ageHtml=`<span style="color:#fbbf24">TODAY</span>`;
      else                ageHtml=`<span style="color:#4ade80">+${days}d</span>`;

      div.innerHTML = `
        <div class="t-main">
          <div class="t-row1">
            <span class="t-badge" style="background:${sc}22;color:${sc};border-color:${sc}44">${bs.stat||'NEW'}</span>
            <span class="t-name">${b.name}</span>
            <span class="t-age">${ageHtml}</span>
          </div>
          <div class="t-row2">
            <span class="t-action">→ ${action}</span>
          </div>
          <div class="t-row3">
            ${phoneLink(b)}
            <div class="t-btns">
              <button class="t-btn reschedule" title="Reschedule" onclick="event.stopPropagation();showReschedule('${b.id}')">📅 Date</button>
              <button class="t-btn done" title="Done" onclick="ticklerDone('${b.id}',event)">✓ Done</button>
            </div>
          </div>
        </div>`;

      div.onclick = () => {
        collapsePanel();
        if (filtIdx>=0) { currentIdx=filtIdx; render(); }
        else { applyFilter('all'); const ni=filtered.findIndex(f=>f.id===b.id); if(ni>=0){currentIdx=ni;render();} }
      };
      sec.appendChild(div);
    });

    if (limit && list.length > limit) {
      const more = document.createElement('div');
      more.style.cssText='text-align:center;padding:6px;font-size:11px;color:#475569;cursor:pointer';
      more.textContent=`▼ Show all ${list.length} (${list.length-limit} more)`;
      more.onclick=()=>{ sec.remove(); makeSection(icon,title,color,list,null); dl.insertBefore(dl.firstChild,dl.firstChild); renderTickler(); };
      sec.appendChild(more);
    }
    dl.appendChild(sec);
  }

  makeSection('🔴','OVERDUE',   '#f87171', overdue,   null);
  makeSection('🟡','DUE TODAY', '#fbbf24', dueToday,  null);
  makeSection('🟢','UPCOMING',  '#4ade80', upcoming,  null);
  makeSection('⚪','NEEDS DATE','#94a3b8', needsDate, null);
  makeSection('🔵','NEW — Not Yet Called','#60a5fa', fresh, 30);

  if (!total) {
    dl.innerHTML='<div style="text-align:center;padding:24px 0;color:#475569;font-size:13px">All businesses accounted for.</div>';
  }
}

