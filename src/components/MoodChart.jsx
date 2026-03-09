import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { MOOD_CONFIG } from "../data/mockData";
import { G } from "../styles/theme";

function MoodChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={90}>
      <AreaChart data={data} margin={{ top:4, right:4, bottom:0, left:-36 }}>
        <defs>
          <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.22}/>
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="day" tick={{ fontSize:10, fill:G.muted, fontFamily:G.fs }} axisLine={false} tickLine={false}/>
        <YAxis domain={[0,5]} hide/>
        <Tooltip content={({ active, payload }) => {
          if (!active||!payload?.length) return null;
          const d = payload[0].payload; const c = MOOD_CONFIG[d.label];
          const borderColor = c?.color || "#d1d5db";
          return <div style={{ background:"white", border:`2px solid ${borderColor}`, borderRadius:10, padding:"6px 12px", fontSize:12, fontFamily:G.fs, boxShadow:"0 4px 16px rgba(0,0,0,.1)" }}>{c ? `${c.emoji} ` : ""}<strong style={{ color:c?.text || G.muted }}>{c ? d.label : "No mood data"}</strong></div>;
        }}/>
        <Area type="monotone" dataKey="mood" stroke="#f59e0b" strokeWidth={2.5} fill="url(#mg)"
          dot={({ cx, cy, payload }) => { const c=MOOD_CONFIG[payload.label]; return <circle key={cx} cx={cx} cy={cy} r={5} fill={c?.color||"#d1d5db"} stroke="white" strokeWidth={2}/>; }}/>
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default MoodChart;
