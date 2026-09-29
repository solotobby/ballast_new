/* ==========================================================================
   Ballast — STAFF-side dummy data.
   One front-line staff member (Rina Okafor, site lead at The Copper Kettle),
   with her tasks, log entries, notifications, learning and profile.
   Reuses window.BALLAST obligations where useful (loaded from data.js).
   ========================================================================== */
window.STAFF = (function () {

  const me = {
    name: 'Rina Okafor', first: 'Rina', initials: 'RO',
    role: 'Site lead', site: 'Northern Quarter café',
    business: 'The Copper Kettle',
    email: 'rokafor@copperkettle.co', phone: '07700 900132',
    started: '2025-09-01', manager: 'A. Mensah'
  };

  // status: todo | done | overdue ; type: check | review | log | renewal | training
  const tasks = [
    { id:'T-01', title:'Morning fridge & freezer temperature check', type:'check', due:'Today', when:0, status:'todo',
      guidance:'Record temperatures for every unit before service. Anything above 5\u00b0C needs a note and a fix.', obl:'OBL-010' },
    { id:'T-02', title:'Confirm allergen matrix matches the autumn menu', type:'review', due:'Today', when:0, status:'todo',
      guidance:'Check the printed matrix against today\u2019s specials before doors open. If anything\u2019s off, flag it and don\u2019t serve it.', obl:'OBL-009' },
    { id:'T-03', title:'Log last night\u2019s Challenge 25 refusals', type:'log', due:'Today', when:0, status:'done', obl:'OBL-002' },
    { id:'T-04', title:'Weekly cleaning sign-off', type:'check', due:'In 2 days', when:2, status:'todo',
      guidance:'Walk the kitchen and front-of-house against the cleaning schedule, then sign each area off.', obl:'OBL-010' },
    { id:'T-05', title:'Start your personal licence renewal review', type:'renewal', due:'In 5 days', when:5, status:'todo',
      guidance:'As the premises supervisor, your personal licence needs a review to keep authorising alcohol sales.', obl:'OBL-003' },
    { id:'T-06', title:'Food hygiene Level 2 refresher', type:'training', due:'In 5 days', when:5, status:'todo',
      guidance:'A 20-minute refresher. Complete it to keep your certificate current.', learn:'L-1' }
  ];

  // kind: task | training | evidence | message | shift | system
  const notifications = [
    { id:'N-1', kind:'training', title:'New training assigned', body:'Food hygiene Level 2 refresher \u2014 due in 5 days.', ts:'1h ago', unread:true, link:'learn.html' },
    { id:'N-2', kind:'task', title:'Task still open today', body:'The morning temperature check hasn\u2019t been logged yet.', ts:'3h ago', unread:true, link:'home.html' },
    { id:'N-3', kind:'message', title:'Message from A. Mensah', body:'Thanks for sorting the allergen update yesterday \u2014 nicely handled.', ts:'1 day ago', unread:false },
    { id:'N-4', kind:'evidence', title:'Your certificate is expiring', body:'Level 2 food hygiene certificate expires in 30 days.', ts:'2 days ago', unread:false, link:'profile.html' },
    { id:'N-5', kind:'shift', title:'Next week\u2019s rota is out', body:'Your shifts for the week of 29 Sep are published.', ts:'3 days ago', unread:false },
    { id:'N-6', kind:'system', title:'A policy was updated', body:'The kitchen cleaning SOP was updated by your manager.', ts:'4 days ago', unread:false }
  ];

  // staff member's own log entries (a personal slice of the operational logbook)
  const myLog = [
    { id:'LOG-2040', type:'Challenge 25 refusal', date:'2026-09-16', summary:'Refused an alcohol sale \u2014 ID declined. Logged per licensing conditions.', obl:'OBL-002' },
    { id:'LOG-2035', type:'Inspection', date:'2026-08-15', summary:'Cross-checked the allergen matrix against the new menu and corrected one discrepancy.', obl:'OBL-009' },
    { id:'LOG-2031', type:'Temperature check', date:'2026-09-22', summary:'AM fridge/freezer temps recorded \u2014 all within range.', obl:'OBL-010' },
    { id:'LOG-2028', type:'Cleaning', date:'2026-09-19', summary:'Weekly cleaning schedule completed and signed off for front-of-house.', obl:'OBL-010' }
  ];

  const logTypes = ['Temperature check','Cleaning','Challenge 25 refusal','Allergen check','Near-miss','Fire incident','Delivery check','Inspection','Training'];

  // learning modules ; status: assigned | in-progress | completed
  const learning = [
    { id:'L-1', title:'Food hygiene Level 2 (refresher)', category:'Food safety', minutes:20, status:'assigned', progress:0, due:'2026-09-28',
      about:'A refresher on safe food handling: bacteria, temperature control, cleaning and personal hygiene.',
      lessons:[ {t:'Bacteria & cross-contamination',done:false},{t:'Temperature control',done:false},{t:'Cleaning & disinfection',done:false},{t:'Personal hygiene',done:false},{t:'Quick assessment',done:false} ] },
    { id:'L-2', title:'Allergen awareness (Natasha\u2019s Law)', category:'Allergens', minutes:15, status:'in-progress', progress:60, due:'2026-10-05',
      about:'How to take allergen orders safely, avoid cross-contact and label pre-packed food correctly.',
      lessons:[ {t:'The 14 allergens',done:true},{t:'Taking allergen orders',done:true},{t:'Avoiding cross-contact',done:true},{t:'Labelling & PPDS',done:false},{t:'Quick assessment',done:false} ] },
    { id:'L-3', title:'Fire safety basics', category:'Fire safety', minutes:12, status:'completed', progress:100, due:'\u2014', cert:true,
      about:'What to do if there\u2019s a fire: prevention, extinguisher types and safe evacuation.',
      lessons:[ {t:'The fire triangle',done:true},{t:'Extinguisher types',done:true},{t:'Evacuation & assembly',done:true},{t:'Quick assessment',done:true} ] },
    { id:'L-4', title:'Handling customer data safely', category:'Data & security', minutes:10, status:'assigned', progress:0, due:'2026-10-12',
      about:'Everyday data protection: bookings, CCTV and spotting phishing at work.',
      lessons:[ {t:'What counts as personal data',done:false},{t:'Bookings & CCTV',done:false},{t:'Spotting phishing',done:false},{t:'Quick assessment',done:false} ] },
    { id:'L-5', title:'Manual handling', category:'Health & safety', minutes:10, status:'completed', progress:100, due:'\u2014', cert:true,
      about:'Lifting and carrying safely to avoid injury during deliveries and setup.',
      lessons:[ {t:'Safe lifting technique',done:true},{t:'Quick assessment',done:true} ] }
  ];

  function unreadCount(){ return notifications.filter(n=>n.unread).length; }
  function taskCounts(){
    const c={todo:0,done:0,overdue:0};
    tasks.forEach(t=>c[t.status]++);
    return {...c, total:tasks.length, todayOpen: tasks.filter(t=>t.when===0 && t.status!=='done').length};
  }
  function topFocus(){
    const open = tasks.filter(t=>t.status!=='done').sort((a,b)=>a.when-b.when);
    return open[0] || null;
  }
  function learnCounts(){
    return {
      assigned: learning.filter(l=>l.status==='assigned').length,
      inProgress: learning.filter(l=>l.status==='in-progress').length,
      completed: learning.filter(l=>l.status==='completed').length,
      certs: learning.filter(l=>l.cert).length
    };
  }
  function moduleById(id){ return learning.find(l=>l.id===id); }

  return { me, tasks, notifications, myLog, logTypes, learning,
    unreadCount, taskCounts, topFocus, learnCounts, moduleById };
})();

/* ==========================================================================
   STARTER TASK LIBRARY (additive) — assignable, recurring log / evidence /
   action templates, tagged by sector and cadence. Universal + Data & cyber +
   Employment templates apply to every sector and are merged in automatically.
   Home derives the day's tasks from this; Log lists the sector's activities.
   ========================================================================== */
(function () {
  const S = window.STAFF;

  // selectable business sectors (universal / data-cyber / employment always merge in)
  S.SECTORS = [
    { key:'hospitality', label:'Hospitality & food' },
    { key:'construction', label:'Construction' },
    { key:'trade',        label:'Trade' },
    { key:'retail',       label:'Retail' },
    { key:'care-child',   label:'Care (child)' },
    { key:'care-adult',   label:'Care (adult)' },
    { key:'property',     label:'Property & facilities' }
  ];

  // type -> icon + colour + short verb (kind is log|evidence|action)
  S.typeMeta = {
    check:    { ic:'checkCircle', col:'#1F7DB4', bg:'#E4F2FB', verb:'Do check' },
    review:   { ic:'list',        col:'#1F7DB4', bg:'#E4F2FB', verb:'Review' },
    log:      { ic:'logbook',     col:'#8A6412', bg:'#FBF1DC', verb:'Log it' },
    training: { ic:'learn',       col:'#2C7358', bg:'#E7F3EE', verb:'Start' },
    evidence: { ic:'file',        col:'#155E88', bg:'#E4F2FB', verb:'Collect' },
    renewal:  { ic:'shield',      col:'#8A6412', bg:'#FBF1DC', verb:'Schedule' },
    action:   { ic:'bolt',        col:'#8F3527', bg:'#F8E7E2', verb:'Action' }
  };

  // tuples: [sector, kind, cadence, type, title, guidance, obl?]
  const raw = [
    /* ---- Universal (every business) ---- */
    ['universal','log','weekly','check','Weekly fire alarm test','Activate a call point on the weekly test and confirm the alarm sounds. Note which point you tested.'],
    ['universal','log','monthly','check','Emergency lighting test','Run the monthly flick test and check every fitting illuminates.'],
    ['universal','log','monthly','check','Fire door & escape route check','Check fire doors close fully, seals are intact and escape routes are clear.'],
    ['universal','log','monthly','check','Fire extinguisher visual check','Check pressure gauges, seals and clear access for each unit.'],
    ['universal','log','monthly','check','First-aid kit check & restock','Check contents against the list and replace anything used or expired.'],
    ['universal','log','weekly','review','Health & safety walk-around','Walk the site for hazards, then log and fix anything you find.'],
    ['universal','log','annual','check','Portable appliance (PAT) check','Test and label portable electrical equipment.'],
    ['universal','log','per-event','log','Accident / near-miss report','Record what happened, who was involved and the action taken.'],
    ['universal','evidence','annual','evidence','Fire risk assessment','Keep the current written fire risk assessment on file.','OBL-005'],
    ['universal','evidence','annual','evidence','Employers\u2019 liability insurance certificate','Hold and display current cover (at least \u00a35m).','OBL-008'],
    ['universal','action','on-change','action','Review risk assessments after a change','Update the relevant risk assessment after any incident or change.'],

    /* ---- Data & cyber (every business) ---- */
    ['data-cyber','log','per-event','log','Data breach / near-miss log','Record any lost data, misdirected email or suspected breach.','OBL-013'],
    ['data-cyber','log','per-event','log','Report a phishing email','Forward and log suspicious emails; note if anyone clicked.'],
    ['data-cyber','log','weekly','check','Backup check','Confirm the weekly backup completed and can be restored.'],
    ['data-cyber','action','quarterly','action','Review who has access','Remove leavers and check permissions each quarter.'],
    ['data-cyber','evidence','annual','evidence','ICO data protection registration','Keep the annual ICO registration and fee current.','OBL-011'],

    /* ---- Employment (every business) ---- */
    ['employment','log','per-hire','log','Right to work check','Verify and record each new employee\u2019s right to work.','OBL-014'],
    ['employment','log','weekly','review','Working time & rest-break records','Record hours worked and confirm statutory breaks were taken.','OBL-015'],
    ['employment','log','per-event','training','Training completion record','Log training delivered and file the certificates.'],
    ['employment','evidence','on-change','evidence','Written health & safety policy','Keep the written policy current (required with 5+ staff).','OBL-016'],

    /* ---- Hospitality & food ---- */
    ['hospitality','log','daily','check','Fridge & freezer temperature check','Record temperatures before service. Flag anything above 5\u00b0C.','OBL-010'],
    ['hospitality','log','daily','check','Delivery temperature & date check','Check chilled/frozen delivery temps and use-by dates on arrival.'],
    ['hospitality','log','on-change','review','Allergen matrix review','Check the matrix matches the current menu before serving.','OBL-009'],
    ['hospitality','log','weekly','check','Cleaning schedule sign-off','Sign off each area against the cleaning schedule.','OBL-010'],
    ['hospitality','log','per-event','log','Challenge 25 refusal log','Record refused age-restricted (alcohol) sales.','OBL-002'],
    ['hospitality','log','per-event','training','Food hygiene training record','Log Level 2 food hygiene training and refreshers.'],
    ['hospitality','evidence','on-change','evidence','HACCP food safety plan','Keep the documented food safety management system current.','OBL-010'],
    ['hospitality','action','annual','renewal','Book annual gas safety inspection','Arrange a Gas Safe engineer before the CP12 expires.','OBL-006'],
    ['hospitality','action','on-change','renewal','Personal licence review (DPS)','Keep the premises supervisor\u2019s personal licence valid.','OBL-003'],

    /* ---- Construction ---- */
    ['construction','log','daily','log','Daily site diary','Record works, weather, deliveries and issues each day.'],
    ['construction','log','daily','check','Plant & equipment pre-use check','Inspect plant before use; log defects and take unsafe kit out of use.'],
    ['construction','log','per-event','log','Site induction record','Record induction for every worker and visitor before they start.'],
    ['construction','log','weekly','training','Toolbox talk','Deliver and log the weekly safety briefing.'],
    ['construction','log','per-event','log','Permit-to-work sign-off','Issue and sign permits for hot works, height and confined space.'],
    ['construction','log','weekly','check','Scaffold inspection','Inspect scaffolding weekly and after any alteration.'],
    ['construction','log','per-event','check','PPE issue & check','Record PPE issued and condition checks.'],
    ['construction','log','per-event','log','Waste transfer / disposal log','Record waste removed, with transfer notes.'],
    ['construction','evidence','on-change','evidence','RAMS (risk assessment & method statement)','Keep task RAMS current and briefed to the team.'],
    ['construction','action','quarterly','renewal','Lifting equipment examination (LOLER)','Schedule statutory examinations for lifting equipment.'],
    ['construction','action','per-event','action','RIDDOR reportable incident','Report qualifying injuries and dangerous occurrences to the HSE.'],

    /* ---- Trade (electrical / gas / plumbing / HVAC) ---- */
    ['trade','log','per-event','log','Job / installation record','Record the work done and materials used on each job.'],
    ['trade','log','per-event','log','Test certificate issued','Log certificates issued (e.g. EIC / EICR, gas CP12).'],
    ['trade','log','weekly','check','Van stock & vehicle check','Check vehicle condition and restock consumables.'],
    ['trade','action','annual','renewal','Test-instrument calibration','Recalibrate test instruments and keep the certificates.'],
    ['trade','action','per-event','action','Notify building control / scheme','Notify notifiable works to your competent-person scheme.'],
    ['trade','evidence','annual','evidence','Competent-person scheme registration','Keep Gas Safe / NICEIC / NAPIT membership current.'],
    ['trade','evidence','annual','evidence','Public liability insurance','Hold current public liability cover.'],

    /* ---- Retail ---- */
    ['retail','log','daily','check','Till & cash-handling check','Reconcile the till and record any discrepancies.'],
    ['retail','log','per-event','log','Age-restricted sale refusal','Log Challenge 25 refusals (alcohol, tobacco/vapes, knives, fireworks).'],
    ['retail','log','per-event','log','Product recall action','Record recall notices actioned and stock removed from sale.'],
    ['retail','log','per-event','log','Slip / trip / manual-handling incident','Record shop-floor incidents and the action taken.'],
    ['retail','log','annual','check','Weighing scale calibration check','Check scales used for trade are accurate and stamped.'],
    ['retail','log','per-event','training','Age-restricted sales training','Log staff training on age verification.'],
    ['retail','evidence','annual','evidence','PCI DSS self-assessment','Complete the annual card-payment self-assessment.','OBL-012'],

    /* ---- Care (child) ---- */
    ['care-child','log','daily','log','Daily care / activity record','Record care, activities and observations for each child.'],
    ['care-child','log','daily','check','Attendance & ratio check','Confirm attendance and the required staff-to-child ratios.'],
    ['care-child','log','per-event','check','Medication administration record (MAR)','Record every medication given, with dose and time.'],
    ['care-child','log','per-event','log','Safeguarding concern','Record and escalate any safeguarding concern immediately.'],
    ['care-child','log','per-event','log','Incident / accident & body map','Record incidents with a body map and parent notification.'],
    ['care-child','log','monthly','check','Fire drill','Run and record an evacuation drill.'],
    ['care-child','log','per-event','training','Safeguarding / first-aid training','Log mandatory training and refreshers.'],
    ['care-child','evidence','on-change','evidence','DBS certificates','Hold current enhanced DBS checks for all staff.'],
    ['care-child','action','per-event','action','Notify Ofsted / LADO','Report notifiable events to Ofsted or the LADO.'],

    /* ---- Care (adult) ---- */
    ['care-adult','log','daily','log','Daily care notes & care-plan update','Record care delivered and update the care plan.'],
    ['care-adult','log','daily','check','Food, fluid & repositioning chart','Record intake and repositioning where the care plan requires it.'],
    ['care-adult','log','daily','check','Infection prevention & control check','Complete the daily IPC checks.'],
    ['care-adult','log','per-event','check','Medication administration record (MAR)','Record every medication administered, with dose and time.'],
    ['care-adult','log','per-event','log','Safeguarding concern','Record and escalate safeguarding concerns.'],
    ['care-adult','log','on-change','review','DoLS / restrictive-practice record','Record any restraint or deprivation-of-liberty matters.'],
    ['care-adult','log','monthly','check','Water temperature / legionella check','Record hot and cold water temperatures.'],
    ['care-adult','log','per-event','training','Mandatory training record','Log the Care Certificate and mandatory training.'],
    ['care-adult','evidence','on-change','evidence','DBS certificates','Hold current enhanced DBS checks for all staff.'],
    ['care-adult','action','per-event','action','Notify CQC (notifiable event)','Report notifiable events to the CQC.'],

    /* ---- Property & facilities ---- */
    ['property','log','weekly','check','Fire systems check','Weekly alarm test; check emergency lighting, doors and extinguishers.'],
    ['property','log','weekly','check','Planned maintenance sign-off','Sign off scheduled (PPM) maintenance tasks.'],
    ['property','log','monthly','check','Water hygiene / legionella check','Record temperatures, flushing and tank checks.'],
    ['property','log','per-event','log','Contractor permit-to-work & sign-in','Issue permits and record contractor sign-in.'],
    ['property','log','per-event','log','Defect / fault report','Log building defects and the remedial action.'],
    ['property','action','annual','renewal','Gas safety inspection','Schedule annual gas safety checks and file the records.'],
    ['property','action','quarterly','renewal','Fixed-wire electrical (EICR)','Schedule periodic inspection and any remedial works.'],
    ['property','action','quarterly','renewal','Lift thorough examination (LOLER)','Schedule statutory lift examinations.'],
    ['property','action','annual','action','Asbestos re-inspection & register','Keep the asbestos register and management plan live.'],
    ['property','evidence','on-change','evidence','Service contracts & certificates','Keep servicing contracts and certificates on file.']
  ];

  const CAD = {
    daily:      { due:'Today',         when:0,  label:'Daily' },
    weekly:     { due:'This week',     when:2,  label:'Weekly' },
    monthly:    { due:'This month',    when:6,  label:'Monthly' },
    quarterly:  { due:'This quarter',  when:20, label:'Quarterly' },
    annual:     { due:'This year',     when:40, label:'Annual' },
    'per-event':{ due:'As it happens', when:99, label:'Per event' },
    'on-change':{ due:'On change',     when:99, label:'On change' },
    'per-hire': { due:'Per new hire',  when:99, label:'Per new hire' }
  };
  S.CADENCE = CAD;

  const counters = {};
  S.taskLibrary = raw.map(r => {
    const [sector, kind, cadence, type, title, guidance, obl] = r;
    counters[sector] = (counters[sector] || 0) + 1;
    return { id: sector + '-' + counters[sector], sector, kind, cadence, type, title, guidance, obl: obl || null };
  });

  // ---- sector selection (persisted best-effort) ----
  const KEY = 'ballast.staff.sector';
  function businessSector() {
    const t = (window.BALLAST && window.BALLAST.business && window.BALLAST.business.type) || '';
    const hit = S.SECTORS.find(s => s.label === t);
    return hit ? hit.key : 'hospitality';
  }
  S.getSector = function () {
    try { const v = localStorage.getItem(KEY); if (v) return v; } catch (e) {}
    return businessSector();
  };
  S.setSector = function (k) { try { localStorage.setItem(KEY, k); } catch (e) {} };
  S.sectorLabel = function (k) { const s = S.SECTORS.find(x => x.key === k); return s ? s.label : k; };

  // ---- derived views ----
  S.libraryFor = function (sector) {
    const keep = new Set(['universal', 'data-cyber', 'employment', sector]);
    return S.taskLibrary.filter(t => keep.has(t.sector));
  };

  const SCHEDULED = ['daily', 'weekly', 'monthly', 'quarterly', 'annual'];
  const cadOrder = { daily:0, weekly:1, monthly:2, quarterly:3, annual:4 };
  S.assignedTasks = function (sector) {
    const lib = S.libraryFor(sector).filter(t => SCHEDULED.includes(t.cadence));
    const picked = lib.slice().sort((a, b) => cadOrder[a.cadence] - cadOrder[b.cadence]).slice(0, 7);
    return picked.map((t, i) => ({
      id: t.id, title: t.title, type: t.type, kind: t.kind, guidance: t.guidance, obl: t.obl,
      due: CAD[t.cadence].due, when: CAD[t.cadence].when,
      status: i === 1 ? 'done' : 'todo'
    }));
  };
  S.topFocusFor = function (sector) {
    const open = S.assignedTasks(sector).filter(t => t.status !== 'done').sort((a, b) => a.when - b.when);
    return open[0] || null;
  };
  S.logTypesForSector = function (sector) {
    const logs = S.libraryFor(sector).filter(t => t.kind === 'log').map(t => t.title);
    return Array.from(new Set(logs));
  };
})();
