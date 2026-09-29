# Ballast — Design specification (Figma build guide)

This document is the design blueprint for **Ballast**, a UK SME compliance operating
system. It is written so a designer can (a) reproduce the product in Figma from the
tokens and component specs below, or (b) import the working HTML prototype directly
into Figma and refine it there.

---

## 0. Getting this into Figma

There is no reliable way to generate a native, editable `.fig` file outside Figma —
the format is proprietary and undocumented. There are two practical routes, and this
project supports both:

**Route A — Import the built HTML (fastest, recommended).**
Use the free **html.to.design** Figma plugin (Figma → Plugins → *html.to.design*).
It converts a live page or raw HTML into real, editable Figma layers (frames, text,
autolayout).
1. Run the prototype locally (see `README.md`) or host it.
2. In Figma, open the plugin → *Import from URL* and paste each page's URL, **or**
   choose *Import code* and paste the page's rendered HTML.
3. Repeat per page. Each becomes a Figma frame you can restyle and componentise.
Because the prototype already uses one consistent design system, the imported layers
map cleanly onto the styles and components described below.

**Route B — Rebuild natively from this spec.**
Set up the colour/text/effect **variables and styles** in section 1–2, build the
**components** in section 3, then assemble the **page frames** in section 4. This gives
the cleanest Figma library but takes longer.

A recommended Figma file structure is in section 6.

---

## 1. Colour

Primary is **light blue**; the wider palette is grey, black and white. Status colours
are deliberately muted so they read as information, not decoration.

### Brand ramp (light blue — primary)
| Token | Hex | Use |
|---|---|---|
| brand/50 | `#EFF8FE` | tinted backgrounds, hover fills |
| brand/100 | `#D7EEFB` | chips, avatar backgrounds |
| brand/200 | `#B3E0F7` | subtle borders |
| **brand/300** | **`#7FCBF0`** | **the signature light blue** — active nav marker, ring highlight, gradients |
| brand/400 | `#4FB3E6` | ring gradient, small accents |
| brand/500 | `#2E9BD6` | focus rings, secondary accents |
| **brand/600** | **`#1F7DB4`** | **solid primary buttons** (white text passes AA for UI) |
| brand/700 | `#1A6390` | links on white, button hover |
| brand/800 | `#184F71` | — |
| brand/900 | `#123A53` | badge backgrounds on dark |

> Why two "primary" shades: light blue (`brand/300`) is the brand signature and is used
> for accents, the active-nav marker and the readiness ring, where it sits on the dark
> sidebar or on white and has strong contrast. Solid buttons use `brand/600` so white
> label text meets accessibility contrast. Both belong to the same light-blue hue.

### Ink (black) & grey
| Token | Hex | Use |
|---|---|---|
| ink | `#111418` | primary text, headings |
| sidebar | `#0E1319` | sidebar / dark surfaces |
| grey/50 | `#F6F8FA` | app background |
| grey/100 | `#EEF2F6` | track fills, tag backgrounds |
| grey/200 | `#E2E8F0` | borders / dividers |
| grey/300 | `#CBD5E1` | scrollbars, muted dots |
| grey/500 | `#64748B` | secondary text |
| grey/600 | `#475569` | body text on cards |
| grey/700 | `#334155` | strong secondary text |
| white | `#FFFFFF` | cards, content surfaces |
| hairline | `#E7ECF2` | card borders (slightly warmer than grey/200) |

### Status (content colours)
| State | Text | Fill | Dot |
|---|---|---|---|
| Met / Valid / Submitted | `#2C7358` | `#E7F3EE` | `#3E9E7A` |
| Due soon / Expiring / Draft-attention | `#8A6412` | `#FBF1DC` | `#C0891F` |
| Overdue / Expired | `#8F3527` | `#F8E7E2` | `#C0503B` |
| Not applicable | `#5A6675` | `#EEF2F6` | `#94A3B8` |
| Info / Draft | `#155E88` | `#E4F2FB` | `#2E9BD6` |

**Signature gradient:** `linear-gradient(150deg, #7FCBF0 → #1F7DB4)` — logo tile, readiness
ring, feature icons only. Use sparingly.

---

## 2. Typography

Two families, clearly distinct:

- **Space Grotesk** — display: page titles, section headings, big numbers, wordmark.
  Weights 500/600/700.
- **IBM Plex Sans** — body & UI: labels, table data, paragraphs. Weights 400/500/600/700.
  Enable **tabular figures** (`tabular-nums`) for all numeric/data cells and dates.

Both are on Google Fonts.

### Type scale
| Style | Family / weight | Size / line |
|---|---|---|
| Page title | Space Grotesk 600 | 24 / 30 |
| Section heading | Space Grotesk 600 | 18 / 24 |
| Big stat number | Space Grotesk 700 | 30–40 |
| Body | IBM Plex Sans 400 | 15 / 24 |
| UI / table | IBM Plex Sans 400–500 | 14 / 20 |
| Label | IBM Plex Sans 600 | 13 |
| Meta / caption | IBM Plex Sans 400 | 12 / 16, grey/500 |

Sentence case everywhere (including buttons and labels). No all-caps eyebrows. Keep body
line length under ~72 characters.

---

## 3. Components (build as Figma components with variants)

**Spacing base** 4px. Common paddings: cards 20–24, table cells 13×14, buttons 10×15.
**Radius:** buttons/inputs 10, cards/tags 14 (pills 999). **Elevation:** cards use a
1px hairline border + `0 1px 2px rgba(16,24,40,.05)`; only modals/popovers get a real
shadow `0 16px 40px -12px rgba(16,24,40,.22)`.

- **Button** — variants: `primary` (brand/600, white), `ghost` (white, grey border),
  `quiet` (transparent), plus `size = sm/md` and optional leading icon.
- **Status pill** — variant `state = met/due/overdue/na/info`; pill = coloured text on
  tinted fill with an 8px status dot. Reuse for evidence state, report state, risk.
- **Tier tag** — small grey rounded tag for obligation area (Universal / Sector
  licensing / Data & cyber / Employment).
- **Card** — white, hairline border, radius 14. Sub-variants: plain, stat tile, list-row
  container.
- **Data table** — sticky header (grey/50, 12.5px grey label), 1px row dividers, hover
  fill grey `#F7FAFD`, clickable rows.
- **Sidebar nav item** — variants `default / hover / active`. Active = dark tint fill +
  3px `brand/300` left marker + white label.
- **Topbar** — business switcher, search field, alerts bell (with dot + dropdown),
  avatar.
- **Modal** — 560px max, header (title + close), body, footer (right-aligned actions on
  grey/50).
- **Toast** — dark pill, `brand/300` dot, bottom-right.
- **Input / select / textarea** — 1px grey/300 border, radius 10, focus = brand/500
  border + 3px brand tint ring. Label above in 13px/600.
- **Readiness ring** *(signature element)* — 168px, 15px stroke, grey/100 track +
  gradient arc (`brand/300→600`), rounded cap, centred big number + "ready" caption.
  Build as a component with a numeric property driving the arc.

---

## 4. Page inventory & layout

App shell (all app pages): fixed **dark sidebar 244px** (left) + fixed **topbar 60px** +
scrolling white content (max-width 1400, 32px gutters). Sidebar nav grouped: *Overview*
(Dashboard, Obligations, Monitoring), *Records* (Logbook, Evidence vault, Reports),
*Intelligence* (Insights, Verifiable [Soon badge]), *Account* (Settings).

Auth/onboarding pages are full-screen with no shell.

### 4.1 Login — `pages/login.html`
Two-column. Left: dark brand panel (wordmark, headline, three stats). Right: sign-in form
(email, password, keep-signed-in, primary button, link to onboarding). Mobile: form only.

### 4.2 Onboarding wizard — `pages/onboarding.html`
Full-screen, 4-step stepper: **Basics** (name, business type) → **Size & location**
(headcount, jurisdiction, local authority) → **Activities** (multi-select tiles that each
"switch on" the rules they trigger) → **generating…** loader → **Review** (obligation
count + per-area breakdown → enter dashboard). This is the obligation-identification intake.

### 4.3 Dashboard — `pages/dashboard.html` *(Governance & Oversight home)*
Hero title "Are we covered right now?". Row 1: **readiness ring** card + three attention
tiles (Overdue, Due within 30 days, Evidence expiring) + a compliance-by-area bar block.
Row 2: **Upcoming deadlines** list | **Priority actions** (top recommendations). Row 3:
**Recent activity** feed. Every tile deep-links (e.g. Overdue → obligations filtered).

### 4.4 Obligations register — `pages/obligations.html`
Filter bar (status chips + area chips, honours `?status=` deep link) + result count, over a
data table (Obligation, Area, Jurisdiction, Owner, Next due, Status). Rows → detail.

### 4.5 Obligation detail — `pages/obligation-detail.html`
Header (tier tag, id, title, status, actions). Left column: **Why this applies** + source
citation, **Linked evidence**, **Related log entries**. Right column: **Details** panel,
**Status history** timeline. Reads `?id=`. Empty states written as invitations to act.

### 4.6 Monitoring — `pages/monitoring.html`
Four-count summary strip (met/due/overdue/n-a). Left: **Status board** sorted by urgency
with a coloured urgency bar per row. Right: **Active alerts** with snooze / mark-handled.

### 4.7 Logbook — `pages/logbook.html`
Type filter chips + entry count, over a table (Entry, Type, Site, Logged by, Linked
obligation, Date). **New log entry** modal (type, date, site, linked obligation, description,
evidence drop) prepends to the table.

### 4.8 Evidence vault — `pages/evidence.html`
Three-count summary (valid / expiring / expired) + state filter, over a **card grid**
(doc icon, name, type + version, linked obligation, expiry, state pill). **Upload evidence**
modal (dropzone + name, type, obligation, expiry) prepends a card.

### 4.9 Insights — `pages/insights.html` *(Prescriptive AI)*
Recommendation cards ranked by risk (High → Low), each: risk pill, linked obligation,
title, plain-English rationale, primary action (routes to the relevant module) + dismiss.
Confidence/"not legal advice" caveat at the foot.

### 4.10 Reports — `pages/reports.html`
Four-count summary (due / draft / overdue / submitted), over a schedule table (Report,
Recipient, Period, Due, Status, contextual action). Generate → draft → submit transitions,
"view submitted" modal, and a **Generate report** modal.

### 4.11 Verifiable compliance — `pages/verifiable.html` *(future phase)*
Marketing/preview: hero, three pillars (tamper-evident / selective disclosure / revocable),
and a **mock attestation** card. Nav item carries a "Soon" badge.

### 4.12 Settings — `pages/settings.html`
Tabs: **Business profile** (fields + activities/triggers, re-run assessment), **Sites**
(table), **Users & roles** (table). Profile edits are what drive obligation identification.

---

## 5. Interaction & motion

Restrained. The only non-user-triggered motion is the **readiness ring** drawing in and
the number counting up on the dashboard once. Everything else answers an action: modals
open, toasts confirm ("Log entry saved", "…submitted to Manchester CC"), filters re-render,
report statuses transition. Respect `prefers-reduced-motion` (all motion disabled). Action
labels stay consistent through their flow (button "Submit" → toast "…submitted").

## 6. Recommended Figma file structure
- **Page: ⬦ Foundations** — colour variables, text styles, effect styles, spacing/radius.
- **Page: ⬦ Components** — buttons, pills, tags, card, table row, nav item, topbar,
  modal, toast, inputs, readiness ring (all with variants).
- **Page: 01 Auth** — Login, Onboarding (all steps + loader + review).
- **Page: 02 App** — Dashboard, Obligations, Obligation detail, Monitoring, Logbook,
  Evidence, Insights, Reports, Verifiable, Settings — each as a frame, plus modal/empty/
  filtered states as variant frames.
- **Page: 03 Flows** — prototype wiring: Login → Dashboard → (Obligations → Detail),
  Insights → module, Onboarding → Dashboard.

Set the colour table (section 1) as Figma **variables** and the type scale (section 2) as
**text styles** first; every component then references them, so a token change propagates
everywhere — matching how the prototype's Tailwind theme works.


---

## 7. Staff app (mobile-first surface)

Ballast has two surfaces sharing one design system: the **owner/admin console** (desktop,
dark sidebar — sections 4.1–4.12) and the **staff app** (`staff/`), a mobile-first surface
for added employees.

**Shell.** Mobile: a sticky top bar (greeting/back + alerts bell with unread badge) and a
fixed **bottom tab bar** — Home, Log, Learn, Alerts, Profile — with safe-area insets and
large tap targets. Desktop (≥1024px): the bottom bar becomes a left **sidebar** and content
widens (max 900px, optional two-column grids). Build the bottom bar and sidebar as two
components driven by the same nav model.

**Tone.** Friendlier and simpler than the admin console: plain language, one clear next
action, checklists over tables. A light sidebar (vs the admin's dark one) distinguishes the
surface while keeping the light-blue accent.

**Signature component — "focus" card.** A dark gradient card at the top of Home that names
the single most important task right now plus one line of guidance and a primary action.
This is the staff version of "decision intelligence": the app decides what matters most so
the employee doesn't have to.

**Staff frames to build:** Login (mobile sheet), Home (focus card, quick actions, today's
tasks checklist, coming-up, learning nudge, recent alerts), Log (feed + new-entry modal),
Log entry, Alerts (all/unread), Learn (progress ring + module cards + status filter),
Module/lesson (lessons checklist → completion → certificate), Profile (details / alert
toggles / certificates). Re-use the status-pill, card, progress-bar and toggle components;
add a bottom-tab item, a task-check control and a lesson-row.

---

## §8 — Platform back-office (internal operator console)

A third product surface for Ballast's own team. Visually it reuses the **owner console
design system** (dark `#0E1319` sidebar, white content, light-blue accent, same cards,
pills, tables, modals) with two deliberate differentiators so operators always know they
are in an internal tool:

- **Wordmark** reads `Ballast` + a small `PLATFORM` label.
- A persistent amber **"Internal · Production"** chip sits in the top bar.

### Page inventory (for Figma frames)
1. **Dashboard** — 5 metric tiles, "businesses needing attention" list, rule-library
   status donut/counters, sector-mix bars, operations strip, recent-activity feed.
2. **Businesses** — filter bar + dense data table (readiness colour-coded).
3. **Business detail** — identity header + governance action buttons, metric row,
   compliance snapshot, support tickets, governance history, account sidebar with the
   full governance-action menu (impersonate, plan, manager, suspend).
4. **Rule library** — table + **rule editor modal** showing the status stepper
   (draft → review → published) and an impact banner ("applies to N businesses").
5. **Task templates** — summary tiles + filterable table of the 83 sector templates.
6. **Support / Audit / System / Team** — queue, timeline, health tiles + AI-engine card,
   and role legend + table respectively.

### Component additions over §3
- **Environment chip** (amber `st-due` pill with shield icon).
- **Governance action menu** (left-aligned quiet buttons, destructive actions in `bad`).
- **Status stepper** for the rule publish workflow.
- **Impact banner** (brand-50 inset) warning that a change reaches live businesses.

Everything else (colour, type, spacing, table + pill primitives) is inherited from the
tokens already defined above, so the html.to.design import route in §6 covers this
surface too.
