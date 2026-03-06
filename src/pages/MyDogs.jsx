import { useEffect, useState } from "react";
import MoodChart from "../components/MoodChart";
import { DOGS, WEEK_DATA, MOOD_CONFIG } from "../data/mockData";
import { G } from "../styles/theme";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const INIT_MEDS = [
  {
    id: 1,
    name: "Apoquel (Oclacitinib)",
    type: "Antipruritic",
    dose: "5.4 mg",
    frequency: "Once daily",
    startDate: "2024-11-01",
    endDate: "2024-11-14",
    status: "completed",
    prescribedBy: "Dr. Somchai",
    reason: "Allergic dermatitis",
    notes: "Good response after day 3.",
  },
  {
    id: 2,
    name: "Bravecto",
    type: "Antiparasitic",
    dose: "250 mg",
    frequency: "Every 3 months",
    startDate: "2025-01-10",
    endDate: "2025-04-10",
    status: "active",
    prescribedBy: "Dr. Somchai",
    reason: "Flea & tick prevention",
    notes: "",
  },
];

const INIT_HEALTH_RECORDS = [
  { id: 1, condition: "Allergic Dermatitis", severity: "medium", status: "resolved", diagnosedDate: "2024-11-01", notes: "Improved after treatment." },
  { id: 2, condition: "Separation Anxiety", severity: "medium", status: "ongoing", diagnosedDate: "2024-09-10", notes: "Worse during long alone time." },
];

const INIT_VACCINES = [
  { id: 1, name: "Rabies", lastDate: "2024-06-15", nextDue: "2025-06-15", status: "current" },
  { id: 2, name: "DHPPiL (5-in-1)", lastDate: "2024-06-15", nextDue: "2025-06-15", status: "current" },
  { id: 3, name: "Bordetella", lastDate: "2024-03-10", nextDue: "2025-03-10", status: "due-soon" },
];

function fmtDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function profileFromDog(dog) {
  const birthdayByDogId = {
    1: "2023-04-12",
    2: "2021-09-05",
    3: "2024-01-20",
  };
  return {
    name: dog.name,
    breed: dog.breed,
    age: dog.age,
    birthday: birthdayByDogId[dog.id] || "2023-01-01",
    sex: dog.sex,
    weight: Number(dog.weight),
    microchip: `TH-${2020 + dog.id}-${String(984000 + dog.id * 35)}`,
    notes: "",
  };
}

function MyDogs({ selectedDog, setSelectedDog, setPage }) {
  const [showForm, setShowForm] = useState(false);
  const dog = selectedDog || DOGS[0];

  return (
    <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "300px 1fr", minHeight: "calc(100vh - 60px)" }}>
      <div style={{ borderRight: `1px solid ${G.border}`, padding: "24px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontFamily: G.ff, fontSize: 15, fontWeight: 700, color: G.text }}>My Dogs</span>
          <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setShowForm(!showForm)}>+ Add</button>
        </div>
        {DOGS.map((d) => (
          <div
            key={d.id}
            className={`dog-card ${selectedDog?.id === d.id ? "selected" : ""}`}
            style={{ padding: "14px 16px" }}
            onClick={() => setSelectedDog(d)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${d.moodColor}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: `2px solid ${d.moodColor}40` }}>{d.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: G.ff, fontSize: 15, fontWeight: 600, color: G.text }}>{d.name}</div>
                <div style={{ fontFamily: G.fs, fontSize: 11, color: G.muted }}>{d.breed}</div>
              </div>
              <span style={{ fontFamily: G.fs, fontSize: 13 }}>{d.moodEmoji}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: "28px 32px", overflowY: "auto" }}>
        {showForm ? <AddDogForm onClose={() => setShowForm(false)} /> : <DogDetailView dog={dog} setPage={setPage} />}
      </div>
    </div>
  );
}

function AddDogForm({ onClose }) {
  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h2 style={{ fontFamily: G.ff, fontSize: 22, fontWeight: 700, color: G.text }}>Add New Dog 🐾</h2>
        <button className="btn btn-ghost" onClick={onClose}>✕ Cancel</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {[
          { label: "Name", placeholder: "e.g. Mochi", type: "text" },
          { label: "Breed", placeholder: "e.g. Shiba Inu", type: "text" },
          { label: "Birthdate", placeholder: "", type: "date" },
          { label: "Weight (kg)", placeholder: "e.g. 10.2", type: "number" },
        ].map((f) => (
          <div key={f.label}>
            <label style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 600, color: G.text, display: "block", marginBottom: 6 }}>{f.label}</label>
            <input className="journal-input" type={f.type} placeholder={f.placeholder} style={{ width: "100%" }} />
          </div>
        ))}
        <div>
          <label style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 600, color: G.text, display: "block", marginBottom: 6 }}>Sex</label>
          <select className="journal-input" style={{ width: "100%" }}>
            <option>Male</option><option>Female</option><option>Unknown</option>
          </select>
        </div>
        <div>
          <label style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 600, color: G.text, display: "block", marginBottom: 6 }}>Energy Level</label>
          <select className="journal-input" style={{ width: "100%" }}>
            <option>Low</option><option>Medium</option><option>High</option>
          </select>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 600, color: G.text, display: "block", marginBottom: 6 }}>Medical Notes</label>
          <textarea className="journal-input" rows={3} placeholder="Known conditions, medications, allergies..." style={{ width: "100%", resize: "vertical" }} />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "13px" }}>Save Dog Profile 🐾</button>
        </div>
      </div>
    </div>
  );
}

function DogDetailView({ dog, setPage }) {
  const [tab, setTab] = useState("overview");
  const [medications, setMedications] = useState(INIT_MEDS);
  const [medFilter, setMedFilter] = useState("all");
  const [showMedModal, setShowMedModal] = useState(false);
  const [editMed, setEditMed] = useState(null);
  const [healthRecords, setHealthRecords] = useState(INIT_HEALTH_RECORDS);
  const [healthView, setHealthView] = useState("ongoing");
  const [vaccines, setVaccines] = useState(INIT_VACCINES);
  const [profile, setProfile] = useState(profileFromDog(dog));
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showOverviewDetail, setShowOverviewDetail] = useState(false);
  const [weightLog, setWeightLog] = useState([
    { id: 1, date: "2026-02-26", weight: Number(dog.weight) - 0.2 },
    { id: 2, date: "2026-03-01", weight: Number(dog.weight) },
  ]);
  const cfg = MOOD_CONFIG[dog.mood];
  const activityData = [
    { day: "Mon", walk: 28, play: 18, train: 10 },
    { day: "Tue", walk: 24, play: 12, train: 8 },
    { day: "Wed", walk: 35, play: 15, train: 12 },
    { day: "Thu", walk: 30, play: 22, train: 8 },
    { day: "Fri", walk: 20, play: 9, train: 5 },
    { day: "Sat", walk: 42, play: 25, train: 15 },
    { day: "Sun", walk: 37, play: 20, train: 12 },
  ];
  const weightChartData = [...weightLog]
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((w) => ({ date: fmtDate(w.date), weight: Number(w.weight) }));
  const activeMeds = medications.filter((m) => m.status === "active");
  const moodDist = Object.entries(
    WEEK_DATA.reduce((acc, d) => {
      acc[d.label] = (acc[d.label] || 0) + 1;
      return acc;
    }, {})
  ).map(([label, value]) => ({ label, value, color: MOOD_CONFIG[label]?.color || G.brown }));
  const overviewLogs = [
    ...weightLog.map((w) => ({ when: `${fmtDate(w.date)} 09:00`, type: "Weight", detail: `${Number(w.weight).toFixed(1)} kg` })),
    { when: "03 Mar 2026 18:20", type: "Activity", detail: "Walked 35 min, play 20 min, training 12 min" },
    { when: "02 Mar 2026 21:40", type: "Health Note", detail: "Mild itching observed after park walk" },
  ].slice(0, 10);

  useEffect(() => {
    setProfile(profileFromDog(dog));
    setWeightLog([
      { id: Date.now(), date: "2026-03-01", weight: Number(dog.weight) },
      { id: Date.now() + 1, date: "2026-02-26", weight: Number(dog.weight) - 0.2 },
    ]);
    setHealthView("ongoing");
  }, [dog]);

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg,${cfg.color},${cfg.color}80)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, flexShrink: 0 }}>{dog.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontFamily: G.ff, fontSize: 26, fontWeight: 700, color: G.text }}>{profile.name}</h1>
            <span style={{ background: cfg.bg, color: cfg.color, fontFamily: G.fs, fontSize: 12, fontWeight: 600, padding: "3px 12px", borderRadius: 20 }}>{cfg.emoji} {dog.mood}</span>
          </div>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            {[["Breed", profile.breed], ["Age", `${profile.age} yrs`], ["Birthday", fmtDate(profile.birthday)], ["Weight", `${Number(profile.weight).toFixed(1)} kg`], ["Sex", profile.sex], ["Microchip", profile.microchip]].map(([l, v]) => (
              <div key={l} style={{ fontFamily: G.fs, fontSize: 12 }}><span style={{ color: G.muted }}>{l} </span><span style={{ color: G.text, fontWeight: 500 }}>{v}</span></div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setShowProfileModal(true)}>Edit Profile</button>
          <button className="btn btn-primary" onClick={() => setPage("analyze")}>📷 Analyze</button>
          <button className="btn btn-secondary" onClick={() => setPage("analyze")}>💬 Chat</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, background: G.brownPale, padding: 5, borderRadius: 24, marginBottom: 24, width: "fit-content", flexWrap: "wrap" }}>
        {[
          ["overview", "📊 Overview"],
          ["history", "🕐 History"],
          ["journal", "📓 Journal"],
          ["medicine", "💊 Medicine"],
          ["health", "🩺 Health Records"],
          ["vaccine", "💉 Vaccine"],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 500, padding: "7px 18px", borderRadius: 20, border: "none", cursor: "pointer", transition: "all .2s", background: tab === k ? G.brown : "transparent", color: tab === k ? "white" : G.muted }}>{l}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="fade-in">
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button className="btn btn-ghost" onClick={() => setShowOverviewDetail(true)}>View Detail</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div className="card">
              <h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 700, color: G.text, marginBottom: 4 }}>Mood Trend</h3>
              <p style={{ fontFamily: G.fs, fontSize: 12, color: G.muted, marginBottom: 12 }}>Weekly mood score</p>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={WEEK_DATA} margin={{ left: -30, right: 6, top: 6, bottom: 0 }}>
                  <defs>
                    <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={cfg.color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={cfg.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: G.muted, fontFamily: G.fs }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 5]} hide />
                  <Tooltip />
                  <Area type="monotone" dataKey="mood" stroke={cfg.color} strokeWidth={2.5} fill="url(#moodFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 700, color: G.text, marginBottom: 4 }}>Activity Breakdown</h3>
              <p style={{ fontFamily: G.fs, fontSize: 12, color: G.muted, marginBottom: 12 }}>Walk / Play / Training minutes per day</p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={activityData} margin={{ left: -20, right: 4, top: 6, bottom: 0 }}>
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
              <h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 700, color: G.text, marginBottom: 4 }}>Mood Distribution</h3>
              <p style={{ fontFamily: G.fs, fontSize: 12, color: G.muted, marginBottom: 12 }}>Past 7 days</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {moodDist.map((d) => (
                  <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: G.fs, fontSize: 12, width: 80 }}>{d.label}</span>
                    <div style={{ flex: 1, height: 8, borderRadius: 99, background: G.brownPale, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(d.value / WEEK_DATA.length) * 100}%`, background: d.color }} />
                    </div>
                    <span style={{ fontFamily: G.fs, fontSize: 11, color: G.muted, width: 16, textAlign: "right" }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 700, color: G.text, marginBottom: 4 }}>Weight History</h3>
              <p style={{ fontFamily: G.fs, fontSize: 12, color: G.muted, marginBottom: 12 }}>Latest weight records</p>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={weightChartData} margin={{ left: -20, right: 6, top: 6, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5c3d1e" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#5c3d1e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: G.muted, fontFamily: G.fs }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: G.muted, fontFamily: G.fs }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`${Number(v).toFixed(1)} kg`, "Weight"]} />
                  <Area type="monotone" dataKey="weight" stroke="#5c3d1e" strokeWidth={2.5} fill="url(#weightFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 700, color: G.text, marginBottom: 12 }}>Health At a Glance</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Active meds", val: medications.filter((m) => m.status === "active").length, color: "#1e40af", bg: "#dbeafe", icon: "💊" },
                  { label: "Ongoing cases", val: healthRecords.filter((r) => r.status !== "resolved").length, color: "#991b1b", bg: "#fee2e2", icon: "⚠️" },
                  { label: "Resolved", val: healthRecords.filter((r) => r.status === "resolved").length, color: "#065f46", bg: "#d1fae5", icon: "✅" },
                  { label: "Vaccines current", val: vaccines.filter((v) => v.status === "current").length, color: "#0f6b6b", bg: "#d4f0f0", icon: "💉" },
                ].map((s) => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontFamily: G.ff, fontSize: 19, fontWeight: 700, color: s.color }}>{s.val}</div>
                      <div style={{ fontFamily: G.fs, fontSize: 11, color: s.color }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 700, color: G.text }}>Current Medications</h3>
                <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setTab("medicine")}>View all</button>
              </div>
              {activeMeds.length === 0 ? (
                <p style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>No active medications.</p>
              ) : (
                activeMeds.map((m, i) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < activeMeds.length - 1 ? `1px solid ${G.border}` : "none" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💊</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 600, color: G.text }}>{m.name}</div>
                      <div style={{ fontFamily: G.fs, fontSize: 11, color: G.muted }}>{m.dose} · {m.frequency}</div>
                    </div>
                    <span style={{ fontFamily: G.fs, fontSize: 11, color: "#1e40af", fontWeight: 700 }}>{m.endDate ? `Until ${fmtDate(m.endDate)}` : "Ongoing"}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="card fade-in">
          <h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 600, marginBottom: 18 }}>Analysis History</h3>
          {[
            { date: "Today 09:14", mood: "Happy", conf: 92, note: "Active morning, energetic" },
            { date: "Yesterday 18:30", mood: "Relaxed", conf: 87, note: "Calm after evening walk" },
            { date: "Sat 14:05", mood: "Angry", conf: 78, note: "Barked at neighbor's dog" },
          ].map((a, i) => {
            const c = MOOD_CONFIG[a.mood];
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: `1px solid ${G.border}` }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{c.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}><span style={{ fontFamily: G.fs, fontSize: 14, fontWeight: 600, color: G.text }}>{a.mood}</span><span style={{ fontFamily: G.fs, fontSize: 11, color: G.muted }}>{a.date}</span></div>
                  <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>{a.note}</div>
                </div>
                <div style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 700, color: c.color }}>{a.conf}%</div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "journal" && <JournalTab currentWeight={profile.weight} weightLog={weightLog} setWeightLog={setWeightLog} />}
      {tab === "medicine" && (
        <MedicineTab
          medications={medications}
          setMedications={setMedications}
          medFilter={medFilter}
          setMedFilter={setMedFilter}
          showMedModal={showMedModal}
          setShowMedModal={setShowMedModal}
          editMed={editMed}
          setEditMed={setEditMed}
        />
      )}
      {tab === "health" && (
        <HealthRecordsTab
          healthRecords={healthRecords}
          setHealthRecords={setHealthRecords}
          healthView={healthView}
          setHealthView={setHealthView}
        />
      )}
      {tab === "vaccine" && <VaccineTab vaccines={vaccines} setVaccines={setVaccines} />}
      {showOverviewDetail && <OverviewDetailModal logs={overviewLogs} onClose={() => setShowOverviewDetail(false)} />}
      {showProfileModal && (
        <ProfileModal
          profile={profile}
          onClose={() => setShowProfileModal(false)}
          onSave={(nextProfile) => {
            setProfile(nextProfile);
            setWeightLog((prev) => [{ id: Date.now(), date: new Date().toISOString().slice(0, 10), weight: Number(nextProfile.weight) }, ...prev]);
            setShowProfileModal(false);
          }}
        />
      )}
    </div>
  );
}

function ProfileModal({ profile, onSave, onClose }) {
  const [form, setForm] = useState(profile);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }} onClick={onClose}>
      <div className="card" style={{ width: "100%", maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontFamily: G.ff, fontSize: 20, fontWeight: 700, color: G.text, marginBottom: 14 }}>Edit Profile</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontFamily: G.fs, fontSize: 12, fontWeight: 600, color: G.text, display: "block", marginBottom: 5 }}>Name</label>
            <input className="journal-input" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label style={{ fontFamily: G.fs, fontSize: 12, fontWeight: 600, color: G.text, display: "block", marginBottom: 5 }}>Breed</label>
            <input className="journal-input" value={form.breed} onChange={(e) => set("breed", e.target.value)} />
          </div>
          <div>
            <label style={{ fontFamily: G.fs, fontSize: 12, fontWeight: 600, color: G.text, display: "block", marginBottom: 5 }}>Age (years)</label>
            <input className="journal-input" type="number" value={form.age} onChange={(e) => set("age", Number(e.target.value))} />
          </div>
          <div>
            <label style={{ fontFamily: G.fs, fontSize: 12, fontWeight: 600, color: G.text, display: "block", marginBottom: 5 }}>Birthday</label>
            <input className="journal-input" type="date" value={form.birthday} onChange={(e) => set("birthday", e.target.value)} />
          </div>
          <div>
            <label style={{ fontFamily: G.fs, fontSize: 12, fontWeight: 600, color: G.text, display: "block", marginBottom: 5 }}>Sex</label>
            <select className="journal-input" value={form.sex} onChange={(e) => set("sex", e.target.value)}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
          <div>
            <label style={{ fontFamily: G.fs, fontSize: 12, fontWeight: 600, color: G.text, display: "block", marginBottom: 5 }}>Weight (kg)</label>
            <input className="journal-input" type="number" step="0.1" value={form.weight} onChange={(e) => set("weight", Number(e.target.value))} />
          </div>
          <div>
            <label style={{ fontFamily: G.fs, fontSize: 12, fontWeight: 600, color: G.text, display: "block", marginBottom: 5 }}>Microchip</label>
            <input className="journal-input" value={form.microchip} onChange={(e) => set("microchip", e.target.value)} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontFamily: G.fs, fontSize: 12, fontWeight: 600, color: G.text, display: "block", marginBottom: 5 }}>Profile Notes</label>
            <textarea className="journal-input" rows={3} style={{ resize: "vertical" }} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Profile</button>
        </div>
      </div>
    </div>
  );
}

function JournalTab({ currentWeight, weightLog, setWeightLog }) {
  const [weightInput, setWeightInput] = useState("");
  const [weightDate, setWeightDate] = useState(new Date().toISOString().slice(0, 10));

  const addWeightRecord = () => {
    const value = parseFloat(weightInput);
    if (!value || value <= 0) return;
    setWeightLog((prev) => [{ id: Date.now(), date: weightDate, weight: value }, ...prev]);
    setWeightInput("");
  };

  return (
    <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      <div className="card">
        <h3 style={{ fontFamily: G.ff, fontSize: 15, fontWeight: 600, color: G.text, marginBottom: 18 }}>Today's Check-in</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 600, color: G.text, display: "block", marginBottom: 6 }}>⚖️ Weight (kg)</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px auto", gap: 8 }}>
              <input type="number" className="journal-input" step="0.1" placeholder={`Current: ${Number(currentWeight).toFixed(1)}`} value={weightInput} onChange={(e) => setWeightInput(e.target.value)} />
              <input type="date" className="journal-input" value={weightDate} onChange={(e) => setWeightDate(e.target.value)} />
              <button className="btn btn-secondary" type="button" onClick={addWeightRecord}>Add</button>
            </div>
          </div>
          <div>
            <label style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 600, color: G.text, display: "block", marginBottom: 6 }}>📝 Notes</label>
            <textarea className="journal-input" rows={4} placeholder="Behavior, appetite, activity, sleep..." style={{ resize: "vertical" }} />
          </div>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px" }}>Save Today's Entry 📓</button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontFamily: G.ff, fontSize: 15, fontWeight: 600, color: G.text, marginBottom: 14 }}>Weight Records</h3>
        {weightLog.length === 0 ? (
          <p style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>No weight records yet.</p>
        ) : (
          weightLog.slice(0, 10).map((w, i) => (
            <div key={w.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < Math.min(weightLog.length, 10) - 1 ? `1px solid ${G.border}` : "none" }}>
              <span style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>{w.date}</span>
              <span style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 700, color: G.brown }}>{Number(w.weight).toFixed(1)} kg</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MedModal({ med, onSave, onClose }) {
  const [form, setForm] = useState(
    med || {
      name: "",
      type: "",
      dose: "",
      frequency: "",
      startDate: "",
      endDate: "",
      status: "active",
      prescribedBy: "",
      reason: "",
      notes: "",
    }
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }} onClick={onClose}>
      <div className="card" style={{ width: "100%", maxWidth: 760, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontFamily: G.ff, fontSize: 20, fontWeight: 700, color: G.text, marginBottom: 14 }}>{med ? "Edit Medication" : "Add Medication"}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[["name", "Medicine Name"], ["type", "Type / Category"], ["dose", "Dose"], ["frequency", "Frequency"], ["startDate", "Start Date"], ["endDate", "End Date"], ["prescribedBy", "Prescribed By"], ["reason", "Reason"]].map(([k, label]) => (
            <div key={k}>
              <label style={{ fontFamily: G.fs, fontSize: 12, fontWeight: 600, color: G.text, display: "block", marginBottom: 5 }}>{label}</label>
              <input className="journal-input" type={k.toLowerCase().includes("date") ? "date" : "text"} value={form[k]} onChange={(e) => set(k, e.target.value)} />
            </div>
          ))}
          <div>
            <label style={{ fontFamily: G.fs, fontSize: 12, fontWeight: 600, color: G.text, display: "block", marginBottom: 5 }}>Status</label>
            <select className="journal-input" value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="active">active</option>
              <option value="completed">completed</option>
              <option value="discontinued">discontinued</option>
            </select>
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontFamily: G.fs, fontSize: 12, fontWeight: 600, color: G.text, display: "block", marginBottom: 5 }}>Notes</label>
            <textarea className="journal-input" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} style={{ resize: "vertical" }} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => form.name && onSave(form)}>Save Medication</button>
        </div>
      </div>
    </div>
  );
}

function MedicineTab({
  medications,
  setMedications,
  medFilter,
  setMedFilter,
  showMedModal,
  setShowMedModal,
  editMed,
  setEditMed,
}) {
  const filteredMeds = medFilter === "all" ? medications : medications.filter((m) => m.status === medFilter);

  const saveMed = (form) => {
    if (editMed) {
      setMedications((prev) => prev.map((m) => (m.id === editMed.id ? { ...m, ...form } : m)));
    } else {
      setMedications((prev) => [{ id: Date.now(), ...form }, ...prev]);
    }
    setShowMedModal(false);
    setEditMed(null);
  };

  const deleteMed = (id) => setMedications((prev) => prev.filter((m) => m.id !== id));

  const statusStyle = (status) => {
    if (status === "active") return { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" };
    if (status === "completed") return { background: "#dbeafe", color: "#1e40af", border: "1px solid #93c5fd" };
    return { background: "#f5f5f5", color: "#6b7280", border: "1px solid #d1d5db" };
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[["all", "All"], ["active", "Active"], ["completed", "Completed"], ["discontinued", "Discontinued"]].map(([k, l]) => (
            <button key={k} onClick={() => setMedFilter(k)} style={{ fontFamily: G.fs, fontSize: 12, fontWeight: 500, padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${G.border}`, background: medFilter === k ? G.brown : "white", color: medFilter === k ? "white" : G.muted, cursor: "pointer", transition: "all .15s" }}>{l}</button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditMed(null); setShowMedModal(true); }}>+ Add Medication</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1.2fr 1.5fr 1.4fr 1fr auto", gap: 12, padding: "10px 20px", background: "#f7f2ea", borderBottom: `1px solid ${G.border}` }}>
          {["Medicine", "Dose", "Frequency", "Period", "Reason", "Status", ""].map((h) => (
            <span key={h} style={{ fontFamily: G.fs, fontSize: 11, fontWeight: 700, color: G.muted, textTransform: "uppercase", letterSpacing: .4 }}>{h}</span>
          ))}
        </div>
        {filteredMeds.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", fontFamily: G.fs, fontSize: 13, color: G.muted, fontStyle: "italic" }}>No records found</div>
        ) : (
          filteredMeds.map((m, i) => (
            <div key={m.id} style={{ borderBottom: i < filteredMeds.length - 1 ? `1px solid ${G.border}` : "none" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1.2fr 1.5fr 1.4fr 1fr auto", gap: 12, alignItems: "center", padding: "12px 20px" }}>
                <div>
                  <div style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 600, color: G.text }}>{m.name}</div>
                  <div style={{ fontFamily: G.fs, fontSize: 11, color: G.muted }}>{m.type || "-"}</div>
                  {m.prescribedBy && <div style={{ fontFamily: G.fs, fontSize: 11, color: G.muted }}>By {m.prescribedBy}</div>}
                </div>
                <div style={{ fontFamily: G.fs, fontSize: 12 }}>{m.dose || "-"}</div>
                <div style={{ fontFamily: G.fs, fontSize: 12 }}>{m.frequency || "-"}</div>
                <div>
                  <div style={{ fontFamily: G.fs, fontSize: 12 }}>{fmtDate(m.startDate)}</div>
                  <div style={{ fontFamily: G.fs, fontSize: 11, color: G.muted }}>→ {fmtDate(m.endDate)}</div>
                </div>
                <div style={{ fontFamily: G.fs, fontSize: 12, color: G.text }}>{m.reason || "-"}</div>
                <div>
                  <span style={{ ...statusStyle(m.status), fontFamily: G.fs, fontSize: 11, padding: "3px 9px", borderRadius: 20, textTransform: "uppercase", fontWeight: 700 }}>
                    {m.status}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="btn btn-ghost" style={{ padding: "5px 9px" }} onClick={() => { setEditMed(m); setShowMedModal(true); }}>Edit</button>
                  <button className="btn btn-ghost" style={{ padding: "5px 9px", color: "#991b1b" }} onClick={() => deleteMed(m.id)}>Delete</button>
                </div>
              </div>
              {m.notes && (
                <div style={{ padding: "8px 20px 12px", background: "#fdfaf5" }}>
                  <span style={{ fontFamily: G.fs, fontSize: 11, color: G.muted }}>Note: </span>
                  <span style={{ fontFamily: G.fs, fontSize: 12, color: G.text, fontStyle: "italic" }}>{m.notes}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showMedModal && <MedModal med={editMed} onSave={saveMed} onClose={() => { setShowMedModal(false); setEditMed(null); }} />}
    </div>
  );
}

function HealthRecordsTab({ healthRecords, setHealthRecords, healthView, setHealthView }) {
  const [form, setForm] = useState({ condition: "", severity: "medium", status: "ongoing", diagnosedDate: "", notes: "" });
  const ongoing = healthRecords.filter((r) => r.status !== "resolved");
  const resolved = healthRecords.filter((r) => r.status === "resolved");
  const visibleRecords = healthView === "resolved" ? resolved : ongoing;

  const addRecord = () => {
    if (!form.condition.trim()) return;
    setHealthRecords((prev) => [{ id: Date.now(), ...form }, ...prev]);
    setForm({ condition: "", severity: "medium", status: "ongoing", diagnosedDate: "", notes: "" });
  };

  const removeRecord = (id) => setHealthRecords((prev) => prev.filter((r) => r.id !== id));

  const severityStyle = (severity) => {
    if (severity === "high") return { background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" };
    if (severity === "medium") return { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" };
    return { background: "#d1fae5", color: "#065f46", border: "1px solid #a7f3d0" };
  };

  const statusStyle = (status) => {
    if (status === "resolved") return { background: "#dbeafe", color: "#1e40af", border: "1px solid #bfdbfe" };
    if (status === "monitoring") return { background: "#ede9fe", color: "#5b21b6", border: "1px solid #ddd6fe" };
    return { background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" };
  };

  const recordCard = (r) => (
    <div key={r.id} className="card-sm" style={{ borderLeft: `4px solid ${r.severity === "high" ? "#ef4444" : r.severity === "medium" ? "#f59e0b" : "#10b981"}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: G.ff, fontSize: 17, fontWeight: 700, color: G.text }}>{r.condition}</div>
          <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted, marginTop: 2 }}>Diagnosed: {fmtDate(r.diagnosedDate)}</div>
        </div>
        <button className="btn btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => removeRecord(r.id)}>Delete</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <span style={{ ...severityStyle(r.severity), fontFamily: G.fs, fontSize: 11, fontWeight: 700, textTransform: "uppercase", borderRadius: 20, padding: "3px 9px" }}>{r.severity}</span>
        <span style={{ ...statusStyle(r.status), fontFamily: G.fs, fontSize: 11, fontWeight: 700, textTransform: "uppercase", borderRadius: 20, padding: "3px 9px" }}>{r.status}</span>
      </div>
      <div style={{ background: G.bg, border: `1px solid ${G.border}`, borderRadius: 10, padding: "10px 12px", fontFamily: G.fs, fontSize: 12, color: G.text, lineHeight: 1.6 }}>
        {r.notes || "No additional notes."}
      </div>
    </div>
  );

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div className="card-sm" style={{ textAlign: "center" }}>
          <div style={{ fontFamily: G.ff, fontSize: 24, fontWeight: 700, color: "#991b1b" }}>{ongoing.length}</div>
          <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>Active Cases</div>
        </div>
        <div className="card-sm" style={{ textAlign: "center" }}>
          <div style={{ fontFamily: G.ff, fontSize: 24, fontWeight: 700, color: "#5b21b6" }}>{healthRecords.filter((r) => r.status === "monitoring").length}</div>
          <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>Monitoring</div>
        </div>
        <div className="card-sm" style={{ textAlign: "center" }}>
          <div style={{ fontFamily: G.ff, fontSize: 24, fontWeight: 700, color: "#1e40af" }}>{resolved.length}</div>
          <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>Resolved</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 700, marginBottom: 12, color: G.text }}>New Health Record</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
          <input className="journal-input" placeholder="Condition / diagnosis" value={form.condition} onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))} />
          <select className="journal-input" value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}><option>low</option><option>medium</option><option>high</option></select>
          <select className="journal-input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}><option>ongoing</option><option>monitoring</option><option>resolved</option></select>
          <input className="journal-input" type="date" value={form.diagnosedDate} onChange={(e) => setForm((f) => ({ ...f, diagnosedDate: e.target.value }))} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
          <input className="journal-input" placeholder="Symptoms / notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <button className="btn btn-primary" onClick={addRecord}>Add Record</button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 700, color: G.text }}>{healthView === "resolved" ? "Resolved History" : "Ongoing & Monitoring"}</h3>
          <div style={{ display: "flex", gap: 6, background: G.brownPale, padding: 4, borderRadius: 20 }}>
            {[["ongoing", `Ongoing (${ongoing.length})`], ["resolved", `Resolved (${resolved.length})`]].map(([k, label]) => (
              <button key={k} onClick={() => setHealthView(k)} style={{ fontFamily: G.fs, fontSize: 12, fontWeight: 600, border: "none", borderRadius: 18, padding: "6px 12px", cursor: "pointer", background: healthView === k ? G.brown : "transparent", color: healthView === k ? "white" : G.muted }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {visibleRecords.length === 0 ? (
          <p style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>{healthView === "resolved" ? "No resolved records yet." : "No active records."}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {visibleRecords.map(recordCard)}
          </div>
        )}
      </div>
    </div>
  );
}

function VaccineTab({ vaccines, setVaccines }) {
  const [form, setForm] = useState({ name: "", lastDate: "", nextDue: "", status: "current" });

  const addVaccine = () => {
    if (!form.name.trim()) return;
    setVaccines((prev) => [{ id: Date.now(), ...form }, ...prev]);
    setForm({ name: "", lastDate: "", nextDue: "", status: "current" });
  };

  const removeVaccine = (id) => setVaccines((prev) => prev.filter((v) => v.id !== id));

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card">
        <h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Add Vaccine</h3>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 8 }}>
          <input className="journal-input" placeholder="Vaccine name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <input className="journal-input" type="date" value={form.lastDate} onChange={(e) => setForm((f) => ({ ...f, lastDate: e.target.value }))} />
          <input className="journal-input" type="date" value={form.nextDue} onChange={(e) => setForm((f) => ({ ...f, nextDue: e.target.value }))} />
          <select className="journal-input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}><option value="current">current</option><option value="due-soon">due-soon</option></select>
          <button className="btn btn-primary" onClick={addVaccine}>Add</button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Vaccine Records</h3>
        {vaccines.map((v, i) => (
          <div key={v.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: i < vaccines.length - 1 ? `1px solid ${G.border}` : "none" }}>
            <div style={{ fontFamily: G.fs, fontSize: 13, fontWeight: 600 }}>{v.name}</div>
            <div style={{ fontFamily: G.fs, fontSize: 12 }}>{v.lastDate || "-"}</div>
            <div style={{ fontFamily: G.fs, fontSize: 12 }}>{v.nextDue || "-"}</div>
            <span style={{ fontFamily: G.fs, fontSize: 11, padding: "3px 9px", borderRadius: 20, textTransform: "uppercase", fontWeight: 700, background: v.status === "current" ? "#d1fae5" : "#fef3c7", color: v.status === "current" ? "#065f46" : "#92400e" }}>{v.status}</span>
            <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={() => removeVaccine(v.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyDogs;



