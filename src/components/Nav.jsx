import { useEffect, useMemo, useRef, useState } from "react";
import { G } from "../styles/theme";

const READ_KEY = "pawmind_read_notifications";

function getTypeMeta(type) {
  switch (type) {
    case "vaccine":
      return { icon: "💉", color: "#ef4444", bg: "#fee2e2" };
    case "mood":
      return { icon: "😟", color: "#f59e0b", bg: "#fef3c7" };
    case "health":
      return { icon: "🩺", color: "#f97316", bg: "#ffedd5" };
    default:
      return { icon: "🔔", color: "#5c3d1e", bg: "#f5efe6" };
  }
}

function formatTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function Nav({
  page,
  setPage,
  onLogout,
  notifications = [],
  notificationsLoading = false,
  onRefreshNotifications,
  onNotificationClick,
}) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try {
      const raw = localStorage.getItem(READ_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const boxRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(READ_KEY, JSON.stringify(readIds));
  }, [readIds]);

  useEffect(() => {
    const validIds = new Set(notifications.map((n) => n.id));
    setReadIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [notifications]);

  useEffect(() => {
    function onClickOutside(e) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readIds.includes(n.id)).length,
    [notifications, readIds],
  );

  const markAsRead = (id) => {
    setReadIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const markAllAsRead = () => {
    setReadIds(notifications.map((n) => n.id));
  };

  const openNotification = (item) => {
    markAsRead(item.id);
    setOpen(false);
    onNotificationClick?.(item);
  };

  return (
    <nav style={{ display: "flex", alignItems: "center", padding: "0 32px", height: 60, background: "white", borderBottom: `1px solid ${G.border}`, position: "sticky", top: 0, zIndex: 200, boxShadow: "0 1px 12px rgba(92,61,30,.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 40 }}>
        <span style={{ fontSize: 22 }}>🐾</span>
        <span style={{ fontFamily: G.ff, fontWeight: 700, fontSize: 17, color: G.brown }}>PawMind</span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {[["dashboard", "🏠 Dashboard"], ["dogs", "🐕 My Dogs"], ["analyze", "🔬 Analyze & Chat"], ["reports", "📊 Reports"]].map(([k, l]) => (
          <button key={k} className={`nav-item ${page === k ? "active" : ""}`} onClick={() => setPage(k)}>{l}</button>
        ))}
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
        {onLogout && (
          <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={onLogout}>
            Logout
          </button>
        )}
        <div ref={boxRef} style={{ position: "relative" }}>
          <button
            className="btn btn-ghost"
            style={{ width: 36, height: 36, borderRadius: "50%", padding: 0, justifyContent: "center", position: "relative" }}
            onClick={() => setOpen((v) => !v)}
            aria-label="Notifications"
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>🔔</span>
            {unreadCount > 0 && (
              <span style={{ position: "absolute", top: -3, right: -3, minWidth: 16, height: 16, padding: "0 4px", background: "#ef4444", borderRadius: "999px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "white", fontWeight: 700, fontFamily: G.fs }}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="fade-in" style={{ position: "absolute", top: 42, right: 0, width: 360, maxHeight: 420, overflowY: "auto", background: "white", border: `1px solid ${G.border}`, borderRadius: 14, boxShadow: "0 12px 30px rgba(0,0,0,.14)", padding: 10, zIndex: 320 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 6px 10px 6px" }}>
                <div>
                  <div style={{ fontFamily: G.ff, fontSize: 16, fontWeight: 700, color: G.text }}>Notifications</div>
                  <div style={{ fontFamily: G.fs, fontSize: 11, color: G.muted }}>{unreadCount} unread</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-ghost" style={{ padding: "5px 8px", fontSize: 11 }} onClick={() => onRefreshNotifications?.()}>
                    {notificationsLoading ? "..." : "Refresh"}
                  </button>
                  <button className="btn btn-ghost" style={{ padding: "5px 8px", fontSize: 11 }} onClick={markAllAsRead} disabled={!notifications.length}>
                    Mark all
                  </button>
                </div>
              </div>

              {!notifications.length && !notificationsLoading && (
                <div style={{ padding: "14px 10px", fontFamily: G.fs, fontSize: 12, color: G.muted }}>
                  No alerts right now.
                </div>
              )}

              {notifications.map((item) => {
                const read = readIds.includes(item.id);
                const meta = getTypeMeta(item.type);
                return (
                  <button
                    key={item.id}
                    onClick={() => openNotification(item)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      background: read ? "white" : "#fffbf5",
                      borderRadius: 10,
                      padding: "10px 10px",
                      marginBottom: 6,
                      cursor: "pointer",
                      display: "flex",
                      gap: 10,
                    }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: meta.bg, color: meta.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                      {meta.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: G.fs, fontSize: 12, fontWeight: read ? 500 : 700, color: G.text, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.title}
                      </div>
                      <div style={{ fontFamily: G.fs, fontSize: 12, color: G.muted, lineHeight: 1.45 }}>
                        {item.message}
                      </div>
                      <div style={{ fontFamily: G.fs, fontSize: 10, color: "#b79b7a", marginTop: 4 }}>
                        {formatTime(item.createdAt)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: G.brown, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontFamily: G.fs, fontWeight: 600 }}>K</div>
      </div>
    </nav>
  );
}

export default Nav;
