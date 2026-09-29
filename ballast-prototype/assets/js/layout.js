/* ==========================================================================
   Ballast — Precision App Shell (Matured Design & Power-User UX).
   Features:
   - Command Palette with Raycast-grade keyboard shortcuts (Cmd+K)
   - Sequential Hotkeys (G then D = Dashboard, G then O = Obligations)
   - Real-time Regulatory Engine Heartbeat Indicator
   - Multi-Site Interactive Switcher with Branch Telemetry
   - Micro-toast system & User session inspector
   ========================================================================== */
(function () {
  const B = window.BALLAST, page = document.body.dataset.page;

  const NAV = [
    { section: 'Overview' },
    { id:'dashboard',  label:'Dashboard',        icon:'dashboard',  href:'dashboard.html', hotkey:'G D' },
    { id:'obligations',label:'Obligations',      icon:'obligations',href:'obligations.html', hotkey:'G O' },
    { id:'monitoring', label:'Monitoring',       icon:'monitoring', href:'monitoring.html', hotkey:'G M' },
    { section: 'Records' },
    { id:'logbook',    label:'Logbook',          icon:'logbook',    href:'logbook.html', hotkey:'G L' },
    { id:'evidence',   label:'Evidence vault',   icon:'evidence',   href:'evidence.html', hotkey:'G E' },
    { id:'reports',    label:'Reports',          icon:'reports',    href:'reports.html', hotkey:'G R' },
    { section: 'Intelligence' },
    { id:'insights',   label:'Insights',         icon:'insights',   href:'insights.html', hotkey:'G I' },
    { id:'verifiable', label:'Verifiable',       icon:'verifiable', href:'verifiable.html', badge:'Beta' },
    { section: 'System' },
    { id:'settings',   label:'Settings',         icon:'settings',   href:'settings.html', hotkey:'G S' }
  ];

  const navHTML = NAV.map(item => {
    if (item.section) return `<div class="nav-section">${item.section}</div>`;
    const active = item.id === page ? ' active' : '';
    const badge = item.badge ? `<span class="ml-auto text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800/60">${item.badge}</span>` : '';
    return `<a class="nav-link${active}" href="${item.href}">
      ${UI.icon(item.icon)}
      <span class="flex-1">${item.label}</span>
      ${badge}
    </a>`;
  }).join('');

  const sidebar = `
    <aside class="app-sidebar">
      <div class="flex items-center justify-between px-5 h-[64px] border-b border-[#161D27]">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg grid place-items-center shadow-md relative overflow-hidden" style="background:linear-gradient(145deg,#0284C7,#0369A1)">
            <div class="absolute inset-0 bg-gradient-to-tr from-transparent to-white/20"></div>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M5 8l7-5 7 5"/><path d="M5 8v6a7 7 0 0 0 14 0V8"/></svg>
          </div>
          <div class="leading-tight">
            <div class="font-display text-white font-bold text-[15px] tracking-tight flex items-center gap-1.5">
              <span>Ballast</span>
              <span class="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">OS</span>
            </div>
            <div class="text-[10px] text-[#718096] font-mono font-medium tracking-wider">COMPLIANCE ENGINE</div>
          </div>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto py-3">${navHTML}</nav>

      <!-- User footer container -->
      <div class="p-3 border-t border-[#161D27]">
        <div class="relative">
          <button id="userProfileBtn" class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/5 transition text-left group">
            <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-400 to-sky-600 text-obsidian-950 grid place-items-center text-xs font-bold shadow-sm flex-none">OO</div>
            <div class="leading-tight min-w-0 flex-1">
              <div class="text-white text-[12.5px] font-semibold truncate group-hover:text-sky-300 transition">Opeyemi O.</div>
              <div class="text-[10.5px] text-[#718096] font-mono truncate">The Copper Kettle · Owner</div>
            </div>
            <svg class="w-3.5 h-3.5 text-[#718096] group-hover:text-white transition flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </button>

          <!-- Dropdown flyout -->
          <div id="userProfileMenu" class="absolute bottom-full left-0 mb-2 w-60 bg-[#0A0E15] border border-[#202A38] rounded-xl shadow-2xl p-1.5 hidden z-50 text-xs font-sans">
            <div class="px-3 py-2 border-b border-[#202A38] text-slate-400">
              <div class="font-bold text-white text-[12px]">The Copper Kettle Ltd</div>
              <div class="text-[10.5px] font-mono text-slate-500">CRN: 14829104 · Manchester</div>
            </div>
            <a href="settings.html" class="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition">
              ${UI.icon('settings','w-3.5 h-3.5 text-sky-400')} Workspace &amp; Sites
            </a>
            <a href="../staff/home.html" class="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition">
              ${UI.icon('user','w-3.5 h-3.5 text-emerald-400')} Staff Mobile Terminal
            </a>
            <div class="my-1 border-t border-[#202A38]"></div>
            <a href="login.html" class="flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-950/40 transition">
              ${UI.icon('logout','w-3.5 h-3.5')} Sign Out of Workspace
            </a>
          </div>
        </div>
      </div>
    </aside>
    <div class="sidebar-backdrop" data-nav-close></div>`;

  const alertsCount = B.alerts ? B.alerts.length : 3;
  const alertsHTML = (B.alerts || []).map(a => {
    const map = { overdue:'st-bad', due:'st-due', evidence:'st-info', system:'st-na' };
    return `<div class="flex gap-3 px-4 py-3 hover:bg-slate-50 border-b hairline last:border-0 transition-colors">
      <span class="pill ${map[a.kind]||'st-na'} !p-0 !w-6 !h-6 grid place-items-center flex-none">${UI.icon(a.kind==='evidence'?'file':'alert','w-3.5 h-3.5')}</span>
      <div class="min-w-0 flex-1">
        <div class="text-xs font-semibold text-ink leading-snug">${a.title}</div>
        <div class="text-[11px] text-grey-500 font-mono mt-0.5">${a.meta} · ${a.ts}</div>
      </div>
    </div>`;
  }).join('');

  const topbar = `
    <header class="app-topbar flex items-center gap-3 px-4 md:px-7">
      <button class="menu-btn btn btn-quiet btn-sm md:hidden" data-nav-toggle aria-label="Open menu">${UI.icon('menu')}</button>

      <!-- Multi-Site Switcher Pill -->
      <div class="relative">
        <button id="siteSelectorBtn" class="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border hairline hover:bg-slate-50 hover:border-slate-300 transition text-xs font-semibold text-ink bg-white shadow-xs">
          <span class="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100"></span>
          <span id="currentSiteLabel">${B.business ? B.business.name : 'The Copper Kettle'}</span>
          <span class="text-grey-400 font-mono text-[10.5px]">· Manchester (HQ)</span>
          ${UI.icon('chevron','w-3 h-3 text-grey-400 rotate-90 ml-0.5')}
        </button>

        <!-- Dropdown -->
        <div id="siteSelectorDropdown" class="absolute top-full left-0 mt-2 w-80 card shadow-pop p-2 hidden z-50 text-xs">
          <div class="px-3 py-1.5 text-[10px] font-mono font-bold text-grey-400 uppercase tracking-wider border-b hairline mb-1">Select Active Operating Location</div>
          <button class="w-full flex items-center justify-between p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/80 text-sky-950 font-semibold text-left transition site-opt mb-1" data-site="Central Manchester (HQ)">
            <div class="flex items-start gap-2.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 mt-1"></span>
              <div>
                <div class="text-xs font-bold">Central Manchester (HQ)</div>
                <div class="text-[10.5px] text-sky-700 font-mono mt-0.5">M1 4BT · 14 staff · Commercial kitchen</div>
              </div>
            </div>
            ${UI.icon('check','w-4 h-4 text-sky-600 flex-none')}
          </button>
          <button class="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 font-medium text-left transition site-opt" data-site="Ancoats Prep Kitchen">
            <div class="flex items-start gap-2.5">
              <span class="w-2 h-2 rounded-full bg-slate-300 mt-1"></span>
              <div>
                <div class="text-xs font-semibold text-slate-800">Ancoats Prep Kitchen</div>
                <div class="text-[10.5px] text-slate-400 font-mono mt-0.5">M4 5BD · 4 staff · Bakery & storage</div>
              </div>
            </div>
          </button>
          <div class="my-1.5 border-t hairline"></div>
          <a href="settings.html" class="flex items-center gap-2 px-3 py-2 text-sky-700 hover:bg-sky-50 rounded-lg font-semibold transition text-xs">
            ${UI.icon('plus','w-3.5 h-3.5')} Manage or provision site...
          </a>
        </div>
      </div>

      <!-- Engine Live Sync Pill (Heartbeat) -->
      <div class="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>REGULATORY SYNC: <strong class="text-slate-800 font-semibold">ACTIVE</strong> (02:00 UTC)</span>
      </div>

      <!-- Spotlight Search Trigger (Cmd+K) -->
      <div class="relative flex-1 max-w-sm hidden md:block">
        <button id="cmdPaletteTrigger" class="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-slate-100/80 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition text-xs text-slate-500 text-left">
          <span class="flex items-center gap-2">
            <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
            <span class="font-medium">Quick search...</span>
          </span>
          <kbd class="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-200 rounded shadow-xs">
            <span>⌘K</span>
          </kbd>
        </button>
      </div>

      <!-- Topbar Actions -->
      <div class="ml-auto flex items-center gap-2">
        <!-- Notification Alerts -->
        <div class="relative">
          <button class="btn btn-quiet btn-sm btn-icon relative" data-alerts-toggle aria-label="Alerts">
            ${UI.icon('bell','w-4 h-4 text-slate-600')}
            <span id="alertsBadge" class="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
          </button>
          <div class="absolute right-0 mt-2 w-80 card shadow-pop overflow-hidden hidden z-50" data-alerts-panel>
            <div class="flex items-center justify-between px-4 py-3 border-b hairline bg-slate-50">
              <div class="flex items-center gap-2">
                <span class="font-display font-bold text-xs uppercase tracking-wider text-slate-700">Notifications</span>
                <span id="alertsCountLabel" class="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700">${alertsCount} active</span>
              </div>
              <button id="markReadBtn" class="text-xs text-sky-700 hover:underline font-semibold">Mark read</button>
            </div>
            <div id="alertsContainer" class="max-h-80 overflow-auto divide-y divide-slate-100">${alertsHTML}</div>
            <div class="p-2.5 border-t hairline bg-slate-50 text-center">
              <a href="monitoring.html" class="text-xs font-semibold text-sky-700 hover:text-sky-800">Open monitoring schedule &rarr;</a>
            </div>
          </div>
        </div>

        <a href="settings.html" class="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-sky-400 text-white font-bold grid place-items-center text-xs shadow-xs hover:scale-105 transition" title="Account &amp; Workspace">
          OO
        </a>
      </div>
    </header>

    <!-- Raycast-Style Command Palette (Cmd+K) -->
    <div id="cmdPaletteOverlay" class="overlay">
      <div class="cmd-modal">
        <div class="flex items-center gap-3 px-4 py-3.5 border-b hairline bg-white">
          <svg class="w-4 h-4 text-sky-600 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <input id="cmdSearchInput" class="w-full bg-transparent border-0 outline-none text-sm text-ink placeholder-slate-400 font-medium" placeholder="Search duties, documents, tasks or jump to page..." />
          <kbd class="text-[10px] font-mono font-bold text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded border hairline">ESC</kbd>
        </div>
        <div id="cmdResults" class="p-2 max-h-80 overflow-y-auto space-y-1">
          <div class="px-3 pt-2 pb-1 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Navigation</div>
          <a href="dashboard.html" class="cmd-item selected"><span class="w-6 h-6 rounded bg-sky-50 text-sky-600 grid place-items-center flex-none">${UI.icon('dashboard','w-3.5 h-3.5')}</span><span class="flex-1 font-semibold text-xs">Dashboard</span><kbd class="font-mono text-[10px] text-slate-400">G D</kbd></a>
          <a href="obligations.html" class="cmd-item"><span class="w-6 h-6 rounded bg-sky-50 text-sky-600 grid place-items-center flex-none">${UI.icon('obligations','w-3.5 h-3.5')}</span><span class="flex-1 font-semibold text-xs">Obligations Register (16 Rules)</span><kbd class="font-mono text-[10px] text-slate-400">G O</kbd></a>
          <a href="monitoring.html" class="cmd-item"><span class="w-6 h-6 rounded bg-sky-50 text-sky-600 grid place-items-center flex-none">${UI.icon('monitoring','w-3.5 h-3.5')}</span><span class="flex-1 font-semibold text-xs">Monitoring &amp; Deadlines</span><kbd class="font-mono text-[10px] text-slate-400">G M</kbd></a>
          <a href="logbook.html" class="cmd-item"><span class="w-6 h-6 rounded bg-sky-50 text-sky-600 grid place-items-center flex-none">${UI.icon('logbook','w-3.5 h-3.5')}</span><span class="flex-1 font-semibold text-xs">Logbook</span><kbd class="font-mono text-[10px] text-slate-400">G L</kbd></a>
          <a href="evidence.html" class="cmd-item"><span class="w-6 h-6 rounded bg-sky-50 text-sky-600 grid place-items-center flex-none">${UI.icon('evidence','w-3.5 h-3.5')}</span><span class="flex-1 font-semibold text-xs">Evidence Vault</span><kbd class="font-mono text-[10px] text-slate-400">G E</kbd></a>
          <a href="reports.html" class="cmd-item"><span class="w-6 h-6 rounded bg-sky-50 text-sky-600 grid place-items-center flex-none">${UI.icon('reports','w-3.5 h-3.5')}</span><span class="flex-1 font-semibold text-xs">Reports &amp; Inspection Packs</span><kbd class="font-mono text-[10px] text-slate-400">G R</kbd></a>
          
          <div class="px-3 pt-3 pb-1 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Quick Actions</div>
          <button class="cmd-item w-full text-left" onclick="location.href='logbook.html?new=true'"><span class="w-6 h-6 rounded bg-emerald-50 text-emerald-600 grid place-items-center flex-none">${UI.icon('plus','w-3.5 h-3.5')}</span><span class="flex-1 font-semibold text-xs">Log Fridge Temperature (AM)</span><kbd class="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded">N L</kbd></button>
          <button class="cmd-item w-full text-left" onclick="location.href='evidence.html?upload=true'"><span class="w-6 h-6 rounded bg-sky-50 text-sky-600 grid place-items-center flex-none">${UI.icon('upload','w-3.5 h-3.5')}</span><span class="flex-1 font-semibold text-xs">Upload Statutory Certificate (Gas / Fire)</span><kbd class="font-mono text-[10px] text-sky-700 bg-sky-50 px-1 rounded">U E</kbd></button>
          <button class="cmd-item w-full text-left" onclick="location.href='reports.html'"><span class="w-6 h-6 rounded bg-purple-50 text-purple-600 grid place-items-center flex-none">${UI.icon('reports','w-3.5 h-3.5')}</span><span class="flex-1 font-semibold text-xs">Generate EHO Inspection Readiness Dossier</span><span class="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-mono font-semibold">Audit Pack</span></button>
        </div>
        <div class="px-4 py-2 border-t hairline bg-slate-50 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div class="flex items-center gap-3">
            <span><strong class="text-slate-700">↑↓</strong> Navigate</span>
            <span><strong class="text-slate-700">↵</strong> Select</span>
          </div>
          <span>Ballast Intelligent Navigator</span>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('afterbegin', sidebar + topbar);

  // Mobile drawer
  const body = document.body;
  document.querySelector('[data-nav-toggle]')?.addEventListener('click', ()=> body.classList.toggle('nav-open'));
  document.querySelector('[data-nav-close]')?.addEventListener('click', ()=> body.classList.remove('nav-open'));

  // User menu
  const userBtn = document.getElementById('userProfileBtn');
  const userMenu = document.getElementById('userProfileMenu');
  userBtn?.addEventListener('click', (e) => { e.stopPropagation(); userMenu.classList.toggle('hidden'); });

  // Site selector
  const siteBtn = document.getElementById('siteSelectorBtn');
  const siteDropdown = document.getElementById('siteSelectorDropdown');
  siteBtn?.addEventListener('click', (e) => { e.stopPropagation(); siteDropdown.classList.toggle('hidden'); });

  document.querySelectorAll('.site-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const site = btn.getAttribute('data-site');
      UI.toast(`Active location switched to: ${site}`, 'success');
      siteDropdown.classList.add('hidden');
    });
  });

  // Alerts
  const aToggle = document.querySelector('[data-alerts-toggle]');
  const aPanel  = document.querySelector('[data-alerts-panel]');
  const badge = document.getElementById('alertsBadge');
  const countLabel = document.getElementById('alertsCountLabel');
  const markReadBtn = document.getElementById('markReadBtn');

  aToggle?.addEventListener('click', e=>{ e.stopPropagation(); aPanel.classList.toggle('hidden'); });
  markReadBtn?.addEventListener('click', () => {
    if (badge) badge.classList.add('hidden');
    if (countLabel) countLabel.textContent = '0 active';
    UI.toast('All alerts acknowledged', 'success');
  });

  // Command palette
  const cmdTrigger = document.getElementById('cmdPaletteTrigger');
  const cmdOverlay = document.getElementById('cmdPaletteOverlay');
  const cmdInput = document.getElementById('cmdSearchInput');
  const cmdResults = document.getElementById('cmdResults');

  function openCmd() { cmdOverlay.classList.add('open'); setTimeout(() => cmdInput.focus(), 40); }
  function closeCmd() { cmdOverlay.classList.remove('open'); cmdInput.value = ''; filterCmd(''); }

  cmdTrigger?.addEventListener('click', openCmd);
  cmdOverlay?.addEventListener('click', (e) => { if (e.target === cmdOverlay) closeCmd(); });

  let keySeq = '';
  let seqTimer = null;

  document.addEventListener('keydown', (e) => {
    // Cmd+K
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (cmdOverlay.classList.contains('open')) closeCmd();
      else openCmd();
      return;
    }
    if (e.key === 'Escape' && cmdOverlay.classList.contains('open')) {
      closeCmd();
      return;
    }

    // Don't trigger sequence hotkeys when typing in input
    if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) return;

    clearTimeout(seqTimer);
    keySeq += e.key.toLowerCase();
    seqTimer = setTimeout(() => { keySeq = ''; }, 600);

    if (keySeq === 'gd') location.href = 'dashboard.html';
    else if (keySeq === 'go') location.href = 'obligations.html';
    else if (keySeq === 'gm') location.href = 'monitoring.html';
    else if (keySeq === 'gl') location.href = 'logbook.html';
    else if (keySeq === 'ge') location.href = 'evidence.html';
    else if (keySeq === 'gr') location.href = 'reports.html';
    else if (keySeq === 'gs') location.href = 'settings.html';
    else if (keySeq === 'nl') location.href = 'logbook.html?new=true';
    else if (keySeq === 'ue') location.href = 'evidence.html?upload=true';
  });

  function filterCmd(query) {
    const q = query.toLowerCase().trim();
    cmdResults.querySelectorAll('.cmd-item').forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = !q || text.includes(q) ? 'flex' : 'none';
    });
  }
  cmdInput?.addEventListener('input', (e) => filterCmd(e.target.value));

  document.addEventListener('click', e => {
    if (aPanel && !aPanel.contains(e.target) && !aToggle.contains(e.target)) aPanel.classList.add('hidden');
    if (siteDropdown && !siteDropdown.contains(e.target) && !siteBtn.contains(e.target)) siteDropdown.classList.add('hidden');
    if (userMenu && !userMenu.contains(e.target) && !userBtn.contains(e.target)) userMenu.classList.add('hidden');
  });
})();