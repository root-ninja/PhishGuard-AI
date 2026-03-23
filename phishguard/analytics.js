/* PhishGuard AI — Analytics — renderAnalytics, indicator charts
   analytics.js */

// ═══════════════════════════════════════════════
//  ANALYTICS
// ═══════════════════════════════════════════════
function renderAnalytics() {
  const indData = [
    { name:'Urgent Language',     val:72 },
    { name:'Suspicious Domain',   val:58 },
    { name:'Typosquatting',       val:44 },
    { name:'No HTTPS',            val:39 },
    { name:'Long URL',            val:33 },
    { name:'Credential Request',  val:28 },
  ];
  document.getElementById('indicators-chart').innerHTML = indData.map(d => `
    <div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:12px;font-family:'JetBrains Mono',monospace">${d.name}</span>
        <span style="font-size:12px;font-family:'Space Mono',monospace;color:var(--accent)">${d.val}%</span>
      </div>
      <div style="height:4px;background:var(--bg3);border-radius:99px;overflow:hidden">
        <div style="height:100%;width:${d.val}%;background:linear-gradient(to right,var(--accent2),var(--accent));border-radius:99px;transition:width 0.8s"></div>
      </div>
    </div>`).join('');

  const typeData = [
    { name:'Email Analyses',    val:62, color:'var(--accent2)' },
    { name:'URL Analyses',      val:38, color:'var(--accent)' },
    { name:'Phishing Detected', val:24, color:'var(--red)' },
    { name:'False Positives',   val:2,  color:'var(--yellow)' },
  ];
  document.getElementById('type-chart').innerHTML = typeData.map(d => `
    <div class="mini-bar">
      <span style="width:160px;font-size:12px;font-family:'JetBrains Mono',monospace;flex-shrink:0">${d.name}</span>
      <div class="mini-bar-track">
        <div class="mini-bar-fill" style="width:${d.val}%;background:${d.color}"></div>
      </div>
      <span class="mini-bar-val" style="color:${d.color}">${d.val}%</span>
    </div>`).join('');
}
