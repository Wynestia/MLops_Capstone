import { G } from "../styles/theme";

function Nav({ page, setPage }) {
  return (
    <nav style={{ display:"flex", alignItems:"center", padding:"0 32px", height:60, background:"white", borderBottom:`1px solid ${G.border}`, position:"sticky", top:0, zIndex:200, boxShadow:"0 1px 12px rgba(92,61,30,.06)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginRight:40 }}>
        <span style={{ fontSize:22 }}>🐾</span>
        <span style={{ fontFamily:G.ff, fontWeight:700, fontSize:17, color:G.brown }}>PawMind</span>
      </div>
      <div style={{ display:"flex", gap:4 }}>
        {[["dashboard","🏠 Dashboard"],["dogs","🐕 My Dogs"],["analyze","🔬 Analyze & Chat"],["reports","📊 Reports"]].map(([k,l]) => (
          <button key={k} className={`nav-item ${page===k?"active":""}`} onClick={() => setPage(k)}>{l}</button>
        ))}
      </div>
      <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ position:"relative" }}>
          <span style={{ fontSize:20, cursor:"pointer" }}>🔔</span>
          <span style={{ position:"absolute", top:-4, right:-4, width:16, height:16, background:"#ef4444", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"white", fontWeight:700, fontFamily:G.fs }}>3</span>
        </div>
        <div style={{ width:34, height:34, borderRadius:"50%", background:G.brown, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:14, fontFamily:G.fs, fontWeight:600 }}>K</div>
      </div>
    </nav>
  );
}

export default Nav;
