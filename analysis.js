/* PhishGuard AI - Analysis UI and local fallback engine */

const URGENT_WORDS = ['urgent','immediately','suspended','verify','confirm','alert','warning','account','expire','limited','action required','click here','update','validate','blocked','unusual','security','compromised'];
const SCAM_DOMAINS = ['paypa1','paypa-l','g00gle','arnazon','micros0ft','faceb00k','netfl1x','app1e','secure-login','account-verify','login-secure','banking-alert','update-required'];
const SUSPICIOUS_TLDS = ['.xyz','.tk','.ml','.ga','.cf','.gq','.work','.click','.link','.top','.icu'];
const LEGIT_DOMAINS = ['google.com','microsoft.com','apple.com','amazon.com','paypal.com','facebook.com','github.com','stackoverflow.com'];

let lastAnalysisResult = null;

function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tab-email').classList.toggle('active', tab === 'email');
  document.getElementById('tab-url').classList.toggle('active', tab === 'url');
  document.getElementById('email-input-area').style.display = tab === 'email' ? 'block' : 'none';
  document.getElementById('url-input-area').style.display = tab === 'url' ? 'block' : 'none';
  document.getElementById('result-box').classList.remove('show');
}

function getLevel(score) {
  if (score <= 30) return 'SAFE';
  if (score <= 65) return 'SUSPICIOUS';
  return 'PHISHING';
}

function getRecommendedAction(level) {
  if (level === 'PHISHING') return 'Do not click links or share credentials. Report this to security and delete or quarantine it.';
  if (level === 'SUSPICIOUS') return 'Verify the sender or domain through a trusted channel before taking action.';
  return 'No immediate action is required. Keep normal caution and retain the report for history.';
}

function validateHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char]));
}

function extractHostname(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (error) {
    return '';
  }
}

function localAnalyseEmail(text) {
  const lower = text.toLowerCase();
  const indicators = [];
  let score = 0;

  const urgentFound = URGENT_WORDS.filter(word => lower.includes(word));
  if (urgentFound.length >= 3) {
    score += 25;
    indicators.push({ icon:'!', title:'Urgent / Threatening Language', desc:'Found pressure words: ' + urgentFound.slice(0, 5).join(', '), level: urgentFound.length > 5 ? 'danger' : 'warn' });
  }

  const fromMatch = text.match(/[Ff]rom:\s*([^\n]+)/);
  if (fromMatch) {
    const from = fromMatch[1];
    const domMatch = from.match(/@([a-zA-Z0-9.\-]+)/);
    if (domMatch) {
      const dom = domMatch[1].toLowerCase();
      const isLegit = LEGIT_DOMAINS.some(item => dom.endsWith(item));
      const isSuspect = SCAM_DOMAINS.some(item => dom.includes(item)) || dom.includes('-secure') || dom.includes('-login') || dom.includes('verify');
      if (isSuspect) {
        score += 30;
        indicators.push({ icon:'!', title:'Spoofed Sender Domain', desc:'Domain "' + dom + '" mimics a legitimate service.', level:'danger' });
      } else if (!isLegit && dom.split('.').length > 3) {
        score += 12;
        indicators.push({ icon:'?', title:'Unusual Sender Domain', desc:'Sender domain has excessive subdomain depth: ' + dom, level:'warn' });
      }

      const displayName = from.match(/^([^<]+)</);
      if (displayName) {
        const display = displayName[1].trim().toLowerCase();
        const brands = ['paypal', 'amazon', 'microsoft', 'google', 'apple'];
        const mismatch = brands.find(brand => display.includes(brand) && !dom.includes(brand));
        if (mismatch) {
          score += 25;
          indicators.push({ icon:'!', title:'Display Name Mismatch', desc:'Sender claims to be ' + mismatch + ' but sends from ' + dom + '.', level:'danger' });
        }
      }
    }
  }

  const authHeaders = lower.includes('spf=pass') || lower.includes('dkim=pass') || lower.includes('dmarc=pass');
  const failedAuth = lower.includes('spf=fail') || lower.includes('dkim=fail') || lower.includes('dmarc=fail');
  if (failedAuth) {
    score += 28;
    indicators.push({ icon:'!', title:'Email Authentication Failed', desc:'SPF, DKIM, or DMARC failed in the email headers.', level:'danger' });
  } else if (authHeaders) {
    indicators.push({ icon:'OK', title:'Authentication Headers Present', desc:'SPF, DKIM, or DMARC pass signals were found.', level:'safe' });
  } else {
    score += 8;
    indicators.push({ icon:'?', title:'Authentication Not Confirmed', desc:'SPF, DKIM, and DMARC headers were not present in the pasted content.', level:'warn' });
  }

  const links = text.match(/https?:\/\/[^\s"'<>\]]+/g) || [];
  const linkResults = links.map(link => ({ url: link, ...localAnalyseURL(link) }));
  const riskyLinks = linkResults.filter(item => item.risk_score >= 66);
  if (riskyLinks.length > 0) {
    score += 30;
    indicators.push({ icon:'!', title:'Malicious Links Detected', desc:riskyLinks.length + ' embedded link(s) scored as phishing.', level:'danger' });
  } else if (links.length > 0) {
    indicators.push({ icon:'OK', title:'Links Checked', desc:links.length + ' embedded link(s) checked.', level:'safe' });
  }

  if (lower.includes('password') || lower.includes('credit card') || lower.includes('ssn') || lower.includes('social security') || lower.includes('pin') || lower.includes('bank account')) {
    score += 20;
    indicators.push({ icon:'!', title:'Credential / Financial Request', desc:'Message asks for sensitive account or payment information.', level:'danger' });
  }

  if (lower.includes('<img') && lower.includes('display:none')) {
    score += 8;
    indicators.push({ icon:'?', title:'Hidden Content', desc:'Email contains hidden HTML elements.', level:'warn' });
  }

  if (indicators.length === 0) {
    indicators.push({ icon:'OK', title:'No Phishing Indicators Found', desc:'No suspicious language, sender, or link patterns were detected.', level:'safe' });
  }

  return buildLocalResult('EMAIL', (text.split('\n')[0] || 'Email').substring(0, 80), Math.min(score || 5, 100), indicators, { links: linkResults });
}

function localAnalyseURL(url) {
  if (!validateHttpUrl(url)) {
    throw new Error('Enter a valid http or https URL.');
  }

  const indicators = [];
  let score = 0;
  const lower = url.toLowerCase();
  const host = extractHostname(url);
  const lists = getDomainLists();

  if (lists.whitelist.includes(host)) {
    return buildLocalResult('URL', url, 5, [{ icon:'OK', title:'Whitelisted Domain', desc:host + ' is trusted by admin policy.', level:'safe' }], {});
  }
  if (lists.blacklist.includes(host)) {
    score += 85;
    indicators.push({ icon:'!', title:'Blacklisted Domain', desc:host + ' is blocked by admin policy.', level:'danger' });
  }

  if (/^https?:\/\/\d{1,3}(\.\d{1,3}){3}/.test(url)) {
    score += 30;
    indicators.push({ icon:'!', title:'IP Address Used as Domain', desc:'URL uses a raw IP address instead of a domain name.', level:'danger' });
  }
  if (url.length > 75) {
    score += 12;
    indicators.push({ icon:'?', title:'Unusually Long URL', desc:'URL length is ' + url.length + ' characters.', level:'warn' });
  }
  const suspKeywords = ['login','secure','verify','account','update','confirm','banking','paypal','amazon','apple','microsoft','google'].filter(item => lower.includes(item));
  if (suspKeywords.length >= 2) {
    score += 18;
    indicators.push({ icon:'?', title:'Sensitive Keywords in URL', desc:'URL contains trust-baiting keywords: ' + suspKeywords.join(', '), level:'warn' });
  }
  const typo = SCAM_DOMAINS.find(item => lower.includes(item));
  if (typo) {
    score += 35;
    indicators.push({ icon:'!', title:'Brand Impersonation / Typosquatting', desc:'URL contains "' + typo + '".', level:'danger' });
  }
  const tld = SUSPICIOUS_TLDS.find(item => host.endsWith(item));
  if (tld) {
    score += 15;
    indicators.push({ icon:'?', title:'Suspicious Top-Level Domain', desc:'TLD "' + tld + '" is frequently abused.', level:'warn' });
  }
  const specialCount = (url.match(/[@%#!]/g) || []).length;
  if (specialCount > 2) {
    score += 10;
    indicators.push({ icon:'?', title:'Excessive Special Characters', desc:'Found ' + specialCount + ' URL obfuscation characters.', level:'warn' });
  }
  const subDepth = Math.max(host.split('.').length - 2, 0);
  if (subDepth >= 3) {
    score += 12;
    indicators.push({ icon:'?', title:'Deep Subdomain Chain', desc:'Subdomain depth is ' + subDepth + '.', level:'warn' });
  }
  if (!url.startsWith('https://')) {
    score += 15;
    indicators.push({ icon:'?', title:'No HTTPS Encryption', desc:'URL uses HTTP.', level:'warn' });
  } else {
    indicators.push({ icon:'OK', title:'HTTPS Present', desc:'Connection is encrypted with TLS.', level:'safe' });
  }
  if (LEGIT_DOMAINS.some(domain => host.endsWith(domain)) && score < 20) {
    score = Math.max(score - 10, 3);
    indicators.unshift({ icon:'OK', title:'Known Legitimate Domain', desc:'Domain matches a verified common service.', level:'safe' });
  }
  if (indicators.length === 0) {
    indicators.push({ icon:'OK', title:'No Major URL Indicators', desc:'No high-risk URL patterns were detected.', level:'safe' });
  }

  return buildLocalResult('URL', url, Math.min(score || 5, 100), indicators, {
    features: { url_length: url.length, subdomain_depth: subDepth, special_char_count: specialCount },
  });
}

function buildLocalResult(type, target, score, indicators, metadata) {
  const level = getLevel(score);
  const id = Date.now().toString();
  return {
    analysis_id: 'local_' + id,
    job_id: 'job_local_' + id,
    report_id: '',
    report_url: '',
    type,
    target,
    risk_score: score,
    risk_level: level,
    confidence: Math.min(0.99, Math.round((0.68 + indicators.length * 0.04 + score / 500) * 100) / 100),
    indicators,
    recommended_action: getRecommendedAction(level),
    timestamp: new Date().toISOString(),
    metadata: metadata || {},
  };
}

function normalizeApiResult(result) {
  if (result.risk_score !== undefined) return result;
  const score = result.score || 0;
  return buildLocalResult(result.type || currentTab.toUpperCase(), result.target || '', score, result.indicators || [], result.metadata || {});
}

function resultSummary(level) {
  return {
    SAFE: 'No significant phishing indicators detected.',
    SUSPICIOUS: 'Some suspicious patterns found. Exercise caution.',
    PHISHING: 'High risk. Do not click links or share information.',
  }[level] || '';
}

function renderResult(result, prefix) {
  const level = result.risk_level;
  const cls = level === 'SAFE' ? 'safe' : level === 'SUSPICIOUS' ? 'sus' : 'phish';
  const color = level === 'SAFE' ? 'var(--green)' : level === 'SUSPICIOUS' ? 'var(--yellow)' : 'var(--red)';

  document.getElementById(prefix + 'result-banner').className = 'risk-banner ' + cls;
  document.getElementById(prefix + 'result-level').textContent = level;
  document.getElementById(prefix + 'result-summary').textContent = resultSummary(level);
  document.getElementById(prefix + 'result-score').textContent = result.risk_score;
  document.getElementById(prefix + 'score-bar').style.width = result.risk_score + '%';
  document.getElementById(prefix + 'score-bar').style.background = color;

  const list = document.getElementById(prefix + 'indicators-list');
  list.innerHTML = (result.indicators || []).map(ind => `
    <div class="indicator">
      <div class="ind-icon">${escapeHtml(ind.icon || '!')}</div>
      <div style="flex:1">
        <div class="ind-title">${escapeHtml(ind.title)}</div>
        <div class="ind-desc">${escapeHtml(ind.desc)}</div>
      </div>
      <div class="ind-badge badge-${ind.level === 'safe' ? 'safe' : ind.level === 'warn' ? 'warn' : 'danger'}">
        ${escapeHtml(String(ind.level || '').toUpperCase())}
      </div>
    </div>`).join('');

  const actionEl = document.getElementById(prefix + 'recommended-action');
  if (actionEl) actionEl.textContent = result.recommended_action || getRecommendedAction(level);

  const metaEl = document.getElementById(prefix + 'result-meta');
  if (metaEl) {
    metaEl.textContent = 'Job ' + (result.job_id || 'local') + ' | Confidence ' + Math.round((result.confidence || 0) * 100) + '%';
  }

  const reportBtn = document.getElementById(prefix + 'download-report-btn');
  if (reportBtn) reportBtn.disabled = !result.report_id;
  document.getElementById(prefix + 'result-box').classList.add('show');
}

function saveAnalysisResult(result, fullInput) {
  const entry = {
    id: Date.now(),
    analysisId: result.analysis_id,
    jobId: result.job_id,
    reportId: result.report_id,
    target: result.target.substring(0, 80),
    type: result.type,
    score: result.risk_score,
    level: result.risk_level,
    indicators: (result.indicators || []).length,
    time: new Date(result.timestamp || Date.now()).toLocaleString(),
    timestamp: result.timestamp || new Date().toISOString(),
    recommendedAction: result.recommended_action,
    full: fullInput,
    userEmail: currentUser ? currentUser.email : '',
  };
  logAction('ANALYSIS ' + result.type, entry.target + ' -> ' + result.risk_level + ' (' + result.risk_score + ')');
  const h = getHistory();
  h.unshift(entry);
  saveHistory(h.slice(0, 500));
  return entry;
}

async function getSelectedEmlFile() {
  const input = document.getElementById('email-file-input');
  return input && input.files && input.files.length ? input.files[0] : null;
}

async function runAnalysis() {
  const btn = document.getElementById('analyse-btn');
  const txt = document.getElementById('btn-text');
  btn.disabled = true;
  txt.innerHTML = '<span class="spinner"></span> Analysing...';

  const file = currentTab === 'email' ? await getSelectedEmlFile() : null;
  const input = currentTab === 'email'
    ? document.getElementById('email-input').value.trim()
    : document.getElementById('url-input').value.trim();

  if (currentTab === 'url' && !validateHttpUrl(input)) {
    showToast('Enter a valid http or https URL.', 'error');
    btn.disabled = false;
    txt.textContent = 'Analyse Now';
    return;
  }

  if (currentTab === 'email' && !input && !file) {
    showToast('Paste email content or upload a .eml file.', 'error');
    btn.disabled = false;
    txt.textContent = 'Analyse Now';
    return;
  }

  try {
    const result = await analyseWithFallback(currentTab, input, file);
    lastAnalysisResult = result;
    renderResult(result, '');
    saveAnalysisResult(result, file ? file.name : input);
    refreshDashboard();

    if (result.risk_level === 'PHISHING') showToast('Phishing detected. Alert workflow recorded.', 'error');
    else if (result.risk_level === 'SUSPICIOUS') showToast('Suspicious content detected.', 'info');
    else showToast('Analysis complete. No major threats found.', 'success');
  } catch (error) {
    showToast(error.message || 'Analysis failed.', 'error');
  } finally {
    btn.disabled = false;
    txt.textContent = 'Analyse Now';
  }
}

async function reportFalsePositive() {
  if (!lastAnalysisResult) {
    showToast('Run an analysis before submitting feedback.', 'info');
    return;
  }
  await submitFalsePositive(lastAnalysisResult.analysis_id, 'Submitted from result screen');
  showToast('False-positive feedback recorded.', 'success');
}

function downloadCurrentReport() {
  if (!lastAnalysisResult || !lastAnalysisResult.report_id) {
    showToast('Start the API service to generate downloadable PDF reports.', 'info');
    return;
  }
  downloadReport(lastAnalysisResult.report_id);
}

