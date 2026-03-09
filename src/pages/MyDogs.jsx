import { useCallback, useEffect, useMemo, useState } from "react";
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
  ["weight", "Weight"],
  ["activity", "Activity"],
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

  // Backfill from analyses for days where mood logs are missing.
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

function dateInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function toNullableString(value) {
  const v = String(value ?? "").trim();
  return v || null;
}

function toNullableNumber(value) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function MyDogs({ dogs = [], selectedDog, setSelectedDog, setPage, onDogAdded }) {
  const [showForm, setShowForm] = useState(false);
  const dog = selectedDog || dogs[0] || null;
  const onDogsChanged = onDogAdded;

  return (
    <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "300px 1fr", minHeight: "calc(100vh - 60px)" }}>
      <div style={{ borderRight: `1px solid ${G.border}`, padding: "24px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontFamily: G.ff, fontSize: 15, fontWeight: 700, color: G.text }}>My Dogs</span>
          <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setShowForm((v) => !v)}>+ Add</button>
        </div>

        {dogs.map((d) => (
          <div key={d.id} className={`dog-card ${String(selectedDog?.id) === String(d.id) ? "selected" : ""}`} style={{ padding: "14px 16px" }} onClick={() => { setSelectedDog(d); setShowForm(false); }}>
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
        {showForm || !dog ? (
          <AddDogForm onClose={() => setShowForm(false)} onDogAdded={onDogsChanged} />
        ) : (
          <DogDetailView dog={dog} setPage={setPage} onDogsChanged={onDogsChanged} />
        )}
      </div>
    </div>
  );
}

function AddDogForm({ onClose, onDogAdded }) {
  const [form, setForm] = useState({ name: "", breed: "", birthday: "", weight_kg: "", microchip: "", sex: "Male", energy_level: "Medium", notes: "" });
  const [loading, setLoading] = useState(false);

  const saveDog = async () => {
    if (!form.name.trim()) {
      alert("Please fill dog name");
      return;
    }

    const parsedWeight = toNullableNumber(form.weight_kg);
    if (form.weight_kg !== "" && (parsedWeight == null || parsedWeight <= 0 || parsedWeight > 999.99)) {
      alert("Please fill a valid weight (0.01 - 999.99 kg)");
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
          weight_kg: parsedWeight,
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

function DogDetailView({ dog, setPage, onDogsChanged }) {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    breed: "",
    birthday: "",
    weight_kg: "",
    microchip: "",
    sex: "Male",
    energy_level: "Medium",
    emoji: "\uD83D\uDC36",
    notes: "",
  });
  const [moods, setMoods] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [weights, setWeights] = useState([]);
  const [journals, setJournals] = useState([]);
  const [medications, setMedications] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [activities, setActivities] = useState([]);

  const load = useCallback(async () => {
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
  }, [dog.id]);

  useEffect(() => {
    setProfileForm({
      name: dog.name || "",
      breed: dog.breed || "",
      birthday: dateInputValue(dog.birthday),
      weight_kg: dog.weight_kg == null ? "" : String(dog.weight_kg),
      microchip: dog.microchip || "",
      sex: dog.sex || "Male",
      energy_level: dog.energy_level || "Medium",
      emoji: dog.emoji || "\uD83D\uDC36",
      notes: dog.notes || "",
    });
    setProfileEditing(false);
    load();
  }, [dog, load]);

  const moodLabel = toMoodLabel(dog?.mood || dog?.status, "Relaxed");
  const cfg = MOOD_CONFIG[moodLabel];
  const age = dog?.age ?? calculateAge(dog?.birthday);
  const weekMoodData = useMemo(() => buildWeekMoodData(moods, analyses), [moods, analyses]);
  const moodDist = useMemo(() => buildMoodDist(moods, moodLabel), [moods, moodLabel]);
  const activityData = useMemo(() => buildActivityData(activities), [activities]);
  const weightDisplay = dog.weight_kg == null ? "-" : `${Number(dog.weight_kg).toFixed(1)} kg`;
  const latestWeightDisplay = useMemo(() => {
    if (weights.length > 0) {
      const sorted = [...weights].sort((a, b) => {
        const tA = new Date(a.recorded_at).getTime();
        const tB = new Date(b.recorded_at).getTime();
        return tB - tA;
      });
      const latest = sorted[0];
      const n = Number(latest.weight_kg);
      return Number.isFinite(n) ? `${n.toFixed(1)} kg` : "-";
    }
    return weightDisplay;
  }, [weights, weightDisplay]);

  const saveProfile = async () => {
    if (!profileForm.name.trim()) {
      alert("Dog name is required");
      return;
    }
    const parsedWeight = toNullableNumber(profileForm.weight_kg);
    if (profileForm.weight_kg !== "" && (parsedWeight == null || parsedWeight <= 0 || parsedWeight > 999.99)) {
      alert("Weight must be between 0.01 and 999.99 kg");
      return;
    }

    setSavingProfile(true);
    try {
      await apiFetch(`/dogs/${dog.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: profileForm.name.trim(),
          breed: toNullableString(profileForm.breed),
          birthday: profileForm.birthday || null,
          weight_kg: parsedWeight,
          microchip: toNullableString(profileForm.microchip),
          sex: toNullableString(profileForm.sex),
          energy_level: toNullableString(profileForm.energy_level),
          emoji: toNullableString(profileForm.emoji) || "\uD83D\uDC36",
          notes: toNullableString(profileForm.notes),
        }),
      });
      await onDogsChanged?.();
      await load();
      setProfileEditing(false);
    } catch (err) {
      alert(`Failed to update dog profile: ${err.message}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const deleteDog = async () => {
    if (!window.confirm(`Delete ${dog.name}? This action cannot be undone.`)) return;
    try {
      await apiFetch(`/dogs/${dog.id}`, { method: "DELETE" });
      await onDogsChanged?.();
    } catch (err) {
      alert(`Failed to delete dog: ${err.message}`);
    }
  };

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
            {[["Breed", dog.breed || "-"], ["Age", age == null ? "-" : `${age} yrs`], ["Birthday", fmtDate(dog.birthday)], ["Weight", weightDisplay], ["Sex", dog.sex || "-"], ["Microchip", dog.microchip || "-"]].map(([l, v]) => (
              <div key={l} style={{ fontFamily: G.fs, fontSize: 12 }}><span style={{ color: G.muted }}>{l} </span><span style={{ color: G.text, fontWeight: 500 }}>{v}</span></div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={() => setPage("analyze")}>Analyze</button>
          <button className="btn btn-secondary" onClick={() => setPage("analyze")}>Chat</button>
          <button className="btn btn-ghost" onClick={() => setProfileEditing((v) => !v)}>{profileEditing ? "Close Edit" : "Edit Profile"}</button>
          <button className="btn btn-ghost" style={{ color: "#991b1b", borderColor: "#fecaca" }} onClick={deleteDog}>Delete Dog</button>
        </div>
      </div>

      {profileEditing && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: G.ff, fontSize: 18, fontWeight: 700, marginBottom: 12, color: G.text }}>Edit Dog Profile</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Name" value={profileForm.name} onChange={(v) => setProfileForm((f) => ({ ...f, name: v }))} />
            <Field label="Breed" value={profileForm.breed} onChange={(v) => setProfileForm((f) => ({ ...f, breed: v }))} />
            <Field label="Birthday" type="date" value={profileForm.birthday} onChange={(v) => setProfileForm((f) => ({ ...f, birthday: v }))} />
            <Field label="Weight (kg)" type="number" min="0.01" max="999.99" step="0.1" value={profileForm.weight_kg} onChange={(v) => setProfileForm((f) => ({ ...f, weight_kg: v }))} />
            <Field label="Microchip" value={profileForm.microchip} onChange={(v) => setProfileForm((f) => ({ ...f, microchip: v }))} />
            <Field label="Emoji" value={profileForm.emoji} onChange={(v) => setProfileForm((f) => ({ ...f, emoji: v }))} />
            <div>
              <Label>Sex</Label>
              <select className="journal-input" style={{ width: "100%" }} value={profileForm.sex} onChange={(e) => setProfileForm((f) => ({ ...f, sex: e.target.value }))}>
                <option>Male</option>
                <option>Female</option>
                <option>Unknown</option>
              </select>
            </div>
            <div>
              <Label>Energy Level</Label>
              <select className="journal-input" style={{ width: "100%" }} value={profileForm.energy_level} onChange={(e) => setProfileForm((f) => ({ ...f, energy_level: e.target.value }))}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Notes</Label>
              <textarea className="journal-input" rows={3} style={{ width: "100%", resize: "vertical" }} value={profileForm.notes} onChange={(e) => setProfileForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setProfileEditing(false)} disabled={savingProfile}>Cancel</button>
              <button className="btn btn-primary" onClick={saveProfile} disabled={savingProfile}>{savingProfile ? "Saving..." : "Save Profile"}</button>
            </div>
          </div>
        </div>
      )}

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
          <div className="card"><h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Summary</h3><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{[["Analyses", analyses.length],["Latest Weight", latestWeightDisplay],["Journal", journals.length],["Meds", medications.length],["Health", healthRecords.length],["Vaccines", vaccines.length]].map(([k,v]) => <Stat key={k} label={k} value={String(v)} />)}</div></div>
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
              return <div key={a.id} className="card-sm" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><div><div style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 600 }}>{c.emoji} {label} - {Number(a.confidence || 0).toFixed(1)}%</div><div style={{ fontFamily: G.fs, fontSize: 11, color: G.muted }}>{fmtDateTime(a.analyzed_at)}</div></div></div>;
            })}
          </div>
        </div>
      )}

      {!loading && !error && tab === "journal" && <JournalManager dogId={dog.id} rows={journals} onChanged={load} />}
      {!loading && !error && tab === "medicine" && <MedicationManager dogId={dog.id} rows={medications} onChanged={load} />}
      {!loading && !error && tab === "health" && <HealthManager dogId={dog.id} rows={healthRecords} onChanged={load} />}
      {!loading && !error && tab === "vaccine" && <VaccineManager dogId={dog.id} rows={vaccines} onChanged={load} />}
      {!loading && !error && tab === "weight" && <WeightManager dogId={dog.id} rows={weights} onChanged={load} />}
      {!loading && !error && tab === "activity" && <ActivityManager dogId={dog.id} rows={activities} onChanged={load} />}
    </div>
  );
}

function JournalManager({ dogId, rows, onChanged }) {
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ entry_date: todayIso(), mood: "", content: "" });

  const beginCreate = () => {
    setEditingId("new");
    setForm({ entry_date: todayIso(), mood: "", content: "" });
  };

  const beginEdit = (row) => {
    setEditingId(row.id);
    setForm({
      entry_date: dateInputValue(row.entry_date),
      mood: row.mood || "",
      content: row.content || "",
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ entry_date: todayIso(), mood: "", content: "" });
  };

  const save = async () => {
    if (!form.entry_date) {
      alert("Entry date is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        entry_date: form.entry_date,
        mood: toNullableString(form.mood),
        content: toNullableString(form.content),
      };
      if (editingId === "new") {
        await apiFetch(`/dogs/${dogId}/journal`, { method: "POST", body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/dogs/${dogId}/journal/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      }
      await onChanged();
      resetForm();
    } catch (err) {
      alert(`Failed to save journal entry: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this journal entry?")) return;
    try {
      await apiFetch(`/dogs/${dogId}/journal/${id}`, { method: "DELETE" });
      await onChanged();
    } catch (err) {
      alert(`Failed to delete journal entry: ${err.message}`);
    }
  };

  return (
    <div className="card">
      <SectionTitle title="Journal Entries" actionLabel="+ Add Entry" onAction={beginCreate} />
      {editingId && (
        <div className="card-sm" style={{ marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Entry Date" type="date" value={form.entry_date} onChange={(v) => setForm((f) => ({ ...f, entry_date: v }))} />
            <Field label="Mood (optional)" value={form.mood} onChange={(v) => setForm((f) => ({ ...f, mood: v }))} />
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Content</Label>
              <textarea className="journal-input" rows={3} style={{ width: "100%", resize: "vertical" }} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} />
            </div>
          </div>
          <FormActions onCancel={resetForm} onSave={save} saving={saving} />
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {!rows.length && <EmptyText text="No journal entries yet." />}
        {rows.map((row) => (
          <div key={row.id} className="card-sm">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>
                <div style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 600 }}>{fmtDate(row.entry_date)} {row.mood ? `· ${row.mood}` : ""}</div>
                <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>{row.content || "-"}</div>
              </div>
              <RowActions onEdit={() => beginEdit(row)} onDelete={() => remove(row.id)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MedicationManager({ dogId, rows, onChanged }) {
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "",
    dose: "",
    frequency: "",
    start_date: "",
    end_date: "",
    status: "active",
    prescribed_by: "",
    reason: "",
    notes: "",
  });

  const beginCreate = () => {
    setEditingId("new");
    setForm({
      name: "",
      type: "",
      dose: "",
      frequency: "",
      start_date: "",
      end_date: "",
      status: "active",
      prescribed_by: "",
      reason: "",
      notes: "",
    });
  };

  const beginEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name || "",
      type: row.type || "",
      dose: row.dose || "",
      frequency: row.frequency || "",
      start_date: dateInputValue(row.start_date),
      end_date: dateInputValue(row.end_date),
      status: row.status || "active",
      prescribed_by: row.prescribed_by || "",
      reason: row.reason || "",
      notes: row.notes || "",
    });
  };

  const resetForm = () => setEditingId(null);

  const save = async () => {
    if (!form.name.trim()) {
      alert("Medication name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: toNullableString(form.type),
        dose: toNullableString(form.dose),
        frequency: toNullableString(form.frequency),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: form.status || "active",
        prescribed_by: toNullableString(form.prescribed_by),
        reason: toNullableString(form.reason),
        notes: toNullableString(form.notes),
      };
      if (editingId === "new") {
        await apiFetch(`/dogs/${dogId}/medications`, { method: "POST", body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/dogs/${dogId}/medications/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      }
      await onChanged();
      resetForm();
    } catch (err) {
      alert(`Failed to save medication: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this medication?")) return;
    try {
      await apiFetch(`/dogs/${dogId}/medications/${id}`, { method: "DELETE" });
      await onChanged();
    } catch (err) {
      alert(`Failed to delete medication: ${err.message}`);
    }
  };

  return (
    <div className="card">
      <SectionTitle title="Medications" actionLabel="+ Add Medication" onAction={beginCreate} />
      {editingId && (
        <div className="card-sm" style={{ marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
            <Field label="Type" value={form.type} onChange={(v) => setForm((f) => ({ ...f, type: v }))} />
            <Field label="Dose" value={form.dose} onChange={(v) => setForm((f) => ({ ...f, dose: v }))} />
            <Field label="Frequency" value={form.frequency} onChange={(v) => setForm((f) => ({ ...f, frequency: v }))} />
            <Field label="Start Date" type="date" value={form.start_date} onChange={(v) => setForm((f) => ({ ...f, start_date: v }))} />
            <Field label="End Date" type="date" value={form.end_date} onChange={(v) => setForm((f) => ({ ...f, end_date: v }))} />
            <div>
              <Label>Status</Label>
              <select className="journal-input" style={{ width: "100%" }} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="active">active</option>
                <option value="completed">completed</option>
                <option value="discontinued">discontinued</option>
              </select>
            </div>
            <Field label="Prescribed By" value={form.prescribed_by} onChange={(v) => setForm((f) => ({ ...f, prescribed_by: v }))} />
            <Field label="Reason" value={form.reason} onChange={(v) => setForm((f) => ({ ...f, reason: v }))} />
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Notes</Label>
              <textarea className="journal-input" rows={3} style={{ width: "100%", resize: "vertical" }} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <FormActions onCancel={resetForm} onSave={save} saving={saving} />
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {!rows.length && <EmptyText text="No medications yet." />}
        {rows.map((row) => (
          <div key={row.id} className="card-sm">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>
                <div style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 600 }}>{row.name} · {row.status}</div>
                <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>{row.dose || "-"} · {row.frequency || "-"}</div>
                <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>{fmtDate(row.start_date)} → {fmtDate(row.end_date)}</div>
              </div>
              <RowActions onEdit={() => beginEdit(row)} onDelete={() => remove(row.id)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HealthManager({ dogId, rows, onChanged }) {
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    condition: "",
    severity: "medium",
    status: "ongoing",
    diagnosed_date: "",
    notes: "",
  });

  const beginCreate = () => {
    setEditingId("new");
    setForm({
      condition: "",
      severity: "medium",
      status: "ongoing",
      diagnosed_date: "",
      notes: "",
    });
  };

  const beginEdit = (row) => {
    setEditingId(row.id);
    setForm({
      condition: row.condition || "",
      severity: row.severity || "medium",
      status: row.status || "ongoing",
      diagnosed_date: dateInputValue(row.diagnosed_date),
      notes: row.notes || "",
    });
  };

  const resetForm = () => setEditingId(null);

  const save = async () => {
    if (!form.condition.trim()) {
      alert("Condition is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        condition: form.condition.trim(),
        severity: form.severity || "medium",
        status: form.status || "ongoing",
        diagnosed_date: form.diagnosed_date || null,
        notes: toNullableString(form.notes),
      };
      if (editingId === "new") {
        await apiFetch(`/dogs/${dogId}/health`, { method: "POST", body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/dogs/${dogId}/health/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      }
      await onChanged();
      resetForm();
    } catch (err) {
      alert(`Failed to save health record: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this health record?")) return;
    try {
      await apiFetch(`/dogs/${dogId}/health/${id}`, { method: "DELETE" });
      await onChanged();
    } catch (err) {
      alert(`Failed to delete health record: ${err.message}`);
    }
  };

  return (
    <div className="card">
      <SectionTitle title="Health Records" actionLabel="+ Add Health Record" onAction={beginCreate} />
      {editingId && (
        <div className="card-sm" style={{ marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Condition" value={form.condition} onChange={(v) => setForm((f) => ({ ...f, condition: v }))} />
            <Field label="Diagnosed Date" type="date" value={form.diagnosed_date} onChange={(v) => setForm((f) => ({ ...f, diagnosed_date: v }))} />
            <div>
              <Label>Severity</Label>
              <select className="journal-input" style={{ width: "100%" }} value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </div>
            <div>
              <Label>Status</Label>
              <select className="journal-input" style={{ width: "100%" }} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="ongoing">ongoing</option>
                <option value="monitoring">monitoring</option>
                <option value="resolved">resolved</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Notes</Label>
              <textarea className="journal-input" rows={3} style={{ width: "100%", resize: "vertical" }} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <FormActions onCancel={resetForm} onSave={save} saving={saving} />
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {!rows.length && <EmptyText text="No health records yet." />}
        {rows.map((row) => (
          <div key={row.id} className="card-sm">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>
                <div style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 600 }}>{row.condition} · {row.status}</div>
                <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>{row.severity || "-"} · {fmtDate(row.diagnosed_date)}</div>
                <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>{row.notes || "-"}</div>
              </div>
              <RowActions onEdit={() => beginEdit(row)} onDelete={() => remove(row.id)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VaccineManager({ dogId, rows, onChanged }) {
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    last_date: "",
    next_due: "",
    status: "current",
  });

  const beginCreate = () => {
    setEditingId("new");
    setForm({ name: "", last_date: "", next_due: "", status: "current" });
  };

  const beginEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name || "",
      last_date: dateInputValue(row.last_date),
      next_due: dateInputValue(row.next_due),
      status: row.status || "current",
    });
  };

  const resetForm = () => setEditingId(null);

  const save = async () => {
    if (!form.name.trim()) {
      alert("Vaccine name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        last_date: form.last_date || null,
        next_due: form.next_due || null,
        status: form.status || "current",
      };
      if (editingId === "new") {
        await apiFetch(`/dogs/${dogId}/vaccines`, { method: "POST", body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/dogs/${dogId}/vaccines/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      }
      await onChanged();
      resetForm();
    } catch (err) {
      alert(`Failed to save vaccine record: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this vaccine record?")) return;
    try {
      await apiFetch(`/dogs/${dogId}/vaccines/${id}`, { method: "DELETE" });
      await onChanged();
    } catch (err) {
      alert(`Failed to delete vaccine record: ${err.message}`);
    }
  };

  return (
    <div className="card">
      <SectionTitle title="Vaccine Records" actionLabel="+ Add Vaccine" onAction={beginCreate} />
      {editingId && (
        <div className="card-sm" style={{ marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
            <div>
              <Label>Status</Label>
              <select className="journal-input" style={{ width: "100%" }} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="current">current</option>
                <option value="due-soon">due-soon</option>
                <option value="overdue">overdue</option>
              </select>
            </div>
            <Field label="Last Date" type="date" value={form.last_date} onChange={(v) => setForm((f) => ({ ...f, last_date: v }))} />
            <Field label="Next Due" type="date" value={form.next_due} onChange={(v) => setForm((f) => ({ ...f, next_due: v }))} />
          </div>
          <FormActions onCancel={resetForm} onSave={save} saving={saving} />
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {!rows.length && <EmptyText text="No vaccines yet." />}
        {rows.map((row) => (
          <div key={row.id} className="card-sm">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>
                <div style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 600 }}>{row.name} · {row.status}</div>
                <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>Last: {fmtDate(row.last_date)} · Next: {fmtDate(row.next_due)}</div>
              </div>
              <RowActions onEdit={() => beginEdit(row)} onDelete={() => remove(row.id)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeightManager({ dogId, rows, onChanged }) {
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ weight_kg: "", recorded_at: todayIso() });

  const beginCreate = () => {
    setEditingId("new");
    setForm({ weight_kg: "", recorded_at: todayIso() });
  };

  const beginEdit = (row) => {
    setEditingId(row.id);
    setForm({
      weight_kg: String(row.weight_kg ?? ""),
      recorded_at: dateInputValue(row.recorded_at),
    });
  };

  const resetForm = () => setEditingId(null);

  const save = async () => {
    const weight = Number(form.weight_kg);
    if (!Number.isFinite(weight) || weight <= 0 || weight > 999.99) {
      alert("Weight must be between 0.01 and 999.99 kg");
      return;
    }
    if (!form.recorded_at) {
      alert("Recorded date is required");
      return;
    }
    setSaving(true);
    try {
      const payload = { weight_kg: weight, recorded_at: form.recorded_at };
      if (editingId === "new") {
        await apiFetch(`/dogs/${dogId}/weights`, { method: "POST", body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/dogs/${dogId}/weights/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      }
      await onChanged();
      resetForm();
    } catch (err) {
      alert(`Failed to save weight log: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this weight log?")) return;
    try {
      await apiFetch(`/dogs/${dogId}/weights/${id}`, { method: "DELETE" });
      await onChanged();
    } catch (err) {
      alert(`Failed to delete weight log: ${err.message}`);
    }
  };

  return (
    <div className="card">
      <SectionTitle title="Weight Logs" actionLabel="+ Add Weight Log" onAction={beginCreate} />
      {editingId && (
        <div className="card-sm" style={{ marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Weight (kg)" type="number" min="0.01" max="999.99" step="0.1" value={form.weight_kg} onChange={(v) => setForm((f) => ({ ...f, weight_kg: v }))} />
            <Field label="Recorded Date" type="date" value={form.recorded_at} onChange={(v) => setForm((f) => ({ ...f, recorded_at: v }))} />
          </div>
          <FormActions onCancel={resetForm} onSave={save} saving={saving} />
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {!rows.length && <EmptyText text="No weight logs yet." />}
        {rows.map((row) => (
          <div key={row.id} className="card-sm">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>
                <div style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 600 }}>{Number(row.weight_kg).toFixed(1)} kg</div>
                <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>{fmtDate(row.recorded_at)}</div>
              </div>
              <RowActions onEdit={() => beginEdit(row)} onDelete={() => remove(row.id)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityManager({ dogId, rows, onChanged }) {
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ logged_date: todayIso(), walk_min: "0", play_min: "0", train_min: "0", notes: "" });

  const beginCreate = () => {
    setEditingId("new");
    setForm({ logged_date: todayIso(), walk_min: "0", play_min: "0", train_min: "0", notes: "" });
  };

  const beginEdit = (row) => {
    setEditingId(row.id);
    setForm({
      logged_date: dateInputValue(row.logged_date),
      walk_min: String(row.walk_min ?? 0),
      play_min: String(row.play_min ?? 0),
      train_min: String(row.train_min ?? 0),
      notes: row.notes || "",
    });
  };

  const resetForm = () => setEditingId(null);

  const save = async () => {
    if (!form.logged_date) {
      alert("Logged date is required");
      return;
    }
    const walk = Number(form.walk_min || 0);
    const play = Number(form.play_min || 0);
    const train = Number(form.train_min || 0);
    if (![walk, play, train].every((v) => Number.isFinite(v) && v >= 0)) {
      alert("Activity minutes must be 0 or greater");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        logged_date: form.logged_date,
        walk_min: Math.round(walk),
        play_min: Math.round(play),
        train_min: Math.round(train),
        notes: toNullableString(form.notes),
      };
      if (editingId === "new") {
        await apiFetch(`/dogs/${dogId}/activities`, { method: "POST", body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/dogs/${dogId}/activities/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      }
      await onChanged();
      resetForm();
    } catch (err) {
      alert(`Failed to save activity log: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this activity log?")) return;
    try {
      await apiFetch(`/dogs/${dogId}/activities/${id}`, { method: "DELETE" });
      await onChanged();
    } catch (err) {
      alert(`Failed to delete activity log: ${err.message}`);
    }
  };

  return (
    <div className="card">
      <SectionTitle title="Activity Logs" actionLabel="+ Add Activity Log" onAction={beginCreate} />
      {editingId && (
        <div className="card-sm" style={{ marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Logged Date" type="date" value={form.logged_date} onChange={(v) => setForm((f) => ({ ...f, logged_date: v }))} />
            <Field label="Walk Minutes" type="number" min="0" value={form.walk_min} onChange={(v) => setForm((f) => ({ ...f, walk_min: v }))} />
            <Field label="Play Minutes" type="number" min="0" value={form.play_min} onChange={(v) => setForm((f) => ({ ...f, play_min: v }))} />
            <Field label="Train Minutes" type="number" min="0" value={form.train_min} onChange={(v) => setForm((f) => ({ ...f, train_min: v }))} />
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Notes</Label>
              <textarea className="journal-input" rows={3} style={{ width: "100%", resize: "vertical" }} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <FormActions onCancel={resetForm} onSave={save} saving={saving} />
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {!rows.length && <EmptyText text="No activity logs yet." />}
        {rows.map((row) => (
          <div key={row.id} className="card-sm">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>
                <div style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 600 }}>{fmtDate(row.logged_date)}</div>
                <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>Walk {row.walk_min || 0}m · Play {row.play_min || 0}m · Train {row.train_min || 0}m</div>
                <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>{row.notes || "-"}</div>
              </div>
              <RowActions onEdit={() => beginEdit(row)} onDelete={() => remove(row.id)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ title, actionLabel, onAction }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 700 }}>{title}</h3>
      <button className="btn btn-primary" style={{ padding: "7px 12px", fontSize: 12 }} onClick={onAction}>{actionLabel}</button>
    </div>
  );
}

function EmptyText({ text }) {
  return <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>{text}</div>;
}

function RowActions({ onEdit, onDelete }) {
  return (
    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
      <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={onEdit}>Edit</button>
      <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12, color: "#991b1b", borderColor: "#fecaca" }} onClick={onDelete}>Delete</button>
    </div>
  );
}

function FormActions({ onCancel, onSave, saving }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
      <button className="btn btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
      <button className="btn btn-primary" onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
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

