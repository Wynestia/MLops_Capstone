import { useState, useRef, useEffect } from "react";
import { SUGGESTED_QS, MOOD_CONFIG } from "../data/mockData";
import { G } from "../styles/theme";
import { apiFetch, API_ORIGIN } from "../api";

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
  return `${API_ORIGIN}${imageUrl}`;
}

function toChatItem(msg) {
  return {
    id: msg.id || `msg-${Date.now()}`,
    role: msg.role || "assistant",
    text: msg.content || "",
  };
}

function AnalyzeChat({ dogs = [], selectedDog, setSelectedDog }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [latestAnalysisId, setLatestAnalysisId] = useState(null);
  const [analysisError, setAnalysisError] = useState("");

  const [isDragOver, setIsDragOver] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [chatError, setChatError] = useState("");

  const fileRef = useRef();
  const chatRef = useRef();

  const dog = selectedDog || dogs[0];
  if (!dog) {
    return (
      <div className="fade-in" style={{ padding: "28px 32px", maxWidth: 1080, margin: "0 auto" }}>
        <div className="card">
          <h2 style={{ fontFamily: G.ff, fontSize: 22, fontWeight: 700, color: G.text, marginBottom: 8 }}>Analyze & Chat</h2>
          <p style={{ fontFamily: G.fs, fontSize: 13, color: G.muted }}>Please add your first dog in the My Dogs page before using this feature.</p>
        </div>
      </div>
    );
  }

  const moodLabel = MOOD_CONFIG[dog.mood] ? dog.mood : "Relaxed";
  const cfg = MOOD_CONFIG[moodLabel];

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, typing]);

  useEffect(() => {
    let mounted = true;

    async function loadDogData() {
      setLoadingHistory(true);
      setChatError("");
      try {
        const [history, analyses] = await Promise.all([
          apiFetch(`/dogs/${dog.id}/chat?limit=50`),
          apiFetch(`/dogs/${dog.id}/analyses?limit=50`),
        ]);
        if (!mounted) return;
        setMessages(history.map(toChatItem));
        setAnalysisCount(analyses.length);
        setLatestAnalysisId(analyses[0]?.id || null);
      } catch (err) {
        if (!mounted) return;
        setMessages([]);
        setChatError(err.message || "Failed to load chat history");
        setAnalysisCount(Number(dog.analyses) || 0);
        setLatestAnalysisId(null);
      } finally {
        if (mounted) setLoadingHistory(false);
      }
    }

    setPreview(null);
    setFile(null);
    setResult(null);
    setAnalysisError("");
    setInput("");
    loadDogData();

    return () => {
      mounted = false;
    };
  }, [dog.id]);

  const handleFile = (nextFile) => {
    if (!nextFile) return;
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    setResult(null);
    setAnalysisError("");
  };

  const runAnalysis = async () => {
    if (!file) {
      setAnalysisError("Please choose an image first");
      return;
    }

    setAnalyzing(true);
    setAnalysisError("");
    try {
      const formData = new FormData();
      formData.append("image", file);

      const analysis = await apiFetch(`/dogs/${dog.id}/analyze`, {
        method: "POST",
        body: formData,
      });

      const nextCount = analysisCount + 1;
      setResult({
        id: analysis.id,
        mood: analysis.mood,
        confidence: analysis.confidence ?? 0,
        scores: analysis.scores || {},
        imageUrl: resolveImageUrl(analysis.image_url),
      });
      setLatestAnalysisId(analysis.id);
      setAnalysisCount(nextCount);
      setSelectedDog({ ...dog, mood: analysis.mood, status: analysis.mood, analyses: nextCount });
    } catch (err) {
      setAnalysisError(err.message || "Failed to analyze image");
    } finally {
      setAnalyzing(false);
    }
  };

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;

    setChatError("");
    setInput("");
    setTyping(true);
    setSending(true);

    setMessages((prev) => [
      ...prev,
      { id: `local-user-${Date.now()}`, role: "user", text: msg },
    ]);

    try {
      const reply = await apiFetch(`/dogs/${dog.id}/chat`, {
        method: "POST",
        body: JSON.stringify({
          message: msg,
          analysis_id: latestAnalysisId,
        }),
      });

      setMessages((prev) => [
        ...prev,
        toChatItem(reply),
      ]);
    } catch (err) {
      setChatError(err.message || "Failed to send message");
      setMessages((prev) => [
        ...prev,
        {
          id: `local-error-${Date.now()}`,
          role: "assistant",
          text: "Sorry, I could not respond right now. Please try again.",
        },
      ]);
    } finally {
      setTyping(false);
      setSending(false);
    }
  };

  const displayedResultMood = result?.mood && MOOD_CONFIG[result.mood] ? result.mood : moodLabel;
  const displayedResultCfg = MOOD_CONFIG[displayedResultMood];

  return (
    <div className="fade-in analyze-layout">
      <div className="analyze-left" style={{ borderRight: `1px solid ${G.border}`, padding: "28px 28px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: G.ff, fontSize: 20, fontWeight: 700, color: G.text }}>📷 Emotion Analysis</h2>
          <select className="journal-input" style={{ padding: "7px 12px", fontSize: 13, width: "auto" }}
            value={String(dog.id)} onChange={(e) => setSelectedDog(dogs.find((d) => String(d.id) === e.target.value))}>
            {dogs.map((d) => <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>)}
          </select>
        </div>

        {!preview ? (
          <div className={`drop-zone ${isDragOver ? "over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current.click()}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
            <div style={{ fontSize: 48, marginBottom: 12 }}>🐕</div>
            <p style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 600, color: G.brown, marginBottom: 6 }}>Drop {dog.name}&apos;s photo here</p>
            <p style={{ fontFamily: G.fs, fontSize: 13, color: G.muted }}>or click to browse · JPG, PNG, WEBP, GIF</p>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            <img src={preview} alt="preview" style={{ width: "100%", borderRadius: 16, maxHeight: 240, objectFit: "cover", border: `2px solid ${G.border}` }} />
            <button onClick={() => { setPreview(null); setFile(null); setResult(null); setAnalysisError(""); }}
              style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,.55)", color: "white", border: "none", borderRadius: 20, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontFamily: G.fs }}>✕ Clear</button>
          </div>
        )}

        {preview && (
          <button className="btn btn-primary" style={{ justifyContent: "center", padding: "13px" }} onClick={runAnalysis} disabled={analyzing}>
            {analyzing ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                Analyzing {dog.name}...
              </span>
            ) : "🔬 Run Analysis"}
          </button>
        )}

        {analysisError && (
          <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 12px", fontFamily: G.fs, fontSize: 12, color: "#991b1b" }}>
            {analysisError}
          </div>
        )}

        {result && (
          <div className="card fade-in">
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
              <div className="result-ring" style={{ background: `radial-gradient(circle,${displayedResultCfg.bg},white)`, border: `4px solid ${displayedResultCfg.color}`, boxShadow: `0 0 32px ${displayedResultCfg.color}40` }}>
                <span style={{ fontSize: 36 }}>{displayedResultCfg.emoji}</span>
                <span style={{ fontFamily: G.fs, fontSize: 11, fontWeight: 700, color: displayedResultCfg.text, marginTop: 2 }}>{Math.round(result.confidence)}%</span>
              </div>
              <div>
                <div style={{ fontFamily: G.ff, fontSize: 22, fontWeight: 700, color: G.text }}>{displayedResultMood}</div>
                <div style={{ fontFamily: G.fs, fontSize: 13, color: G.muted, marginBottom: 8 }}>Detected emotion · {Math.round(result.confidence)}% confidence</div>
                <span className="tag" style={{ background: displayedResultCfg.bg, color: displayedResultCfg.text }}>✓ Saved to database</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(result.scores || {}).map(([mood, score]) => {
                const moodCfg = MOOD_CONFIG[mood] || displayedResultCfg;
                return (
                  <div key={mood} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: G.fs, fontSize: 12, width: 64, color: G.text }}>{moodCfg.emoji} {mood}</span>
                    <div style={{ flex: 1, height: 8, borderRadius: 99, background: G.brownPale, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 99, width: `${score}%`, background: moodCfg.color, transition: "width .6s ease" }} />
                    </div>
                    <span style={{ fontFamily: G.fs, fontSize: 12, color: G.muted, width: 32, textAlign: "right" }}>{Math.round(score)}%</span>
                  </div>
                );
              })}
            </div>
            {result.imageUrl && (
              <div style={{ marginTop: 14, padding: "12px", background: G.brownPale, borderRadius: 12 }}>
                <a href={result.imageUrl} target="_blank" rel="noreferrer" style={{ fontFamily: G.fs, fontSize: 12, color: G.brown, textDecoration: "none" }}>
                  Open stored image ↗
                </a>
              </div>
            )}
          </div>
        )}

        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "10px 14px" }}>
          <p style={{ fontFamily: G.fs, fontSize: 11, color: "#0369a1", lineHeight: 1.6 }}>
            ℹ️ This analysis is for informational purposes only and does not replace professional veterinary advice.
          </p>
        </div>
      </div>

      <div className="analyze-right" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)" }}>
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${G.border}`, background: "white", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${cfg.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: `2px solid ${cfg.color}40` }}>{dog.emoji}</div>
          <div>
            <div style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 700, color: G.text }}>{dog.name}&apos;s Wellness Advisor</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>Online · Context-aware AI</span>
            </div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <span style={{ fontFamily: G.fs, fontSize: 11, background: G.brownPale, color: G.brown, padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>
              🧠 Using {dog.name}&apos;s history
            </span>
          </div>
        </div>

        <div style={{ padding: "10px 20px", borderBottom: `1px solid ${G.border}`, background: "#fdfaf6", display: "flex", gap: 6, overflowX: "auto" }}>
          {[`${cfg.emoji} ${moodLabel} today`, `📷 Total analyses: ${analysisCount}`, "📓 Journal synced", "💬 DB chat history"].map((chip) => (
            <span key={chip} className="tag" style={{ background: G.brownPale, color: G.brown, whiteSpace: "nowrap" }}>{chip}</span>
          ))}
        </div>

        <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {loadingHistory && (
            <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>Loading chat history...</div>
          )}
          {!loadingHistory && messages.length === 0 && (
            <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted }}>No chat history yet. Start by asking a question below.</div>
          )}
          {messages.map((m) => (
            <div key={m.id} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              {m.role === "assistant" && (
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${G.brown},${G.brownLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginRight: 8, flexShrink: 0, marginTop: 2 }}>🐾</div>
              )}
              <div className={m.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}>{m.text}</div>
            </div>
          ))}
          {typing && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${G.brown},${G.brownLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🐾</div>
              <div className="chat-bubble-ai" style={{ padding: "12px 16px" }}>
                <span style={{ display: "flex", gap: 4 }}>
                  {[0, 1, 2].map((i) => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: G.muted, display: "inline-block", animation: `bounce .9s ${i * 0.15}s infinite` }} />)}
                </span>
              </div>
            </div>
          )}
        </div>

        {chatError && (
          <div style={{ margin: "0 16px 8px", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 10px", fontFamily: G.fs, fontSize: 12, color: "#991b1b" }}>
            {chatError}
          </div>
        )}

        <div style={{ padding: "8px 16px", borderTop: `1px solid ${G.border}`, display: "flex", gap: 6, overflowX: "auto" }}>
          {SUGGESTED_QS.map((q) => (
            <button key={q} className="sugg-chip" onClick={() => sendMessage(q)} disabled={sending}>{q}</button>
          ))}
        </div>

        <div style={{ padding: "12px 16px", borderTop: `1px solid ${G.border}`, background: "white", display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea className="chat-input" rows={1} placeholder={`Ask about ${dog.name}...`}
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            style={{ flex: 1, minHeight: 44, maxHeight: 100, lineHeight: 1.5 }} />
          <button className="btn btn-primary" style={{ padding: "10px 16px", flexShrink: 0, alignSelf: "flex-end" }}
            onClick={() => sendMessage()} disabled={!input.trim() || sending}>Send ↑</button>
        </div>
      </div>
    </div>
  );
}

export default AnalyzeChat;
