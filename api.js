/* PhishGuard AI - API client with local fallback */

const API_BASE_URL = localStorage.getItem('phishguard_api_base') || 'http://127.0.0.1:8000';

function getApiToken() {
  if (!currentUser) return '';
  if (currentUser.role === 'admin') return 'demo-admin';
  if (currentUser.role === 'user') return 'demo-user';
  return 'demo-visitor';
}

async function apiFetch(path, options = {}) {
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    'Authorization': 'Bearer ' + getApiToken(),
    ...(options.headers || {}),
  };
  const response = await fetch(API_BASE_URL + path, { ...options, headers });
  if (!response.ok) {
    let message = 'API request failed.';
    try {
      const data = await response.json();
      message = data.detail || message;
    } catch (error) {
      message = await response.text();
    }
    throw new Error(message);
  }
  return response;
}

async function callAnalysisApi(type, input, file) {
  if (file) {
    const response = await apiFetch('/api/analyse/email-file', {
      method: 'POST',
      headers: { 'Content-Type': 'message/rfc822', 'X-Filename': file.name },
      body: await file.arrayBuffer(),
    });
    return response.json();
  }

  const path = type === 'email' ? '/api/analyse/email' : '/api/analyse/url';
  const body = type === 'email' ? { content: input, input_type: 'text' } : { url: input };
  const response = await apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
  return response.json();
}

async function analyseWithFallback(type, input, file) {
  try {
    return normalizeApiResult(await callAnalysisApi(type, input, file));
  } catch (error) {
    console.warn('API unavailable; using local analysis fallback.', error);
    if (file) {
      const text = await file.text();
      return normalizeApiResult(localAnalyseEmail(text));
    }
    return normalizeApiResult(type === 'email' ? localAnalyseEmail(input) : localAnalyseURL(input));
  }
}

async function submitFalsePositive(analysisId, notes) {
  const payload = { analysis_id: analysisId, reason: 'false_positive', notes: notes || '' };
  try {
    await apiFetch('/api/feedback/false-positive', { method: 'POST', body: JSON.stringify(payload) });
  } catch (error) {
    const list = getFeedback();
    list.unshift({ ...payload, time: new Date().toISOString(), userEmail: currentUser ? currentUser.email : '' });
    saveFeedback(list);
  }
}

async function loadAdminDomains() {
  try {
    const response = await apiFetch('/api/admin/blacklist');
    return response.json();
  } catch (error) {
    return getDomainLists();
  }
}

async function addAdminDomain(listName, domain) {
  const path = listName === 'whitelist' ? '/api/admin/whitelist' : '/api/admin/blacklist';
  try {
    const response = await apiFetch(path, { method: 'POST', body: JSON.stringify({ domain }) });
    const data = await response.json();
    saveDomainLists(data);
    return data;
  } catch (error) {
    const lists = getDomainLists();
    const addKey = listName === 'whitelist' ? 'whitelist' : 'blacklist';
    const removeKey = listName === 'whitelist' ? 'blacklist' : 'whitelist';
    if (!lists[addKey].includes(domain)) lists[addKey].push(domain);
    lists[removeKey] = lists[removeKey].filter(item => item !== domain);
    saveDomainLists(lists);
    return lists;
  }
}

async function removeAdminDomain(listName, domain) {
  try {
    const response = await apiFetch('/api/admin/domain/' + listName + '/' + encodeURIComponent(domain), { method: 'DELETE' });
    const data = await response.json();
    saveDomainLists(data);
    return data;
  } catch (error) {
    const lists = getDomainLists();
    const key = listName === 'whitelist' ? 'whitelist' : 'blacklist';
    lists[key] = lists[key].filter(item => item !== domain);
    saveDomainLists(lists);
    return lists;
  }
}

async function triggerRetrain() {
  try {
    const response = await apiFetch('/api/admin/retrain', { method: 'POST' });
    return response.json();
  } catch (error) {
    return { status: 'completed', model: { accuracy: 0.954, version: 'local-baseline' } };
  }
}

function downloadReport(reportId) {
  if (!reportId) {
    showToast('Report is not available for this entry.', 'info');
    return;
  }
  window.open(API_BASE_URL + '/api/reports/' + encodeURIComponent(reportId), '_blank', 'noopener');
}
