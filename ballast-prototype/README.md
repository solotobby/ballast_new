# Ballast — interactive prototype

A clickable HTML/CSS/JavaScript prototype of **Ballast**, a UK SME compliance operating
system: it identifies the obligations that apply to a business, tracks their status,
stores evidence, logs operational events, generates reports, and gives prescriptive
"what to do next" insights.

The prototype is populated with dummy data for one fictional tenant — *The Copper Kettle*,
a small Manchester hospitality group — so every screen is walkable end to end.

## Run it

No build step. Either:

- **Open directly:** open `index.html` in a browser (it redirects to the sign-in page), or
  open any file in `pages/` directly.
- **Or serve locally** (nicer, avoids any file:// quirks):
  ```bash
  cd ballast-prototype
  python3 -m http.server 8080
  # then visit http://localhost:8080
  ```

Sign-in is mocked — press **Sign in** to enter, or **Set up your business** to walk the
onboarding wizard. An internet connection is needed the first time so the Tailwind CDN and
Google Fonts load.

## Walk-through

1. **Login** → Sign in (or run **Onboarding** to see obligations "generated" from a business
   profile).
2. **Dashboard** — the readiness ring answers "are we covered right now?"; tiles deep-link
   into filtered views.
3. **Obligations** → click any row → **Obligation detail** (why it applies, evidence, logs,
   history).
4. **Monitoring** — status board + snooze/handle alerts.
5. **Logbook** — add a log entry (modal) and watch it appear.
6. **Evidence vault** — upload evidence (modal), filter by expiry state.
7. **Insights** — act on / dismiss ranked recommendations.
8. **Reports** — generate a draft, then submit; view submitted reports.
9. **Verifiable** — future-phase preview.
10. **Settings** — business profile, sites, users.

## Project structure

```
ballast-prototype/
├── index.html                 # entry → redirects to login
├── README.md
├── DESIGN.md                  # Figma design spec + import guide
├── assets/
│   ├── css/
│   │   └── styles.css         # app shell, components, ring, tables (plain CSS)
│   ├── js/
│   │   ├── tailwind.config.js # Tailwind Play CDN theme (brand palette, fonts)
│   │   ├── data.js            # dummy data for every entity in the model
│   │   ├── ui.js              # shared helpers: icons, status pills, modal, toast
│   │   └── layout.js          # injects the sidebar + topbar into each app page
│   └── img/
└── pages/
    ├── login.html             onboarding.html
    ├── dashboard.html         obligations.html      obligation-detail.html
    ├── monitoring.html        logbook.html          evidence.html
    ├── insights.html          reports.html          verifiable.html
    └── settings.html
```

## Tech notes

- **Tailwind CSS** via the Play CDN (`cdn.tailwindcss.com`) with a shared theme in
  `assets/js/tailwind.config.js`. This keeps the prototype build-free. **For production**,
  swap the CDN for a compiled Tailwind build (`npm i -D tailwindcss` → `npx tailwindcss`),
  moving the same theme into `tailwind.config.js` and emitting a static CSS file.
- Structural styling (sidebar/topbar/content offsets, tables, the readiness ring) lives in
  plain CSS in `assets/css/styles.css`, so layout holds even independent of Tailwind.
- **Vanilla JavaScript**, no framework. `data.js` is the single source of dummy data;
  pages render from it and share `ui.js`/`layout.js`.
- Accessibility floor: keyboard focus styles, `prefers-reduced-motion` respected,
  responsive down to mobile (sidebar collapses behind a menu button).

## Colour scheme

Light blue (primary), grey, black, white — see `DESIGN.md` for the full token table.
Muted green/amber/red are used only to carry compliance **status**, which is content.

## Into Figma

See **`DESIGN.md`**. Short version: import the built pages with the **html.to.design**
Figma plugin for editable layers, or rebuild natively from the tokens and component specs
in that document.

---

## Staff app (mobile-first)

Alongside the owner/admin console in `pages/`, the `staff/` folder is the **staff app** —
the surface for front-line employees an owner adds to Ballast. It is mobile-first (bottom
tab bar, large touch targets, safe-area aware) and expands to a sidebar layout on desktop,
since staff may open it on a phone or a back-office screen.

Entry: open `staff/login.html` (or reach it from the admin sign-in page → "Open the staff
app"). Dummy staff member: *Rina Okafor, site lead at the Northern Quarter café*.

Staff pages:

```
staff/
├── login.html      # mobile sign-in / account activation (invited by employer)
├── home.html       # dashboard: a "your focus right now" guidance card + today's tasks,
│                   #   quick actions, coming-up, a learning nudge, recent alerts
├── log.html        # the staff member's log feed + a big "New log entry" flow
├── log-entry.html  # a single log entry (why it matters, linked obligation)
├── alerts.html     # notifications: tasks, training, messages, certificates, rota, system
├── learn.html      # training modules with progress ring + status filter
├── lesson.html     # a module: lessons checklist, progress, complete → certificate
└── profile.html    # profile + settings: details, notification toggles, certificates
```

Shared staff code lives in `assets/`: `staff.css` (the mobile shell), `staff-data.js`
(the staff member's tasks/logs/alerts/learning), and `staff-layout.js` (injects the top
bar, bottom tab bar and desktop sidebar). It reuses the same theme, `ui.js` helpers and
obligation data as the admin side.

The staff dashboard is deliberately simple and guidance-led: rather than the owner's full
oversight view, it surfaces the single most important thing to do next in plain language,
then the day's checklist — "informative decision intelligence", sized for someone on shift.

### Sector task library

The staff data now includes a **starter task library** (`assets/js/staff-data.js`): 83
assignable, recurring **log / evidence / action** templates, each tagged with a **sector**
and a **cadence** (daily, weekly, monthly, quarterly, annual, per-event, on-change,
per-hire). Universal, *data & cyber* and *employment* templates apply to every business and
are merged into each sector automatically.

A **sector switcher** at the top of the staff **Home** and **Log** pages changes which set
is shown (the choice is remembered across pages). On Home it drives the "focus" card and the
day's task checklist; on Log it drives the new-entry types and a browsable
**"Compliance activities for your sector"** library, split into Logs / Evidence / Actions,
where each template can be logged, marked for collection, or scheduled. Sectors covered:
hospitality & food, construction, trade, retail, care (child), care (adult), and property &
facilities.

---

## Platform back-office (`platform/`) — internal operator console

A third surface, for **Ballast's own engineers and staff** to govern every onboarded
business. This is *not* a customer view — it's marked "PLATFORM · Internal · Production"
so it can never be confused with a tenant workspace. Sign in at `platform/login.html`.

| Page | What it does |
|------|--------------|
| `dashboard.html` | Fleet overview: totals, avg readiness, businesses needing attention, rule-library status, sector mix, ops strip (council coverage, tickets, uptime), recent audit. |
| `businesses.html` | Every tenant with filters (status / at-risk / sector). |
| `business-detail.html` | One tenant, with **governance actions**: view-as/impersonate, edit profile, re-run assessment, change plan, assign account manager, suspend/reactivate. Shows compliance snapshot, tickets and governance history. |
| `rules.html` | The **regulatory rule library** the compliance team owns — edit rules, run the draft → review → published workflow, bump versions, and see "affects N businesses" impact. |
| `templates.html` | Manages the **staff task-template library** (the sector-tagged log/evidence/action templates), read live from `staff-data.js`. |
| `support.html` | Ticket queue — assign to me / resolve. |
| `audit.html` | Immutable governance trail (publishes, suspensions, impersonations, role changes). |
| `system.html` | Engineering ops: platform health, the **private/self-hosted obligation-identification engine**, background jobs, and integrations (incl. the degraded 214/317 council-portal coverage). |
| `team.html` | Internal team & access levels (full / tenants / rules / engineering / support). |

Data lives in `assets/js/platform-data.js`; the shell is `assets/js/platform-layout.js`
(reuses the dark app shell from `styles.css`). All governance actions are wired with
modals/toasts and mutate in-memory state so the workflow is demonstrable.
