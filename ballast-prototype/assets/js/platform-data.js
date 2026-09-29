/* ==========================================================================
   Ballast — PLATFORM back-office dummy data.
   The internal operator view across ALL onboarded businesses (tenants),
   the regulatory rule library engineers/analysts govern, the internal team,
   support queue, audit trail and system health.
   ========================================================================== */
window.PLATFORM = (function () {

  // ---- tenants (onboarded businesses) ----
  // status: active | trial | suspended
  const tenants = [
    { id:'BIZ-1001', name:'The Copper Kettle',        sector:'Hospitality & food', jurisdiction:'England', council:'Manchester CC', sites:2, users:5,  plan:'Growth',  status:'active',    readiness:53, obligations:16, alerts:5,  created:'2025-08-14', am:'Opeyemi O.' },
    { id:'BIZ-1002', name:'Northgate Construction Ltd', sector:'Construction',     jurisdiction:'England', council:'Leeds CC',      sites:6, users:18, plan:'Scale',   status:'active',    readiness:71, obligations:34, alerts:8,  created:'2025-11-03', am:'T. Reeves' },
    { id:'BIZ-1003', name:'Brightpath Care Homes',     sector:'Care (adult)',      jurisdiction:'England', council:'Birmingham CC', sites:3, users:40, plan:'Scale',   status:'active',    readiness:88, obligations:41, alerts:3,  created:'2026-01-19', am:'S. Ellis' },
    { id:'BIZ-1004', name:'Little Acorns Nursery',     sector:'Care (child)',      jurisdiction:'Wales',   council:'Cardiff',       sites:1, users:12, plan:'Growth',  status:'active',    readiness:92, obligations:29, alerts:1,  created:'2026-02-08', am:'S. Ellis' },
    { id:'BIZ-1005', name:'Verde Retail Group',        sector:'Retail',            jurisdiction:'England', council:'Bristol CC',    sites:5, users:33, plan:'Scale',   status:'active',    readiness:64, obligations:27, alerts:6,  created:'2025-12-11', am:'T. Reeves' },
    { id:'BIZ-1006', name:'Sparkline Electrical',      sector:'Trade',             jurisdiction:'Scotland',council:'Glasgow',       sites:1, users:6,  plan:'Starter', status:'active',    readiness:58, obligations:21, alerts:4,  created:'2026-03-22', am:'Unassigned' },
    { id:'BIZ-1007', name:'Meridian FM',               sector:'Property & facilities', jurisdiction:'England', council:'Camden',    sites:9, users:27, plan:'Scale',   status:'active',    readiness:77, obligations:38, alerts:5,  created:'2025-10-05', am:'T. Reeves' },
    { id:'BIZ-1008', name:'The Gilded Spoon',          sector:'Hospitality & food', jurisdiction:'England', council:'Leeds CC',     sites:1, users:9,  plan:'Starter', status:'trial',     readiness:41, obligations:15, alerts:7,  created:'2026-09-09', am:'Unassigned' },
    { id:'BIZ-1009', name:'Harbourview Care',          sector:'Care (adult)',      jurisdiction:'Northern Ireland', council:'Belfast', sites:2, users:22, plan:'Growth', status:'active',    readiness:83, obligations:40, alerts:2,  created:'2026-04-16', am:'S. Ellis' },
    { id:'BIZ-1010', name:'Peak Plumbing & Heating',   sector:'Trade',             jurisdiction:'England', council:'Sheffield CC',  sites:1, users:4,  plan:'Starter', status:'active',    readiness:69, obligations:20, alerts:3,  created:'2026-05-27', am:'Unassigned' },
    { id:'BIZ-1011', name:'Cornerstone Builders',      sector:'Construction',      jurisdiction:'Wales',   council:'Swansea',       sites:3, users:11, plan:'Growth',  status:'suspended', readiness:34, obligations:31, alerts:12, created:'2025-09-01', am:'T. Reeves' },
    { id:'BIZ-1012', name:'Tidal Retail',              sector:'Retail',            jurisdiction:'England', council:'Brighton & Hove', sites:2, users:14, plan:'Growth', status:'trial',     readiness:55, obligations:26, alerts:5,  created:'2026-09-02', am:'Unassigned' }
  ];

  // ---- regulatory rule library (what the compliance team governs) ----
  // status: published | review | draft
  const rules = [
    { id:'RULE-001', title:'Food hygiene registration',        sectors:['Hospitality & food'], area:'Sector licensing', jurisdiction:'England & Wales', source:'Food Safety Act 1990',                cadence:'Annual',     status:'published', version:'v3', updated:'2026-06-02', updatedBy:'P. Adeyemi', appliesTo:2 },
    { id:'RULE-002', title:'Premises licence (alcohol)',       sectors:['Hospitality & food','Retail'], area:'Sector licensing', jurisdiction:'England & Wales', source:'Licensing Act 2003',           cadence:'On change',  status:'published', version:'v2', updated:'2026-04-18', updatedBy:'P. Adeyemi', appliesTo:3 },
    { id:'RULE-003', title:'Fire risk assessment',             sectors:['Universal'],          area:'Universal',        jurisdiction:'England',        source:'Regulatory Reform (Fire Safety) Order 2005', cadence:'Annual', status:'published', version:'v4', updated:'2026-07-30', updatedBy:'L. Chen',    appliesTo:12 },
    { id:'RULE-004', title:'Gas safety inspection',            sectors:['Universal','Property & facilities','Hospitality & food'], area:'Universal', jurisdiction:'England', source:'Gas Safety (Installation & Use) Regs 1998', cadence:'Annual', status:'published', version:'v2', updated:'2026-05-11', updatedBy:'L. Chen', appliesTo:9 },
    { id:'RULE-005', title:'Electrical installation condition report', sectors:['Universal','Property & facilities'], area:'Universal', jurisdiction:'England', source:'Electricity at Work Regs 1989', cadence:'5-yearly', status:'published', version:'v1', updated:'2026-02-03', updatedBy:'P. Adeyemi', appliesTo:12 },
    { id:'RULE-006', title:'Employers\u2019 liability insurance', sectors:['Universal'],        area:'Universal',        jurisdiction:'Great Britain',  source:'Employers\u2019 Liability (Compulsory Insurance) Act 1969', cadence:'Annual', status:'published', version:'v1', updated:'2025-12-01', updatedBy:'P. Adeyemi', appliesTo:12 },
    { id:'RULE-007', title:'ICO data protection registration', sectors:['Universal'],          area:'Data & cyber',     jurisdiction:'UK',            source:'Data Protection Act 2018',           cadence:'Annual',     status:'published', version:'v2', updated:'2026-03-15', updatedBy:'L. Chen',    appliesTo:12 },
    { id:'RULE-008', title:'PCI DSS self-assessment',          sectors:['Retail','Hospitality & food'], area:'Data & cyber', jurisdiction:'UK',        source:'PCI DSS v4.0',                       cadence:'Annual',     status:'review',    version:'v2', updated:'2026-09-20', updatedBy:'P. Adeyemi', appliesTo:5 },
    { id:'RULE-009', title:'CCTV data protection impact assessment', sectors:['Universal'],    area:'Data & cyber',     jurisdiction:'UK',            source:'UK GDPR Art.35',                     cadence:'On change',  status:'published', version:'v1', updated:'2026-01-22', updatedBy:'L. Chen',    appliesTo:12 },
    { id:'RULE-010', title:'Right to work checks',             sectors:['Universal'],          area:'Employment',       jurisdiction:'UK',            source:'Immigration, Asylum & Nationality Act 2006', cadence:'Per hire', status:'published', version:'v1', updated:'2025-11-20', updatedBy:'P. Adeyemi', appliesTo:12 },
    { id:'RULE-011', title:'Working time & rest-break records', sectors:['Universal'],         area:'Employment',       jurisdiction:'UK',            source:'Working Time Regulations 1998',      cadence:'Ongoing',    status:'published', version:'v1', updated:'2025-11-20', updatedBy:'P. Adeyemi', appliesTo:12 },
    { id:'RULE-012', title:'Construction phase plan (CDM)',    sectors:['Construction'],       area:'Sector licensing', jurisdiction:'Great Britain', source:'CDM Regulations 2015',               cadence:'Per project',status:'published', version:'v2', updated:'2026-06-28', updatedBy:'L. Chen',    appliesTo:3 },
    { id:'RULE-013', title:'F10 notification of project',      sectors:['Construction'],       area:'Sector licensing', jurisdiction:'Great Britain', source:'CDM Regulations 2015',               cadence:'Per project',status:'published', version:'v1', updated:'2026-06-28', updatedBy:'L. Chen',    appliesTo:3 },
    { id:'RULE-014', title:'Scaffold inspection',              sectors:['Construction'],       area:'Universal',        jurisdiction:'Great Britain', source:'Work at Height Regs 2005',           cadence:'Weekly',     status:'published', version:'v1', updated:'2026-06-28', updatedBy:'L. Chen',    appliesTo:3 },
    { id:'RULE-015', title:'Lifting equipment examination (LOLER)', sectors:['Construction','Property & facilities'], area:'Universal', jurisdiction:'Great Britain', source:'LOLER 1998', cadence:'6-monthly', status:'published', version:'v1', updated:'2026-05-02', updatedBy:'L. Chen', appliesTo:4 },
    { id:'RULE-016', title:'DBS checks (regulated activity)',  sectors:['Care (child)','Care (adult)'], area:'Employment', jurisdiction:'England & Wales', source:'Safeguarding Vulnerable Groups Act 2006', cadence:'On change', status:'published', version:'v3', updated:'2026-08-05', updatedBy:'P. Adeyemi', appliesTo:4 },
    { id:'RULE-017', title:'CQC registration & notifications', sectors:['Care (adult)'],       area:'Sector licensing', jurisdiction:'England',       source:'Health & Social Care Act 2008',      cadence:'Ongoing',    status:'published', version:'v2', updated:'2026-07-14', updatedBy:'L. Chen',    appliesTo:2 },
    { id:'RULE-018', title:'Ofsted registration (childcare)',  sectors:['Care (child)'],       area:'Sector licensing', jurisdiction:'England',       source:'Childcare Act 2006',                 cadence:'Ongoing',    status:'draft',     version:'v1', updated:'2026-09-21', updatedBy:'P. Adeyemi', appliesTo:0, note:'Wales (CIW) divergence pending before publish.' },
    { id:'RULE-019', title:'Legionella risk assessment',       sectors:['Property & facilities','Care (adult)','Hospitality & food'], area:'Universal', jurisdiction:'Great Britain', source:'ACOP L8 / HSG274', cadence:'Annual + monthly checks', status:'published', version:'v1', updated:'2026-04-09', updatedBy:'L. Chen', appliesTo:6 },
    { id:'RULE-020', title:'Asbestos management',              sectors:['Property & facilities'], area:'Universal',      jurisdiction:'Great Britain', source:'Control of Asbestos Regs 2012',      cadence:'Annual',     status:'review',    version:'v2', updated:'2026-09-18', updatedBy:'L. Chen',    appliesTo:1 }
  ];

  // ---- internal team (Ballast staff & engineers) ----
  // access: full | tenants | rules | engineering | support
  const team = [
    { id:'T-1', name:'Opeyemi Oyelesi', role:'Founder / Platform admin', access:'full',        email:'op@ballast.app',       lastActive:'now',    twoFA:true },
    { id:'T-2', name:'T. Reeves',       role:'Account manager',          access:'tenants',     email:'treeves@ballast.app',  lastActive:'12m ago',twoFA:true },
    { id:'T-3', name:'S. Ellis',        role:'Account manager',          access:'tenants',     email:'sellis@ballast.app',   lastActive:'1h ago', twoFA:true },
    { id:'T-4', name:'D. Nwosu',        role:'Senior engineer',          access:'engineering', email:'dnwosu@ballast.app',   lastActive:'3m ago', twoFA:true },
    { id:'T-5', name:'M. Farrow',       role:'Engineer',                 access:'engineering', email:'mfarrow@ballast.app',  lastActive:'40m ago',twoFA:true },
    { id:'T-6', name:'P. Adeyemi',      role:'Compliance analyst',       access:'rules',       email:'padeyemi@ballast.app', lastActive:'25m ago',twoFA:true },
    { id:'T-7', name:'L. Chen',         role:'Compliance analyst',       access:'rules',       email:'lchen@ballast.app',    lastActive:'2h ago', twoFA:true },
    { id:'T-8', name:'K. Osei',         role:'Support lead',             access:'support',     email:'kosei@ballast.app',    lastActive:'8m ago', twoFA:false }
  ];

  // ---- support queue ----
  // status: open | pending | resolved ; priority: high | medium | low
  const tickets = [
    { id:'SUP-341', tenant:'The Gilded Spoon',       subject:'Onboarding: obligations not generating for late-night hours', priority:'high',   status:'open',     assignee:'K. Osei',   opened:'2h ago' },
    { id:'SUP-338', tenant:'Verde Retail Group',     subject:'PCI DSS self-assessment report won\u2019t submit',            priority:'medium', status:'open',     assignee:'Unassigned',opened:'5h ago' },
    { id:'SUP-335', tenant:'Northgate Construction Ltd', subject:'Bulk-add 40 operatives via CSV?',                        priority:'medium', status:'pending',  assignee:'M. Farrow', opened:'1 day ago' },
    { id:'SUP-330', tenant:'Sparkline Electrical',   subject:'Wrong council mapped (should be Glasgow City)',              priority:'high',   status:'open',     assignee:'P. Adeyemi',opened:'1 day ago' },
    { id:'SUP-322', tenant:'Brightpath Care Homes',  subject:'Export a full evidence pack for CQC inspection',             priority:'low',    status:'resolved', assignee:'K. Osei',   opened:'3 days ago' },
    { id:'SUP-318', tenant:'Cornerstone Builders',   subject:'Account suspended \u2014 request reactivation',              priority:'high',   status:'pending',  assignee:'T. Reeves', opened:'4 days ago' },
    { id:'SUP-311', tenant:'Meridian FM',            subject:'Asbestos re-inspection cadence looks wrong',                 priority:'medium', status:'open',     assignee:'L. Chen',   opened:'5 days ago' }
  ];

  // ---- audit log (governance trail) ----
  const audit = [
    { id:'A-1',  actor:'P. Adeyemi', action:'Published rule',   target:'RULE-008 · PCI DSS self-assessment', detail:'Updated to PCI DSS v4.0 mapping', ts:'1h ago' },
    { id:'A-2',  actor:'Opeyemi O.', action:'Changed role',     target:'L. Chen', detail:'Set access to Compliance analyst', ts:'3h ago' },
    { id:'A-3',  actor:'T. Reeves',  action:'Suspended tenant', target:'BIZ-1011 · Cornerstone Builders', detail:'Trial expired, non-payment', ts:'1 day ago' },
    { id:'A-4',  actor:'K. Osei',    action:'Impersonated tenant', target:'BIZ-1008 · The Gilded Spoon', detail:'Support session for SUP-341', ts:'1 day ago' },
    { id:'A-5',  actor:'D. Nwosu',   action:'Deployed config',  target:'council-ingestion', detail:'Batch 4 connectors enabled', ts:'1 day ago' },
    { id:'A-6',  actor:'P. Adeyemi', action:'Created draft',    target:'RULE-018 · Ofsted registration (childcare)', detail:'Awaiting Wales (CIW) divergence', ts:'2 days ago' },
    { id:'A-7',  actor:'S. Ellis',   action:'Assigned manager', target:'BIZ-1004 · Little Acorns Nursery', detail:'Account manager set to S. Ellis', ts:'2 days ago' },
    { id:'A-8',  actor:'M. Farrow',  action:'Edited template',  target:'Task template · Site induction record', detail:'Guidance text updated', ts:'3 days ago' },
    { id:'A-9',  actor:'Opeyemi O.', action:'Toggled feature',  target:'verifiable-attestations (beta)', detail:'Enabled for 2 tenants', ts:'3 days ago' },
    { id:'A-10', actor:'T. Reeves',  action:'Reactivated tenant', target:'BIZ-1012 · Tidal Retail', detail:'Trial extended 14 days', ts:'4 days ago' }
  ];

  // ---- system health ----
  // state: operational | degraded | down
  const integrations = [
    { name:'Companies House API', state:'operational', detail:'Registration lookups', sync:'5m ago' },
    { name:'ICO register',        state:'operational', detail:'Data-protection fee status', sync:'1h ago' },
    { name:'HSE / RIDDOR',        state:'operational', detail:'Incident reporting', sync:'2h ago' },
    { name:'Council portals',     state:'degraded',    detail:'214 / 317 authorities connected · 12 failing', sync:'20m ago' },
    { name:'Notifications (email/SMS)', state:'operational', detail:'Alert delivery', sync:'2m ago' },
    { name:'Evidence storage',    state:'operational', detail:'Encrypted object store', sync:'live' }
  ];
  const jobs = [
    { name:'Obligation assessment', state:'operational', detail:'1,240 runs today', throughput:'~52/hr' },
    { name:'Monitoring sweep',      state:'operational', detail:'Last run 09:00', throughput:'hourly' },
    { name:'Evidence expiry scan',  state:'operational', detail:'Nightly', throughput:'02:00' },
    { name:'Report generation',     state:'operational', detail:'On demand', throughput:'—' }
  ];
  const ai = { name:'Obligation Identification Engine', hosting:'Private / self-hosted', state:'operational', model:'ballast-obl v2.3', latency:'820ms p95', requests:'3,410 today' };
  const platformHealth = { uptime:'99.98%', errorRate:'0.2%', apiP95:'340ms', region:'UK (London)' };

  // ---- regulatory web scrapers & statutory authority feeds ----
  // Runs daily at 02:00 UTC across all designated govt agency portals.
  // Ingests raw legislation/clauses into Ballast database; AI solely presents & summarizes for users.
  const scrapers = [
    {
      id: 'SCRP-01',
      agency: 'Food Standards Agency (FSA)',
      url: 'https://www.food.gov.uk/business-guidance',
      sector: 'Hospitality & food',
      scope: 'HACCP, Food Hygiene & Natasha\'s Law',
      cadence: 'Daily (02:00 UTC)',
      status: 'active',
      lastRun: 'Today 02:14 UTC',
      clausesIngested: 428,
      drift: '+2 updates',
      driftAlert: true,
      jurisdiction: 'England, Wales, NI',
      sampleClause: 'Regulation (EC) No 852/2004 Art. 5: Food business operators shall put in place, implement and maintain a permanent procedure or procedures based on the HACCP principles.',
      aiPresentationSummary: 'AI synthesizes raw FSA clauses into 3 actionable staff daily temperature checks and allergen matrix requirements.'
    },
    {
      id: 'SCRP-02',
      agency: 'Health and Safety Executive (HSE)',
      url: 'https://www.hse.gov.uk/catering',
      sector: 'Hospitality & food',
      scope: 'Commercial Kitchens & Ventilation Safety',
      cadence: 'Daily (02:15 UTC)',
      status: 'active',
      lastRun: 'Today 02:16 UTC',
      clausesIngested: 312,
      drift: 'No drift',
      driftAlert: false,
      jurisdiction: 'Great Britain',
      sampleClause: 'Health & Safety at Work Act 1974 s.2: Employers must ensure, so far as is reasonably practicable, the health, safety and welfare of all employees.',
      aiPresentationSummary: 'AI maps to annual extraction fan clean certificate and grease filter logbook entries.'
    },
    {
      id: 'SCRP-03',
      agency: 'Manchester City Council Licensing',
      url: 'https://www.manchester.gov.uk/info/200063/licences_and_permissions',
      sector: 'Hospitality & food',
      scope: 'Premises Licensing, Pavement Licences & Late-Night',
      cadence: 'Daily (02:30 UTC)',
      status: 'active',
      lastRun: 'Today 02:32 UTC',
      clausesIngested: 184,
      drift: '+1 amendment',
      driftAlert: true,
      jurisdiction: 'Manchester (Local Authority)',
      sampleClause: 'Licensing Act 2003 s.17: Applications for premises licences in Manchester cumulative impact zones require detailed dispersal policies.',
      aiPresentationSummary: 'AI prescribes: "Ensure DPS personal licence copy is displayed behind bar and Challenge 25 refusals register maintained."'
    },
    {
      id: 'SCRP-04',
      agency: 'Health and Safety Executive — CDM',
      url: 'https://www.hse.gov.uk/construction/cdm/2015',
      sector: 'Construction',
      scope: 'CDM 2015 Regulations & F10 Notifications',
      cadence: 'Daily (02:05 UTC)',
      status: 'active',
      lastRun: 'Today 02:08 UTC',
      clausesIngested: 512,
      drift: 'No drift',
      driftAlert: false,
      jurisdiction: 'Great Britain',
      sampleClause: 'Construction (Design and Management) Regulations 2015 Reg. 6: Notification of project exceeding 30 working days or 500 person days.',
      aiPresentationSummary: 'AI generates pre-flight checklist for Principal Contractor before breaking ground on site.'
    },
    {
      id: 'SCRP-05',
      agency: 'Environment Agency',
      url: 'https://www.gov.uk/guidance/waste-carriers-brokers-and-dealers',
      sector: 'Construction',
      scope: 'Waste Duty of Care & Environmental Permitting',
      cadence: 'Daily (02:22 UTC)',
      status: 'active',
      lastRun: 'Today 02:24 UTC',
      clausesIngested: 276,
      drift: 'No drift',
      driftAlert: false,
      jurisdiction: 'England',
      sampleClause: 'Environmental Protection Act 1990 s.34: Duty to ensure waste transferred only to an authorised person or for authorised transport purposes.',
      aiPresentationSummary: 'AI prompts upload of Waste Carrier Transfer Notes for audit defense.'
    },
    {
      id: 'SCRP-06',
      agency: 'Gas Safe Register Standards',
      url: 'https://www.gassaferegister.co.uk/standards',
      sector: 'Trade',
      scope: 'Gas Safety (Installation & Use) Regulations',
      cadence: 'Daily (02:18 UTC)',
      status: 'active',
      lastRun: 'Today 02:20 UTC',
      clausesIngested: 195,
      drift: 'No drift',
      driftAlert: false,
      jurisdiction: 'Great Britain',
      sampleClause: 'Gas Safety (Installation and Use) Regulations 1998 Reg. 35: Employers must inspect every gas appliance at intervals of not more than 12 months.',
      aiPresentationSummary: 'AI sets 30-day advance expiry reminder for Landlord / Commercial CP12 certificate.'
    },
    {
      id: 'SCRP-07',
      agency: 'Care Quality Commission (CQC)',
      url: 'https://www.cqc.org.uk/guidance-providers',
      sector: 'Care (adult)',
      scope: 'Fundamental Standards & Safe Care Guidance',
      cadence: 'Daily (02:10 UTC)',
      status: 'active',
      lastRun: 'Today 02:12 UTC',
      clausesIngested: 640,
      drift: '+4 updates',
      driftAlert: true,
      jurisdiction: 'England',
      sampleClause: 'Health and Social Care Act 2008 (Regulated Activities) Regs 2014 Reg. 12: Care and treatment must be provided in a safe way for service users.',
      aiPresentationSummary: 'AI translates inspection framework questions into weekly medication audit logs.'
    },
    {
      id: 'SCRP-08',
      agency: 'Ofsted Early Years',
      url: 'https://www.gov.uk/government/organisations/ofsted',
      sector: 'Care (child)',
      scope: 'EYFS Statutory Framework & Childminder Ratios',
      cadence: 'Daily (02:12 UTC)',
      status: 'active',
      lastRun: 'Today 02:15 UTC',
      clausesIngested: 388,
      drift: 'No drift',
      driftAlert: false,
      jurisdiction: 'England',
      sampleClause: 'Statutory framework for the early years foundation stage s.3: Providers must ensure staff:child ratios meet minimum statutory thresholds.',
      aiPresentationSummary: 'AI checks daily staff sign-in sheets against registered child numbers.'
    },
    {
      id: 'SCRP-09',
      agency: 'Trading Standards Institute',
      url: 'https://www.tradingstandards.uk',
      sector: 'Retail',
      scope: 'Consumer Rights Act & Age-Restricted Sales',
      cadence: 'Daily (02:40 UTC)',
      status: 'active',
      lastRun: 'Today 02:42 UTC',
      clausesIngested: 320,
      drift: 'No drift',
      driftAlert: false,
      jurisdiction: 'UK',
      sampleClause: 'Consumer Rights Act 2015 / Video Recordings Act: Strict liability offenses for underage supply of age-restricted goods.',
      aiPresentationSummary: 'AI requires staff Challenge 25 refusal logbook and quarterly training records.'
    },
    {
      id: 'SCRP-10',
      agency: 'Information Commissioner’s Office (ICO)',
      url: 'https://ico.org.uk/for-organisations',
      sector: 'Universal',
      scope: 'UK GDPR, Data Protection Fee & CCTV Code of Practice',
      cadence: 'Daily (02:02 UTC)',
      status: 'active',
      lastRun: 'Today 02:04 UTC',
      clausesIngested: 490,
      drift: 'No drift',
      driftAlert: false,
      jurisdiction: 'UK',
      sampleClause: 'Data Protection Act 2018 s.137 / UK GDPR Art. 13: Data controllers must register with the ICO and publish compliant privacy notices.',
      aiPresentationSummary: 'AI flags whether ICO annual data protection registration fee is paid.'
    },
    {
      id: 'SCRP-11',
      agency: 'Home Office — Right to Work',
      url: 'https://www.gov.uk/government/organisations/home-office',
      sector: 'Universal',
      scope: 'Employer Right to Work Guidance & Identity Checks',
      cadence: 'Daily (02:00 UTC)',
      status: 'active',
      lastRun: 'Today 02:01 UTC',
      clausesIngested: 210,
      drift: '+1 update',
      driftAlert: true,
      jurisdiction: 'UK',
      sampleClause: 'Immigration, Asylum and Nationality Act 2006 s.15: Civil penalty notice imposed unless statutory excuse established prior to employment.',
      aiPresentationSummary: 'AI creates standard onboarding right-to-work verification checklist per new employee.'
    },
    {
      id: 'SCRP-12',
      agency: 'London Fire Brigade / Home Office Fire Safety',
      url: 'https://www.gov.uk/workplace-fire-safety-your-responsibilities',
      sector: 'Property & facilities',
      scope: 'Fire Safety Act 2021 & RRO 2005 Article 9',
      cadence: 'Daily (02:25 UTC)',
      status: 'active',
      lastRun: 'Today 02:28 UTC',
      clausesIngested: 360,
      drift: 'No drift',
      driftAlert: false,
      jurisdiction: 'England & Wales',
      sampleClause: 'Regulatory Reform (Fire Safety) Order 2005 Art. 9: The responsible person must make a suitable and sufficient assessment of fire risks.',
      aiPresentationSummary: 'AI schedules annual professional Fire Risk Assessment (FRA) and weekly alarm testing.'
    }
  ];

  // ---- derived metrics ----
  function metrics() {
    const total = tenants.length;
    const active = tenants.filter(t=>t.status==='active').length;
    const trial = tenants.filter(t=>t.status==='trial').length;
    const suspended = tenants.filter(t=>t.status==='suspended').length;
    const users = tenants.reduce((s,t)=>s+t.users,0);
    const obligations = tenants.reduce((s,t)=>s+t.obligations,0);
    const avgReadiness = Math.round(tenants.reduce((s,t)=>s+t.readiness,0)/total);
    const atRisk = tenants.filter(t=>t.readiness<60 || t.status==='suspended').length;
    const newThisMonth = tenants.filter(t=>t.created.startsWith('2026-09')).length;
    return { total, active, trial, suspended, users, obligations, avgReadiness, atRisk, newThisMonth };
  }
  function sectorMix() {
    const m = {};
    tenants.forEach(t=>{ m[t.sector] = (m[t.sector]||0)+1; });
    return m;
  }
  function tenantById(id){ return tenants.find(t=>t.id===id); }
  function ruleById(id){ return rules.find(r=>r.id===id); }
  function scraperById(id){ return scrapers.find(s=>s.id===id); }

  return { tenants, rules, scrapers, team, tickets, audit, integrations, jobs, ai, platformHealth,
    metrics, sectorMix, tenantById, ruleById, scraperById };
})();
