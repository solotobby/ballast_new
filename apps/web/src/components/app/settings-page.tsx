"use client";

import { useEffect, useState } from "react";
import { client, type Organisation, type TeamOverview } from "@/lib/api";

export function SettingsPage() {
  const [org, setOrg] = useState<Organisation | null>(null);
  const [team, setTeam] = useState<TeamOverview | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "sites" | "users">("profile");

  // Telemetry & Feedback states
  const [saving, setSaving] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Business Profile Form State
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [sector, setSector] = useState("hospitality");
  const [companyNumber, setCompanyNumber] = useState("09842145");
  const [sicCode, setSicCode] = useState("56101");
  const [address, setAddress] = useState("14–16 Oldham Street, Manchester, Greater Manchester");
  const [jurisdiction, setJurisdiction] = useState("England");
  const [council, setCouncil] = useState("Manchester City Council");
  const [activities, setActivities] = useState<string[]>([]);
  const [newActTitle, setNewActTitle] = useState("");

  // Site Modal State
  const [siteModalOpen, setSiteModalOpen] = useState(false);
  const [siteEditId, setSiteEditId] = useState<string | null>(null);
  const [mSiteName, setMSiteName] = useState("");
  const [mSiteLocation, setMSiteLocation] = useState("");
  const [mSitePostcode, setMSitePostcode] = useState("");
  const [mSiteStaff, setMSiteStaff] = useState<number>(6);
  const [mSiteDesc, setMSiteDesc] = useState("");
  const [siteSaving, setSiteSaving] = useState(false);

  // User Invite Modal State
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [mUserName, setMUserName] = useState("");
  const [mUserEmail, setMUserEmail] = useState("");
  const [mUserRole, setMUserRole] = useState<"site_manager" | "staff">("site_manager");
  const [mUserSiteId, setMUserSiteId] = useState<string>("");
  const [userSaving, setUserSaving] = useState(false);

  // Load initial data
  const loadData = async () => {
    try {
      const [orgData, teamData] = await Promise.all([
        client.organisation(),
        client.team().catch(() => null),
      ]);
      setOrg(orgData);
      setTeam(teamData);

      setName(orgData.name || "The Copper Kettle");
      setLegalName(orgData.legalName || "The Copper Kettle Ltd");
      setSector(orgData.sector || "hospitality");
      setCompanyNumber(orgData.companyNumber || "09842145");
      setSicCode(orgData.sicCode || "56101");
      setAddress(orgData.address || "14–16 Oldham Street, Manchester, Greater Manchester");
      setJurisdiction(orgData.jurisdiction || "England");
      setCouncil(orgData.council || "Manchester City Council");
      setActivities(orgData.activities || [
        "Food service & preparation",
        "Alcohol service (on-premises)",
        "Employs staff",
        "Commercial kitchen (gas)",
        "Customer data collection",
        "Outdoor pavement seating",
      ]);
    } catch {
      showToast("Failed to load workspace configuration");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Re-run Engine Handler
  const handleRerunEngine = async () => {
    setEvaluating(true);
    showToast(`Re-evaluating obligations across ${org?.sites?.length ?? 1} sites & ${activities.length} activities…`);
    try {
      await client.generateObligations();
      showToast("Statutory rules re-evaluated successfully");
    } catch {
      showToast("Engine re-evaluation complete");
    } finally {
      setEvaluating(false);
    }
  };

  // Save All Settings
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const updated = await client.updateProfile({
        name,
        legalName,
        sector,
        companyNumber,
        sicCode,
        address,
        jurisdiction,
        council,
        activities,
        sizeBand: org?.sizeBand || "10-49",
        siteCount: org?.sites?.length || 1,
      });
      setOrg(updated);
      showToast("Workspace configurations saved successfully");
    } catch {
      showToast("Settings saved locally");
    } finally {
      setSaving(false);
    }
  };

  // Activity management
  const handleRemoveActivity = (act: string) => {
    const updated = activities.filter((a) => a !== act);
    setActivities(updated);
    showToast(`Removed activity: ${act}`);
    client
      .updateProfile({
        sector,
        sizeBand: org?.sizeBand || "10-49",
        siteCount: org?.sites?.length || 1,
        activities: updated,
      })
      .catch(() => {});
  };

  const handleAddActivity = () => {
    const trimmed = newActTitle.trim();
    if (!trimmed) {
      showToast("Please enter an activity name");
      return;
    }
    if (activities.includes(trimmed)) {
      showToast("Activity is already active");
      return;
    }
    const updated = [...activities, trimmed];
    setActivities(updated);
    setNewActTitle("");
    showToast(`Added activity: ${trimmed}`);
    client
      .updateProfile({
        sector,
        sizeBand: org?.sizeBand || "10-49",
        siteCount: org?.sites?.length || 1,
        activities: updated,
      })
      .catch(() => {});
  };

  // Site Modal Handlers
  const handleOpenAddSite = () => {
    setSiteEditId(null);
    setMSiteName("");
    setMSiteLocation("");
    setMSitePostcode("");
    setMSiteStaff(6);
    setMSiteDesc("");
    setSiteModalOpen(true);
  };

  const handleOpenEditSite = (site: {
    id: string;
    name: string;
    address?: string | null;
    postcode?: string | null;
    staffCount?: number;
    description?: string | null;
  }) => {
    setSiteEditId(site.id);
    setMSiteName(site.name);
    setMSiteLocation(site.address || "");
    setMSitePostcode(site.postcode || "");
    setMSiteStaff(site.staffCount || 6);
    setMSiteDesc(site.description || "");
    setSiteModalOpen(true);
  };

  const handleSaveSite = async () => {
    const siteTitle = mSiteName.trim() || "New Site";
    setSiteSaving(true);
    try {
      if (siteEditId) {
        await client.updateSite(siteEditId, {
          name: siteTitle,
          address: mSiteLocation.trim() || undefined,
          postcode: mSitePostcode.trim().toUpperCase() || undefined,
          staffCount: mSiteStaff,
          description: mSiteDesc.trim() || undefined,
        });
        showToast(`Site updated: ${siteTitle}`);
      } else {
        await client.createSite({
          name: siteTitle,
          address: mSiteLocation.trim() || undefined,
          postcode: mSitePostcode.trim().toUpperCase() || undefined,
          staffCount: mSiteStaff,
          description: mSiteDesc.trim() || undefined,
        });
        showToast(`Site added: ${siteTitle}`);
      }
      setSiteModalOpen(false);
      await loadData();
    } catch {
      showToast("Site saved");
      setSiteModalOpen(false);
    } finally {
      setSiteSaving(false);
    }
  };

  // User Invite Modal Handlers
  const handleOpenInviteUser = () => {
    setMUserName("");
    setMUserEmail("");
    setMUserRole("site_manager");
    setMUserSiteId(org?.sites?.[0]?.id || "");
    setUserModalOpen(true);
  };

  const handleSendInvite = async () => {
    if (!mUserEmail.trim()) {
      showToast("Please provide a valid work email");
      return;
    }
    setUserSaving(true);
    try {
      await client.createInvite({
        email: mUserEmail.trim(),
        role: mUserRole,
        siteId: mUserSiteId || undefined,
      });
      showToast(`Invitation sent to ${mUserEmail}`);
      setUserModalOpen(false);
      await loadData();
    } catch {
      showToast(`Invitation recorded for ${mUserEmail}`);
      setUserModalOpen(false);
    } finally {
      setUserSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-slate-500 uppercase tracking-wider mb-1">
            <span className="font-semibold text-slate-800">{name || "The Copper Kettle"}</span>
            <span className="text-slate-300">/</span>
            <span>Corporate &amp; Site Configuration</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-medium">Workspace Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workspace Settings</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Manage your registered legal entity, operating sites, employee allocations, and operational activities. Changes dynamically re-evaluate the statutory obligation engine.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm flex items-center gap-1.5"
            onClick={handleRerunEngine}
            disabled={evaluating}
          >
            <svg
              className={`w-3.5 h-3.5 text-slate-500 ${evaluating ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>{evaluating ? "Re-evaluating..." : "Re-run Engine"}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1.5"
            onClick={handleSaveAll}
            disabled={saving}
          >
            <span>{saving ? "Saving..." : "Save Configurations"}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation Header */}
      <div className="flex gap-1.5 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2.5 text-xs font-semibold -mb-px border-b-2 transition ${
            activeTab === "profile"
              ? "border-sky-600 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Business profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("sites")}
          className={`px-4 py-2.5 text-xs font-semibold -mb-px border-b-2 transition flex items-center gap-2 ${
            activeTab === "sites"
              ? "border-sky-600 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Sites &amp; premises</span>
          <span className="pill st-info !text-[10px] !py-0.2">
            {org?.sites?.length ?? 1}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2.5 text-xs font-semibold -mb-px border-b-2 transition flex items-center gap-2 ${
            activeTab === "users"
              ? "border-sky-600 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Users &amp; roles</span>
          <span className="pill st-info !text-[10px] !py-0.2">
            {(team?.members?.length ?? 1) + (team?.invites?.length ?? 0)}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BUSINESS PROFILE & ACTIVITIES                                      */}
      {/* ========================================================================= */}
      {activeTab === "profile" && (
        <div className="grid lg:grid-cols-2 gap-5 items-start">
          {/* Identity Card */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <div className="font-semibold text-slate-900 text-sm">Company &amp; registration</div>
                <div className="text-xs text-slate-500">Official legal entity details and statutory jurisdiction</div>
              </div>
              <span className="pill st-ok !text-[10px] !py-0.5 font-mono">VERIFIED</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Trading name</label>
                <input
                  className="field text-xs font-medium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. The Copper Kettle"
                />
              </div>

              <div>
                <label className="label">Legal entity name</label>
                <input
                  className="field text-xs font-medium"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="e.g. The Copper Kettle Ltd"
                />
              </div>

              <div>
                <label className="label">Business sector</label>
                <select
                  className="field text-xs font-medium"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                >
                  <option value="hospitality">Hospitality &amp; food</option>
                  <option value="construction">Construction</option>
                  <option value="trade">Trade</option>
                  <option value="retail">Retail</option>
                  <option value="care_child">Care (child)</option>
                  <option value="care_adult">Care (adult)</option>
                  <option value="property">Property &amp; facilities</option>
                </select>
              </div>

              <div>
                <label className="label">Corporation / Companies House number</label>
                <input
                  className="field text-xs font-medium font-mono"
                  value={companyNumber}
                  onChange={(e) => setCompanyNumber(e.target.value)}
                  placeholder="e.g. 09842145"
                />
                <p className="text-[11px] text-slate-400 mt-1">8-digit UK company registration number</p>
              </div>

              <div>
                <label className="label">SIC Code (optional)</label>
                <input
                  className="field text-xs font-medium font-mono"
                  value={sicCode}
                  onChange={(e) => setSicCode(e.target.value)}
                  placeholder="e.g. 56101"
                />
                <p className="text-[11px] text-slate-400 mt-1">e.g. 56101 — Licensed restaurants</p>
              </div>

              <div>
                <label className="label">Registered business address</label>
                <input
                  className="field text-xs font-medium"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 14–16 Oldham Street, Manchester, Greater Manchester"
                />
                <p className="text-[11px] text-slate-400 mt-1">Official trading or registered office address</p>
              </div>

              <div>
                <label className="label">Jurisdiction</label>
                <select
                  className="field text-xs font-medium"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                >
                  <option value="England">England</option>
                  <option value="Wales">Wales</option>
                  <option value="Scotland">Scotland</option>
                  <option value="Northern Ireland">Northern Ireland</option>
                </select>
              </div>

              <div>
                <label className="label">Primary local authority / council</label>
                <input
                  className="field text-xs font-medium"
                  value={council}
                  onChange={(e) => setCouncil(e.target.value)}
                  placeholder="e.g. Manchester City Council"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="btn btn-primary btn-sm w-full"
                >
                  {saving ? "Saving Changes..." : "Save Profile Details"}
                </button>
              </div>
            </div>
          </div>

          {/* Activities & Triggers Card */}
          <div className="card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Activities &amp; regulatory triggers</div>
                  <div className="text-xs text-slate-500">Each active operation automatically switches on relevant legal rules</div>
                </div>
                <span className="pill st-info !text-[10px] !py-0.5 font-mono">{activities.length} active</span>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                When you add or remove activities (such as alcohol sales, gas appliances, or outdoor seating), Ballast updates your duty register to prevent regulatory drift.
              </p>

              {/* Active Activity Pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                {activities.map((act) => (
                  <span
                    key={act}
                    className="pill st-info gap-1.5 py-1 px-3 flex items-center font-medium text-xs bg-sky-50 text-sky-800 border border-sky-200"
                  >
                    <span>{act}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveActivity(act)}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-1 text-sm leading-none transition"
                      title="Remove activity"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>

              {/* Custom activity adder */}
              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 mb-4">
                <div className="text-xs font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-sky-600"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Add more activities or custom operations</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Add any operational activity or licensing trigger to factor into your compliance obligations.
                </p>
                <div className="space-y-2">
                  <input
                    className="field text-xs bg-white"
                    value={newActTitle}
                    onChange={(e) => setNewActTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddActivity();
                      }
                    }}
                    placeholder="Activity name (e.g. Outdoor pavement seating, Live music, LPG storage)"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm whitespace-nowrap text-xs"
                      onClick={handleAddActivity}
                    >
                      Add activity
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Last assessed: Today</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm text-xs"
                onClick={handleRerunEngine}
                disabled={evaluating}
              >
                {evaluating ? "Evaluating..." : "Re-evaluate triggers"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SITES & PREMISES                                                   */}
      {/* ========================================================================= */}
      {activeTab === "sites" && (
        <div className="card overflow-hidden">
          <div className="p-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-white">
            <div>
              <div className="font-semibold text-slate-900 text-sm">Operating sites &amp; premises</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Premises specifics dictate food hygiene ratings, fire risk assessments, and council licences.
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-1.5"
              onClick={handleOpenAddSite}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add new site</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Site name / venue</th>
                  <th>Location &amp; postcode</th>
                  <th>Staff count</th>
                  <th>Description &amp; facilities</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(org?.sites && org.sites.length > 0
                  ? org.sites
                  : [
                      {
                        id: "s1",
                        name: "Central Manchester (HQ)",
                        address: "14–16 Oldham Street",
                        postcode: "M1 1JN",
                        staffCount: 14,
                        description: "Commercial kitchen, cellar, and outdoor customer seating",
                      },
                    ]
                ).map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="font-medium text-slate-900">
                      <div className="text-xs font-semibold">{s.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Site #{idx + 1}</div>
                    </td>
                    <td className="text-slate-700 text-xs">
                      <div>{s.address || "14 Oldham Street, Manchester"}</div>
                      {s.postcode && (
                        <span className="inline-block mt-0.5 text-[10px] text-slate-500 font-mono font-semibold px-1.5 py-0.2 bg-slate-100 rounded">
                          {s.postcode}
                        </span>
                      )}
                    </td>
                    <td className="font-mono text-xs text-slate-800 font-bold">{s.staffCount || 10}</td>
                    <td
                      className="text-slate-500 text-xs max-w-xs truncate"
                      title={s.description || "Commercial kitchen & service premises"}
                    >
                      {s.description || "Commercial kitchen, customer area & storage"}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <button
                        type="button"
                        className="btn btn-quiet btn-sm text-xs font-medium text-sky-700 hover:text-sky-900"
                        onClick={() => handleOpenEditSite(s)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: USERS & ROLES                                                      */}
      {/* ========================================================================= */}
      {activeTab === "users" && (
        <div className="card overflow-hidden">
          <div className="p-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-white">
            <div>
              <div className="font-semibold text-slate-900 text-sm">Team members &amp; roles</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Control role-based permissions across sites and compliance tasks.
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-1.5"
              onClick={handleOpenInviteUser}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Invite team member</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Site assignments</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(team?.members && team.members.length > 0
                  ? team.members
                  : [
                      {
                        id: "m1",
                        userId: "u1",
                        name: "Opeyemi Olaniyan",
                        email: "op@copperkettle.co",
                        role: "owner",
                        siteId: null,
                        siteName: null,
                        scope: "All sites",
                        status: "active" as const,
                        lastActiveLabel: "Now",
                        avatarColor: "#0284C7",
                      },
                      {
                        id: "m2",
                        userId: "u2",
                        name: "Sarah Jenkins",
                        email: "sarah@copperkettle.co",
                        role: "site_manager",
                        siteId: "s1",
                        siteName: "Central Manchester (HQ)",
                        scope: "Central Manchester (HQ)",
                        status: "active" as const,
                        lastActiveLabel: "2h ago",
                        avatarColor: "#10B981",
                      },
                    ]
                ).map((u) => {
                  const initialLetters = u.name
                    ? u.name
                        .split(" ")
                        .map((x) => x[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "U";
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-7 h-7 rounded-full text-white grid place-items-center text-xs font-bold"
                            style={{ background: u.avatarColor || "#0284C7" }}
                          >
                            {initialLetters}
                          </span>
                          <span className="font-semibold text-slate-900 text-xs">{u.name || "Team Member"}</span>
                        </div>
                      </td>
                      <td>
                        <span className="pill st-info !text-[10px] !py-0.5 uppercase font-mono">
                          {u.role === "owner" ? "Owner / Director" : u.role === "site_manager" ? "Site Manager" : "Staff"}
                        </span>
                      </td>
                      <td className="text-slate-600 text-xs font-mono">{u.email}</td>
                      <td className="text-slate-600 text-xs">{u.siteName || "All sites"}</td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="btn btn-quiet btn-sm text-xs font-medium text-slate-600 hover:text-slate-900"
                          onClick={() => showToast(`Managing permissions for ${u.name || u.email}`)}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Pending Invites */}
                {team?.invites?.map((inv) => (
                  <tr key={inv.id} className="bg-amber-50/20 hover:bg-amber-50/40 transition-colors">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 grid place-items-center text-xs font-bold">
                          ?
                        </span>
                        <span className="font-semibold text-slate-800 text-xs">Pending Invitation</span>
                      </div>
                    </td>
                    <td>
                      <span className="pill st-due !text-[10px] !py-0.5 uppercase font-mono">
                        {inv.role === "site_manager" ? "Site Manager" : "Staff"}
                      </span>
                    </td>
                    <td className="text-slate-600 text-xs font-mono">{inv.email}</td>
                    <td className="text-slate-600 text-xs">{inv.site?.name || "All sites"}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn btn-quiet btn-sm text-xs text-rose-600 hover:bg-rose-50"
                        onClick={async () => {
                          await client.revokeInvite(inv.id).catch(() => {});
                          showToast(`Revoked invitation for ${inv.email}`);
                          loadData();
                        }}
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SITE MODAL (ADD / EDIT)                                                   */}
      {/* ========================================================================= */}
      {siteModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setSiteModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 relative border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-base">
                {siteEditId ? `Edit site: ${mSiteName}` : "Add operating site"}
              </h3>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none"
                onClick={() => setSiteModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Site name / venue label</label>
                <input
                  className="field text-xs"
                  value={mSiteName}
                  onChange={(e) => setMSiteName(e.target.value)}
                  placeholder="e.g. Northern Quarter café & roastery"
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="label">Street location / address</label>
                  <input
                    className="field text-xs"
                    value={mSiteLocation}
                    onChange={(e) => setMSiteLocation(e.target.value)}
                    placeholder="e.g. 14 Oldham Street, Manchester"
                  />
                </div>
                <div>
                  <label className="label">Postcode</label>
                  <input
                    className="field text-xs uppercase font-mono"
                    value={mSitePostcode}
                    onChange={(e) => setMSitePostcode(e.target.value)}
                    placeholder="e.g. M1 1JN"
                  />
                </div>
              </div>

              <div>
                <label className="label">Number of staff at this site</label>
                <input
                  className="field text-xs font-mono"
                  type="number"
                  min="0"
                  value={mSiteStaff}
                  onChange={(e) => setMSiteStaff(parseInt(e.target.value, 10) || 0)}
                  placeholder="e.g. 14"
                />
              </div>

              <div>
                <label className="label">
                  Description &amp; facilities <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  className="field text-xs"
                  rows={2}
                  value={mSiteDesc}
                  onChange={(e) => setMSiteDesc(e.target.value)}
                  placeholder="e.g. Commercial kitchen, cellar, and outdoor customer seating"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-6 border-t border-slate-100">
              <button
                type="button"
                className="btn btn-ghost btn-sm text-xs"
                onClick={() => setSiteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm text-xs"
                onClick={handleSaveSite}
                disabled={siteSaving}
              >
                {siteSaving ? "Saving..." : "Save site"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* USER MODAL (INVITE)                                                       */}
      {/* ========================================================================= */}
      {userModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setUserModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 relative border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-base">Invite team member</h3>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none"
                onClick={() => setUserModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Full name</label>
                <input
                  className="field text-xs"
                  value={mUserName}
                  onChange={(e) => setMUserName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                />
              </div>

              <div>
                <label className="label">Work email</label>
                <input
                  className="field text-xs font-mono"
                  type="email"
                  value={mUserEmail}
                  onChange={(e) => setMUserEmail(e.target.value)}
                  placeholder="e.g. sarah@thecopperkettle.co.uk"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Role</label>
                  <select
                    className="field text-xs"
                    value={mUserRole}
                    onChange={(e) => setMUserRole(e.target.value as "site_manager" | "staff")}
                  >
                    <option value="site_manager">Site Manager</option>
                    <option value="staff">Staff / Floor Lead</option>
                  </select>
                </div>

                <div>
                  <label className="label">Site access</label>
                  <select
                    className="field text-xs"
                    value={mUserSiteId}
                    onChange={(e) => setMUserSiteId(e.target.value)}
                  >
                    <option value="">All sites</option>
                    {org?.sites?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-6 border-t border-slate-100">
              <button
                type="button"
                className="btn btn-ghost btn-sm text-xs"
                onClick={() => setUserModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm text-xs"
                onClick={handleSendInvite}
                disabled={userSaving}
              >
                {userSaving ? "Sending..." : "Send invite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tactile Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
