import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import MoodChart from "../components/MoodChart";
import { MOOD_CONFIG } from "../data/mockData";
import { G } from "../styles/theme";
import { apiFetch } from "../api";

const TABS = [
  ["overview", "Overview"],
  ["history", "History"],
  ["journal", "Journal"],
  ["medicine", "Medicine"],
  ["health", "Health"],
  ["vaccine", "Vaccine"],
];

function fmtDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function toMoodLabel(raw, fallback = "Relaxed") {
  return MOOD_CONFIG[raw] ? raw : fallback;
}

function calculateAge(birthday) {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

function buildWeekMoodData(logs, fallbackMood = "Relaxed") {
  const byDate = new Map();
  logs.forEach((row) => {
    const key = (row.logged_at || "").slice(0, 10);
    if (key && !byDate.has(key)) byDate.set(key, row.mood);
  });
  const rows = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = toMoodLabel(byDate.get(key), fallbackMood);
    rows.push({
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      mood: MOOD_CONFIG[label]?.val ?? 3,
      label,
    });
  }
  return rows;
}

function buildMoodDist(logs, fallbackMood = "Relaxed") {
  const counts = { Happy: 0, Relaxed: 0, Sad: 0, Angry: 0 };
  logs.forEach((row) => {
    const label = toMoodLabel(row.mood, fallbackMood);
    counts[label] += 1;
  });
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  return Object.entries(counts).map(([label, value]) => ({
    label,
    value,
    percent: total ? Math.round((value / total) * 100) : 0,
    cfg: MOOD_CONFIG[label],
  }));
}

function buildActivityData(activities) {
  const rows = [...activities]
    .sort((a, b) => new Date(a.logged_date) - new Date(b.logged_date))
    .slice(-7)
    .map((a) => ({
      day: new Date(a.logged_date).toLocaleDateString("en-US", { weekday: "short" }),
      walk: Number(a.walk_min || 0),
      play: Number(a.play_min || 0),
      train: Number(a.train_min || 0),
    }));
  if (rows.length) return rows;
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({ day, walk: 0, play: 0, train: 0 }));
}

function MyDogs({ dogs = [], selectedDog, setSelectedDog, setPage, onDogAdded }) {
  const [showForm, setShowForm] = useState(false);
  const dog = selectedDog || dogs[0] || null;

  return (
    <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "300px 1fr", minHeight: "calc(100vh - 60px)" }}>
      <div style={{ borderRight: `1px solid ${G.border}`, padding: "24px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontFamily: G.ff, fontSize: 15, fontWeight: 700, color: G.text }}>My Dogs</span>
          <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setShowForm((v) => !v)}>+ Add</button>
        </div>

        {dogs.map((d) => (
          <div key={d.id} className={`dog-card ${selectedDog?.id === d.id ? "selected" : ""}`} style={{ padding: "14px 16px" }} onClick={() => { setSelectedDog(d); setShowForm(false); }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: "2px solid #fde68a" }}>{d.emoji || "??"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: G.ff, fontSize: 15, fontWeight: 600, color: G.text }}>{d.name}</div>
                <div style={{ fontFamily: G.fs, fontSize: 11, color: G.muted }}>{d.breed || "Mixed Breed"}</div>
              </div>
            </div>
          </div>
        ))}

        {!dogs.length && !showForm && (
          <div style={{ textAlign: "center", marginTop: 20, fontFamily: G.fs, color: G.muted }}>
            <p>No dogs found.</p>
            <button className="btn btn-ghost" onClick={() => setShowForm(true)}>Add your first dog</button>
          </div>
        )}
      </div>

      <div style={{ padding: "28px 32px", overflowY: "auto" }}>
        {showForm || !dog ? <AddDogForm onClose={() => setShowForm(false)} onDogAdded={onDogAdded} /> : <DogDetailView dog={dog} setPage={setPage} />}
      </div>
    </div>
  );
}

function AddDogForm({ onClose, onDogAdded }) {
  const [form, setForm] = useState({ name: "", breed: "", birthday: "", weight_kg: "", microchip: "", sex: "Male", energy_level: "Medium", notes: "" });
  const [loading, setLoading] = useState(false);

  const saveDog = async () => {
    const weight = Number(form.weight_kg);
    if (!form.name.trim() || !Number.isFinite(weight) || weight <= 0 || weight > 999.99) {
      alert("Please fill a valid name and weight (0.01 - 999.99 kg)");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/dogs", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          breed: form.breed.trim() || null,
          birthday: form.birthday || null,
          weight_kg: weight,
          microchip: form.microchip.trim() || null,
          sex: form.sex || null,
          energy_level: form.energy_level || null,
          notes: form.notes.trim() || null,
        }),
      });
      await onDogAdded?.();
      onClose();
    } catch (err) {
      alert(`Failed to save dog: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h2 style={{ fontFamily: G.ff, fontSize: 22, fontWeight: 700, color: G.text }}>Add New Dog</h2>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Field label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
        <Field label="Breed" value={form.breed} onChange={(v) => setForm((f) => ({ ...f, breed: v }))} />
        <Field label="Birthdate" type="date" value={form.birthday} onChange={(v) => setForm((f) => ({ ...f, birthday: v }))} />
        <Field label="Weight (kg)" type="number" value={form.weight_kg} onChange={(v) => setForm((f) => ({ ...f, weight_kg: v }))} min="0.01" max="999.99" step="0.1" />
        <Field label="Microchip" value={form.microchip} onChange={(v) => setForm((f) => ({ ...f, microchip: v }))} />
        <div>
          <Label>Sex</Label>
          <select className="journal-input" style={{ width: "100%" }} value={form.sex} onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value }))}><option>Male</option><option>Female</option><option>Unknown</option></select>
        </div>
        <div>
          <Label>Energy Level</Label>
          <select className="journal-input" style={{ width: "100%" }} value={form.energy_level} onChange={(e) => setForm((f) => ({ ...f, energy_level: e.target.value }))}><option>Low</option><option>Medium</option><option>High</option></select>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Label>Notes</Label>
          <textarea className="journal-input" rows={3} style={{ width: "100%", resize: "vertical" }} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 13 }} onClick={saveDog} disabled={loading}>{loading ? "Saving..." : "Save Dog Profile"}</button>
        </div>
      </div>
    </div>
  );
}

function DogDetailView({ dog, setPage }) {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [moods, setMoods] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [weights, setWeights] = useState([]);
  const [journals, setJournals] = useState([]);
  const [medications, setMedications] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [moodsRes, analysesRes, weightsRes, journalsRes, medsRes, healthRes, vaccinesRes, activitiesRes] = await Promise.all([
          apiFetch(`/dogs/${dog.id}/moods?days=30`),
          apiFetch(`/dogs/${dog.id}/analyses?limit=30`),
          apiFetch(`/dogs/${dog.id}/weights`),
          apiFetch(`/dogs/${dog.id}/journal`),
          apiFetch(`/dogs/${dog.id}/medications`),
          apiFetch(`/dogs/${dog.id}/health`),
          apiFetch(`/dogs/${dog.id}/vaccines`),
          apiFetch(`/dogs/${dog.id}/activities?limit=14`),
        ]);
        setMoods(moodsRes || []);
        setAnalyses(analysesRes || []);
        setWeights(weightsRes || []);
        setJournals(journalsRes || []);
        setMedications(medsRes || []);
        setHealthRecords(healthRes || []);
        setVaccines(vaccinesRes || []);
        setActivities(activitiesRes || []);
      } catch (err) {
        setError(err.message || "Failed to load dog data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dog.id]);

  const moodLabel = toMoodLabel(dog?.mood || dog?.status, "Relaxed");
  const cfg = MOOD_CONFIG[moodLabel];
  const age = dog?.age ?? calculateAge(dog?.birthday);
  const weekMoodData = useMemo(() => buildWeekMoodData(moods, moodLabel), [moods, moodLabel]);
  const moodDist = useMemo(() => buildMoodDist(moods, moodLabel), [moods, moodLabel]);
  const activityData = useMemo(() => buildActivityData(activities), [activities]);

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg,${cfg.color},${cfg.color}80)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, flexShrink: 0 }}>{dog.emoji || "??"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontFamily: G.ff, fontSize: 26, fontWeight: 700, color: G.text }}>{dog.name}</h1>
            <span style={{ background: cfg.bg, color: cfg.color, fontFamily: G.fs, fontSize: 12, fontWeight: 600, padding: "3px 12px", borderRadius: 20 }}>{cfg.emoji} {moodLabel}</span>
          </div>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            {[ ["Breed", dog.breed || "-"], ["Age", age == null ? "-" : `${age} yrs`], ["Birthday", fmtDate(dog.birthday)], ["Weight", `${Number(dog.weight_kg ?? 0).toFixed(1)} kg`], ["Sex", dog.sex || "-"], ["Microchip", dog.microchip || "-"] ].map(([l, v]) => (
              <div key={l} style={{ fontFamily: G.fs, fontSize: 12 }}><span style={{ color: G.muted }}>{l} </span><span style={{ color: G.text, fontWeight: 500 }}>{v}</span></div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={() => setPage("analyze")}>Analyze</button>
          <button className="btn btn-secondary" onClick={() => setPage("analyze")}>Chat</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, background: G.brownPale, padding: 5, borderRadius: 24, marginBottom: 24, width: "fit-content", flexWrap: "wrap" }}>
        {TABS.map(([k, label]) => <button key={k} onClick={() => setTab(k)} style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 500, padding: "7px 18px", borderRadius: 20, border: "none", cursor: "pointer", background: tab === k ? G.brown : "transparent", color: tab === k ? "white" : G.muted }}>{label}</button>)}
      </div>

      {loading && <div className="card">Loading dog data...</div>}
      {!loading && error && <div className="card" style={{ color: "#991b1b" }}>{error}</div>}

      {!loading && !error && tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="card"><h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Mood Trend (7 days)</h3><MoodChart data={weekMoodData} /></div>
          <div className="card">
            <h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Activity</h3>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={activityData} margin={{ left: -10, right: 2, top: 6, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={G.border} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: G.muted, fontFamily: G.fs }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: G.muted, fontFamily: G.fs }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="walk" fill="#8b5e3c" radius={[6, 6, 0, 0]} />
                <Bar dataKey="play" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                <Bar dataKey="train" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Mood Distribution</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {moodDist.map((d) => <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 90, fontFamily: G.fs, fontSize: 12 }}>{d.cfg.emoji} {d.label}</span><div style={{ flex: 1, height: 8, borderRadius: 99, background: G.brownPale, overflow: "hidden" }}><div style={{ height: "100%", width: `${d.percent}%`, background: d.cfg.color }} /></div><span style={{ width: 35, textAlign: "right", fontFamily: G.fs, fontSize: 11, color: G.muted }}>{d.value}</span></div>)}
            </div>
          </div>
          <div className="card"><h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Summary</h3><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{[["Analyses", analyses.length],["Weights", weights.length],["Journal", journals.length],["Meds", medications.length],["Health", healthRecords.length],["Vaccines", vaccines.length]].map(([k,v]) => <Stat key={k} label={k} value={String(v)} />)}</div></div>
        </div>
      )}

      {!loading && !error && tab === "history" && (
        <div className="card">
          <h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Analysis History</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {analyses.length === 0 && <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>No analysis history yet.</div>}
            {analyses.map((a) => {
              const label = toMoodLabel(a.mood, "Relaxed");
              const c = MOOD_CONFIG[label];
              return <div key={a.id} className="card-sm" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><div><div style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 600 }}>{c.emoji} {label} � {Number(a.confidence || 0).toFixed(1)}%</div><div style={{ fontFamily: G.fs, fontSize: 11, color: G.muted }}>{fmtDateTime(a.analyzed_at)}</div></div></div>;
            })}
          </div>
        </div>
      )}

      {!loading && !error && tab === "journal" && <SimpleList title="Journal Entries" emptyText="No journal entries yet." rows={journals.map((j) => ({ id: j.id, title: `${fmtDate(j.entry_date)} ${j.mood ? `� ${j.mood}` : ""}`, desc: j.content || "-" }))} />}
      {!loading && !error && tab === "medicine" && <SimpleList title="Medications" emptyText="No medications yet." rows={medications.map((m) => ({ id: m.id, title: `${m.name} � ${m.status}`, desc: `${m.dose || "-"} � ${m.frequency || "-"}` }))} />}
      {!loading && !error && tab === "health" && <SimpleList title="Health Records" emptyText="No health records yet." rows={healthRecords.map((r) => ({ id: r.id, title: `${r.condition} � ${r.status}`, desc: `${r.severity} � ${fmtDate(r.diagnosed_date)}` }))} />}
      {!loading && !error && tab === "vaccine" && <SimpleList title="Vaccine Records" emptyText="No vaccines yet." rows={vaccines.map((v) => ({ id: v.id, title: `${v.name} � ${v.status}`, desc: `Last: ${fmtDate(v.last_date)} � Next: ${fmtDate(v.next_due)}` }))} />}
    </div>
  );
}

function SimpleList({ title, emptyText, rows }) {
  return (
    <div className="card">
      <h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.length === 0 && <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>{emptyText}</div>}
        {rows.map((r) => <div key={r.id} className="card-sm"><div style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 600 }}>{r.title}</div><div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>{r.desc}</div></div>)}
      </div>
    </div>
  );
}

function Label({ children }) {
  return <label style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 600, color: G.text, display: "block", marginBottom: 6 }}>{children}</label>;
}

function Field({ label, onChange, ...props }) {
  return <div><Label>{label}</Label><input className="journal-input" style={{ width: "100%" }} {...props} onChange={(e) => onChange(e.target.value)} /></div>;
}

function Stat({ label, value }) {
  return <div className="card-sm" style={{ textAlign: "center" }}><div style={{ fontFamily: G.ff, fontSize: 22, fontWeight: 700, color: G.brown }}>{value}</div><div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>{label}</div></div>;
}

export default MyDogs;
