import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from "recharts";
import MoodChart from "../components/MoodChart";
import { MOOD_CONFIG } from "../data/mockData";
import { G } from "../styles/theme";
import { apiFetch } from "../api";

const DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMoodLabel(dog) {
  return MOOD_CONFIG[dog?.mood] ? dog.mood : "Relaxed";
}

function toMoodLabel(raw, fallback = "Relaxed") {
  return MOOD_CONFIG[raw] ? raw : fallback;
}

function toDateKeyLocal(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildWeekMoodData(logs = [], analyses = []) {
  const byDate = new Map();

  const upsert = (dateTime, rawMood) => {
    const key = toDateKeyLocal(dateTime);
    if (!key) return;
    const label = toMoodLabel(rawMood, "");
    if (!label) return;
    const at = new Date(dateTime).getTime();
    const prev = byDate.get(key);
    if (!prev || at > prev.at) {
      byDate.set(key, { label, at });
    }
  };

  logs.forEach((row) => upsert(row.logged_at, row.mood));
  analyses.forEach((row) => {
    const key = toDateKeyLocal(row.analyzed_at);
    if (!key || byDate.has(key)) return;
    upsert(row.analyzed_at, row.mood);
  });

  const rows = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = toDateKeyLocal(d);
    const entry = byDate.get(key);
    const label = entry?.label || "No data";
    rows.push({
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      mood: MOOD_CONFIG[label]?.val ?? 0,
      label,
    });
  }
  return rows;
}

function buildAllDogsWeekData(weekDataList) {
  const countsByDay = DAY_KEYS.map(() => ({ Happy: 0, Relaxed: 0, Sad: 0, Angry: 0 }));

  weekDataList.forEach((weekData) => {
    weekData.forEach((row, index) => {
      if (!MOOD_CONFIG[row.label]) return;
      countsByDay[index][row.label] += 1;
    });
  });

  return DAY_KEYS.map((day, index) => {
    const counts = countsByDay[index];
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const [topLabel, topCount] = sorted[0] || [];
    if (!topLabel || !topCount) {
      return { day, mood: 0, label: "No data" };
    }
    return {
      day,
      mood: MOOD_CONFIG[topLabel]?.val ?? 0,
      label: topLabel,
    };
  });
}

function inferCurrentMoodFromWeek(weekData, fallbackMood) {
  for (let i = weekData.length - 1; i >= 0; i -= 1) {
    const label = weekData[i]?.label;
    if (MOOD_CONFIG[label]) return label;
  }
  return fallbackMood;
}

function parseDogWeight(dog) {
  const parsed = Number(dog?.weight_kg ?? dog?.weight);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getLatestWeightKg(weightLogs, dog) {
  if (Array.isArray(weightLogs) && weightLogs.length > 0) {
    const sorted = [...weightLogs].sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
    const latest = Number(sorted[0]?.weight_kg);
    if (Number.isFinite(latest) && latest > 0) return latest;
  }
  return parseDogWeight(dog);
}

function Dashboard({ dogs = [], setPage, setSelectedDog }) {
  const [dogDetails, setDogDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardDetails() {
      if (!dogs.length) {
        setDogDetails({});
        return;
      }

      setLoadingDetails(true);
      try {
        const detailList = await Promise.all(
          dogs.map(async (dog) => {
            const [dashboardRes, analysesRes, weightsRes] = await Promise.all([
              apiFetch(`/dogs/${dog.id}/dashboard`).catch(() => null),
              apiFetch(`/dogs/${dog.id}/analyses?limit=30`).catch(() => []),
              apiFetch(`/dogs/${dog.id}/weights`).catch(() => []),
            ]);
            return { dog, dashboardRes, analysesRes, weightsRes };
          }),
        );

        if (cancelled) return;

        const next = {};
        detailList.forEach(({ dog, dashboardRes, analysesRes, weightsRes }) => {
          const weekData = buildWeekMoodData(dashboardRes?.week_mood || [], analysesRes || []);
          const fallbackMood = getMoodLabel(dog);
          next[dog.id] = {
            weekData,
            currentMood: toMoodLabel(dashboardRes?.current_mood, inferCurrentMoodFromWeek(weekData, fallbackMood)),
            latestWeightKg: getLatestWeightKg(weightsRes || [], dog),
            totalAnalyses: Number(dashboardRes?.total_analyses) || 0,
          };
        });

        setDogDetails(next);
      } finally {
        if (!cancelled) setLoadingDetails(false);
      }
    }

    loadDashboardDetails();
    return () => {
      cancelled = true;
    };
  }, [dogs]);

  const totalDogs = dogs.length;
  const chippedDogs = dogs.filter((dog) => dog.microchip).length;

  const totalAnalyses = useMemo(
    () => dogs.reduce((sum, dog) => sum + (Number(dogDetails[dog.id]?.totalAnalyses) || 0), 0),
    [dogs, dogDetails],
  );

  const avgLatestWeight = useMemo(() => {
    const values = dogs
      .map((dog) => dogDetails[dog.id]?.latestWeightKg)
      .filter((n) => Number.isFinite(n));
    if (!values.length) return null;
    const total = values.reduce((sum, n) => sum + n, 0);
    return total / values.length;
  }, [dogs, dogDetails]);

  const weeklyOverviewData = useMemo(() => {
    const weekList = dogs
      .map((dog) => dogDetails[dog.id]?.weekData)
      .filter((rows) => Array.isArray(rows) && rows.length === 7);
    return buildAllDogsWeekData(weekList);
  }, [dogs, dogDetails]);

  return (
    <div className="fade-in" style={{ padding: "28px 32px 48px", maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: G.ff, fontSize: 28, fontWeight: 700, color: G.text }}>Good morning 👋</h1>
          <p style={{ fontFamily: G.fs, fontSize: 14, color: G.muted, marginTop: 4 }}>Here&apos;s how your dogs are doing today</p>
        </div>
        <button className="btn btn-primary" onClick={() => setPage("dogs")}>+ Add Dog</button>
      </div>

      {totalDogs === 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: G.fs, fontSize: 14, color: G.muted, marginBottom: 10 }}>
            You have no dogs yet. Add your first dog to start tracking and reporting.
          </p>
          <button className="btn btn-primary" onClick={() => setPage("dogs")}>Go to My Dogs</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 18, marginBottom: 32 }}>
        {dogs.map((dog) => {
          const detail = dogDetails[dog.id];
          const moodLabel = detail?.currentMood || getMoodLabel(dog);
          const moodCfg = MOOD_CONFIG[moodLabel] || MOOD_CONFIG.Relaxed;
          const weekData = detail?.weekData || buildWeekMoodData([], []);
          const latestWeightText = Number.isFinite(detail?.latestWeightKg) ? `${detail.latestWeightKg.toFixed(1)} kg` : "-";
          return (
            <div key={dog.id} className="dog-card" onClick={() => { setSelectedDog(dog); setPage("dogs"); }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div style={{ width: 54, height: 54, borderRadius: "50%", background: `linear-gradient(135deg,${moodCfg.color}40,${moodCfg.color}20)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, border: `2px solid ${moodCfg.color}50` }}>
                  {dog.emoji}
                </div>
                <div>
                  <div style={{ fontFamily: G.ff, fontSize: 17, fontWeight: 700, color: G.text }}>{dog.name}</div>
                  <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>
                    {dog.breed || "Mixed Breed"} · {dog.age == null ? "-" : `${dog.age}y`}
                  </div>
                  <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>Latest weight: {latestWeightText}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div className="pulse" style={{ background: moodCfg.color, boxShadow: `0 0 0 0 ${moodCfg.color}66` }} />
                <span style={{ background: moodCfg.bg, color: moodCfg.color, fontFamily: G.fs, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
                  {moodCfg.emoji} {moodLabel}
                </span>
              </div>
              <MoodChart data={weekData} />
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", fontSize: 12, padding: "8px" }} onClick={(e) => { e.stopPropagation(); setSelectedDog(dog); setPage("analyze"); }}>
                  📷 Analyze
                </button>
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 12, padding: "8px" }} onClick={(e) => { e.stopPropagation(); setSelectedDog(dog); setPage("analyze"); }}>
                  💬 Chat
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div className="card">
          <h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 600, color: G.text, marginBottom: 18 }}>Weekly Overview — All Dogs</h3>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={weeklyOverviewData} margin={{ left: -28, right: 4, top: 4, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: G.muted, fontFamily: G.fs }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} hide />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                const c = MOOD_CONFIG[d.label];
                const borderColor = c?.color || "#d1d5db";
                return <div style={{ background: "white", border: `2px solid ${borderColor}`, borderRadius: 10, padding: "6px 12px", fontSize: 12, fontFamily: G.fs }}>{c ? `${c.emoji} ${d.label}` : "No mood data"}</div>;
              }} />
              <Bar dataKey="mood" radius={[6, 6, 0, 0]}>
                {weeklyOverviewData.map((d, i) => <Cell key={i} fill={MOOD_CONFIG[d.label]?.color || "#d1d5db"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { icon: "🐕", label: "Dogs", val: String(totalDogs), sub: "in your account", color: "#5c3d1e" },
            { icon: "⚖️", label: "Avg latest weight", val: avgLatestWeight == null ? "-" : `${avgLatestWeight.toFixed(1)} kg`, sub: "from latest logs/profile", color: "#f59e0b" },
            { icon: "🪪", label: "Microchipped", val: String(chippedDogs), sub: "dogs with chip number", color: "#34d399" },
            { icon: "📷", label: "Total analyses", val: String(totalAnalyses), sub: loadingDetails ? "loading..." : "saved analyses count", color: "#1e40af" },
          ].map((s) => (
            <div key={s.label} className="card-sm" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: G.brownPale, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontFamily: G.ff, fontSize: 20, fontWeight: 700, color: s.color }}>{s.val}</div>
                <div style={{ fontFamily: G.fs, fontSize: 12, color: G.text, fontWeight: 500 }}>{s.label}</div>
                <div style={{ fontFamily: G.fs, fontSize: 11, color: G.muted }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
