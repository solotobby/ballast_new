/* ==========================================================================
   Ballast prototype — shared UI helpers (no framework).
   ========================================================================== */
window.UI = (function () {

  /* --- inline icon set (Feather-style, stroked) ------------------------- */
  const ICONS = {
    dashboard: '<path d="M3 12l9-9 9 9"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    obligations: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>',
    monitoring: '<path d="M3 12h4l2 6 4-14 2 8h6"/>',
    logbook: '<path d="M4 4h13a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    evidence: '<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
    insights: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12c.7.7 1 1.4 1 2h6c0-.6.3-1.3 1-2A7 7 0 0 0 12 2z"/>',
    reports: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8"/>',
    verifiable: '<path d="M12 2l3 3 4 .5.5 4 3 3-3 3-.5 4-4 .5-3 3-3-3-4-.5-.5-4-3-3 3-3 .5-4 4-.5z"/><path d="M9 12l2 2 4-4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2.2-1.3L14 2h-4l-.3 2.5A7 7 0 0 0 7.5 5.8l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .9.1 1.3l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2.2 1.3L10 22h4l.3-2.5a7 7 0 0 0 2.2-1.3l2.3 1 2-3.4-2-1.5c.1-.4.1-.9.1-1.3z"/>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v13"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    building: '<path d="M3 21h18M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M9 8h.01M12 8h.01M15 8h.01M9 12h.01M12 12h.01M15 12h.01"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
    grid: '<path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
    learn: '<path d="M22 9 12 5 2 9l10 4 10-4z"/><path d="M6 11v5c0 1 2.7 3 6 3s6-2 6-3v-5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="M9 14.5 8 22l4-2 4 2-1-7.5"/>',
    play: '<path d="M7 5v14l11-7z"/>',
    message: '<path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.6 1.8 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6z"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L17 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    bolt: '<path d="M13 2 3 14h7l-1 8 10-12h-7z"/>',
    thermometer: '<path d="M14 14V5a2 2 0 0 0-4 0v9a4 4 0 1 0 4 0z"/>',
    chevronL: '<path d="m15 18-6-6 6-6"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    server: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
    lifebuoy: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.6"/><path d="m5 5 3.5 3.5M15.5 15.5 19 19M19 5l-3.5 3.5M8.5 15.5 5 19"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
    flag: '<path d="M4 22V4s1-1 4-1 5 2 8 2 4-1 4-1v11s-1 1-4 1-5-2-8-2-4 1-4 1"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    refresh: '<path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>'
  };

  function icon(name, cls) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="${cls||''}">${ICONS[name]||''}</svg>`;
  }

  /* --- status helpers --------------------------------------------------- */
  const STATUS = {
    ok:      { cls:'st-ok',   label:'Met' },
    due:     { cls:'st-due',  label:'Due soon' },
    overdue: { cls:'st-bad',  label:'Overdue' },
    na:      { cls:'st-na',   label:'Not applicable' }
  };
  function statusPill(s) {
    const m = STATUS[s] || STATUS.na;
    return `<span class="pill ${m.cls}"><span class="dot"></span>${m.label}</span>`;
  }
  const EVSTATE = {
    valid:    { cls:'st-ok',  label:'Valid' },
    expiring: { cls:'st-due', label:'Expiring' },
    expired:  { cls:'st-bad', label:'Expired' }
  };
  function evPill(s){ const m = EVSTATE[s]||EVSTATE.valid; return `<span class="pill ${m.cls}"><span class="dot"></span>${m.label}</span>`; }

  const RPT = {
    due:       { cls:'st-due',  label:'Due' },
    draft:     { cls:'st-info', label:'Draft' },
    submitted: { cls:'st-ok',   label:'Submitted' },
    overdue:   { cls:'st-bad',  label:'Overdue' }
  };
  function rptPill(s){ const m = RPT[s]||RPT.draft; return `<span class="pill ${m.cls}"><span class="dot"></span>${m.label}</span>`; }

  const RISK = { high:{cls:'st-bad',label:'High'}, med:{cls:'st-due',label:'Medium'}, low:{cls:'st-na',label:'Low'} };
  function riskPill(r){ const m = RISK[r]||RISK.low; return `<span class="pill ${m.cls}"><span class="dot"></span>${m.label} priority</span>`; }

  function tierTag(t){ return `<span class="tier-tag">${t}</span>`; }

  function fmtDate(d){
    if(!d || d==='\u2014' || d==='—') return '—';
    const dt = new Date(d + 'T00:00:00');
    if(isNaN(dt)) return d;
    return dt.toLocaleDateString('en-GB',{ day:'numeric', month:'short', year:'numeric' });
  }

  /* --- toast ------------------------------------------------------------ */
  function toast(msg){
    let stack = document.getElementById('toast-stack');
    if(!stack){ stack = document.createElement('div'); stack.id='toast-stack'; document.body.appendChild(stack); }
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="dot"></span><span>${msg}</span>`;
    stack.appendChild(el);
    setTimeout(()=>{ el.style.transition='opacity .3s'; el.style.opacity='0'; setTimeout(()=>el.remove(),300); }, 2600);
  }

  /* --- modal ------------------------------------------------------------ */
  function modal(title, bodyHTML, footerHTML){
    let ov = document.getElementById('ui-modal');
    if(ov) ov.remove();
    ov = document.createElement('div');
    ov.id = 'ui-modal'; ov.className = 'overlay';
    ov.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="${title}">
        <div class="flex items-center justify-between px-5 py-4 border-b hairline">
          <h3 class="font-display text-lg font-semibold">${title}</h3>
          <button class="modal-close" data-close aria-label="Close">${icon('close')}</button>
        </div>
        <div class="px-5 py-5">${bodyHTML}</div>
        ${footerHTML ? `<div class="flex justify-end gap-2 px-5 py-4 border-t hairline bg-grey-50 rounded-b-2xl">${footerHTML}</div>` : ''}
      </div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(()=> ov.classList.add('open'));
    const close = ()=>{ ov.classList.remove('open'); setTimeout(()=>ov.remove(),180); };
    ov.addEventListener('click', e=>{ if(e.target===ov || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', function esc(e){ if(e.key==='Escape'){ close(); document.removeEventListener('keydown', esc);} });
    return { close, el: ov };
  }

  function param(name){ return new URLSearchParams(location.search).get(name); }

  return { icon, statusPill, evPill, rptPill, riskPill, tierTag, fmtDate, toast, modal, param, STATUS };
})();
