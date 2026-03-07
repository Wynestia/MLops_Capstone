import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { G } from "../styles/theme";

function Reports({ dogs }) {
  const [activeDog, setActiveDog] = useState(dogs[0]);
  const monthData = [
    { week:"W1", happy:4, relaxed:2, sad:1, angry:0 },
    { week:"W2", happy:2, relaxed:3, sad:2, angry:0 },
    { week:"W3", happy:3, relaxed:2, sad:1, angry:1 },
    { week:"W4", happy:5, relaxed:1, sad:1, angry:0 },
  ];
  return (
    <div className="fade-in" style={{ padding:"28px 32px 48px", maxWidth:1080, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:G.ff, fontSize:26, fontWeight:700, color:G.text }}>📊 Reports & Insights</h1>
          <p style={{ fontFamily:G.fs, fontSize:13, color:G.muted, marginTop:4 }}>Monthly summaries and trend analysis</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <select className="journal-input" style={{ fontSize:13 }} value={activeDog.id} onChange={e => setActiveDog(dogs.find(d=>d.id===parseInt(e.target.value)))}>
            {dogs.map(d => <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>)}
          </select>
          <button className="btn btn-primary">📄 Export PDF</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:14, marginBottom:24 }}>
        {[
          { label:"Happy days", val:"14", icon:"😄", color:"#f59e0b", bg:"#fef3c7" },
          { label:"Analyses done", val:"22", icon:"📷", color:G.brown, bg:G.brownPale },
          { label:"Journal entries", val:"18", icon:"📓", color:"#34d399", bg:"#d1fae5" },
          { label:"Alerts triggered", val:"3", icon:"⚠️", color:"#f87171", bg:"#fee2e2" },
        ].map(s => (
          <div key={s.label} className="card-sm" style={{ textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontFamily:G.ff, fontSize:28, fontWeight:700, color:s.color }}>{s.val}</div>
            <div style={{ fontFamily:G.fs, fontSize:12, color:G.muted, fontWeight:500 }}>{s.label}</div>
            <div style={{ fontFamily:G.fs, fontSize:10, color:G.muted }}>this month</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:20, marginBottom:20 }}>
        <div className="card">
          <h3 style={{ fontFamily:G.ff, fontSize:16, fontWeight:600, color:G.text, marginBottom:6 }}>Monthly Mood Distribution</h3>
          <p style={{ fontFamily:G.fs, fontSize:12, color:G.muted, marginBottom:18 }}>{activeDog.name} · March 2025</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthData} margin={{ left:-20, right:4, top:4, bottom:0 }}>
              <XAxis dataKey="week" tick={{ fontSize:11, fill:G.muted, fontFamily:G.fs }} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip contentStyle={{ fontFamily:G.fs, fontSize:12, borderRadius:10, border:`1px solid ${G.border}` }}/>
              <Bar dataKey="happy" stackId="a" fill="#f59e0b" radius={[0,0,0,0]} name="Happy"/>
              <Bar dataKey="relaxed" stackId="a" fill="#34d399" name="Relaxed"/>
              <Bar dataKey="sad" stackId="a" fill="#60a5fa" name="Sad"/>
              <Bar dataKey="angry" stackId="a" fill="#f87171" radius={[4,4,0,0]} name="Angry"/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", gap:16, marginTop:12 }}>
            {[["#f59e0b","Happy"],["#34d399","Relaxed"],["#60a5fa","Sad"],["#f87171","Angry"]].map(([c,l]) => (
              <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:10, height:10, borderRadius:2, background:c }}/>
                <span style={{ fontFamily:G.fs, fontSize:11, color:G.muted }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div className="card">
            <h3 style={{ fontFamily:G.ff, fontSize:15, fontWeight:600, color:G.text, marginBottom:12 }}>Top Triggers</h3>
            {[["🌧 Rainy days",8],["🏠 Alone 6+ hrs",5],["👥 New visitors",3]].map(([t,n]) => (
              <div key={t} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <span style={{ fontFamily:G.fs, fontSize:12, flex:1, color:G.text }}>{t}</span>
                <div style={{ width:60, height:6, borderRadius:99, background:G.brownPale, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${(n/8)*100}%`, background:G.brown, borderRadius:99 }}/>
                </div>
                <span style={{ fontFamily:G.fs, fontSize:11, color:G.muted, width:20, textAlign:"right" }}>{n}x</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ background:`linear-gradient(135deg,${G.brown},${G.brownLight})`, border:"none" }}>
            <div style={{ fontFamily:G.ff, fontSize:15, fontWeight:600, color:"white", marginBottom:10 }}>🏥 Vet Summary Ready</div>
            <p style={{ fontFamily:G.fs, fontSize:12, color:"rgba(255,255,255,.8)", lineHeight:1.6, marginBottom:12 }}>
              Generate a summary report for {activeDog.name}'s next vet appointment.
            </p>
            <button className="btn" style={{ background:"rgba(255,255,255,.15)", color:"white", border:"1px solid rgba(255,255,255,.25)", width:"100%", justifyContent:"center", fontSize:12 }}>
              📋 Generate Vet Report
            </button>
          </div>
        </div>
      </div>

      {/* RECOMMENDATIONS */}
      <div className="card">
        <h3 style={{ fontFamily:G.ff, fontSize:16, fontWeight:600, color:G.text, marginBottom:18 }}>💡 Monthly Recommendations for {activeDog.name}</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
          {[
            { icon:"🦮", title:"Daily Walk Goal", desc:"Aim for 30–45 min outdoor walks to maintain Happy baseline", color:"#d1fae5", tc:"#065f46" },
            { icon:"🧩", title:"Mental Stimulation", desc:"Introduce puzzle toys on rainy days to prevent sadness patterns", color:"#fef3c7", tc:"#92400e" },
            { icon:"🧘", title:"Routine Consistency", desc:"Fixed meal and sleep times reduced anxiety episodes by 40%", color:"#dbeafe", tc:"#1e40af" },
          ].map(r => (
            <div key={r.title} style={{ background:r.color, borderRadius:14, padding:"16px 18px" }}>
              <div style={{ fontSize:26, marginBottom:8 }}>{r.icon}</div>
              <div style={{ fontFamily:G.ff, fontSize:14, fontWeight:600, color:r.tc, marginBottom:4 }}>{r.title}</div>
              <p style={{ fontFamily:G.fs, fontSize:12, color:r.tc, opacity:.8, lineHeight:1.6 }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Reports;
