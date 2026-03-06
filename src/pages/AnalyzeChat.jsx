import { useState, useRef, useEffect } from "react";
import { CHAT_HISTORY, SUGGESTED_QS, MOOD_CONFIG } from "../data/mockData";
import { G } from "../styles/theme";

function AnalyzeChat({ dogs, selectedDog, setSelectedDog }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [messages, setMessages] = useState(CHAT_HISTORY);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const fileRef = useRef();
  const chatRef = useRef();
  const dog = selectedDog || dogs[0];
  const cfg = MOOD_CONFIG[dog.mood];

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, typing]);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const runAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setResult({ mood:"Happy", confidence:92, scores:{ Happy:92, Relaxed:5, Sad:2, Angry:1 } });
    }, 2200);
  };

  const sendMessage = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setMessages(m => [...m, { role:"user", text:msg }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, { role:"assistant", text:`Based on ${dog.name}'s recent history and current mood (${dog.mood}), here's my analysis: this behavior pattern is common in ${dog.breed}s aged ${dog.age}. I'd recommend consistent daily routines and positive reinforcement. If you notice this persisting for more than a week, consider a vet visit. 🐾` }]);
    }, 1800);
  };

  return (
    <div className="fade-in analyze-layout">

      {/* LEFT: ANALYZE */}
      <div className="analyze-left" style={{ borderRight:`1px solid ${G.border}`, padding:"28px 28px", overflowY:"auto", display:"flex", flexDirection:"column", gap:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h2 style={{ fontFamily:G.ff, fontSize:20, fontWeight:700, color:G.text }}>📷 Emotion Analysis</h2>
          <select className="journal-input" style={{ padding:"7px 12px", fontSize:13, width:"auto" }}
            value={dog.id} onChange={e => setSelectedDog(dogs.find(d => d.id === parseInt(e.target.value)))}>
            {dogs.map(d => <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>)}
          </select>
        </div>

        {/* DROP ZONE */}
        {!preview ? (
          <div className={`drop-zone ${isDragOver?"over":""}`}
            onDragOver={e=>{ e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={e=>{ e.preventDefault(); setIsDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current.click()}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])}/>
            <div style={{ fontSize:48, marginBottom:12 }}>🐕</div>
            <p style={{ fontFamily:G.ff, fontSize:16, fontWeight:600, color:G.brown, marginBottom:6 }}>Drop {dog.name}'s photo here</p>
            <p style={{ fontFamily:G.fs, fontSize:13, color:G.muted }}>or click to browse · JPG, PNG, WEBP</p>
          </div>
        ) : (
          <div style={{ position:"relative" }}>
            <img src={preview} alt="preview" style={{ width:"100%", borderRadius:16, maxHeight:240, objectFit:"cover", border:`2px solid ${G.border}` }}/>
            <button onClick={() => { setPreview(null); setFile(null); setResult(null); }}
              style={{ position:"absolute", top:10, right:10, background:"rgba(0,0,0,.55)", color:"white", border:"none", borderRadius:20, padding:"4px 10px", cursor:"pointer", fontSize:12, fontFamily:G.fs }}>✕ Clear</button>
          </div>
        )}

        {preview && !result && (
          <button className="btn btn-primary" style={{ justifyContent:"center", padding:"13px" }} onClick={runAnalysis} disabled={analyzing}>
            {analyzing ? (
              <span style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ display:"inline-block", width:14, height:14, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"white", borderRadius:"50%", animation:"spin .7s linear infinite" }}/>
                Analyzing {dog.name}...
              </span>
            ) : "🔬 Run Analysis"}
          </button>
        )}

        {/* RESULT */}
        {result && (
          <div className="card fade-in">
            <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:20 }}>
              <div className="result-ring" style={{ background:`radial-gradient(circle,${MOOD_CONFIG[result.mood].bg},white)`, border:`4px solid ${MOOD_CONFIG[result.mood].color}`, boxShadow:`0 0 32px ${MOOD_CONFIG[result.mood].color}40` }}>
                <span style={{ fontSize:36 }}>{MOOD_CONFIG[result.mood].emoji}</span>
                <span style={{ fontFamily:G.fs, fontSize:11, fontWeight:700, color:MOOD_CONFIG[result.mood].text, marginTop:2 }}>{result.confidence}%</span>
              </div>
              <div>
                <div style={{ fontFamily:G.ff, fontSize:22, fontWeight:700, color:G.text }}>{result.mood}</div>
                <div style={{ fontFamily:G.fs, fontSize:13, color:G.muted, marginBottom:8 }}>Detected emotion · {result.confidence}% confidence</div>
                <span className="tag" style={{ background:MOOD_CONFIG[result.mood].bg, color:MOOD_CONFIG[result.mood].text }}>✓ Saved to history</span>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {Object.entries(result.scores).map(([mood, score]) => (
                <div key={mood} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontFamily:G.fs, fontSize:12, width:64, color:G.text }}>{MOOD_CONFIG[mood].emoji} {mood}</span>
                  <div style={{ flex:1, height:8, borderRadius:99, background:G.brownPale, overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:99, width:`${score}%`, background:MOOD_CONFIG[mood].color, transition:"width .6s ease" }}/>
                  </div>
                  <span style={{ fontFamily:G.fs, fontSize:12, color:G.muted, width:32, textAlign:"right" }}>{score}%</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop:14, padding:"12px", background:G.brownPale, borderRadius:12 }}>
              <div style={{ fontFamily:G.fs, fontSize:12, fontWeight:600, color:G.brown, marginBottom:4 }}>💡 Quick Tip</div>
              <div style={{ fontFamily:G.fs, fontSize:12, color:G.text, lineHeight:1.6 }}>
                {dog.name} looks happy! This is a great time for training or bonding activities. Keep up the positive routine.
              </div>
            </div>
          </div>
        )}

        {/* DISCLAIMER */}
        <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:12, padding:"10px 14px" }}>
          <p style={{ fontFamily:G.fs, fontSize:11, color:"#0369a1", lineHeight:1.6 }}>
            ℹ️ This analysis is for informational purposes only and does not replace professional veterinary advice. If you notice persistent changes in behavior, please consult a veterinarian.
          </p>
        </div>
      </div>

      {/* RIGHT: CHAT */}
      <div className="analyze-right" style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 60px)" }}>
        {/* Chat header */}
        <div style={{ padding:"18px 24px", borderBottom:`1px solid ${G.border}`, background:"white", display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:"50%", background:`${cfg.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, border:`2px solid ${cfg.color}40` }}>{dog.emoji}</div>
          <div>
            <div style={{ fontFamily:G.ff, fontSize:16, fontWeight:700, color:G.text }}>{dog.name}'s Wellness Advisor</div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e" }}/>
              <span style={{ fontFamily:G.fs, fontSize:12, color:G.muted }}>Online · Context-aware AI</span>
            </div>
          </div>
          <div style={{ marginLeft:"auto" }}>
            <span style={{ fontFamily:G.fs, fontSize:11, background:G.brownPale, color:G.brown, padding:"4px 10px", borderRadius:20, fontWeight:600 }}>
              🧠 Using {dog.name}'s history
            </span>
          </div>
        </div>

        {/* Context chips */}
        <div style={{ padding:"10px 20px", borderBottom:`1px solid ${G.border}`, background:"#fdfaf6", display:"flex", gap:6, overflowX:"auto" }}>
          {[`${cfg.emoji} ${dog.mood} today`, `📷 Last: ${dog.analyses} analyses`, "📓 Journal synced", "⚠️ 2 triggers logged"].map(c => (
            <span key={c} className="tag" style={{ background:G.brownPale, color:G.brown, whiteSpace:"nowrap" }}>{c}</span>
          ))}
        </div>

        {/* Messages */}
        <div ref={chatRef} style={{ flex:1, overflowY:"auto", padding:"20px", display:"flex", flexDirection:"column", gap:12 }}>
          {messages.map((m,i) => (
            <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
              {m.role==="assistant" && (
                <div style={{ width:30, height:30, borderRadius:"50%", background:`linear-gradient(135deg,${G.brown},${G.brownLight})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, marginRight:8, flexShrink:0, marginTop:2 }}>🐾</div>
              )}
              <div className={m.role==="user"?"chat-bubble-user":"chat-bubble-ai"}>{m.text}</div>
            </div>
          ))}
          {typing && (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:30, height:30, borderRadius:"50%", background:`linear-gradient(135deg,${G.brown},${G.brownLight})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🐾</div>
              <div className="chat-bubble-ai" style={{ padding:"12px 16px" }}>
                <span style={{ display:"flex", gap:4 }}>
                  {[0,1,2].map(i => <span key={i} style={{ width:6, height:6, borderRadius:"50%", background:G.muted, display:"inline-block", animation:`bounce .9s ${i*0.15}s infinite` }}/>)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        <div style={{ padding:"8px 16px", borderTop:`1px solid ${G.border}`, display:"flex", gap:6, overflowX:"auto" }}>
          {SUGGESTED_QS.map(q => (
            <button key={q} className="sugg-chip" onClick={() => sendMessage(q)}>{q}</button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding:"12px 16px", borderTop:`1px solid ${G.border}`, background:"white", display:"flex", gap:10, alignItems:"flex-end" }}>
          <textarea className="chat-input" rows={1} placeholder={`Ask about ${dog.name}...`}
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            style={{ flex:1, minHeight:44, maxHeight:100, lineHeight:1.5 }}/>
          <button className="btn btn-primary" style={{ padding:"10px 16px", flexShrink:0, alignSelf:"flex-end" }}
            onClick={() => sendMessage()} disabled={!input.trim()}>Send ↑</button>
        </div>
      </div>
    </div>
  );
}

export default AnalyzeChat;
