import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { G } from "../styles/theme";
import { apiFetch } from "../api";

const MOOD_COLORS = {
  Happy: "#f59e0b",
  Relaxed: "#34d399",
  Sad: "#60a5fa",
  Angry: "#f87171",
};

const MOOD_ORDER = ["Happy", "Relaxed", "Sad", "Angry"];

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

function Reports({ dogs = [] }) {
  const [activeDogId, setActiveDogId] = useState(dogs[0]?.id || null);
  const [month, setMonth] = useState(getCurrentMonth());
  const [dashboard, setDashboard] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div className="fade-in" style={{ padding: "28px 32px 48px", maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: G.ff, fontSize: 26, fontWeight: 700, color: G.text }}>Reports & Insights</h1>
          <p style={{ fontFamily: G.fs, fontSize: 13, color: G.muted, marginTop: 4 }}>Monthly summaries from real user data</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
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
