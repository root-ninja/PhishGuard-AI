/* PhishGuard AI - History, filtering, pagination, report actions */

let historyPage = 1;
const HISTORY_PAGE_SIZE = 10;
let lastFilteredHistory = [];

function getFilteredHistory() {
  const q = (document.getElementById('search-input')?.value || '').toLowerCase();
  const level = document.getElementById('filter-level')?.value || '';
  const type = document.getElementById('filter-type')?.value || '';
  const date = document.getElementById('filter-date')?.value || '';

  return getHistory().filter(row => {
    const rowDate = row.timestamp ? row.timestamp.slice(0, 10) : '';
    return (!q || String(row.target || '').toLowerCase().includes(q)) &&
      (!level || row.level === level) &&
      (!type || row.type === type) &&
      (!date || rowDate === date);
  });
}

function renderHistory(data) {
  const items = data || getFilteredHistory();
  lastFilteredHistory = items;
  const tbody = document.getElementById('history-body');
  const empty = document.getElementById('history-empty');
  const label = document.getElementById('history-page-label');
  const totalPages = Math.max(1, Math.ceil(items.length / HISTORY_PAGE_SIZE));

  if (historyPage > totalPages) historyPage = totalPages;
  const start = (historyPage - 1) * HISTORY_PAGE_SIZE;
  const pageItems = items.slice(start, start + HISTORY_PAGE_SIZE);

  if (items.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    if (label) label.textContent = 'Page 1 of 1';
    return;
  }

  empty.style.display = 'none';
  if (label) label.textContent = 'Page ' + historyPage + ' of ' + totalPages + ' (' + items.length + ' results)';
  tbody.innerHTML = pageItems.map(row => `
    <tr>
      <td style="padding:12px 20px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHtml(row.target)}">${escapeHtml(row.target)}</td>
      <td><span class="badge badge-${String(row.type).toLowerCase()}">${escapeHtml(row.type)}</span></td>
      <td style="color:${row.level === 'SAFE' ? 'var(--green)' : row.level === 'SUSPICIOUS' ? 'var(--yellow)' : 'var(--red)'};font-family:'Space Mono',monospace;font-weight:700">${row.score}/100</td>
      <td><span class="badge b-${row.level === 'SAFE' ? 'safe' : row.level === 'SUSPICIOUS' ? 'sus' : 'phish'}">${escapeHtml(row.level)}</span></td>
      <td style="color:var(--muted)">${row.indicators}</td>
      <td style="color:var(--muted)">${escapeHtml(row.time)}</td>
      <td>
        <div class="row-actions">
          <button onclick="downloadReport('${escapeHtml(row.reportId || '')}')" title="Download PDF">PDF</button>
          <button onclick="markHistoryFalsePositive(${row.id})" title="Report false positive">FP</button>
          <button onclick="deleteEntry(${row.id})" title="Delete">X</button>
        </div>
      </td>
    </tr>`).join('');
}

function filterHistory() {
  historyPage = 1;
  renderHistory(getFilteredHistory());
}

function changeHistoryPage(delta) {
  const totalPages = Math.max(1, Math.ceil(lastFilteredHistory.length / HISTORY_PAGE_SIZE));
  historyPage = Math.min(Math.max(historyPage + delta, 1), totalPages);
  renderHistory(lastFilteredHistory);
}

function deleteEntry(id) {
  const h = getHistory().filter(row => row.id !== id);
  saveHistory(h);
  filterHistory();
  refreshDashboard();
  showToast('Entry deleted.', 'info');
}

async function markHistoryFalsePositive(id) {
  const entry = getHistory().find(row => row.id === id);
  if (!entry) return;
  await submitFalsePositive(entry.analysisId || String(id), 'Submitted from history');
  showToast('False-positive feedback recorded.', 'success');
}

function exportHistory() {
  const rows = lastFilteredHistory.length ? lastFilteredHistory : getFilteredHistory();
  if (rows.length === 0) {
    showToast('No history to export.', 'info');
    return;
  }
  const csv = [
    'Target,Type,Score,Level,Indicators,Time,Recommended Action,Report ID',
    ...rows.map(row => [
      row.target,
      row.type,
      row.score,
      row.level,
      row.indicators,
      row.time,
      row.recommendedAction || '',
      row.reportId || '',
    ].map(value => '"' + String(value || '').replace(/"/g, '""') + '"').join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'phishguard_history.csv';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('CSV exported.', 'success');
}

