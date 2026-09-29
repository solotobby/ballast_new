/* ==========================================================================
   Ballast — STAFF shell. Injects a desktop sidebar + a shared top bar +
   a mobile bottom tab bar into any page with:
     <body class="staff" data-staff-page="home" data-staff-title="Home">
   Optional: data-staff-back="home.html" shows a back button + title instead
   of the greeting (used on detail pages).
   ========================================================================== */
(function () {
  const S = window.STAFF, ds = document.body.dataset;
  const page = ds.staffPage, title = ds.staffTitle || '', back = ds.staffBack;
  const unread = S.unreadCount();

  const NAV = [
    { id:'home',   label:'Home',   icon:'home',    href:'home.html' },
    { id:'log',    label:'Log',    icon:'logbook', href:'log.html' },
    { id:'learn',  label:'Learn',  icon:'learn',   href:'learn.html' },
    { id:'alerts', label:'Alerts', icon:'bell',    href:'alerts.html', badge: unread },
    { id:'profile',label:'Profile',icon:'user',    href:'profile.html' }
  ];

  /* ---- desktop sidebar ---- */
  const sideLinks = NAV.map(n=>{
    const active = n.id===page ? ' active' : '';
    const badge = n.badge ? `<span class="staff-side-badge">${n.badge}</span>` : '';
    return `<a class="staff-side-link${active}" href="${n.href}">${UI.icon(n.icon)}<span>${n.label}</span>${badge}</a>`;
  }).join('');

  const sidebar = `
    <aside class="staff-sidebar">
      <div class="flex items-center gap-2.5 px-5 h-[64px] border-b hairline">
        <div class="w-8 h-8 rounded-lg grid place-items-center" style="background:linear-gradient(150deg,#7FCBF0,#1F7DB4)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#0E1319" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M5 8l7-5 7 5"/><path d="M5 8v6a7 7 0 0 0 14 0V8"/></svg>
        </div>
        <div class="leading-tight"><div class="font-display font-semibold text-[15px]">Ballast</div>
          <div class="text-[11px] text-grey-500">for staff</div></div>
      </div>
      <nav class="flex-1 py-3">${sideLinks}</nav>
      <a href="profile.html" class="flex items-center gap-2.5 m-3 p-2.5 rounded-xl hover:bg-grey-50 border hairline">
        <span class="w-9 h-9 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-sm font-semibold">${S.me.initials}</span>
        <div class="leading-tight min-w-0"><div class="text-sm font-medium truncate">${S.me.name}</div>
          <div class="text-xs text-grey-500 truncate">${S.me.role}</div></div>
      </a>
    </aside>`;

  /* ---- top bar ---- */
  const left = back
    ? `<a href="${back}" class="btn btn-quiet btn-sm !px-2" aria-label="Back">${UI.icon('chevronL','w-5 h-5')}</a>
       <span class="font-display font-semibold text-[17px] truncate">${title}</span>`
    : (page==='home'
        ? `<a href="profile.html" class="w-9 h-9 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-sm font-semibold lg:hidden">${S.me.initials}</a>
           <div class="leading-tight"><div class="text-[11px] text-grey-500 -mb-0.5">${S.me.site}</div>
             <div class="font-display font-semibold text-[17px]">Hi, ${S.me.first}</div></div>`
        : `<span class="font-display font-semibold text-[18px]">${title}</span>`);

  const topbar = `
    <header class="staff-topbar">
      ${left}
      <div class="ml-auto flex items-center gap-1">
        <a href="alerts.html" class="btn btn-quiet btn-sm !px-2 relative" aria-label="Alerts">
          ${UI.icon('bell','w-5 h-5')}
          ${unread ? `<span class="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-bad text-white text-[9px] font-bold grid place-items-center">${unread}</span>` : ''}
        </a>
      </div>
    </header>`;

  /* ---- bottom nav (mobile) ---- */
  const tabs = NAV.map(n=>{
    const active = n.id===page ? ' active' : '';
    const badge = n.badge ? `<span class="tab-badge">${n.badge}</span>` : '';
    return `<a class="staff-tab${active}" href="${n.href}">${UI.icon(n.icon)}${badge}<span>${n.label}</span></a>`;
  }).join('');
  const bottomnav = `<nav class="staff-bottomnav">${tabs}</nav>`;

  document.body.insertAdjacentHTML('afterbegin', sidebar + topbar);
  document.body.insertAdjacentHTML('beforeend', bottomnav);
})();
