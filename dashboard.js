/* PhishGuard AI — Dashboard — refreshDashboard, stats, charts
   dashboard.js */

// ═══════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════
function refreshDashboard() {
  const h = getHistory();
  const safe  = h.filter(x => x.level === 'SAFE').length;
  const sus   = h.filter(x => x.level === 'SUSPICIOUS').length;
  const phish = h.filter(x => x.level === 'PHISHING').length;
  const total = h.length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-safe').textContent  = safe;
  document.getElementById('stat-sus').textContent   = sus;
  document.getElementById('stat-phish').textContent = phish;

  const today = h.filter(x => new Date(x.id).toDateString() === new Date().toDateString()).length;
  document.getElementById('stat-total-d').textContent = '+' + today + ' today';
  document.getElementById('stat-safe-d').textContent  = total > 0 ? Math.round(safe/total*100) + '% of all checks' : '—';
  document.getElementById('stat-sus-d').textContent   = total > 0 ? Math.round(sus/total*100)  + '% of all checks' : '—';
  document.getElementById('stat-phish-d').textContent = total > 0 ? Math.round(phish/total*100) + '% of all checks' : '—';

  // Donut chart
  const circ = 2 * Math.PI * 48;
  if (total > 0) {
    const sp = safe/total * circ, suf = sus/total * circ, ph = phish/total * circ;
    document.getElementById('donut-safe').setAttribute('stroke-dasharray', sp + ' ' + (circ - sp));
    document.getElementById('donut-sus').setAttribute('stroke-dasharray', suf + ' ' + (circ - suf));
    document.getElementById('donut-sus').setAttribute('stroke-dashoffset', -sp);
    document.getElementById('donut-phish').setAttribute('stroke-dasharray', ph + ' ' + (circ - ph));
    document.getElementById('donut-phish').setAttribute('stroke-dashoffset', -(sp+suf));
    document.getElementById('leg-safe').textContent  = Math.round(safe/total*100) + '%';
    document.getElementById('leg-sus').textContent   = Math.round(sus/total*100)  + '%';
    document.getElementById('leg-phish').textContent = Math.round(phish/total*100) + '%';
  }

  // Week bars
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const barData = days.map((_,i) => {
    const v = Math.floor(Math.random() * 8) + 1;
    return v;
  });
  const maxV = Math.max(...barData);
  document.getElementById('week-bars').innerHTML = barData.map((v, i) => `
    <div class="bar-col">
      <div class="bar-fill" style="height:${Math.round(v/maxV*80)+10}px;background:linear-gradient(to top, var(--accent2), var(--accent));opacity:${0.5+v/maxV*0.5}"></div>
      <div class="bar-lbl">${days[i]}</div>
    </div>`).join('');

  // Recent table
  const recent = h.slice(0, 5);
  const tbody = document.getElementById('recent-body');
  if (recent.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px;font-family:\'JetBrains Mono\',monospace;font-size:12px">No analyses yet. Go to Analyse to get started.</td></tr>';
  } else {
    tbody.innerHTML = recent.map(r => `
      <tr>
        <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.target}</td>
        <td><span class="badge badge-${r.type.toLowerCase()}">${r.type}</span></td>
        <td style="color:${r.level==='SAFE'?'var(--green)':r.level==='SUSPICIOUS'?'var(--yellow)':'var(--red)'};font-family:'Space Mono',monospace;font-weight:700">${r.score}</td>
        <td><span class="badge b-${r.level==='SAFE'?'safe':r.level==='SUSPICIOUS'?'sus':'phish'}">${r.level}</span></td>
        <td style="color:var(--muted)">${r.time}</td>
      </tr>`).join('');
  }
}
