import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from "recharts";
import MoodChart from "../components/MoodChart";
import { DOGS, WEEK_DATA, MOOD_CONFIG } from "../data/mockData";
import { G } from "../styles/theme";

function Dashboard({ setPage, setSelectedDog }) {
  const alerts = DOGS.flatMap(d => Array(d.alerts).fill(d));
  return (
    <div className="fade-in" style={{ padding:"28px 32px 48px", maxWidth:1080, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
        <div>
          <h1 style={{ fontFamily:G.ff, fontSize:28, fontWeight:700, color:G.text }}>Good morning, Khun 👋</h1>
          <p style={{ fontFamily:G.fs, fontSize:14, color:G.muted, marginTop:4 }}>Here's how your dogs are doing today</p>
        </div>
        <button className="btn btn-primary" onClick={() => setPage("dogs")}>+ Add Dog</button>
      </div>

      {/* ALERT STRIP */}
      {alerts.length > 0 && (
        <div style={{ background:"linear-gradient(135deg,#fef3c7,#fde68a)", border:"1.5px solid #f59e0b", borderRadius:16, padding:"14px 20px", marginBottom:24, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>⚠️</span>
          <div style={{ flex:1, fontFamily:G.fs, fontSize:13 }}>
            <strong style={{ color:"#92400e" }}>3 alerts need attention: </strong>
            <span style={{ color:"#78350f" }}>Pepper has been sad for 2 consecutive days · Mochi showed anxiety after rainstorm</span>
          </div>
          <button className="btn btn-secondary" style={{ padding:"6px 14px", fontSize:12 }}>View All</button>
        </div>
      )}

      {/* DOG CARDS */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:18, marginBottom:32 }}>
        {DOGS.map(dog => (
          <div key={dog.id} className="dog-card" onClick={() => { setSelectedDog(dog); setPage("dogs"); }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
              <div style={{ width:54, height:54, borderRadius:"50%", background:`linear-gradient(135deg,${dog.moodColor}40,${dog.moodColor}20)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, border:`2px solid ${dog.moodColor}50` }}>{dog.emoji}</div>
              <div>
                <div style={{ fontFamily:G.ff, fontSize:17, fontWeight:700, color:G.text }}>{dog.name}</div>
                <div style={{ fontFamily:G.fs, fontSize:12, color:G.muted }}>{dog.breed} · {dog.age}y</div>
              </div>
              {dog.alerts > 0 && <span style={{ marginLeft:"auto", background:"#fee2e2", color:"#991b1b", fontFamily:G.fs, fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>{dog.alerts} alert{dog.alerts>1?"s":""}</span>}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <div className="pulse" style={{ background:dog.moodColor, boxShadow:`0 0 0 0 ${dog.moodColor}66` }}/>
              <span style={{ background:dog.moodBg, color:dog.moodColor, fontFamily:G.fs, fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:20 }}>{dog.moodEmoji} {dog.mood}</span>
            </div>
            <MoodChart data={WEEK_DATA}/>
            <div style={{ display:"flex", gap:8, marginTop:14 }}>
              <button className="btn btn-secondary" style={{ flex:1, justifyContent:"center", fontSize:12, padding:"8px" }}
                onClick={e=>{ e.stopPropagation(); setSelectedDog(dog); setPage("analyze"); }}>📷 Analyze</button>
              <button className="btn btn-ghost" style={{ flex:1, justifyContent:"center", fontSize:12, padding:"8px" }}
                onClick={e=>{ e.stopPropagation(); setSelectedDog(dog); setPage("analyze"); }}>💬 Chat</button>
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM STATS */}
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:20 }}>
        <div className="card">
          <h3 style={{ fontFamily:G.ff, fontSize:16, fontWeight:600, color:G.text, marginBottom:18 }}>Weekly Overview — All Dogs</h3>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={WEEK_DATA} margin={{ left:-28, right:4, top:4, bottom:0 }}>
              <XAxis dataKey="day" tick={{ fontSize:11, fill:G.muted, fontFamily:G.fs }} axisLine={false} tickLine={false}/>
              <YAxis domain={[0,5]} hide/>
              <Tooltip content={({ active, payload }) => {
                if (!active||!payload?.length) return null;
                const d = payload[0].payload; const c = MOOD_CONFIG[d.label];
                return <div style={{ background:"white", border:`2px solid ${c?.color}`, borderRadius:10, padding:"6px 12px", fontSize:12, fontFamily:G.fs }}>{c?.emoji} {d.label}</div>;
              }}/>
              <Bar dataKey="mood" radius={[6,6,0,0]}>
                {WEEK_DATA.map((d,i) => <Cell key={i} fill={MOOD_CONFIG[d.label]?.color||"#ccc"}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {[
            { icon:"📷", label:"Total Analyses", val:"25", sub:"this month", color:"#5c3d1e" },
            { icon:"😄", label:"Happy days avg", val:"62%", sub:"across all dogs", color:"#f59e0b" },
            { icon:"📓", label:"Journal entries", val:"18", sub:"this month", color:"#34d399" },
          ].map(s => (
            <div key={s.label} className="card-sm" style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:42, height:42, borderRadius:12, background:G.brownPale, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{s.icon}</div>
              <div>
                <div style={{ fontFamily:G.ff, fontSize:20, fontWeight:700, color:s.color }}>{s.val}</div>
                <div style={{ fontFamily:G.fs, fontSize:12, color:G.text, fontWeight:500 }}>{s.label}</div>
                <div style={{ fontFamily:G.fs, fontSize:11, color:G.muted }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
