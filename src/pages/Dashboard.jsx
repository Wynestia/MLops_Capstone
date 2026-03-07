import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from "recharts";
import MoodChart from "../components/MoodChart";
import { MOOD_CONFIG } from "../data/mockData";
import { G } from "../styles/theme";

const DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMoodLabel(dog) {
  return MOOD_CONFIG[dog?.mood] ? dog.mood : "Relaxed";
}

function buildWeekDataByMood(moodLabel) {
  const moodValue = MOOD_CONFIG[moodLabel]?.val ?? 3;
  return DAY_KEYS.map((day) => ({ day, mood: moodValue, label: moodLabel }));
}

function Dashboard({ dogs = [], setPage, setSelectedDog }) {
  const totalDogs = dogs.length;
  const totalAnalyses = dogs.reduce((sum, dog) => sum + (Number(dog.analyses) || 0), 0);
  const totalWeight = dogs.reduce((sum, dog) => sum + (Number(dog.weight_kg ?? dog.weight) || 0), 0);
  const avgWeight = totalDogs ? totalWeight / totalDogs : 0;
  const chippedDogs = dogs.filter((dog) => dog.microchip).length;

  const moodCount = dogs.reduce((acc, dog) => {
    const label = getMoodLabel(dog);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  const dominantMood = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "Relaxed";
  const weeklyOverviewData = buildWeekDataByMood(dominantMood);

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
          const moodLabel = getMoodLabel(dog);
          const moodCfg = MOOD_CONFIG[moodLabel];
          const weekData = buildWeekDataByMood(moodLabel);
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
                return <div style={{ background: "white", border: `2px solid ${c?.color}`, borderRadius: 10, padding: "6px 12px", fontSize: 12, fontFamily: G.fs }}>{c?.emoji} {d.label}</div>;
              }} />
              <Bar dataKey="mood" radius={[6, 6, 0, 0]}>
                {weeklyOverviewData.map((d, i) => <Cell key={i} fill={MOOD_CONFIG[d.label]?.color || "#ccc"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { icon: "🐕", label: "Dogs", val: String(totalDogs), sub: "in your account", color: "#5c3d1e" },
            { icon: "⚖️", label: "Avg weight", val: totalDogs ? `${avgWeight.toFixed(1)} kg` : "-", sub: "across all dogs", color: "#f59e0b" },
            { icon: "🪪", label: "Microchipped", val: String(chippedDogs), sub: "dogs with chip number", color: "#34d399" },
            { icon: "📷", label: "Total analyses", val: String(totalAnalyses), sub: "saved analyses count", color: "#1e40af" },
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
