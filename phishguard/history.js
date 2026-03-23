/* PhishGuard AI — History — renderHistory, filterHistory, deleteEntry, exportHistory
   history.js */

// ═══════════════════════════════════════════════
//  HISTORY
// ═══════════════════════════════════════════════
function renderHistory(data) {
  const items = data || getHistory();
  const tbody = document.getElementById('history-body');
  const empty = document.getElementById('history-empty');
  if (items.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block'; return;
  }
  empty.style.display = 'none';
  tbody.innerHTML = items.map(r => `
    <tr>
      <td style="padding:12px 20px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.target}</td>
      <td><span class="badge badge-${r.type.toLowerCase()}">${r.type}</span></td>
      <td style="color:${r.level==='SAFE'?'var(--green)':r.level==='SUSPICIOUS'?'var(--yellow)':'var(--red)'};font-family:'Space Mono',monospace;font-weight:700">${r.score}/100</td>
      <td><span class="badge b-${r.level==='SAFE'?'safe':r.level==='SUSPICIOUS'?'sus':'phish'}">${r.level}</span></td>
      <td style="color:var(--muted)">${r.indicators}</td>
      <td style="color:var(--muted)">${r.time}</td>
      <td><button onclick="deleteEntry(${r.id})" style="background:none;border:1px solid var(--border);border-radius:6px;color:var(--muted);cursor:pointer;padding:4px 10px;font-size:12px;font-family:'JetBrains Mono',monospace;transition:all 0.15s" onmouseover="this.style.borderColor='var(--red)';this.style.color='var(--red)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">✕</button></td>
    </tr>`).join('');
}

function filterHistory() {
  const q     = document.getElementById('search-input').value.toLowerCase();
  const level = document.getElementById('filter-level').value;
  const type  = document.getElementById('filter-type').value;
  const h     = getHistory().filter(r =>
    (!q     || r.target.toLowerCase().includes(q)) &&
    (!level || r.level === level) &&
    (!type  || r.type  === type)
  );
  renderHistory(h);
}

function deleteEntry(id) {
  const h = getHistory().filter(r => r.id !== id);
  saveHistory(h);
  filterHistory();
  refreshDashboard();
  showToast('Entry deleted.', 'info');
}

function exportHistory() {
  const h = getHistory();
  if (h.length === 0) { showToast('No history to export.', 'info'); return; }
  const csv = ['Target,Type,Score,Level,Indicators,Time',
    ...h.map(r => `"${r.target}",${r.type},${r.score},${r.level},${r.indicators},"${r.time}"`)
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'phishguard_history.csv'; a.click();
  showToast('CSV exported.', 'success');
}
