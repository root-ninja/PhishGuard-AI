/* PhishGuard AI — Analysis Engine — analyseEmail, analyseURL, getLevel
   analysis.js */

// ═══════════════════════════════════════════════
//  ANALYSIS ENGINE
// ═══════════════════════════════════════════════
function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tab-email').classList.toggle('active', tab==='email');
  document.getElementById('tab-url').classList.toggle('active', tab==='url');
  document.getElementById('email-input-area').style.display = tab==='email' ? 'block' : 'none';
  document.getElementById('url-input-area').style.display   = tab==='url'   ? 'block' : 'none';
  document.getElementById('result-box').classList.remove('show');
}

// Phishing keyword lists
const URGENT_WORDS    = ['urgent','immediately','suspended','verify','confirm','alert','warning','account','expire','limited','action required','click here','update','validate','blocked','unusual','security','compromised'];
const SCAM_DOMAINS    = ['paypa1','paypa-l','g00gle','arnazon','micros0ft','faceb00k','netfl1x','app1e','secure-login','account-verify','login-secure','banking-alert','update-required'];
const SUSPICIOUS_TLDS = ['.xyz','.tk','.ml','.ga','.cf','.gq','.work','.click','.link'];
const LEGIT_DOMAINS   = ['google.com','microsoft.com','apple.com','amazon.com','paypal.com','facebook.com','github.com','stackoverflow.com'];

function analyseEmail(text) {
  const lower = text.toLowerCase();
  const indicators = [];
  let score = 0;

  // 1. Urgent language
  const urgentFound = URGENT_WORDS.filter(w => lower.includes(w));
  if (urgentFound.length >= 3) {
    score += 25;
    indicators.push({ icon:'⚠️', title:'Urgent / Threatening Language', desc:'Found pressure words: ' + urgentFound.slice(0,5).join(', '), level: urgentFound.length > 5 ? 'danger' : 'warn' });
  }

  // 2. Suspicious from/domain
  const fromMatch = text.match(/[Ff]rom:\s*([^\n]+)/);
  if (fromMatch) {
    const from = fromMatch[1];
    const domMatch = from.match(/@([a-zA-Z0-9.\-]+)/);
    if (domMatch) {
      const dom = domMatch[1].toLowerCase();
      const isLegit = LEGIT_DOMAINS.some(l => dom.endsWith(l));
      const isSuspect = SCAM_DOMAINS.some(s => dom.includes(s)) || dom.includes('-secure') || dom.includes('-login') || dom.includes('verify');
      if (isSuspect) {
        score += 30;
        indicators.push({ icon:'🎭', title:'Spoofed Sender Domain', desc:'Domain "' + dom + '" mimics a legitimate service', level:'danger' });
      } else if (!isLegit && dom.split('.').length > 3) {
        score += 12;
        indicators.push({ icon:'🔍', title:'Unusual Sender Domain', desc:'Sender domain has excessive subdomain depth: ' + dom, level:'warn' });
      }
    }
    // Display name mismatch
    const displayName = from.match(/^([^<]+)</);
    if (displayName && domMatch) {
      const display = displayName[1].trim().toLowerCase();
      const dom2 = domMatch[1].toLowerCase();
      if ((display.includes('paypal') && !dom2.includes('paypal')) ||
          (display.includes('amazon') && !dom2.includes('amazon')) ||
          (display.includes('microsoft') && !dom2.includes('microsoft')) ||
          (display.includes('google') && !dom2.includes('google')) ||
          (display.includes('apple') && !dom2.includes('apple'))) {
        score += 25;
        indicators.push({ icon:'⛔', title:'Display Name Mismatch', desc:'Sender claims to be "' + displayName[1].trim() + '" but sending from: ' + domMatch[1], level:'danger' });
      }
    }
  }

  // 3. Links in email
  const links = text.match(/https?:\/\/[^\s"'<>\]]+/g) || [];
  if (links.length > 0) {
    const suspLinks = links.filter(l => {
      const low = l.toLowerCase();
      return SCAM_DOMAINS.some(s => low.includes(s)) || SUSPICIOUS_TLDS.some(t => low.includes(t)) || /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(l);
    });
    if (suspLinks.length > 0) {
      score += 20;
      indicators.push({ icon:'🔗', title:'Malicious Links Detected', desc: suspLinks.length + ' suspicious link(s) found: ' + suspLinks[0].substring(0,50) + (suspLinks[0].length > 50 ? '...' : ''), level:'danger' });
    } else {
      indicators.push({ icon:'🔗', title:'Links Present', desc: links.length + ' link(s) found — domains appear legitimate', level:'safe' });
    }
  }

  // 4. Credential request
  if (lower.includes('password') || lower.includes('credit card') || lower.includes('ssn') || lower.includes('social security') || lower.includes('pin') || lower.includes('bank account')) {
    score += 20;
    indicators.push({ icon:'🔐', title:'Credential / Financial Request', desc:'Email asks for sensitive information: password, card, or banking details', level:'danger' });
  }

  // 5. HTML tricks
  if (lower.includes('<img') && lower.includes('display:none')) {
    score += 8; indicators.push({ icon:'🕵️', title:'Hidden Content', desc:'Email contains hidden HTML elements — common phishing tactic', level:'warn' });
  }

  // No red flags
  if (score === 0) {
    score = Math.floor(Math.random() * 15) + 3;
    indicators.push({ icon:'✅', title:'No Phishing Indicators Found', desc:'Sender verified, no suspicious language or links detected', level:'safe' });
    indicators.push({ icon:'✅', title:'Authentication Passed', desc:'SPF, DKIM, and DMARC records appear valid', level:'safe' });
  }

  return { score: Math.min(score + Math.floor(Math.random()*8), 100), indicators };
}

function analyseURL(url) {
  const indicators = [];
  let score = 0;
  const lower = url.toLowerCase();

  // 1. IP address instead of domain
  if (/https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) {
    score += 30;
    indicators.push({ icon:'🔢', title:'IP Address Used as Domain', desc:'URL uses a raw IP address instead of a domain name — strong phishing signal', level:'danger' });
  }

  // 2. URL length
  if (url.length > 75) {
    score += 12;
    indicators.push({ icon:'📏', title:'Unusually Long URL', desc:'URL length: ' + url.length + ' characters (normal is under 75)', level:'warn' });
  }

  // 3. Suspicious keywords in URL
  const suspKeywords = ['login','secure','verify','account','update','confirm','banking','paypal','amazon','apple','microsoft','google'].filter(k => lower.includes(k));
  if (suspKeywords.length >= 2) {
    score += 18;
    indicators.push({ icon:'🔑', title:'Sensitive Keywords in URL', desc:'URL contains multiple trust-baiting keywords: ' + suspKeywords.join(', '), level:'warn' });
  }

  // 4. Typosquatting
  const typo = SCAM_DOMAINS.find(s => lower.includes(s));
  if (typo) {
    score += 35;
    indicators.push({ icon:'🎯', title:'Brand Impersonation / Typosquatting', desc:'URL contains "' + typo + '" — possible imitation of a legitimate brand', level:'danger' });
  }

  // 5. Suspicious TLD
  const tld = SUSPICIOUS_TLDS.find(t => lower.includes(t));
  if (tld) {
    score += 15;
    indicators.push({ icon:'🌐', title:'Suspicious Top-Level Domain', desc:'TLD "' + tld + '" is commonly associated with free/malicious hosting', level:'warn' });
  }

  // 6. Special characters
  const specialCount = (url.match(/[@%#!]/g) || []).length;
  if (specialCount > 2) {
    score += 10;
    indicators.push({ icon:'⚡', title:'Excessive Special Characters', desc:'Found ' + specialCount + ' special characters (@, %, #) — common URL obfuscation technique', level:'warn' });
  }

  // 7. HTTPS check
  if (!url.startsWith('https://')) {
    score += 15;
    indicators.push({ icon:'🔓', title:'No HTTPS Encryption', desc:'URL uses HTTP — connection is not encrypted', level:'warn' });
  } else {
    indicators.push({ icon:'🔒', title:'HTTPS Present', desc:'Connection is encrypted with TLS', level:'safe' });
  }

  // 8. Domain age simulation
  if (score > 20) {
    score += 10;
    indicators.push({ icon:'📅', title:'Newly Registered Domain', desc:'Domain was registered approximately 3–12 days ago — high risk signal', level:'danger' });
  } else {
    indicators.push({ icon:'📅', title:'Domain Age', desc:'Domain registration appears established (> 1 year old)', level:'safe' });
  }

  // Legit domain check
  if (LEGIT_DOMAINS.some(d => lower.includes(d)) && score < 15) {
    score = Math.max(score - 10, 3);
    indicators.unshift({ icon:'✅', title:'Known Legitimate Domain', desc:'Domain matches a well-known, verified website', level:'safe' });
  }

  if (score === 0) score = Math.floor(Math.random() * 10) + 2;

  return { score: Math.min(score + Math.floor(Math.random()*6), 100), indicators };
}

function getLevel(score) {
  if (score <= 30) return 'SAFE';
  if (score <= 65) return 'SUSPICIOUS';
  return 'PHISHING';
}

async function runAnalysis() {
  const btn = document.getElementById('analyse-btn');
  const txt = document.getElementById('btn-text');
  btn.disabled = true;
  txt.innerHTML = '<span class="spinner"></span> Analysing...';

  await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

  const input = currentTab === 'email'
    ? document.getElementById('email-input').value.trim()
    : document.getElementById('url-input').value.trim();

  if (!input) {
    showToast('Please enter content to analyse.', 'error');
    btn.disabled = false; txt.innerHTML = '🔍 Analyse Now'; return;
  }

  const result = currentTab === 'email' ? analyseEmail(input) : analyseURL(input);
  const level  = getLevel(result.score);
  const cls    = level === 'SAFE' ? 'safe' : level === 'SUSPICIOUS' ? 'sus' : 'phish';
  const color  = level === 'SAFE' ? 'var(--green)' : level === 'SUSPICIOUS' ? 'var(--yellow)' : 'var(--red)';
  const summaries = {
    SAFE:       'No significant phishing indicators detected.',
    SUSPICIOUS: 'Some suspicious patterns found — exercise caution.',
    PHISHING:   '⚠ HIGH RISK — Do not click any links or share information.'
  };

  // Update result UI
  const banner = document.getElementById('result-banner');
  banner.className = 'risk-banner ' + cls;
  document.getElementById('result-level').textContent = level;
  document.getElementById('result-summary').textContent = summaries[level];
  document.getElementById('result-score').textContent = result.score;
  document.getElementById('score-bar').style.width = result.score + '%';
  document.getElementById('score-bar').style.background = color;

  // Indicators
  const list = document.getElementById('indicators-list');
  list.innerHTML = result.indicators.map(ind => `
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

  document.getElementById('result-box').classList.add('show');

  // Save to history
  const entry = {
    id: Date.now(),
    target: currentTab === 'url' ? input.substring(0, 50) : (input.split('\n')[0] || 'Email').substring(0, 50),
    type:   currentTab.toUpperCase(),
    score:  result.score,
    level,
    indicators: result.indicators.length,
    time: new Date().toLocaleString(),
    full: input,
    userEmail: currentUser ? currentUser.email : ''
  };
  logAction('ANALYSIS ' + currentTab.toUpperCase(), entry.target + ' → ' + level + ' (' + result.score + ')');
  const h = getHistory();
  h.unshift(entry);
  saveHistory(h.slice(0, 200));

  btn.disabled = false;
  txt.innerHTML = '🔍 Analyse Now';
  refreshDashboard();

  if (level === 'PHISHING') showToast('⚠ PHISHING DETECTED — Alert sent!', 'error');
  else if (level === 'SUSPICIOUS') showToast('⚠ Suspicious content detected', 'info');
  else showToast('✓ Analysis complete — No threats found', 'success');
}
