import { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { G } from "../styles/theme";
import { apiFetch } from "../api";
import VetReport from "../../pawmind-vet-report.jsx";

const MOOD_COLORS = {
  Happy: "#f59e0b",
  Relaxed: "#34d399",
  Sad: "#60a5fa",
  Angry: "#f87171",
};

const MOOD_ORDER = ["Happy", "Relaxed", "Sad", "Angry"];
const EMPTY_OWNER = Object.freeze({
  name: "",
  phone: "",
  email: "",
  address: "",
  emergencyContact: "",
});

function getCurrentMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getMonthOptions(numMonths = 6) {
  const out = [];
  const base = new Date();
  base.setDate(1);
  for (let i = 0; i < numMonths; i += 1) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    out.push({ value, label });
  }
  return out;
}

function buildMoodBars(monthly) {
  const dist = monthly?.mood_distribution || {};
  return MOOD_ORDER.map((mood) => ({
    mood,
    count: Number(dist[mood] || 0),
    color: MOOD_COLORS[mood],
  }));
}

function buildRecommendations(dashboard, monthly, dogName) {
  const items = [];
  if (dashboard?.current_mood === "Sad") {
    items.push({
      title: "Increase Comfort Activities",
      text: `${dogName} shows a sad trend recently. Try shorter-but-more-frequent walks and extra calm playtime.`,
      color: "#dbeafe",
      tc: "#1e40af",
    });
  }
  if ((dashboard?.due_vaccine_count || 0) > 0) {
    items.push({
      title: "Schedule Vaccine Follow-up",
      text: `${dashboard.due_vaccine_count} vaccine item(s) are due soon. Booking in advance can avoid missed windows.`,
      color: "#fef3c7",
      tc: "#92400e",
    });
  }
  if ((dashboard?.active_meds_count || 0) > 0) {
    items.push({
      title: "Medication Routine",
      text: `${dogName} currently has active medication. Keep timing consistent and track appetite/energy daily.`,
      color: "#d1fae5",
      tc: "#065f46",
    });
  }
  if ((monthly?.total_analyses || 0) < 4) {
    items.push({
      title: "Capture More Check-ins",
      text: "Try at least 1-2 analyses per week to improve trend reliability in reports.",
      color: "#ede9fe",
      tc: "#5b21b6",
    });
  }
  if (!items.length) {
    items.push({
      title: "Keep Current Routine",
      text: `${dogName} has stable records this month. Continue current routine and monitor for any behavior changes.`,
      color: "#e2e8f0",
      tc: "#334155",
    });
  }
  return items.slice(0, 3);
}

function normalizeOwnerProfile(data) {
  if (!data || typeof data !== "object") {
    return { ...EMPTY_OWNER };
  }
  return {
    name: String(data.name || ""),
    phone: String(data.phone || ""),
    email: String(data.email || ""),
    address: String(data.address || ""),
    emergencyContact: String(data.emergencyContact || ""),
  };
}

function hasOwnerDetails(profile) {
  const p = profile || EMPTY_OWNER;
  return Boolean(
    p.name.trim()
    || p.phone.trim()
    || p.address.trim()
    || p.emergencyContact.trim(),
  );
}

function toOwnerPayload(form) {
  return {
    name: form.name.trim() || null,
    phone: form.phone.trim() || null,
    email: form.email.trim(),
    address: form.address.trim() || null,
    emergencyContact: form.emergencyContact.trim() || null,
  };
}

function toVetDog(dog) {
  if (!dog) return null;
  const weightRaw = Number(dog.weight_kg ?? dog.weight);
  const weightLabel = Number.isFinite(weightRaw) ? `${weightRaw.toFixed(1)} kg` : "Unknown";
  const sexRaw = String(dog.sex || "Unknown").toLowerCase();
  const sexMap = {
    male: "Male",
    female: "Female",
    unknown: "Unknown",
  };
  const sex = sexMap[sexRaw] || String(dog.sex || "Unknown");
  return {
    name: dog.name || "Dog",
    breed: dog.breed || "Mixed breed",
    dob: dog.birthday || "2022-01-01",
    sex,
    weight: weightLabel,
    microchip: dog.microchip || "-",
    color: dog.color || "-",
    distinguishing: dog.notes || "-",
  };
}

function toVetOwner(ownerProfile) {
  const owner = ownerProfile || EMPTY_OWNER;
  return {
    name: owner.name || "-",
    phone: owner.phone || "-",
    email: owner.email || "-",
    address: owner.address || "-",
    emergencyContact: owner.emergencyContact || "-",
  };
}

function formatDateLabel(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function toSeverityForReport(value) {
  const raw = String(value || "").toLowerCase();
  if (raw === "low") return "mild";
  if (raw === "medium") return "moderate";
  if (raw === "high") return "high";
  return "moderate";
}

function buildMoodDistributionForReport(monthly) {
  const dist = monthly?.mood_distribution || {};
  const total = Object.values(dist).reduce((sum, count) => sum + Number(count || 0), 0);
  return MOOD_ORDER
    .map((name) => {
      const value = Number(dist[name] || 0);
      if (value <= 0) return null;
      const pct = total > 0 ? Math.round((value / total) * 100) : 0;
      return {
        name,
        value,
        pct,
        color: MOOD_COLORS[name] || "#94a3b8",
      };
    })
    .filter(Boolean);
}

function buildConditionsForReport(healthRows) {
  const rows = Array.isArray(healthRows) ? healthRows : [];
  return rows.map((row) => {
    const status = String(row.status || "ongoing").toLowerCase();
    const normalizedStatus = status === "monitoring" ? "ongoing" : status;
    return {
      name: row.condition || "Condition",
      severity: toSeverityForReport(row.severity),
      status: normalizedStatus,
      diagnosed: formatDateLabel(row.diagnosed_date),
      resolved: normalizedStatus === "resolved" ? formatDateLabel(row.updated_at || row.created_at) : null,
      symptoms: row.notes || "No symptom notes recorded.",
      treatment: row.notes || "Follow current treatment plan.",
      vet: "Owner / PawMind record",
      followUp: normalizedStatus === "resolved" ? "Monitor recurrence" : "Follow-up with veterinarian",
    };
  });
}

function buildMedicationsForReport(medRows) {
  const rows = Array.isArray(medRows) ? medRows : [];
  return rows.map((row) => ({
    name: row.name || "Medication",
    type: row.type || "-",
    dose: row.dose || "-",
    freq: row.frequency || "-",
    start: formatDateLabel(row.start_date),
    end: row.end_date ? formatDateLabel(row.end_date) : null,
    status: row.status || "active",
    prescribedBy: row.prescribed_by || "-",
    reason: row.reason || "-",
  }));
}

function buildVaccinesForReport(vaccineRows) {
  const rows = Array.isArray(vaccineRows) ? vaccineRows : [];
  return rows.map((row) => ({
    name: row.name || "Vaccine",
    lastGiven: formatDateLabel(row.last_date),
    nextDue: formatDateLabel(row.next_due),
    status: row.status || "current",
  }));
}

function buildAiNotesForReport({ dashboard, monthly, conditions, medications, vaccines }) {
  const notes = [];
  const moodDist = monthly?.mood_distribution || {};
  const sadCount = Number(moodDist.Sad || 0);
  const happyCount = Number(moodDist.Happy || 0);

  if (sadCount >= 2) {
    notes.push({
      type: "concern",
      text: `Sad mood entries recorded ${sadCount} time(s) in selected period. Review stress triggers and routine changes.`,
    });
  }
  if (happyCount > sadCount) {
    notes.push({
      type: "positive",
      text: `Happy mood entries (${happyCount}) are higher than sad entries (${sadCount}) in this period.`,
    });
  }

  const alerts = Array.isArray(dashboard?.alerts) ? dashboard.alerts : [];
  alerts.forEach((a) => {
    const at = String(a.type || "").toLowerCase();
    notes.push({
      type: at === "vaccine" ? "flag" : at === "mood" ? "concern" : "flag",
      text: a.message || "System alert",
    });
  });

  if (Array.isArray(vaccines) && vaccines.some((v) => String(v.status || "").toLowerCase() === "overdue")) {
    notes.push({
      type: "flag",
      text: "At least one vaccine appears overdue in record. Verify due date and schedule booster.",
    });
  }

  if (Array.isArray(conditions) && conditions.some((c) => String(c.status || "").toLowerCase() !== "resolved")) {
    notes.push({
      type: "concern",
      text: "There are ongoing health conditions requiring monitoring in this report.",
    });
  }

  if (Array.isArray(medications) && medications.some((m) => String(m.status || "").toLowerCase() === "active")) {
    notes.push({
      type: "positive",
      text: "Active medication records are present. Keep adherence and update status after follow-up.",
    });
  }

  const seen = new Set();
  return notes.filter((n) => {
    const key = `${n.type}:${n.text}`.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildReportMeta(dogName) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const stamp = now.toLocaleString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const safeDog = String(dogName || "DOG").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "DOG";
  return {
    id: `PWM-${y}${m}${d}-${safeDog}`,
    generatedAt: stamp,
    period: `Generated on ${y}-${m}-${d}`,
    generatedBy: "PawMind Web App",
  };
}

function Reports({ dogs = [] }) {
  const [activeDogId, setActiveDogId] = useState(dogs[0]?.id || null);
  const [month, setMonth] = useState(getCurrentMonth());
  const [dashboard, setDashboard] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ownerProfile, setOwnerProfile] = useState({ ...EMPTY_OWNER });
  const [ownerForm, setOwnerForm] = useState({ ...EMPTY_OWNER });
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerSaving, setOwnerSaving] = useState(false);
  const [ownerError, setOwnerError] = useState("");
  const [ownerSuccess, setOwnerSuccess] = useState("");
  const [ownerEditMode, setOwnerEditMode] = useState(true);
  const [showExportReport, setShowExportReport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [reportBundle, setReportBundle] = useState(null);
  const ownerCardRef = useRef(null);

  useEffect(() => {
    if (!dogs.length) {
      setActiveDogId(null);
      return;
    }
    setActiveDogId((prev) => {
      if (prev && dogs.some((d) => String(d.id) === String(prev))) return prev;
      return dogs[0].id;
    });
  }, [dogs]);

  useEffect(() => {
    let mounted = true;

    async function loadOwnerProfile() {
      setOwnerLoading(true);
      setOwnerError("");
      try {
        const profile = await apiFetch("/auth/owner-profile");
        if (!mounted) return;
        const normalized = normalizeOwnerProfile(profile);
        setOwnerProfile(normalized);
        setOwnerForm(normalized);
        setOwnerEditMode(!hasOwnerDetails(normalized));
      } catch (err) {
        if (!mounted) return;
        setOwnerError(err.message || "Failed to load owner profile");
      } finally {
        if (mounted) setOwnerLoading(false);
      }
    }

    loadOwnerProfile();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activeDogId) return;
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [dashboardRes, monthlyRes] = await Promise.all([
          apiFetch(`/dogs/${activeDogId}/dashboard`),
          apiFetch(`/dogs/${activeDogId}/reports/monthly?month=${month}`),
        ]);
        if (!mounted) return;
        setDashboard(dashboardRes);
        setMonthly(monthlyRes);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Failed to load reports");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [activeDogId, month]);

  if (!dogs.length) {
    return (
      <div className="fade-in" style={{ padding: "28px 32px 48px", maxWidth: 1080, margin: "0 auto" }}>
        <div className="card">
          <h1 style={{ fontFamily: G.ff, fontSize: 26, fontWeight: 700, color: G.text, marginBottom: 8 }}>Reports & Insights</h1>
          <p style={{ fontFamily: G.fs, fontSize: 13, color: G.muted }}>Please add your first dog in My Dogs to generate reports.</p>
        </div>
      </div>
    );
  }

  const activeDog = dogs.find((d) => String(d.id) === String(activeDogId)) || dogs[0];
  const monthOptions = useMemo(() => getMonthOptions(6), []);
  const moodBars = buildMoodBars(monthly);
  const recs = buildRecommendations(dashboard, monthly, activeDog.name);
  const alerts = dashboard?.alerts || [];
  const ownerDirty = useMemo(
    () => JSON.stringify(ownerForm) !== JSON.stringify(ownerProfile),
    [ownerForm, ownerProfile],
  );
  const profileHasDetails = hasOwnerDetails(ownerProfile);

  const updateOwnerField = (field, value) => {
    setOwnerForm((prev) => ({ ...prev, [field]: value }));
    setOwnerError("");
    setOwnerSuccess("");
  };

  const resetOwnerForm = () => {
    setOwnerForm(ownerProfile);
    setOwnerError("");
    setOwnerSuccess("");
  };

  const saveOwnerProfile = async () => {
    const payload = toOwnerPayload(ownerForm);
    if (!payload.email) {
      setOwnerError("Email is required");
      return;
    }

    setOwnerSaving(true);
    setOwnerError("");
    setOwnerSuccess("");
    try {
      const method = profileHasDetails ? "PUT" : "POST";
      const res = await apiFetch("/auth/owner-profile", {
        method,
        body: JSON.stringify(payload),
      });
      const normalized = normalizeOwnerProfile(res);
      setOwnerProfile(normalized);
      setOwnerForm(normalized);
      setOwnerSuccess(method === "POST" ? "Owner profile created." : "Owner profile updated.");
      setOwnerEditMode(false);
    } catch (err) {
      setOwnerError(err.message || "Failed to save owner profile");
    } finally {
      setOwnerSaving(false);
    }
  };

  const deleteOwnerProfile = async () => {
    if (!window.confirm("Delete owner profile details from this account?")) return;

    setOwnerSaving(true);
    setOwnerError("");
    setOwnerSuccess("");
    try {
      const res = await apiFetch("/auth/owner-profile", { method: "DELETE" });
      const normalized = normalizeOwnerProfile(res);
      setOwnerProfile(normalized);
      setOwnerForm(normalized);
      setOwnerSuccess("Owner profile deleted.");
      setOwnerEditMode(true);
    } catch (err) {
      setOwnerError(err.message || "Failed to delete owner profile");
    } finally {
      setOwnerSaving(false);
    }
  };

  const openOwnerEditor = () => {
    setOwnerEditMode(true);
    setOwnerError("");
    setOwnerSuccess("");
    ownerCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const prepareExportReport = async () => {
    if (!activeDogId) return;
    setExporting(true);
    setExportError("");
    try {
      const [healthRows, medRows, vaccineRows] = await Promise.all([
        apiFetch(`/dogs/${activeDogId}/health`),
        apiFetch(`/dogs/${activeDogId}/medications`),
        apiFetch(`/dogs/${activeDogId}/vaccines`),
      ]);

      const conditionsData = buildConditionsForReport(healthRows);
      const medicationsData = buildMedicationsForReport(medRows);
      const vaccinesData = buildVaccinesForReport(vaccineRows);
      const moodDistData = buildMoodDistributionForReport(monthly);
      const reportMeta = {
        ...buildReportMeta(activeDog?.name),
        period: `Selected month: ${month}`,
      };
      const aiNotesData = buildAiNotesForReport({
        dashboard,
        monthly,
        conditions: conditionsData,
        medications: medicationsData,
        vaccines: vaccinesData,
      });

      setReportBundle({
        dog: toVetDog(activeDog),
        owner: toVetOwner(ownerForm),
        reportMeta,
        moodDist: moodDistData,
        medications: medicationsData,
        conditions: conditionsData,
        vaccines: vaccinesData,
        aiNotes: aiNotesData,
      });
      setShowExportReport(true);
    } catch (err) {
      setExportError(err.message || "Failed to prepare export report");
    } finally {
      setExporting(false);
    }
  };

  if (showExportReport && reportBundle) {
    return (
      <VetReport
        dogOverride={reportBundle.dog}
        ownerOverride={reportBundle.owner}
        reportMetaOverride={reportBundle.reportMeta}
        moodDistOverride={reportBundle.moodDist}
        medicationsOverride={reportBundle.medications}
        conditionsOverride={reportBundle.conditions}
        vaccinesOverride={reportBundle.vaccines}
        aiNotesOverride={reportBundle.aiNotes}
        onBack={() => setShowExportReport(false)}
      />
    );
  }

  return (
    <div className="fade-in" style={{ padding: "28px 32px 48px", maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: G.ff, fontSize: 26, fontWeight: 700, color: G.text }}>Reports & Insights</h1>
          <p style={{ fontFamily: G.fs, fontSize: 13, color: G.muted, marginTop: 4 }}>Monthly summaries from real user data</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={openOwnerEditor}>
            Profile
          </button>
          <button className="btn btn-primary" onClick={prepareExportReport} disabled={exporting || loading}>
            {exporting ? "Preparing..." : "Export"}
          </button>
          <select className="journal-input" style={{ fontSize: 13 }} value={String(activeDogId)} onChange={(e) => setActiveDogId(e.target.value)}>
            {dogs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.emoji} {d.name}
              </option>
            ))}
          </select>
          <select className="journal-input" style={{ fontSize: 13 }} value={month} onChange={(e) => setMonth(e.target.value)}>
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {exportError && (
        <div style={{ marginBottom: 14, background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 10px", fontFamily: G.fs, fontSize: 12, color: "#991b1b" }}>
          {exportError}
        </div>
      )}

      <div ref={ownerCardRef} className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div>
            <h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 700, color: G.text }}>Owner Profile for Report</h3>
            <p style={{ fontFamily: G.fs, fontSize: 12, color: G.muted, marginTop: 3 }}>
              Data fields match OWNER in vet report: name, phone, email, address, emergency contact.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontFamily: G.fs, fontSize: 11, color: G.muted }}>
              {ownerLoading ? "Loading owner profile..." : profileHasDetails ? "Profile ready" : "No profile details yet"}
            </div>
            {!ownerEditMode && (
              <button className="btn btn-ghost" onClick={openOwnerEditor} disabled={ownerLoading || ownerSaving}>
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {ownerEditMode ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input
              className="journal-input"
              placeholder="Full Name"
              value={ownerForm.name}
              onChange={(e) => updateOwnerField("name", e.target.value)}
              disabled={ownerLoading || ownerSaving}
            />
            <input
              className="journal-input"
              placeholder="Phone"
              value={ownerForm.phone}
              onChange={(e) => updateOwnerField("phone", e.target.value)}
              disabled={ownerLoading || ownerSaving}
            />
            <input
              className="journal-input"
              placeholder="Email"
              type="email"
              value={ownerForm.email}
              onChange={(e) => updateOwnerField("email", e.target.value)}
              disabled={ownerLoading || ownerSaving}
            />
            <input
              className="journal-input"
              placeholder="Emergency Contact"
              value={ownerForm.emergencyContact}
              onChange={(e) => updateOwnerField("emergencyContact", e.target.value)}
              disabled={ownerLoading || ownerSaving}
            />
            <input
              className="journal-input"
              placeholder="Address"
              value={ownerForm.address}
              onChange={(e) => updateOwnerField("address", e.target.value)}
              disabled={ownerLoading || ownerSaving}
              style={{ gridColumn: "1 / -1" }}
            />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              ["Full Name", ownerProfile.name || "-"],
              ["Phone", ownerProfile.phone || "-"],
              ["Email", ownerProfile.email || "-"],
              ["Emergency Contact", ownerProfile.emergencyContact || "-"],
              ["Address", ownerProfile.address || "-"],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  gridColumn: label === "Address" ? "1 / -1" : "auto",
                  border: `1px solid ${G.border}`,
                  borderRadius: 10,
                  background: "#fffdf9",
                  padding: "10px 12px",
                }}
              >
                <div style={{ fontFamily: G.fs, fontSize: 11, color: G.muted, marginBottom: 3 }}>{label}</div>
                <div style={{ fontFamily: G.fs, fontSize: 13, color: G.text }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {ownerError && (
          <div style={{ marginTop: 10, background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 10px", fontFamily: G.fs, fontSize: 12, color: "#991b1b" }}>
            {ownerError}
          </div>
        )}
        {ownerSuccess && (
          <div style={{ marginTop: 10, background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, padding: "8px 10px", fontFamily: G.fs, fontSize: 12, color: "#065f46" }}>
            {ownerSuccess}
          </div>
        )}

        {ownerEditMode && (
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              className="btn btn-primary"
              onClick={saveOwnerProfile}
              disabled={ownerLoading || ownerSaving || !ownerDirty}
            >
              {ownerSaving ? "Saving..." : profileHasDetails ? "Update Profile" : "Create Profile"}
            </button>
            <button
              className="btn btn-ghost"
              onClick={resetOwnerForm}
              disabled={ownerSaving || ownerLoading || !ownerDirty}
            >
              Reset
            </button>
            <button
              className="btn btn-ghost"
              onClick={deleteOwnerProfile}
              disabled={ownerSaving || ownerLoading || (!profileHasDetails && !ownerDirty)}
              style={{ color: "#b91c1c", borderColor: "#fecaca" }}
            >
              Delete Profile
            </button>
          </div>
        )}
      </div>

      {loading && <div className="card">Loading report data...</div>}
      {!loading && error && <div className="card" style={{ color: "#991b1b" }}>{error}</div>}

      {!loading && !error && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
            {[
              { label: "Happy days", val: String(monthly?.happy_days || 0), icon: "Happy", color: "#f59e0b" },
              { label: "Analyses done", val: String(monthly?.total_analyses || 0), icon: "Analyze", color: G.brown },
              { label: "Active meds", val: String(dashboard?.active_meds_count || 0), icon: "Meds", color: "#34d399" },
              { label: "Due vaccines", val: String(dashboard?.due_vaccine_count || 0), icon: "Vaccine", color: "#f87171" },
            ].map((s) => (
              <div key={s.label} className="card-sm" style={{ textAlign: "center" }}>
                <div style={{ fontFamily: G.fs, fontSize: 11, color: G.muted, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontFamily: G.ff, fontSize: 28, fontWeight: 700, color: s.color }}>{s.val}</div>
                <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted, fontWeight: 500 }}>{s.label}</div>
                <div style={{ fontFamily: G.fs, fontSize: 10, color: G.muted }}>selected month</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
            <div className="card">
              <h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 600, color: G.text, marginBottom: 6 }}>Mood Distribution</h3>
              <p style={{ fontFamily: G.fs, fontSize: 12, color: G.muted, marginBottom: 18 }}>
                {activeDog.name} · {month}
              </p>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={moodBars} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
                  <XAxis dataKey="mood" tick={{ fontSize: 11, fill: G.muted, fontFamily: G.fs }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: G.muted, fontFamily: G.fs }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontFamily: G.fs, fontSize: 12, borderRadius: 10, border: `1px solid ${G.border}` }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {moodBars.map((entry) => (
                      <Cell key={entry.mood} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="card">
                <h3 style={{ fontFamily: G.ff, fontSize: 15, fontWeight: 600, color: G.text, marginBottom: 12 }}>Alerts</h3>
                {alerts.length === 0 && (
                  <p style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>No active alerts for this dog.</p>
                )}
                {alerts.map((a, idx) => (
                  <div key={`${a.type}-${idx}`} style={{ marginBottom: 10 }}>
                    <div style={{ fontFamily: G.fs, fontSize: 11, color: G.muted, textTransform: "uppercase" }}>{a.type}</div>
                    <div style={{ fontFamily: G.fs, fontSize: 12, color: G.text }}>{a.message}</div>
                  </div>
                ))}
              </div>

              <div className="card">
                <div style={{ fontFamily: G.ff, fontSize: 15, fontWeight: 600, color: G.text, marginBottom: 8 }}>Current Mood Snapshot</div>
                <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>
                  Mood: {dashboard?.current_mood || "-"}
                </div>
                <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>
                  Confidence: {dashboard?.current_confidence == null ? "-" : `${Number(dashboard.current_confidence).toFixed(1)}%`}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 600, color: G.text, marginBottom: 18 }}>Recommendations for {activeDog.name}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              {recs.map((r) => (
                <div key={r.title} style={{ background: r.color, borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ fontFamily: G.ff, fontSize: 14, fontWeight: 600, color: r.tc, marginBottom: 4 }}>{r.title}</div>
                  <p style={{ fontFamily: G.fs, fontSize: 12, color: r.tc, opacity: 0.85, lineHeight: 1.6 }}>{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Reports;
