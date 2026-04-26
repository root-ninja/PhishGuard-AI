/* PhishGuard AI - Visitor quick URL scan */

async function runVisitorScan() {
  const btn = document.getElementById('visitor-scan-btn');
  const txt = document.getElementById('visitor-btn-text');
  const url = document.getElementById('visitor-url-input').value.trim();

  if (!validateHttpUrl(url)) {
    showToast('Enter a valid http or https URL.', 'error');
    return;
  }

  btn.disabled = true;
  txt.innerHTML = '<span class="spinner"></span> Scanning...';

  try {
    const result = await analyseWithFallback('url', url, null);
    renderResult(result, 'visitor-');

    if (result.risk_level === 'PHISHING') showToast('Phishing detected.', 'error');
    else if (result.risk_level === 'SUSPICIOUS') showToast('Suspicious URL detected.', 'info');
    else showToast('URL appears safe.', 'success');
  } catch (error) {
    showToast(error.message || 'Scan failed.', 'error');
  } finally {
    btn.disabled = false;
    txt.textContent = 'Scan URL';
  }
}

