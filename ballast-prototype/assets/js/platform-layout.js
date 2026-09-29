/* ==========================================================================
   Ballast — PLATFORM back-office shell.
   Includes:
   - Elevated operator dark sidebar with status badges
   - Spotlight Operator Command Palette (Cmd+K)
   - Tenant switcher & audit indicators
   ========================================================================== */
(function () {
  const P = window.PLATFORM, page = document.body.dataset.page;

  const NAV = [
    { section:'Overview' },
    { id:'dashboard',  label:'Dashboard',    icon:'dashboard', href:'dashboard.html' },
    { section:'Tenants' },
    { id:'businesses', label:'Businesses',   icon:'building',  href:'businesses.html' },
    { section:'Governance' },
    { id:'rules',      label:'Rule library', icon:'book',      href:'rules.html' },
    { id:'scrapers',   label:'Gov scrapers & feeds', icon:'globe', href:'scrapers.html' },
    { id:'templates',  label:'Task templates', icon:'list',    href:'templates.html' },
    { id:'audit',      label:'Audit log',    icon:'activity',  href:'audit.html' },
    { section:'Operations' },
    { id:'support',    label:'Support',      icon:'lifebuoy',  href:'support.html' },
    { id:'system',     label:'System health',icon:'server',    href:'system.html' },
    { section:'Admin' },
    { id:'team',       label:'Team & roles', icon:'users',     href:'team.html' }
  ];

  const navHTML = NAV.map(item => {
    if (item.section) return `<div class="nav-section">${item.section}</div>`;
    const active = item.id === page ? ' active' : '';
    const badge = item.badge ? `<span class="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-900 text-brand-300">${item.badge}</span>` : '';
    return `<a class="nav-link${active}" href="${item.href}">${UI.icon(item.icon)}<span>${item.label}</span>${badge}</a>`;
  }).join('');

  const sidebar = `
    <aside class="app-sidebar">
      <div class="flex items-center gap-2.5 px-5 h-[62px] border-b border-[#182330]">
        <div class="w-8 h-8 rounded-lg grid place-items-center shadow-sm" style="background:linear-gradient(150deg,#7FCBF0,#1F7DB4)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#0E1319" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M5 8l7-5 7 5"/><path d="M5 8v6a7 7 0 0 0 14 0V8"/></svg>
        </div>
        <div class="leading-tight">
          <div class="font-display text-white font-semibold text-[15px] tracking-tight">Ballast</div>
          <div class="text-[10px] text-brand-300 font-bold tracking-wider">OPS PLATFORM</div>
        </div>
      </div>
      <nav class="flex-1 overflow-y-auto py-3">${navHTML}</nav>
      <div class="p-3 border-t border-[#182330] space-y-2">
        <a href="../pages/dashboard.html" class="flex items-center justify-between px-3 py-2 rounded-lg bg-[#141C26] hover:bg-[#1C2634] text-xs font-semibold text-slate-300 hover:text-white transition border border-[#212E3F]">
          <span class="flex items-center gap-1.5">&larr; Switch to Tenant App</span>
          <span class="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">Live</span>
        </a>
        <div class="flex items-center gap-2.5 px-2 py-1.5">
          <div class="w-7 h-7 rounded-full bg-brand-300 text-ink grid place-items-center text-xs font-bold">OO</div>
          <div class="leading-tight min-w-0 flex-1">
            <div class="text-white text-[13px] font-medium truncate">Opeyemi O.</div>
            <div class="text-[11px] text-[#788899] truncate">Platform Administrator</div>
          </div>
          <a href="login.html" class="text-[#788899] hover:text-white transition" title="Sign out">${UI.icon('logout','w-4 h-4')}</a>
        </div>
      </div>
    </aside>
    <div class="sidebar-backdrop" data-nav-close></div>`;

  const topbar = `
    <header class="app-topbar flex items-center gap-3 px-4 md:px-6">
      <button class="menu-btn btn btn-quiet btn-sm md:hidden" data-nav-toggle aria-label="Open menu">${UI.icon('menu')}</button>

      <span class="pill st-due !py-1 hidden sm:inline-flex items-center gap-1.5 font-semibold text-xs" title="You are in the internal operator console">
        ${UI.icon('shield','w-3.5 h-3.5')} Internal Operator Console
      </span>

      <!-- Spotlight Search Trigger -->
      <div class="relative flex-1 max-w-md hidden md:block">
        <button id="platCmdTrigger" class="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-grey-100/70 hover:bg-grey-100 border border-grey-200/80 hover:border-grey-300 transition text-xs text-grey-500 text-left">
          <span class="flex items-center gap-2.5">
            <svg class="w-3.5 h-3.5 text-grey-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
            <span>Search tenants, scrapers, rules, logs...</span>
          </span>
          <kbd class="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-grey-500 bg-white border border-grey-200 rounded shadow-xs">
            <span>⌘</span><span>K</span>
          </kbd>
        </button>
      </div>

      <div class="ml-auto flex items-center gap-2">
        <a href="scrapers.html" class="btn btn-primary btn-sm hidden sm:inline-flex">
          ${UI.icon('globe','w-3.5 h-3.5')} Daily Scraper Feeds
        </a>
        <a href="audit.html" class="btn btn-quiet btn-sm btn-icon" title="Platform Audit Trail">${UI.icon('activity','w-4 h-4')}</a>
        <a href="support.html" class="btn btn-quiet btn-sm btn-icon relative" title="Operator Support">
          ${UI.icon('lifebuoy','w-4 h-4')}
          <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-bad"></span>
        </a>
        <span class="w-8 h-8 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-xs font-bold shadow-xs">OO</span>
      </div>
    </header>

    <!-- Platform Command Palette Modal (Cmd+K) -->
    <div id="platCmdOverlay" class="overlay">
      <div class="cmd-modal">
        <div class="flex items-center gap-3 px-4 py-3.5 border-b hairline bg-white">
          <svg class="w-4 h-4 text-grey-400 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <input id="platCmdInput" class="w-full bg-transparent border-0 outline-none text-sm text-ink placeholder-grey-400" placeholder="Type a platform command, rule or scraper source..." />
          <kbd class="text-[10px] font-medium text-grey-400 px-1.5 py-0.5 bg-grey-100 rounded border hairline">ESC</kbd>
        </div>
        <div id="platCmdResults" class="p-2 max-h-80 overflow-y-auto space-y-1">
          <div class="px-3 pt-2 pb-1 text-[10px] font-bold text-grey-400 uppercase tracking-wider">Platform Areas</div>
          <a href="dashboard.html" class="cmd-item selected"><span class="w-6 h-6 rounded bg-brand-50 text-brand-600 grid place-items-center flex-none">${UI.icon('dashboard','w-3.5 h-3.5')}</span><span class="flex-1 font-medium text-xs">Platform Dashboard</span></a>
          <a href="scrapers.html" class="cmd-item"><span class="w-6 h-6 rounded bg-brand-50 text-brand-600 grid place-items-center flex-none">${UI.icon('globe','w-3.5 h-3.5')}</span><span class="flex-1 font-medium text-xs">Gov Scrapers &amp; Regulatory Ingestion</span><span class="text-[10px] text-brand-600 font-semibold">Crawl Engine</span></a>
          <a href="businesses.html" class="cmd-item"><span class="w-6 h-6 rounded bg-brand-50 text-brand-600 grid place-items-center flex-none">${UI.icon('building','w-3.5 h-3.5')}</span><span class="flex-1 font-medium text-xs">Tenants &amp; Registered Businesses</span></a>
          <a href="rules.html" class="cmd-item"><span class="w-6 h-6 rounded bg-brand-50 text-brand-600 grid place-items-center flex-none">${UI.icon('book','w-3.5 h-3.5')}</span><span class="flex-1 font-medium text-xs">Rule Library</span></a>
          <a href="templates.html" class="cmd-item"><span class="w-6 h-6 rounded bg-brand-50 text-brand-600 grid place-items-center flex-none">${UI.icon('list','w-3.5 h-3.5')}</span><span class="flex-1 font-medium text-xs">Task Templates</span></a>
          <a href="system.html" class="cmd-item"><span class="w-6 h-6 rounded bg-brand-50 text-brand-600 grid place-items-center flex-none">${UI.icon('server','w-3.5 h-3.5')}</span><span class="flex-1 font-medium text-xs">System Health &amp; Ingestion Workers</span></a>
          <a href="audit.html" class="cmd-item"><span class="w-6 h-6 rounded bg-brand-50 text-brand-600 grid place-items-center flex-none">${UI.icon('activity','w-3.5 h-3.5')}</span><span class="flex-1 font-medium text-xs">Platform Audit Trail</span></a>
          <a href="team.html" class="cmd-item"><span class="w-6 h-6 rounded bg-brand-50 text-brand-600 grid place-items-center flex-none">${UI.icon('users','w-3.5 h-3.5')}</span><span class="flex-1 font-medium text-xs">Platform Roles &amp; Team</span></a>
        </div>
        <div class="px-4 py-2 border-t hairline bg-grey-50 flex items-center justify-between text-[11px] text-grey-400">
          <span><kbd class="font-semibold text-grey-600">↑↓</kbd> to navigate, <kbd class="font-semibold text-grey-600">↵</kbd> to open</span>
          <span>Internal Ballast Ops Console</span>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('afterbegin', sidebar + topbar);
  const body = document.body;
  document.querySelector('[data-nav-toggle]')?.addEventListener('click', ()=> body.classList.toggle('nav-open'));
  document.querySelector('[data-nav-close]')?.addEventListener('click', ()=> body.classList.remove('nav-open'));

  // Command palette
  const trigger = document.getElementById('platCmdTrigger');
  const overlay = document.getElementById('platCmdOverlay');
  const input = document.getElementById('platCmdInput');
  const results = document.getElementById('platCmdResults');

  function openPlatCmd() { overlay.classList.add('open'); setTimeout(() => input.focus(), 50); }
  function closePlatCmd() { overlay.classList.remove('open'); input.value = ''; filterPlatCmd(''); }

  trigger?.addEventListener('click', openPlatCmd);
  overlay?.addEventListener('click', e => { if (e.target === overlay) closePlatCmd(); });

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (overlay.classList.contains('open')) closePlatCmd();
      else openPlatCmd();
    } else if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closePlatCmd();
    }
  });

  function filterPlatCmd(query) {
    const q = query.toLowerCase().trim();
    results.querySelectorAll('.cmd-item').forEach(item => {
      item.style.display = !q || item.textContent.toLowerCase().includes(q) ? 'flex' : 'none';
    });
  }
  input?.addEventListener('input', e => filterPlatCmd(e.target.value));
})();