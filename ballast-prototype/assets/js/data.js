/* ==========================================================================
   Ballast prototype — dummy data.
   A single fictional tenant ("The Copper Kettle" — a small hospitality group)
   with data spanning every entity in the BRD data model.
   ========================================================================== */
window.BALLAST = (function () {

  const business = {
    name: 'The Copper Kettle',
    legalName: 'Copper Kettle Hospitality Ltd',
    companyNumber: '09842145',
    sicCode: '56101',
    address: '14–16 Oldham Street, Manchester, Greater Manchester',
    type: 'Hospitality & food',
    jurisdiction: 'England',
    council: 'Manchester City Council',
    sites: [
      { id: 's1', name: 'Northern Quarter café', location: '14 Oldham Street, Manchester', postcode: 'M1 1JN', city: 'Manchester', staff: 14, description: 'Two-floor dining room, commercial kitchen, bar & cellar' },
      { id: 's2', name: 'Deansgate kitchen',     location: '204 Deansgate, Manchester',    postcode: 'M3 3NF', city: 'Manchester', staff: 22, description: 'Central prep kitchen, takeaway counter, and deliveries' }
    ],
    headcount: 36,
    activities: ['Food preparation', 'Alcohol sales', 'Late-night refreshment', 'Card & online payments', 'CCTV in use', 'Employs staff', 'Handles customer data', 'Operates gas appliances'],
    started: 'Aug 2025'
  };

  // Obligation taxonomy tiers
  const TIER = {
    universal: 'Universal',
    licensing: 'Sector licensing',
    datacyber: 'Data & cyber',
    employment: 'Employment'
  };

  // status: ok | due | overdue | na
  const obligations = [
    { id:'OBL-001', title:'Food hygiene registration', tier:TIER.licensing, jurisdiction:'Manchester CC', evidence:'Registration certificate', cadence:'Annual', owner:'A. Mensah', status:'ok', nextDue:'2026-11-02', source:'Food Safety Act 1990', why:'You prepare and serve food, so premises must be registered with the local authority.' },
    { id:'OBL-002', title:'Premises licence (alcohol)', tier:TIER.licensing, jurisdiction:'Manchester CC', evidence:'Premises licence', cadence:'On change', owner:'A. Mensah', status:'ok', nextDue:'—', source:'Licensing Act 2003', why:'You sell alcohol, which requires a premises licence from the licensing authority.' },
    { id:'OBL-003', title:'Personal licence (DPS)', tier:TIER.licensing, jurisdiction:'Manchester CC', evidence:'Personal licence', cadence:'On change', owner:'R. Okafor', status:'due', nextDue:'2026-10-10', source:'Licensing Act 2003', why:'A Designated Premises Supervisor holding a personal licence is required to authorise alcohol sales.' },
    { id:'OBL-004', title:'Late-night refreshment authorisation', tier:TIER.licensing, jurisdiction:'Manchester CC', evidence:'Licence variation', cadence:'On change', owner:'A. Mensah', status:'na', nextDue:'—', source:'Licensing Act 2003 Sch.2', why:'Serving hot food/drink after 23:00 triggers this — currently not applicable to your stated hours.' },
    { id:'OBL-005', title:'Fire risk assessment', tier:TIER.universal, jurisdiction:'England', evidence:'Written FRA', cadence:'Annual / on change', owner:'J. Fields', status:'overdue', nextDue:'2026-09-01', source:'Regulatory Reform (Fire Safety) Order 2005', why:'As an employer occupying premises, you must maintain a current fire risk assessment.' },
    { id:'OBL-006', title:'Gas safety inspection', tier:TIER.universal, jurisdiction:'England', evidence:'CP12 certificate', cadence:'Annual', owner:'J. Fields', status:'due', nextDue:'2026-10-05', source:'Gas Safety (Installation & Use) Regs 1998', why:'You operate commercial gas appliances, which need annual inspection by a Gas Safe engineer.' },
    { id:'OBL-007', title:'Electrical installation condition report', tier:TIER.universal, jurisdiction:'England', evidence:'EICR', cadence:'5-yearly', owner:'J. Fields', status:'ok', nextDue:'2029-03-14', source:'Electricity at Work Regs 1989', why:'Fixed electrical installations must be periodically inspected and tested.' },
    { id:'OBL-008', title:'Employers\u2019 liability insurance', tier:TIER.universal, jurisdiction:'England', evidence:'Certificate of insurance', cadence:'Annual', owner:'A. Mensah', status:'ok', nextDue:'2027-01-20', source:'Employers\u2019 Liability (Compulsory Insurance) Act 1969', why:'You employ staff, so you must hold at least \u00a35m employers\u2019 liability cover and display the certificate.' },
    { id:'OBL-009', title:'Allergen information controls', tier:TIER.licensing, jurisdiction:'England', evidence:'Allergen matrix + SOP', cadence:'On menu change', owner:'R. Okafor', status:'due', nextDue:'2026-10-01', source:'Food Information Regs 2014 (Natasha\u2019s Law)', why:'You provide food to consumers, so allergen information must be accurate and available.' },
    { id:'OBL-010', title:'HACCP food safety management', tier:TIER.licensing, jurisdiction:'England', evidence:'HACCP plan + records', cadence:'Ongoing', owner:'R. Okafor', status:'ok', nextDue:'—', source:'Regulation (EC) 852/2004', why:'Food businesses must operate a documented food safety management system based on HACCP principles.' },
    { id:'OBL-011', title:'ICO data protection registration', tier:TIER.datacyber, jurisdiction:'UK', evidence:'ICO registration', cadence:'Annual', owner:'O. Balogun', status:'ok', nextDue:'2027-02-11', source:'Data Protection Act 2018', why:'You process personal data (staff, CCTV, bookings), so you must pay the ICO data protection fee.' },
    { id:'OBL-012', title:'PCI DSS SAQ (card payments)', tier:TIER.datacyber, jurisdiction:'UK', evidence:'Self-assessment questionnaire', cadence:'Annual', owner:'O. Balogun', status:'due', nextDue:'2026-10-18', source:'PCI DSS v4.0', why:'You accept card payments, so your card-handling environment must be self-assessed annually.' },
    { id:'OBL-013', title:'CCTV / privacy notice & DPIA', tier:TIER.datacyber, jurisdiction:'UK', evidence:'DPIA + signage', cadence:'On change', owner:'O. Balogun', status:'overdue', nextDue:'2026-08-20', source:'UK GDPR Art.35', why:'Operating CCTV that monitors staff/customers requires a data protection impact assessment.' },
    { id:'OBL-014', title:'Right to work checks', tier:TIER.employment, jurisdiction:'UK', evidence:'Check records per employee', cadence:'Per hire', owner:'A. Mensah', status:'ok', nextDue:'—', source:'Immigration, Asylum & Nationality Act 2006', why:'You employ staff, so you must verify and record each employee\u2019s right to work.' },
    { id:'OBL-015', title:'Working time & rest-break records', tier:TIER.employment, jurisdiction:'UK', evidence:'Rota + records', cadence:'Ongoing', owner:'A. Mensah', status:'due', nextDue:'2026-10-08', source:'Working Time Regulations 1998', why:'You must record hours and ensure statutory rest breaks for workers.' },
    { id:'OBL-016', title:'Health & safety policy (written)', tier:TIER.employment, jurisdiction:'GB', evidence:'Written H&S policy', cadence:'On change', owner:'J. Fields', status:'ok', nextDue:'—', source:'Health & Safety at Work etc. Act 1974', why:'With 5+ employees you must have a written health and safety policy.' }
  ];

  const logEntries = [
    { id:'LOG-2041', type:'Fire incident', date:'2026-09-18', site:'Deansgate kitchen', author:'J. Fields', obl:'OBL-005', summary:'Small pan flare in kitchen, extinguished with fire blanket. No injuries. Extraction checked.' },
    { id:'LOG-2040', type:'Challenge 25 refusal', date:'2026-09-16', site:'Northern Quarter café', author:'R. Okafor', obl:'OBL-002', summary:'Refused alcohol sale, ID declined. Logged per licensing conditions.' },
    { id:'LOG-2039', type:'Inspection', date:'2026-09-12', site:'Deansgate kitchen', author:'A. Mensah', obl:'OBL-010', summary:'Weekly internal food safety walk-through completed, 2 minor actions raised.' },
    { id:'LOG-2038', type:'Electrical inspection', date:'2026-09-05', site:'Northern Quarter café', author:'External (Volt Ltd)', obl:'OBL-007', summary:'PAT testing of portable appliances completed, all passed.' },
    { id:'LOG-2037', type:'Suspected food poisoning', date:'2026-08-29', site:'Deansgate kitchen', author:'R. Okafor', obl:'OBL-010', summary:'Customer reported illness. Investigation opened, batch records retained, no link confirmed.' },
    { id:'LOG-2036', type:'Near-miss', date:'2026-08-22', site:'Deansgate kitchen', author:'J. Fields', obl:'OBL-016', summary:'Wet floor, no signage. Corrected. Staff reminded of procedure.' },
    { id:'LOG-2035', type:'Inspection', date:'2026-08-15', site:'Northern Quarter café', author:'A. Mensah', obl:'OBL-009', summary:'Allergen matrix cross-checked against new menu, discrepancy corrected.' },
    { id:'LOG-2034', type:'Training', date:'2026-08-08', site:'All sites', author:'A. Mensah', obl:'OBL-016', summary:'Level 2 food hygiene refresher delivered to 6 staff, certificates filed.' }
  ];

  // evState: valid | expiring | expired
  const evidence = [
    { id:'EV-501', name:'Employers\u2019 liability certificate 2026', type:'Certificate', obl:'OBL-008', expiry:'2027-01-20', evState:'valid',    version:'v2', owner:'A. Mensah' },
    { id:'EV-502', name:'Gas safety CP12 (2025)',                 type:'Certificate', obl:'OBL-006', expiry:'2026-10-05', evState:'expiring', version:'v1', owner:'J. Fields' },
    { id:'EV-503', name:'Food hygiene registration',              type:'Registration', obl:'OBL-001', expiry:'2026-11-02', evState:'valid',    version:'v3', owner:'A. Mensah' },
    { id:'EV-504', name:'Fire risk assessment (2024)',            type:'Assessment',  obl:'OBL-005', expiry:'2026-09-01', evState:'expired',  version:'v1', owner:'J. Fields' },
    { id:'EV-505', name:'EICR report',                            type:'Report',      obl:'OBL-007', expiry:'2029-03-14', evState:'valid',    version:'v1', owner:'J. Fields' },
    { id:'EV-506', name:'HACCP plan',                             type:'Policy',      obl:'OBL-010', expiry:'—',          evState:'valid',    version:'v4', owner:'R. Okafor' },
    { id:'EV-507', name:'ICO registration receipt',              type:'Registration', obl:'OBL-011', expiry:'2027-02-11', evState:'valid',    version:'v2', owner:'O. Balogun' },
    { id:'EV-508', name:'Allergen matrix (autumn menu)',          type:'Record',      obl:'OBL-009', expiry:'—',          evState:'expiring', version:'v5', owner:'R. Okafor' },
    { id:'EV-509', name:'Level 2 food hygiene certs (x6)',        type:'Training',    obl:'OBL-016', expiry:'2029-08-08', evState:'valid',    version:'v1', owner:'A. Mensah' },
    { id:'EV-510', name:'Premises licence',                       type:'Licence',     obl:'OBL-002', expiry:'—',          evState:'valid',    version:'v1', owner:'A. Mensah' }
  ];

  // reports — rptStatus: due | draft | submitted | overdue
  const reports = [
    { id:'RPT-88', name:'Food standards return',        recipient:'Manchester CC', period:'Q3 2026', due:'2026-10-14', rptStatus:'due',       obl:'OBL-001' },
    { id:'RPT-87', name:'PCI DSS SAQ-A submission',     recipient:'Acquiring bank', period:'2026',    due:'2026-10-18', rptStatus:'draft',     obl:'OBL-012' },
    { id:'RPT-86', name:'RIDDOR — none reportable',     recipient:'HSE',           period:'Sep 2026', due:'2026-10-07', rptStatus:'overdue',   obl:'OBL-016' },
    { id:'RPT-85', name:'ICO fee renewal confirmation', recipient:'ICO',           period:'2026',     due:'2027-02-11', rptStatus:'submitted', obl:'OBL-011' },
    { id:'RPT-84', name:'Employers\u2019 liability display check', recipient:'Internal', period:'2026', due:'2026-11-01', rptStatus:'submitted', obl:'OBL-008' },
    { id:'RPT-83', name:'Allergen review sign-off',     recipient:'Internal',      period:'Autumn menu', due:'2026-10-01', rptStatus:'due',    obl:'OBL-009' }
  ];

  // recommendations — priority score drives ordering; risk: high|med|low
  const recommendations = [
    { id:'REC-1', obl:'OBL-005', risk:'high', title:'Renew your fire risk assessment', why:'Your fire risk assessment lapsed on 1 Sep 2026. Operating without a current FRA is an enforcement risk and can invalidate insurance.', action:'Book FRA', actionKind:'log' },
    { id:'REC-2', obl:'OBL-013', risk:'high', title:'Complete the CCTV data protection impact assessment', why:'CCTV monitors staff and customers but no DPIA is on file. This is required under UK GDPR and was due 20 Aug 2026.', action:'Upload DPIA', actionKind:'evidence' },
    { id:'REC-3', obl:'OBL-003', risk:'med', title:'Renew the personal licence for your DPS', why:'The Designated Premises Supervisor\u2019s personal licence needs review by 10 Oct 2026 to keep authorising alcohol sales.', action:'Start renewal', actionKind:'report' },
    { id:'REC-4', obl:'OBL-006', risk:'med', title:'Schedule the annual gas safety inspection', why:'Your CP12 expires 5 Oct 2026. Book a Gas Safe engineer to avoid a lapse.', action:'Log inspection', actionKind:'log' },
    { id:'REC-5', obl:'OBL-012', risk:'med', title:'Finish the PCI DSS self-assessment', why:'Your annual card-payment self-assessment is in draft and due 18 Oct 2026.', action:'Open report', actionKind:'report' },
    { id:'REC-6', obl:'OBL-009', risk:'low', title:'Sign off the autumn allergen review', why:'Menu changed; confirm the allergen matrix is accurate before it goes live.', action:'Review', actionKind:'report' }
  ];

  // alerts feed — kind: overdue | due | evidence | system
  const alerts = [
    { id:'AL-1', kind:'overdue', title:'Fire risk assessment overdue', meta:'OBL-005 · 22 days', ts:'2h ago' },
    { id:'AL-2', kind:'overdue', title:'CCTV DPIA overdue',            meta:'OBL-013 · 34 days', ts:'2h ago' },
    { id:'AL-3', kind:'due',     title:'Gas safety inspection due soon', meta:'OBL-006 · in 12 days', ts:'1d ago' },
    { id:'AL-4', kind:'evidence',title:'Gas CP12 certificate expiring', meta:'EV-502 · in 12 days', ts:'1d ago' },
    { id:'AL-5', kind:'due',     title:'PCI DSS self-assessment due',   meta:'OBL-012 · in 25 days', ts:'3d ago' }
  ];

  const users = [
    { id:'U1', name:'Opeyemi Oyelesi', role:'Owner / Admin',      email:'op@copperkettle.co', sites:'All' },
    { id:'U2', name:'A. Mensah',       role:'Compliance manager', email:'amensah@copperkettle.co', sites:'All' },
    { id:'U3', name:'R. Okafor',       role:'Site lead',          email:'rokafor@copperkettle.co', sites:'Northern Quarter café' },
    { id:'U4', name:'J. Fields',       role:'Facilities',         email:'jfields@copperkettle.co', sites:'Deansgate kitchen' },
    { id:'U5', name:'O. Balogun',      role:'Data & payments',    email:'obalogun@copperkettle.co', sites:'All' }
  ];

  // ---- derived helpers ----
  function counts() {
    const c = { ok:0, due:0, overdue:0, na:0, total:0 };
    obligations.forEach(o => { c[o.status === 'due' ? 'due' : o.status]++; c.total++; });
    const applicable = c.total - c.na;
    const readiness = Math.round((c.ok / applicable) * 100);
    return { ...c, applicable, readiness };
  }

  function oblById(id){ return obligations.find(o => o.id === id); }
  function tierList(){ return Object.values(TIER); }

  return {
    business, TIER, obligations, logEntries, evidence, reports,
    recommendations, alerts, users, counts, oblById, tierList
  };
})();
