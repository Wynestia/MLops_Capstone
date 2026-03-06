import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

/* ── FONTS & GLOBAL STYLES ─────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Outfit:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #f4f1eb; font-family: 'Outfit', sans-serif; color: #1a1207; }
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-thumb { background: #d4c4a8; border-radius: 99px; }

.fade-in { animation: fadeUp .35s ease both; }
@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

.section-card {
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid #ede6d8;
  box-shadow: 0 2px 18px rgba(90,60,20,.06);
  overflow: hidden;
}

.input-field {
  width: 100%;
  background: #faf8f4;
  border: 1.5px solid #e8dfd0;
  border-radius: 10px;
  padding: 9px 13px;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  color: #1a1207;
  outline: none;
  transition: border-color .2s, background .2s;
}
.input-field:focus { border-color: #8b5e2a; background: #fff; }
.input-field::placeholder { color: #c4b49a; }

.btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 18px; border-radius: 10px;
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600;
  cursor: pointer; border: none; transition: all .2s;
  white-space: nowrap;
}
.btn:hover { transform: translateY(-1px); }
.btn-brown { background: linear-gradient(135deg, #6b3f1a, #9b6030); color: white; box-shadow: 0 4px 14px rgba(107,63,26,.28); }
.btn-outline { background: transparent; border: 1.5px solid #d4c4a8; color: #6b3f1a; }
.btn-outline:hover { background: #fdf8f0; }
.btn-danger { background: #fff0f0; color: #c0392b; border: 1.5px solid #f5c6c6; }
.btn-danger:hover { background: #ffe4e4; }
.btn-teal { background: linear-gradient(135deg, #0f6b6b, #1a9090); color: white; box-shadow: 0 4px 14px rgba(15,107,107,.22); }
.btn-sm { padding: 6px 12px; font-size: 12px; }

.tab-pill {
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500;
  padding: 8px 20px; border-radius: 20px; border: none; cursor: pointer;
  transition: all .2s; background: transparent; color: #9a7e60;
}
.tab-pill.active { background: #6b3f1a; color: white; box-shadow: 0 3px 12px rgba(107,63,26,.28); }
.tab-pill:hover:not(.active) { background: #f0e8d8; color: #6b3f1a; }

.status-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 600;
  padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: .4px;
}

.table-row { display: grid; align-items: center; gap: 12px; padding: 12px 20px; transition: background .15s; }
.table-row:hover { background: #fdf9f4; }
.table-header { display: grid; align-items: center; gap: 12px; padding: 10px 20px; background: #f7f2ea; border-bottom: 1px solid #ede6d8; }

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.45); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center; z-index: 999; padding: 20px;
}
.modal-box {
  background: white; border-radius: 20px; padding: 28px;
  width: 100%; max-width: 520px;
  box-shadow: 0 20px 60px rgba(0,0,0,.25); animation: fadeUp .25s ease;
  max-height: 90vh; overflow-y: auto;
}

.print-area { display: none; }
@media print {
  body * { visibility: hidden !important; }
  .print-area, .print-area * { visibility: visible !important; display: block !important; }
  .print-area { position: fixed; left: 0; top: 0; width: 100%; }
  .no-print { display: none !important; }
}

.severity-high   { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
.severity-medium { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
.severity-low    { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
.severity-resolved { background: #e0e7ff; color: #3730a3; border: 1px solid #a5b4fc; }

.view-toggle-wrap {
  display: flex; gap: 6px; background: #f0e8d8; padding: 5px; border-radius: 22px;
}
.view-toggle {
  display: flex; align-items: center; gap: 6px;
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500;
  padding: 7px 18px; border-radius: 18px; border: none; cursor: pointer; transition: all .2s;
  background: transparent; color: #9a7e60;
}
.view-toggle.active { background: white; color: #6b3f1a; box-shadow: 0 2px 10px rgba(107,63,26,.15); }
`;

/* ── MOCK DATA ──────────────────────────────────────────── */
const DOG = {
  name: "Mochi", breed: "Shiba Inu", dob: "2022-03-15",
  sex: "Male", weight: "10.2 kg", microchip: "TH-2022-984035",
  owner: "Khun Kanya Srisuk", ownerPhone: "081-234-5678",
  ownerEmail: "kanya@email.com",
};

const MOOD_TREND = [
  { month: "Oct", score: 3.1 }, { month: "Nov", score: 2.8 },
  { month: "Dec", score: 3.4 }, { month: "Jan", score: 2.6 },
  { month: "Feb", score: 3.0 }, { month: "Mar", score: 3.7 },
];

const MOOD_DIST = [
  { name: "Happy", value: 14, color: "#f59e0b" },
  { name: "Relaxed", value: 10, color: "#34d399" },
  { name: "Sad", value: 7,  color: "#60a5fa" },
  { name: "Angry", value: 5, color: "#f87171" },
];

const INIT_MEDS = [
  { id: 1, name: "Apoquel (Oclacitinib)", type: "Antipruritic", dose: "5.4 mg", frequency: "Once daily", startDate: "2024-11-01", endDate: "2024-11-14", status: "completed", prescribedBy: "Dr. Somchai", reason: "Allergic dermatitis", notes: "Good response, itching reduced after day 3" },
  { id: 2, name: "Bravecto", type: "Antiparasitic", dose: "250 mg", frequency: "Every 3 months", startDate: "2025-01-10", endDate: "2025-04-10", status: "active", prescribedBy: "Dr. Somchai", reason: "Flea & tick prevention", notes: "" },
  { id: 3, name: "Cephalexin", type: "Antibiotic", dose: "250 mg", frequency: "Twice daily", startDate: "2024-08-05", endDate: "2024-08-19", status: "completed", prescribedBy: "Dr. Napat", reason: "Skin infection (pyoderma)", notes: "Completed full course. No side effects observed." },
];

const INIT_ILLNESSES = [
  { id: 1, condition: "Allergic Dermatitis", severity: "medium", diagnosedDate: "2024-11-01", resolvedDate: "2024-11-20", status: "resolved", symptoms: "Itching, redness, hot spots on belly and paws", treatment: "Apoquel 14-day course + medicated shampoo", vet: "Dr. Somchai", followUp: "Monitor for recurrence in spring", notes: "Suspected trigger: grass pollen" },
  { id: 2, condition: "Separation Anxiety", severity: "medium", diagnosedDate: "2024-09-10", resolvedDate: null, status: "ongoing", symptoms: "Excessive barking, destructive behavior when left alone", treatment: "Behavioral training + calming supplements", vet: "Owner observed", followUp: "Re-evaluate in 3 months", notes: "Worse on rainy days or after schedule changes" },
  { id: 3, condition: "Skin Infection (Pyoderma)", severity: "high", diagnosedDate: "2024-08-01", resolvedDate: "2024-08-25", status: "resolved", symptoms: "Pustules, crusting on lower back", treatment: "Cephalexin 14 days + topical spray", vet: "Dr. Napat", followUp: "None required", notes: "" },
];

const VACCINES = [
  { name: "Rabies", date: "2024-06-15", nextDue: "2025-06-15", status: "current" },
  { name: "DHPPiL (5-in-1)", date: "2024-06-15", nextDue: "2025-06-15", status: "current" },
  { name: "Bordetella", date: "2024-03-10", nextDue: "2025-03-10", status: "due-soon" },
  { name: "Leptospirosis", date: "2024-06-15", nextDue: "2025-06-15", status: "current" },
];

/* ── HELPER ─────────────────────────────────────────────── */
function age(dob) {
  const d = new Date(dob), now = new Date();
  const y = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  return m < 0 ? `${y - 1}y ${12 + m}m` : `${y}y ${m}m`;
}
function fmt(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }); }
const S = (obj) => Object.entries(obj).map(([k,v]) => `${k}:${v}`).join(";");

/* ── MODALS ─────────────────────────────────────────────── */
function MedModal({ med, onSave, onClose }) {
  const [form, setForm] = useState(med || { name:"", type:"", dose:"", frequency:"", startDate:"", endDate:"", status:"active", prescribedBy:"", reason:"", notes:"" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, marginBottom:20, color:"#1a1207" }}>
          {med ? "✏️ Edit Medication" : "💊 Add Medication"}
        </h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {[["name","Medicine Name","text","e.g. Apoquel"],["type","Type / Category","text","e.g. Antibiotic"],
            ["dose","Dosage","text","e.g. 5.4 mg"],["frequency","Frequency","text","e.g. Once daily"],
            ["startDate","Start Date","date",""],["endDate","End Date (optional)","date",""],
            ["prescribedBy","Prescribed By","text","e.g. Dr. Somchai"],["reason","Reason / Indication","text","e.g. Skin infection"],
          ].map(([k,label,type,ph]) => (
            <div key={k}>
              <label style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:600, color:"#5a3a1a", display:"block", marginBottom:5 }}>{label}</label>
              <input className="input-field" type={type} placeholder={ph} value={form[k]} onChange={e => set(k, e.target.value)}/>
            </div>
          ))}
          <div>
            <label style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:600, color:"#5a3a1a", display:"block", marginBottom:5 }}>Status</label>
            <select className="input-field" value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>
          <div style={{ gridColumn:"1/-1" }}>
            <label style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:600, color:"#5a3a1a", display:"block", marginBottom:5 }}>Notes</label>
            <textarea className="input-field" rows={2} style={{ resize:"vertical" }} placeholder="Observations, side effects, response..." value={form.notes} onChange={e => set("notes", e.target.value)}/>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:20, justifyContent:"flex-end" }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-brown" onClick={() => { if (form.name) onSave(form); }}>Save Medication</button>
        </div>
      </div>
    </div>
  );
}

function IllnessModal({ illness, onSave, onClose }) {
  const [form, setForm] = useState(illness || { condition:"", severity:"medium", diagnosedDate:"", resolvedDate:"", status:"ongoing", symptoms:"", treatment:"", vet:"", followUp:"", notes:"" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, marginBottom:20, color:"#1a1207" }}>
          {illness ? "✏️ Edit Health Record" : "🩺 Add Health Record"}
        </h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <div style={{ gridColumn:"1/-1" }}>
            <label style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:600, color:"#5a3a1a", display:"block", marginBottom:5 }}>Condition / Diagnosis</label>
            <input className="input-field" placeholder="e.g. Allergic Dermatitis" value={form.condition} onChange={e => set("condition", e.target.value)}/>
          </div>
          <div>
            <label style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:600, color:"#5a3a1a", display:"block", marginBottom:5 }}>Severity</label>
            <select className="input-field" value={form.severity} onChange={e => set("severity", e.target.value)}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </div>
          <div>
            <label style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:600, color:"#5a3a1a", display:"block", marginBottom:5 }}>Status</label>
            <select className="input-field" value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="ongoing">Ongoing</option><option value="resolved">Resolved</option><option value="monitoring">Monitoring</option>
            </select>
          </div>
          <div>
            <label style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:600, color:"#5a3a1a", display:"block", marginBottom:5 }}>Date Diagnosed</label>
            <input className="input-field" type="date" value={form.diagnosedDate} onChange={e => set("diagnosedDate", e.target.value)}/>
          </div>
          <div>
            <label style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:600, color:"#5a3a1a", display:"block", marginBottom:5 }}>Date Resolved</label>
            <input className="input-field" type="date" value={form.resolvedDate||""} onChange={e => set("resolvedDate", e.target.value)}/>
          </div>
          <div>
            <label style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:600, color:"#5a3a1a", display:"block", marginBottom:5 }}>Veterinarian</label>
            <input className="input-field" placeholder="e.g. Dr. Somchai" value={form.vet} onChange={e => set("vet", e.target.value)}/>
          </div>
          <div>
            <label style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:600, color:"#5a3a1a", display:"block", marginBottom:5 }}>Follow-up Notes</label>
            <input className="input-field" placeholder="Next steps..." value={form.followUp} onChange={e => set("followUp", e.target.value)}/>
          </div>
          <div style={{ gridColumn:"1/-1" }}>
            <label style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:600, color:"#5a3a1a", display:"block", marginBottom:5 }}>Symptoms Observed</label>
            <textarea className="input-field" rows={2} style={{ resize:"vertical" }} placeholder="Describe symptoms..." value={form.symptoms} onChange={e => set("symptoms", e.target.value)}/>
          </div>
          <div style={{ gridColumn:"1/-1" }}>
            <label style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:600, color:"#5a3a1a", display:"block", marginBottom:5 }}>Treatment Given</label>
            <textarea className="input-field" rows={2} style={{ resize:"vertical" }} placeholder="Medications, procedures, therapy..." value={form.treatment} onChange={e => set("treatment", e.target.value)}/>
          </div>
          <div style={{ gridColumn:"1/-1" }}>
            <label style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:600, color:"#5a3a1a", display:"block", marginBottom:5 }}>Additional Notes</label>
            <textarea className="input-field" rows={2} style={{ resize:"vertical" }} placeholder="Owner observations, suspected triggers..." value={form.notes} onChange={e => set("notes", e.target.value)}/>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:20, justifyContent:"flex-end" }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-brown" onClick={() => { if (form.condition) onSave(form); }}>Save Record</button>
        </div>
      </div>
    </div>
  );
}

/* ── PRINT / VET REPORT ─────────────────────────────────── */
function VetReportPreview({ dog, meds, illnesses, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "white", borderRadius: 20, width: "100%", maxWidth: 760,
        maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)",
        animation: "fadeUp .25s ease",
      }}>
        {/* Header bar */}
        <div style={{ background: "linear-gradient(135deg, #0f4c4c, #1a7070)", padding: "18px 28px", borderRadius: "20px 20px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "white" }}>🏥 Veterinary Health Report</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "rgba(255,255,255,.7)", marginTop: 3 }}>PawMind · Generated {new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"long", year:"numeric" })}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-sm" style={{ background: "rgba(255,255,255,.15)", color: "white", border: "1px solid rgba(255,255,255,.25)" }} onClick={() => window.print()}>🖨 Print</button>
            <button className="btn btn-sm btn-outline" style={{ background: "rgba(255,255,255,.1)", color: "white", border: "1px solid rgba(255,255,255,.2)" }} onClick={onClose}>✕</button>
          </div>
        </div>

        <div style={{ padding: "28px" }}>
          {/* Patient info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24, background: "#f8fafa", borderRadius: 14, padding: "18px 20px", border: "1px solid #d1e8e8" }}>
            <div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 600, color: "#0f6b6b", textTransform: "uppercase", letterSpacing: .5, marginBottom: 10 }}>Patient Information</div>
              {[["Name", dog.name], ["Breed", dog.breed], ["Date of Birth", fmt(dog.dob)], ["Age", age(dog.dob)], ["Sex", dog.sex], ["Weight", dog.weight], ["Microchip", dog.microchip]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#6b8a8a", width: 90, flexShrink: 0 }}>{l}</span>
                  <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 500, color: "#1a1207" }}>{v}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 600, color: "#0f6b6b", textTransform: "uppercase", letterSpacing: .5, marginBottom: 10 }}>Owner Contact</div>
              {[["Name", dog.owner], ["Phone", dog.ownerPhone], ["Email", dog.ownerEmail]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#6b8a8a", width: 90, flexShrink: 0 }}>{l}</span>
                  <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 500, color: "#1a1207" }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: "10px 14px", background: "#fff3cd", borderRadius: 10, border: "1px solid #ffc107" }}>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 600, color: "#856404" }}>⚠️ Disclaimer</div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#856404", lineHeight: 1.5, marginTop: 4 }}>
                  This report was compiled by the owner using PawMind and is not a substitute for professional veterinary diagnosis.
                </div>
              </div>
            </div>
          </div>

          {/* Active conditions */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: "#1a1207", marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid #e8dfd0" }}>
              🩺 Current & Ongoing Conditions
            </div>
            {illnesses.filter(i => i.status !== "resolved").length === 0
              ? <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: "#9a7e60", fontStyle: "italic" }}>No ongoing conditions recorded.</div>
              : illnesses.filter(i => i.status !== "resolved").map((ill, idx) => (
                <div key={idx} style={{ background: "#fefcf9", border: "1px solid #e8dfd0", borderLeft: `4px solid ${ill.severity==="high"?"#e74c3c":ill.severity==="medium"?"#f39c12":"#27ae60"}`, borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, color: "#1a1207" }}>{ill.condition}</span>
                    <span className={`status-badge severity-${ill.severity}`}>{ill.severity}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                    {[["Diagnosed", fmt(ill.diagnosedDate)], ["Veterinarian", ill.vet||"Owner recorded"], ["Symptoms", ill.symptoms], ["Treatment", ill.treatment], ["Follow-up", ill.followUp]].map(([l,v]) => v && (
                      <div key={l} style={{ display: "flex", gap: 6, gridColumn: l==="Symptoms"||l==="Treatment"?"1/-1":"auto" }}>
                        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#9a7e60", flexShrink: 0, paddingTop: 1 }}>{l}:</span>
                        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#1a1207", lineHeight: 1.5 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            }
          </div>

          {/* Medication list */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: "#1a1207", marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid #e8dfd0" }}>
              💊 Medication History
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>
              <thead>
                <tr style={{ background: "#f7f2ea" }}>
                  {["Medicine", "Dose", "Frequency", "Period", "Reason", "Status"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#5a3a1a", fontSize: 11, textTransform: "uppercase", letterSpacing: .4 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {meds.map((m, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f0e8d8", background: i%2===0?"white":"#fdfaf6" }}>
                    <td style={{ padding: "9px 12px", fontWeight: 500 }}>{m.name}<div style={{ color: "#9a7e60", fontSize: 11 }}>{m.type}</div></td>
                    <td style={{ padding: "9px 12px" }}>{m.dose}</td>
                    <td style={{ padding: "9px 12px" }}>{m.frequency}</td>
                    <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>{fmt(m.startDate)}<br/><span style={{ color: "#9a7e60" }}>→ {fmt(m.endDate)||"ongoing"}</span></td>
                    <td style={{ padding: "9px 12px" }}>{m.reason}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <span style={{ fontWeight: 600, color: m.status==="active"?"#0f6b6b":m.status==="completed"?"#6b3f1a":"#9a7e60" }}>
                        {m.status.charAt(0).toUpperCase()+m.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vaccines */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: "#1a1207", marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid #e8dfd0" }}>
              💉 Vaccination Record
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {VACCINES.map((v, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 14px", background: v.status==="due-soon"?"#fef9e7":"#f0faf9", borderRadius: 8, border: `1px solid ${v.status==="due-soon"?"#f7dc6f":"#a8d5d5"}` }}>
                  <div>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 500 }}>{v.name}</div>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#9a7e60" }}>Given: {fmt(v.date)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#9a7e60" }}>Next due</div>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600, color: v.status==="due-soon"?"#b7770d":"#0f6b6b" }}>{fmt(v.nextDue)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Behavioral note */}
          <div style={{ background: "#f0f7ff", border: "1px solid #bcd4f0", borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, color: "#1a4a7a", marginBottom: 8 }}>🧠 Behavioral & Mental Wellness Summary</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: "#1a4a7a", lineHeight: 1.7 }}>
              Over the past 6 months, Mochi has shown <strong>predominantly positive mood patterns</strong> (Happy: 38%, Relaxed: 28%). Notable periods of sadness correlated with rainy weather and extended alone time. Known behavioral concern: <strong>Separation Anxiety</strong> (ongoing, under behavioral management). Recommend discussing anxiety management strategies at next appointment.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── MAIN COMPONENT ─────────────────────────────────────── */
export default function ReportPage() {
  const [view, setView] = useState("owner"); // "owner" | "vet-preview"
  const [activeSection, setActiveSection] = useState("overview");
  const [meds, setMeds] = useState(INIT_MEDS);
  const [illnesses, setIllnesses] = useState(INIT_ILLNESSES);
  const [showMedModal, setShowMedModal] = useState(false);
  const [editMed, setEditMed] = useState(null);
  const [showIllModal, setShowIllModal] = useState(false);
  const [editIll, setEditIll] = useState(null);
  const [showVetReport, setShowVetReport] = useState(false);
  const [medFilter, setMedFilter] = useState("all");

  const saveMed = (form) => {
    if (editMed) setMeds(m => m.map(x => x.id === editMed.id ? { ...form, id: editMed.id } : x));
    else setMeds(m => [...m, { ...form, id: Date.now() }]);
    setShowMedModal(false); setEditMed(null);
  };
  const deleteMed = (id) => setMeds(m => m.filter(x => x.id !== id));
  const saveIll = (form) => {
    if (editIll) setIllnesses(m => m.map(x => x.id === editIll.id ? { ...form, id: editIll.id } : x));
    else setIllnesses(m => [...m, { ...form, id: Date.now() }]);
    setShowIllModal(false); setEditIll(null);
  };
  const deleteIll = (id) => setIllnesses(m => m.filter(x => x.id !== id));

  const filteredMeds = medFilter === "all" ? meds : meds.filter(m => m.status === medFilter);
  const activeMeds = meds.filter(m => m.status === "active");
  const ongoingIll = illnesses.filter(i => i.status !== "resolved");

  return (
    <div style={{ fontFamily:"'Outfit',sans-serif", background:"#f4f1eb", minHeight:"100vh" }}>
      <style>{STYLES}</style>

      {/* ── TOP BAR ── */}
      <div style={{ background:"white", borderBottom:"1px solid #ede6d8", padding:"0 32px", height:58, display:"flex", alignItems:"center", boxShadow:"0 1px 12px rgba(90,60,20,.06)", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginRight:32 }}>
          <span style={{ fontSize:20 }}>🐾</span>
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16, color:"#6b3f1a" }}>PawMind</span>
        </div>
        <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:"#b4976a" }}>/ Reports /</span>
        <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:"#1a1207", fontWeight:600, marginLeft:6 }}>Mochi</span>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:12 }}>
          <div className="view-toggle-wrap">
            <button className={`view-toggle ${view==="owner"?"active":""}`} onClick={() => setView("owner")}>👤 Owner View</button>
            <button className={`view-toggle ${view==="vet"?"active":""}`} onClick={() => setView("vet")}>🏥 Vet Summary</button>
          </div>
          <button className="btn btn-teal btn-sm" onClick={() => setShowVetReport(true)}>📋 Export Report</button>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"28px 32px 56px" }}>

        {/* ── DOG HEADER ── */}
        <div className="section-card fade-in" style={{ marginBottom:24, padding:"24px 28px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <div style={{ width:68, height:68, borderRadius:"50%", background:"linear-gradient(135deg,#f59e0b40,#f59e0b20)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, border:"2.5px solid #f59e0b60", flexShrink:0 }}>🐕</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:5 }}>
                <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:"#1a1207" }}>{DOG.name}</h1>
                <span className="status-badge" style={{ background:"#fef3c7", color:"#92400e", border:"1px solid #fde68a" }}>😄 Happy today</span>
                {activeMeds.length > 0 && <span className="status-badge" style={{ background:"#dbeafe", color:"#1e40af", border:"1px solid #93c5fd" }}>💊 {activeMeds.length} active med{activeMeds.length>1?"s":""}</span>}
                {ongoingIll.length > 0 && <span className="status-badge" style={{ background:"#fee2e2", color:"#991b1b", border:"1px solid #fca5a5" }}>⚠️ {ongoingIll.length} ongoing</span>}
              </div>
              <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
                {[["Breed",DOG.breed],["Age",age(DOG.dob)],["Sex",DOG.sex],["Weight",DOG.weight],["Microchip",DOG.microchip]].map(([l,v]) => (
                  <div key={l} style={{ fontFamily:"'Outfit',sans-serif", fontSize:12 }}>
                    <span style={{ color:"#b4976a" }}>{l} </span><span style={{ color:"#1a1207", fontWeight:500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:"#b4976a", marginBottom:4 }}>Report generated</div>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:600, color:"#1a1207" }}>{new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"})}</div>
            </div>
          </div>
        </div>

        {/* ── SECTION TABS ── */}
        <div style={{ display:"flex", gap:4, background:"#ede6d8", padding:5, borderRadius:24, marginBottom:24, width:"fit-content" }}>
          {[["overview","📊 Overview"],["medications","💊 Medications"],["illnesses","🩺 Health Records"],["vaccines","💉 Vaccines"]].map(([k,l]) => (
            <button key={k} className={`tab-pill ${activeSection===k?"active":""}`} onClick={() => setActiveSection(k)}>{l}</button>
          ))}
        </div>

        {/* ════ OVERVIEW ════ */}
        {activeSection === "overview" && (
          <div className="fade-in" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            {/* Mood trend */}
            <div className="section-card" style={{ padding:"22px 24px" }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:"#1a1207", marginBottom:4 }}>Mood Trend — 6 Months</h3>
              <p style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:"#b4976a", marginBottom:16 }}>Average wellness score per month</p>
              <ResponsiveContainer width="100%" height={130}>
                <AreaChart data={MOOD_TREND} margin={{ left:-28, right:8, top:4, bottom:0 }}>
                  <defs>
                    <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5e2a" stopOpacity={.18}/>
                      <stop offset="95%" stopColor="#8b5e2a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize:11, fill:"#b4976a", fontFamily:"'Outfit',sans-serif" }} axisLine={false} tickLine={false}/>
                  <YAxis domain={[1,5]} hide/>
                  <Tooltip contentStyle={{ fontFamily:"'Outfit',sans-serif", fontSize:12, borderRadius:10, border:"1px solid #e8dfd0" }} formatter={v => [v.toFixed(1)+" / 5.0", "Wellness score"]}/>
                  <Area type="monotone" dataKey="score" stroke="#8b5e2a" strokeWidth={2.5} fill="url(#tg)"
                    dot={({ cx, cy }) => <circle key={cx} cx={cx} cy={cy} r={5} fill="#8b5e2a" stroke="white" strokeWidth={2}/>}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Mood distribution */}
            <div className="section-card" style={{ padding:"22px 24px" }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:"#1a1207", marginBottom:4 }}>Mood Distribution</h3>
              <p style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:"#b4976a", marginBottom:8 }}>Past 30 days · 36 analyses</p>
              <div style={{ display:"flex", alignItems:"center" }}>
                <PieChart width={130} height={130}>
                  <Pie data={MOOD_DIST} cx={60} cy={60} innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">
                    {MOOD_DIST.map((e,i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                </PieChart>
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:7, marginLeft:8 }}>
                  {MOOD_DIST.map(d => (
                    <div key={d.name} style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:10, height:10, borderRadius:2, background:d.color, flexShrink:0 }}/>
                      <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, flex:1 }}>{d.name}</span>
                      <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:600, color:"#1a1207" }}>{d.value}d</span>
                      <div style={{ width:48, height:5, borderRadius:99, background:"#ede6d8", overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${(d.value/36)*100}%`, background:d.color, borderRadius:99 }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="section-card" style={{ padding:"22px 24px" }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:"#1a1207", marginBottom:14 }}>Health At a Glance</h3>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[
                  { icon:"💊", label:"Active medications", val:activeMeds.length, color:"#1e40af", bg:"#dbeafe" },
                  { icon:"⚠️", label:"Ongoing conditions", val:ongoingIll.length, color:"#991b1b", bg:"#fee2e2" },
                  { icon:"✅", label:"Resolved conditions", val:illnesses.filter(i=>i.status==="resolved").length, color:"#065f46", bg:"#d1fae5" },
                  { icon:"💉", label:"Vaccines current", val:VACCINES.filter(v=>v.status==="current").length+"/"+VACCINES.length, color:"#0f6b6b", bg:"#d4f0f0" },
                ].map(s => (
                  <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:22 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:s.color }}>{s.val}</div>
                      <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:s.color, opacity:.8 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active meds quick view */}
            <div className="section-card" style={{ padding:"22px 24px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:"#1a1207" }}>Current Medications</h3>
                <button className="btn btn-sm btn-outline" onClick={() => setActiveSection("medications")}>View all →</button>
              </div>
              {activeMeds.length === 0
                ? <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:"#b4976a", fontStyle:"italic" }}>No active medications</div>
                : activeMeds.map(m => (
                  <div key={m.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid #f0e8d8" }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:"#dbeafe", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>💊</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:600, color:"#1a1207" }}>{m.name}</div>
                      <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:"#b4976a" }}>{m.dose} · {m.frequency}</div>
                    </div>
                    <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:"#0f6b6b", fontWeight:600 }}>Until {fmt(m.endDate)||"ongoing"}</div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ════ MEDICATIONS ════ */}
        {activeSection === "medications" && (
          <div className="fade-in">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ display:"flex", gap:6 }}>
                {[["all","All"],["active","Active"],["completed","Completed"],["discontinued","Discontinued"]].map(([k,l]) => (
                  <button key={k} onClick={() => setMedFilter(k)} style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:500, padding:"6px 14px", borderRadius:20, border:"1.5px solid #e8dfd0", background:medFilter===k?"#6b3f1a":"white", color:medFilter===k?"white":"#9a7e60", cursor:"pointer", transition:"all .15s" }}>{l}</button>
                ))}
              </div>
              <button className="btn btn-brown btn-sm" onClick={() => { setEditMed(null); setShowMedModal(true); }}>+ Add Medication</button>
            </div>

            <div className="section-card">
              <div className="table-header" style={{ gridTemplateColumns:"2.5fr 1fr 1.4fr 1.6fr 1.2fr 1fr auto" }}>
                {["Medicine","Dose","Frequency","Period","Reason","Status",""].map(h => (
                  <span key={h} style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, fontWeight:600, color:"#8b6a40", textTransform:"uppercase", letterSpacing:.4 }}>{h}</span>
                ))}
              </div>
              {filteredMeds.length === 0
                ? <div style={{ padding:"32px", textAlign:"center", fontFamily:"'Outfit',sans-serif", fontSize:13, color:"#b4976a", fontStyle:"italic" }}>No records found</div>
                : filteredMeds.map((m, i) => (
                  <div key={m.id}>
                    <div className="table-row" style={{ gridTemplateColumns:"2.5fr 1fr 1.4fr 1.6fr 1.2fr 1fr auto", borderBottom:"1px solid #f5efe5" }}>
                      <div>
                        <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:600, color:"#1a1207" }}>{m.name}</div>
                        <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:"#b4976a" }}>{m.type}</div>
                        {m.prescribedBy && <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:"#9a7e60" }}>By {m.prescribedBy}</div>}
                      </div>
                      <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:500 }}>{m.dose}</div>
                      <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:"#5a3a1a" }}>{m.frequency}</div>
                      <div>
                        <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12 }}>{fmt(m.startDate)}</div>
                        <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:"#b4976a" }}>→ {fmt(m.endDate)||"ongoing"}</div>
                      </div>
                      <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:"#5a3a1a" }}>{m.reason}</div>
                      <div>
                        <span className="status-badge" style={m.status==="active"?{ background:"#d4f0f0", color:"#0f6b6b", border:"1px solid #a8d5d5" }:m.status==="completed"?{ background:"#d1fae5", color:"#065f46", border:"1px solid #6ee7b7" }:{ background:"#f5f5f5", color:"#6b7280", border:"1px solid #d1d5db" }}>
                          {m.status==="active"?"● Active":m.status==="completed"?"✓ Done":"– Disc."}
                        </span>
                      </div>
                      <div style={{ display:"flex", gap:4 }}>
                        <button className="btn btn-sm btn-outline" style={{ padding:"5px 9px" }} onClick={() => { setEditMed(m); setShowMedModal(true); }}>✏️</button>
                        <button className="btn btn-sm btn-danger" style={{ padding:"5px 9px" }} onClick={() => deleteMed(m.id)}>🗑</button>
                      </div>
                    </div>
                    {m.notes && (
                      <div style={{ padding:"8px 20px 12px", background:"#fdfaf5", borderBottom:"1px solid #f5efe5" }}>
                        <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:"#b4976a" }}>Note: </span>
                        <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:"#5a3a1a", fontStyle:"italic" }}>{m.notes}</span>
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ════ HEALTH RECORDS ════ */}
        {activeSection === "illnesses" && (
          <div className="fade-in">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"#1a1207" }}>Health & Illness Records</h2>
                <p style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:"#b4976a", marginTop:2 }}>Owner-recorded conditions and veterinary diagnoses</p>
              </div>
              <button className="btn btn-brown btn-sm" onClick={() => { setEditIll(null); setShowIllModal(true); }}>+ Add Record</button>
            </div>

            {/* Ongoing */}
            {ongoingIll.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <h3 style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:600, color:"#991b1b", textTransform:"uppercase", letterSpacing:.5, marginBottom:10 }}>⚠️ Ongoing / Active</h3>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {ongoingIll.map(ill => (
                    <div key={ill.id} className="section-card" style={{ padding:"18px 20px", borderLeft:`5px solid ${ill.severity==="high"?"#e74c3c":ill.severity==="medium"?"#f39c12":"#27ae60"}` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <h4 style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:"#1a1207" }}>{ill.condition}</h4>
                          <span className={`status-badge severity-${ill.severity}`}>{ill.severity}</span>
                          <span className="status-badge" style={{ background:"#fce8ff", color:"#7e22ce", border:"1px solid #e9d5ff" }}>{ill.status}</span>
                        </div>
                        <div style={{ display:"flex", gap:6 }}>
                          <button className="btn btn-sm btn-outline" onClick={() => { setEditIll(ill); setShowIllModal(true); }}>✏️ Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => deleteIll(ill.id)}>🗑</button>
                        </div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 24px" }}>
                        {[["📅 Diagnosed",fmt(ill.diagnosedDate)],["👨‍⚕️ Recorded by",ill.vet||"Owner"],["🤒 Symptoms",ill.symptoms],["💊 Treatment",ill.treatment],["🔄 Follow-up",ill.followUp]].map(([l,v]) => v && (
                          <div key={l} style={{ gridColumn:l.includes("Symptoms")||l.includes("Treatment")?"1/-1":"auto" }}>
                            <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:"#b4976a", display:"block", marginBottom:2 }}>{l}</span>
                            <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:"#1a1207", lineHeight:1.5 }}>{v}</span>
                          </div>
                        ))}
                        {ill.notes && (
                          <div style={{ gridColumn:"1/-1", background:"#fdfaf5", borderRadius:8, padding:"8px 12px" }}>
                            <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:"#b4976a" }}>Owner note: </span>
                            <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:"#5a3a1a", fontStyle:"italic" }}>{ill.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolved */}
            {illnesses.filter(i=>i.status==="resolved").length > 0 && (
              <div>
                <h3 style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:600, color:"#065f46", textTransform:"uppercase", letterSpacing:.5, marginBottom:10 }}>✅ Resolved</h3>
                <div className="section-card">
                  {illnesses.filter(i=>i.status==="resolved").map((ill, idx, arr) => (
                    <div key={ill.id} style={{ padding:"14px 20px", borderBottom:idx<arr.length-1?"1px solid #f5efe5":"none", display:"flex", alignItems:"flex-start", gap:14 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:"#d1fae5", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>✅</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                          <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:14, fontWeight:600, color:"#1a1207" }}>{ill.condition}</span>
                          <span className={`status-badge severity-${ill.severity}`} style={{ fontSize:10 }}>{ill.severity}</span>
                        </div>
                        <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:"#b4976a" }}>
                          {fmt(ill.diagnosedDate)} → {fmt(ill.resolvedDate)} · {ill.vet||"Owner recorded"}
                        </div>
                        <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:"#5a3a1a", marginTop:4 }}>{ill.symptoms}</div>
                      </div>
                      <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => { setEditIll(ill); setShowIllModal(true); }}>✏️</button>
                        <button className="btn btn-sm btn-danger" onClick={() => deleteIll(ill.id)}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {illnesses.length === 0 && (
              <div className="section-card" style={{ padding:"48px", textAlign:"center" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🩺</div>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:16, color:"#1a1207" }}>No health records yet</p>
                <p style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:"#b4976a", marginTop:4 }}>Start recording conditions to build a complete health history</p>
              </div>
            )}
          </div>
        )}

        {/* ════ VACCINES ════ */}
        {activeSection === "vaccines" && (
          <div className="fade-in">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"#1a1207" }}>Vaccination Record</h2>
              <button className="btn btn-brown btn-sm">+ Add Vaccine</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              {VACCINES.map((v, i) => (
                <div key={i} className="section-card" style={{ padding:"18px 20px", borderLeft:`4px solid ${v.status==="due-soon"?"#f39c12":"#27ae60"}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <h4 style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:"#1a1207" }}>💉 {v.name}</h4>
                    <span className="status-badge" style={v.status==="current"?{ background:"#d1fae5", color:"#065f46", border:"1px solid #6ee7b7" }:{ background:"#fef3c7", color:"#92400e", border:"1px solid #fcd34d" }}>
                      {v.status==="current"?"✓ Current":"⚠️ Due Soon"}
                    </span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    <div><div style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:"#b4976a", marginBottom:2 }}>Last Given</div><div style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:500 }}>{fmt(v.date)}</div></div>
                    <div><div style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:"#b4976a", marginBottom:2 }}>Next Due</div><div style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:600, color:v.status==="due-soon"?"#92400e":"#0f6b6b" }}>{fmt(v.nextDue)}</div></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="section-card" style={{ marginTop:16, padding:"16px 20px", background:"linear-gradient(135deg,#0f4c4c15,#1a707015)", border:"1px solid #a8d5d5" }}>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:"#0f4c4c" }}>
                💡 <strong>Tip for vet visits:</strong> Export this report to share complete vaccination history with your veterinarian. The Bordetella vaccine is due soon — schedule before March 10.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {showMedModal && <MedModal med={editMed} onSave={saveMed} onClose={() => { setShowMedModal(false); setEditMed(null); }}/>}
      {showIllModal && <IllnessModal illness={editIll} onSave={saveIll} onClose={() => { setShowIllModal(false); setEditIll(null); }}/>}
      {showVetReport && <VetReportPreview dog={DOG} meds={meds} illnesses={illnesses} onClose={() => setShowVetReport(false)}/>}
    </div>
  );
}
