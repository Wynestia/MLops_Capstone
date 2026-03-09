import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from "recharts";

/* ── DATA ───────────────────────────────────────────────── */
const DOG = {
  name: "Mochi", breed: "Shiba Inu", dob: "2022-03-15",
  sex: "Male (Neutered)", weight: "10.2 kg", microchip: "TH-2022-984035",
  color: "Red sesame", distinguishing: "White blaze on forehead",
};
const OWNER = {
  name: "Khun Kanya Srisuk", phone: "081-234-5678",
  email: "kanya@email.com", address: "123 Sukhumvit Soi 11, Bangkok 10110",
  emergencyContact: "Khun Pong Srisuk · 089-876-5432",
};
const REPORT_META = {
  id: "PWM-2025-0310-001",
  generatedAt: "March 10, 2025 · 09:42 AM",
  period: "January 1 – March 10, 2025 (69 days)",
  generatedBy: "PawMind AI Wellness Platform v1.0",
  disclaimer: "This report was compiled by the pet owner using PawMind, an AI-assisted dog wellness tracking platform. All behavioral observations and emotion classifications are based on owner-submitted photos and journal entries. This report is intended to supplement — not replace — professional veterinary examination. AI emotion classifications carry inherent uncertainty and should be interpreted alongside clinical findings.",
};

const VITALS = [
  { label: "Last Recorded Weight", value: "10.2 kg", date: "Mar 1, 2025", status: "normal", ref: "9–11 kg (breed standard)" },
  { label: "Body Condition Score", value: "5 / 9", date: "Mar 1, 2025", status: "normal", ref: "Ideal: 4–5/9" },
];

const MOOD_TREND = [
  { week: "Jan W1", score: 2.8, happy: 2, relaxed: 2, sad: 2, angry: 1 },
  { week: "Jan W2", score: 3.2, happy: 3, relaxed: 2, sad: 1, angry: 1 },
  { week: "Jan W3", score: 2.6, happy: 1, relaxed: 2, sad: 3, angry: 1 },
  { week: "Jan W4", score: 3.0, happy: 2, relaxed: 3, sad: 1, angry: 1 },
  { week: "Feb W1", score: 3.4, happy: 3, relaxed: 2, sad: 2, angry: 0 },
  { week: "Feb W2", score: 2.9, happy: 2, relaxed: 2, sad: 2, angry: 1 },
  { week: "Feb W3", score: 3.6, happy: 4, relaxed: 2, sad: 1, angry: 0 },
  { week: "Feb W4", score: 3.8, happy: 4, relaxed: 2, sad: 1, angry: 0 },
  { week: "Mar W1", score: 3.7, happy: 3, relaxed: 3, sad: 1, angry: 0 },
];

const MOOD_DIST = [
  { name: "Happy",   value: 21, pct: 40, color: "#E6A817" },
  { name: "Relaxed", value: 18, pct: 35, color: "#3D8B5E" },
  { name: "Sad",     value: 9,  pct: 17, color: "#4A7FB5" },
  { name: "Angry",   value: 4,  pct: 8,  color: "#C0392B" },
];

const TRIGGERS = [
  { trigger: "Rainy / Stormy weather", count: 14, correlation: "sad", strength: 87, note: "Consistently elevated anxiety. Observed barking and hiding behavior." },
  { trigger: "Extended alone time (>4h)", count: 9, correlation: "sad", strength: 79, note: "Separation-related distress. Destructive behavior reported twice." },
  { trigger: "Unfamiliar visitors / strangers", count: 6, correlation: "angry", strength: 71, note: "Territorial response. Barking, stiff posture, raised hackles." },
  { trigger: "Loud sounds (fireworks, construction)", count: 5, correlation: "angry", strength: 68, note: "Startle response. Seeks hiding spots." },
  { trigger: "Outdoor walks / park visits", count: 18, correlation: "happy", strength: 92, note: "Strong positive correlation. Mood improves significantly after 30+ min walks." },
  { trigger: "Play sessions with owner", count: 22, correlation: "happy", strength: 95, note: "Highest mood elevation observed. Recommend maintaining daily play routine." },
];

const BEHAVIOR_PATTERNS = [
  { pattern: "Separation Anxiety", severity: "moderate", frequency: "Weekly", description: "Consistent low mood on days owner is away >4 hours. Journal notes describe whining and reduced appetite on these days.", recommendation: "Consider graduated desensitization training. Puzzle toys during alone time may help.", evidenceDays: 9 },
  { pattern: "Weather Sensitivity", severity: "moderate", frequency: "As triggered", description: "Strong mood correlation with rainfall detected across 14 separate events. Likely auditory/barometric pressure sensitivity.", recommendation: "White noise machine during storms. Calming supplements (consult vet) on high-risk days.", evidenceDays: 14 },
  { pattern: "Stranger Reactivity", severity: "mild", frequency: "Occasional", description: "6 angry classifications coinciding with journal entries about new people. No aggression reported, primarily vocal.", recommendation: "Controlled socialization exercises. Positive reinforcement with high-value treats during stranger exposure.", evidenceDays: 6 },
  { pattern: "Positive Exercise Response", severity: null, frequency: "Daily observed", description: "Most reliable mood elevator identified. 92% of 'Happy' classifications occur within 2 hours of a walk or active play.", recommendation: "Maintain minimum 30 min outdoor exercise daily. This is Mochi's strongest wellness factor.", evidenceDays: 22 },
];

const MEDICATIONS = [
  { name: "Bravecto (Fluralaner)", type: "Antiparasitic", dose: "250 mg tablet", freq: "Every 3 months", start: "Jan 10, 2025", end: "Apr 10, 2025", status: "active", prescribedBy: "Dr. Somchai Wanpen", reason: "Flea & tick prevention" },
  { name: "Apoquel (Oclacitinib)", type: "Antipruritic", dose: "5.4 mg", freq: "Once daily × 14 days", start: "Nov 1, 2024", end: "Nov 14, 2024", status: "completed", prescribedBy: "Dr. Somchai Wanpen", reason: "Allergic dermatitis episode" },
];

const CONDITIONS = [
  { name: "Separation Anxiety", severity: "moderate", status: "ongoing", diagnosed: "Sep 2024", symptoms: "Excessive vocalization, mild destructive behavior, reduced appetite when alone >4 hours", treatment: "Behavioral modification (in progress)", vet: "Owner observed", followUp: "Behavioral assessment recommended" },
  { name: "Allergic Dermatitis", severity: "mild", status: "resolved", diagnosed: "Nov 2024", resolved: "Nov 20, 2024", symptoms: "Pruritus, erythema on abdomen and paws, hot spots", treatment: "Apoquel 14-day course + medicated chlorhexidine shampoo twice weekly", vet: "Dr. Somchai Wanpen", followUp: "Monitor for seasonal recurrence (spring)" },
];

const VACCINES = [
  { name: "Rabies", lastGiven: "Jun 15, 2024", nextDue: "Jun 15, 2025", status: "current" },
  { name: "DHPPiL (5-in-1)", lastGiven: "Jun 15, 2024", nextDue: "Jun 15, 2025", status: "current" },
  { name: "Bordetella", lastGiven: "Mar 10, 2024", nextDue: "Mar 10, 2025", status: "overdue" },
  { name: "Leptospirosis", lastGiven: "Jun 15, 2024", nextDue: "Jun 15, 2025", status: "current" },
];

const AI_NOTES = [
  { type: "concern", text: "Wellness score declined 3 consecutive weeks in January (weeks 1–3). Owner notes indicate increased work travel during this period — consistent with separation anxiety hypothesis." },
  { type: "concern", text: "4 'Angry' classifications recorded. While frequency is low, 3 of 4 occurred in situations involving unfamiliar people. Recommend discussing reactivity management strategies." },
  { type: "positive", text: "Clear upward trend in wellness score from February onward (2.9 → 3.8 / 4.0). Owner reports establishing a consistent morning walk routine in early February." },
  { type: "positive", text: "No emergency behavioral events (severe aggression, self-harm indicators) detected across the entire monitoring period." },
  { type: "flag", text: "Bordetella vaccine is overdue as of March 10, 2025. Owner should be advised to schedule booster if dog frequents dog parks or boarding facilities." },
  { type: "flag", text: "Allergic dermatitis resolved successfully in November 2024. Spring season approaching — proactive monitoring of skin condition recommended." },
];

/* ── HELPERS ─────────────────────────────────────────────── */
function age(dob) {
  const d = new Date(dob), now = new Date();
  const y = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  return m < 0 ? `${y-1} yrs ${12+m} mos` : `${y} yrs ${m} mos`;
}

const SEV_STYLE = {
  mild:     { bg: "#FEF9C3", color: "#854D0E", border: "#FDE047" },
  moderate: { bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" },
  high:     { bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5" },
};
const CORR_COLOR = { happy:"#E6A817", relaxed:"#3D8B5E", sad:"#4A7FB5", angry:"#C0392B" };

/* ── PRINT STYLES ────────────────────────────────────────── */
const PRINT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #F7F5F0; font-family: 'IBM Plex Sans', sans-serif; color: #1A1A1A; }
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-thumb { background: #D1C4B0; border-radius: 99px; }

.fade { animation: fadeIn .3s ease; }
@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

.section {
  background: white;
  border-radius: 0;
  border: 1px solid #E8E0D4;
  margin-bottom: 0;
  page-break-inside: avoid;
}

.section-header {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 24px; border-bottom: 1px solid #E8E0D4;
  background: #FAFAF8;
}

.toc-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 8px;
  cursor: pointer; transition: all .15s;
  font-family: 'IBM Plex Sans'; font-size: 13px; font-weight: 500;
  border: none; background: transparent; text-align: left; width: 100%;
  color: #4A3728;
}
.toc-item:hover { background: #F5EFE8; color: #2C1810; }
.toc-item.active { background: #2C1810; color: white; }

.badge {
  display: inline-flex; align-items: center;
  font-family: 'IBM Plex Sans'; font-size: 10px; font-weight: 600;
  padding: 2px 8px; border-radius: 4px;
  text-transform: uppercase; letter-spacing: .5px;
}

.data-row {
  display: flex; align-items: flex-start; gap: 0;
  border-bottom: 1px solid #F0EAE0;
}
.data-row:last-child { border-bottom: none; }
.data-label {
  font-family: 'IBM Plex Sans'; font-size: 12px; font-weight: 600;
  color: #7A6552; width: 200px; flex-shrink: 0;
  padding: 11px 24px; background: #FAFAF8; border-right: 1px solid #F0EAE0;
  text-transform: uppercase; letter-spacing: .4px;
}
.data-value {
  font-family: 'IBM Plex Sans'; font-size: 13px; color: #1A1A1A;
  padding: 11px 24px; flex: 1; line-height: 1.5;
}

.flag-row {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 16px; border-radius: 10px; margin-bottom: 8px;
}

@media print {
  body { background: white !important; }
  .no-print { display: none !important; }
  .print-page { page-break-after: always; }
  nav, .sidebar { display: none !important; }
  .main-content { margin: 0 !important; padding: 0 !important; max-width: 100% !important; }
  .section { border-radius: 0; box-shadow: none !important; }
  h1, h2, h3 { page-break-after: avoid; }
}
`;

/* ── SECTION WRAPPER ─────────────────────────────────────── */
function Section({ id, icon, title, badge, badgeColor, children }) {
  return (
    <div id={id} className="section fade" style={{ borderRadius: 12, marginBottom: 20, overflow: "hidden", boxShadow: "0 1px 12px rgba(0,0,0,.05)" }}>
      <div className="section-header">
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontFamily: "'Source Serif 4',serif", fontSize: 16, fontWeight: 700, color: "#1A1A1A", flex: 1 }}>{title}</span>
        {badge && (
          <span className="badge" style={{ background: badgeColor || "#E8F5E9", color: "#1B5E20", border: "1px solid #A5D6A7" }}>{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── MAIN ────────────────────────────────────────────────── */
export default function VetReport({
  dogOverride = null,
  ownerOverride = null,
  reportMetaOverride = null,
  moodDistOverride = null,
  medicationsOverride = null,
  conditionsOverride = null,
  vaccinesOverride = null,
  onBack = null,
}) {
  const [activeSection, setActiveSection] = useState("patient");
  const dog = { ...DOG, ...(dogOverride || {}) };
  const owner = { ...OWNER, ...(ownerOverride || {}) };
  const reportMeta = { ...REPORT_META, ...(reportMetaOverride || {}) };
  const moodDist = Array.isArray(moodDistOverride) ? moodDistOverride : MOOD_DIST;
  const medications = Array.isArray(medicationsOverride) ? medicationsOverride : MEDICATIONS;
  const conditions = Array.isArray(conditionsOverride) ? conditionsOverride : CONDITIONS;
  const vaccines = Array.isArray(vaccinesOverride) ? vaccinesOverride : VACCINES;
  const sections = [
    { id: "patient",    icon: "🐾", label: "Patient & Owner" },
    { id: "vitals",     icon: "◈", label: "Vitals & Scores" },
    { id: "conditions", icon: "🩺", label: "Conditions & Meds" },
    { id: "vaccines",   icon: "💉", label: "Vaccines" },
  ];

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", background: "#F7F5F0", minHeight: "100vh" }}>
      <style>{PRINT_CSS}</style>

      {/* ── TOP BAR ── */}
      <div className="no-print" style={{ background: "white", borderBottom: "1px solid #E8E0D4", padding: "0 28px", height: 56, display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 200, boxShadow: "0 1px 8px rgba(0,0,0,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🐾</span>
          <span style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 700, fontSize: 16, color: "#2C1810" }}>PawMind</span>
          <span style={{ color: "#C4A882", fontSize: 13 }}>/</span>
          <span style={{ fontSize: 13, color: "#7A6552", fontWeight: 500 }}>Veterinary Report</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {typeof onBack === "function" && (
            <button
              onClick={onBack}
              style={{
                background: "white",
                color: "#2C1810",
                border: "1px solid #D6C5AE",
                borderRadius: 8,
                padding: "7px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'IBM Plex Sans'",
              }}
            >
              Back
            </button>
          )}
          <div style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#92400E", fontFamily: "'IBM Plex Sans'" }}>
            ⚠️ For Clinical Reference Only
          </div>
          <button onClick={() => window.print()}
            style={{ background: "#2C1810", color: "white", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'IBM Plex Sans'" }}>
            🖨️ Print Report
          </button>
        </div>
      </div>

      <div style={{ display: "flex", maxWidth: 1140, margin: "0 auto", padding: "24px 20px 56px", gap: 24, alignItems: "flex-start" }}>

        {/* ── SIDEBAR TOC ── */}
        <div className="no-print sidebar" style={{ width: 210, flexShrink: 0, position: "sticky", top: 80 }}>
          <div style={{ background: "white", borderRadius: 12, border: "1px solid #E8E0D4", overflow: "hidden", boxShadow: "0 1px 12px rgba(0,0,0,.05)" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #E8E0D4", background: "#FAFAF8" }}>
              <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 11, fontWeight: 600, color: "#9B7E5A", textTransform: "uppercase", letterSpacing: .5 }}>Contents</div>
            </div>
            <div style={{ padding: "8px" }}>
              {sections.map(s => (
                <button key={s.id} className={`toc-item ${activeSection === s.id ? "active" : ""}`}
                  onClick={() => scrollTo(s.id)}>
                  <span style={{ fontSize: 14 }}>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 12, background: "#FFF8E1", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 11, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>Report ID</div>
            <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 11, color: "#78350F", fontWeight: 500, wordBreak: "break-all" }}>{reportMeta.id}</div>
            <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 11, color: "#9B7E5A", marginTop: 4 }}>{reportMeta.generatedAt}</div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="main-content" style={{ flex: 1, minWidth: 0 }}>


          

          {/* ══ SECTION 1: PATIENT ══ */}
          <Section id="patient" icon="🐾" title="Patient & Owner Information">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              {/* Patient */}
              <div style={{ borderRight: "1px solid #F0EAE0" }}>
                <div style={{ padding: "10px 24px 6px", fontFamily: "'IBM Plex Sans'", fontSize: 11, fontWeight: 600, color: "#9B7E5A", textTransform: "uppercase", letterSpacing: .5, background: "#FAFAF8", borderBottom: "1px solid #F0EAE0" }}>Patient</div>
                {[
                  ["Full Name", dog.name],
                  ["Breed", dog.breed],
                  ["Date of Birth", "March 15, 2022"],
                  ["Age", age(dog.dob)],
                  ["Sex / Reproductive Status", dog.sex],
                  ["Weight", dog.weight],
                  ["Microchip ID", dog.microchip],
                ].map(([l, v]) => (
                  <div key={l} className="data-row">
                    <div className="data-label">{l}</div>
                    <div className="data-value">{v}</div>
                  </div>
                ))}
              </div>
              {/* Owner */}
              <div>
                <div style={{ padding: "10px 24px 6px", fontFamily: "'IBM Plex Sans'", fontSize: 11, fontWeight: 600, color: "#9B7E5A", textTransform: "uppercase", letterSpacing: .5, background: "#FAFAF8", borderBottom: "1px solid #F0EAE0" }}>Owner</div>
                {[
                  ["Full Name", owner.name],
                  ["Phone", owner.phone],
                  ["Email", owner.email],
                  ["Address", owner.address],
                  ["Emergency Contact", owner.emergencyContact],
                  ["Report Generated", reportMeta.generatedAt],
                  ["Generated By", reportMeta.generatedBy],
                ].map(([l, v]) => (
                  <div key={l} className="data-row">
                    <div className="data-label">{l}</div>
                    <div className="data-value">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ══ SECTION 2: VITALS ══ */}
          <Section id="vitals" icon="◈" title="Emotional State Distribution">
            <div style={{ padding: "18px 24px" }}>
              <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 12, fontWeight: 600, color: "#7A6552", textTransform: "uppercase", letterSpacing: .4, marginBottom: 14 }}>69-Day Overview</div>
              {moodDist.length === 0 ? (
                <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 12, color: "#7A6552" }}>
                  No mood distribution data available for this report period.
                </div>
              ) : (
                <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                  <PieChart width={120} height={120}>
                    <Pie data={moodDist} cx={55} cy={55} innerRadius={32} outerRadius={52} paddingAngle={3} dataKey="value">
                      {moodDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                  <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }}>
                    {moodDist.map(d => (
                      <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontFamily: "'IBM Plex Sans'", fontSize: 12, color: "#1A1A1A", fontWeight: 500 }}>{d.name}</span>
                            <span style={{ fontFamily: "'Source Serif 4',serif", fontSize: 13, fontWeight: 700, color: d.color }}>{d.value}d ({d.pct}%)</span>
                          </div>
                          <div style={{ height: 5, borderRadius: 99, background: "#F0EAE0", overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: 99, background: d.color, width: `${d.pct}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* ══ SECTION 6: CONDITIONS & MEDS ══ */}
          <Section id="conditions" icon="🩺" title="Medical Conditions & Medication History">
            {/* Conditions */}
            <div style={{ padding: "10px 24px 6px", fontFamily: "'IBM Plex Sans'", fontSize: 11, fontWeight: 600, color: "#9B7E5A", textTransform: "uppercase", letterSpacing: .5, background: "#FAFAF8", borderBottom: "1px solid #F0EAE0" }}>Conditions</div>
            {conditions.length === 0 && (
              <div style={{ padding: "16px 24px", fontFamily: "'IBM Plex Sans'", fontSize: 12, color: "#7A6552" }}>
                No condition records available.
              </div>
            )}
            {conditions.map((c, i) => (
              <div key={i} style={{ padding: "16px 24px", borderBottom: "1px solid #F0EAE0", borderLeft: `4px solid ${c.severity === "high" ? "#C0392B" : c.severity === "moderate" ? "#E6A817" : "#3D8B5E"}` }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontFamily: "'Source Serif 4',serif", fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>{c.name}</span>
                  {c.severity && <span className="badge" style={SEV_STYLE[c.severity]}>{c.severity}</span>}
                  <span className="badge" style={c.status === "resolved"
                    ? { background: "#E8F5E9", color: "#1B5E20", border: "1px solid #A5D6A7" }
                    : { background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" }}>
                    {c.status}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px 24px" }}>
                  {[
                    ["Diagnosed", c.diagnosed],
                    c.resolved && ["Resolved", c.resolved],
                    ["Recorded By", c.vet],
                    ["Symptoms", c.symptoms],
                  ].filter(Boolean).map(([l, v]) => (
                    <div key={l} style={{ gridColumn: l === "Symptoms" || l === "Treatment" ? "1/-1" : "auto" }}>
                      <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 11, fontWeight: 600, color: "#9B7E5A", textTransform: "uppercase", letterSpacing: .3, marginBottom: 2 }}>{l}</div>
                      <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 13, color: "#2C1810", lineHeight: 1.5 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {/* Medications table */}
            <div style={{ padding: "10px 24px 6px", fontFamily: "'IBM Plex Sans'", fontSize: 11, fontWeight: 600, color: "#9B7E5A", textTransform: "uppercase", letterSpacing: .5, background: "#FAFAF8", borderTop: "1px solid #F0EAE0", borderBottom: "1px solid #F0EAE0" }}>Medications</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'IBM Plex Sans'" }}>
              <thead>
                <tr style={{ background: "#FAFAF8" }}>
                  {["Medication","Type","Dose","Frequency","Period","Prescribed By","Status"].map(h => (
                    <th key={h} style={{ padding: "9px 10px", textAlign: "left", fontWeight: 600, color: "#7A6552", fontSize: 11, textTransform: "uppercase", letterSpacing: .4, borderBottom: "1px solid #F0EAE0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {medications.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: "12px 16px", fontFamily: "'IBM Plex Sans'", fontSize: 12, color: "#7A6552" }}>
                      No medication records available.
                    </td>
                  </tr>
                )}
                {medications.map((m, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F7F3EE", background: i % 2 === 0 ? "white" : "#FDFBF8" }}>
                    <td style={{ padding: "10px 10px", fontWeight: 600 }}>{m.name}</td>
                    <td style={{ padding: "10px 10px", color: "#7A6552" }}>{m.type}</td>
                    <td style={{ padding: "10px 10px" }}>{m.dose}</td>
                    <td style={{ padding: "10px 10px" }}>{m.freq}</td>
                    <td style={{ padding: "10px 10px", whiteSpace: "nowrap", fontSize: 11, color: "#7A6552" }}>{m.start} → {m.end || "ongoing"}</td>
                    <td style={{ padding: "10px 10px" }}>{m.prescribedBy}</td>
                    <td style={{ padding: "10px 10px" }}>
                      <span className="badge" style={m.status === "active"
                        ? { background: "#E8F5E9", color: "#1B5E20", border: "1px solid #A5D6A7" }
                        : { background: "#F5F0E8", color: "#7A6552", border: "1px solid #E8E0D4" }}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* ══ SECTION 7: VACCINES ══ */}
          <Section id="vaccines" icon="💉" title="Vaccination Record">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'IBM Plex Sans'" }}>
              <thead>
                <tr style={{ background: "#FAFAF8" }}>
                  {["Vaccine","Last Administered","Next Due","Status"].map(h => (
                    <th key={h} style={{ padding: "9px 24px", textAlign: "left", fontWeight: 600, color: "#7A6552", fontSize: 11, textTransform: "uppercase", letterSpacing: .4, borderBottom: "1px solid #F0EAE0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vaccines.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: "12px 24px", fontFamily: "'IBM Plex Sans'", fontSize: 12, color: "#7A6552" }}>
                      No vaccine records available.
                    </td>
                  </tr>
                )}
                {vaccines.map((v, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F7F3EE", background: v.status === "overdue" ? "#FFF5F5" : i % 2 === 0 ? "white" : "#FDFBF8" }}>
                    <td style={{ padding: "11px 24px", fontWeight: 600 }}>{v.name}</td>
                    <td style={{ padding: "11px 24px", color: "#5A4030" }}>{v.lastGiven}</td>
                    <td style={{ padding: "11px 24px", fontWeight: 600, color: v.status === "overdue" ? "#991B1B" : "#1B5E20" }}>{v.nextDue}</td>
                    <td style={{ padding: "11px 24px" }}>
                      <span className="badge" style={v.status === "current"
                        ? { background: "#E8F5E9", color: "#1B5E20", border: "1px solid #A5D6A7" }
                        : { background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" }}>
                        {v.status === "current" ? "✓ Current" : "⚠️ Overdue"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>


          {/* ── DISCLAIMER ── */}
          <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠️</span>
            <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 12, color: "#78350F", lineHeight: 1.65 }}>
              <strong>Disclaimer: </strong>{reportMeta.disclaimer}
            </div>
          </div>
        

        </div>
      </div>
    </div>
  );
}
