/* PhishGuard AI — Visitor — runVisitorScan
   visitor.js */

// ═══════════════════════════════════════════════
//  VISITOR QUICK SCAN
// ═══════════════════════════════════════════════
async function runVisitorScan() {
  const btn = document.getElementById('visitor-scan-btn');
  const txt = document.getElementById('visitor-btn-text');
  const url = document.getElementById('visitor-url-input').value.trim();

  if (!url) { showToast('Please enter a URL to scan.', 'error'); return; }

  btn.disabled = true;
  txt.innerHTML = '<span class="spinner"></span> Scanning...';
  await new Promise(r => setTimeout(r, 1000 + Math.random() * 700));

  const result = analyseURL(url);
  const level  = getLevel(result.score);
  const cls    = level === 'SAFE' ? 'safe' : level === 'SUSPICIOUS' ? 'sus' : 'phish';
  const color  = level === 'SAFE' ? 'var(--green)' : level === 'SUSPICIOUS' ? 'var(--yellow)' : 'var(--red)';
  const summaries = {
    SAFE:       'No phishing indicators detected. Link appears safe.',
    SUSPICIOUS: 'Some suspicious patterns found — proceed with caution.',
    PHISHING:   '⚠ HIGH RISK — This link shows strong phishing signals.'
  };

  document.getElementById('visitor-result-banner').className = 'risk-banner ' + cls;
  document.getElementById('visitor-result-level').textContent   = level;
  document.getElementById('visitor-result-summary').textContent = summaries[level];
  document.getElementById('visitor-result-score').textContent   = result.score;
  document.getElementById('visitor-score-bar').style.width      = result.score + '%';
  document.getElementById('visitor-score-bar').style.background = color;

  document.getElementById('visitor-indicators-list').innerHTML = result.indicators.map(ind => `
    <div class="indicator">
      <div class="ind-icon">${ind.icon}</div>
      <div style="flex:1">
        <div class="ind-title">${ind.title}</div>
        <div class="ind-desc">${ind.desc}</div>
      </div>
      <div class="ind-badge badge-${ind.level === 'safe' ? 'safe' : ind.level === 'warn' ? 'warn' : 'danger'}">
        ${ind.level.toUpperCase()}
      </div>
    </div>`).join('');

  document.getElementById('visitor-result-box').classList.add('show');
  btn.disabled = false;
  txt.innerHTML = '🔍 Scan URL';

  if (level === 'PHISHING') showToast('⚠ Phishing detected!', 'error');
  else if (level === 'SUSPICIOUS') showToast('Suspicious URL detected.', 'info');
  else showToast('URL appears safe.', 'success');
}

// Allow Enter key on login
document.getElementById('login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
document.getElementById('login-email').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
