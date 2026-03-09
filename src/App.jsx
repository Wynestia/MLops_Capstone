import { useState, useEffect, useCallback } from "react";
import Nav from "./components/Nav";
import Dashboard from "./pages/Dashboard";
import MyDogs from "./pages/MyDogs";
import AnalyzeChat from "./pages/AnalyzeChat";
import Reports from "./pages/Reports";
import { G } from "./styles/theme";
import { css, appAnimations } from "./styles/globalStyles";
import { API_BASE, getToken, setToken, apiFetch } from "./api";

function AuthWrapper({ children }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    async function initAuth() {
      try {
        const token = getToken();
        if (!token) {
          return;
        }

        await apiFetch("/auth/me");
        setIsAuthenticated(true);
      } catch (err) {
        localStorage.removeItem("pawmind_token");
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password) {
      setError("Please fill email and password");
      return;
    }
    if (mode === "register" && !form.name.trim()) {
      setError("Please fill your name");
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login"
        ? { email: form.email.trim(), password: form.password }
        : { name: form.name.trim(), email: form.email.trim(), password: form.password };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed");
      }
      if (!data?.access_token) {
        throw new Error("Auth response missing access token");
      }

      setToken(data.access_token);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 40, fontFamily: G.ff, color: G.text }}>Loading PawMind API...</div>;

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", background: G.bg, display: "grid", placeItems: "center", padding: 24 }}>
        <style>{`${css}\n${appAnimations}`}</style>
        <div className="card" style={{ width: "100%", maxWidth: 460 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 24 }}>🐾</span>
            <h1 style={{ fontFamily: G.ff, fontSize: 24, color: G.brown }}>PawMind</h1>
          </div>
          <p style={{ fontFamily: G.fs, color: G.muted, marginBottom: 16 }}>
            {mode === "login" ? "Sign in to your account" : "Create an account to start saving your dogs"}
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setMode("login"); setError(""); }}>
              Login
            </button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setMode("register"); setError(""); }}>
              Register
            </button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "register" && (
              <input
                className="journal-input"
                type="text"
                placeholder="Name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            )}
            <input
              className="journal-input"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
            <input
              className="journal-input"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
            />
            {error && (
              <div style={{ fontFamily: G.fs, fontSize: 12, color: "#b91c1c", background: "#fee2e2", padding: "8px 10px", borderRadius: 10 }}>
                {error}
              </div>
            )}
            <button className="btn btn-primary" type="submit" style={{ justifyContent: "center", padding: "11px 14px" }} disabled={submitting}>
              {submitting ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return children;
}

function calculateAge(birthday) {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

function normalizeDog(dog) {
  const parsedWeight = Number(dog?.weight_kg ?? dog?.weight);
  const weight = Number.isFinite(parsedWeight) ? parsedWeight : 0;
  const analyses = Number(dog?.analyses);
  return {
    ...dog,
    id: String(dog.id),
    emoji: dog?.emoji || "🐕",
    weight,
    weight_kg: weight,
    age: dog?.age ?? calculateAge(dog?.birthday),
    mood: dog?.mood || dog?.status || "Relaxed",
    analyses: Number.isFinite(analyses) ? analyses : 0,
  };
}

function slugText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildNotificationId(dogId, type, message) {
  return `${dogId}:${type}:${slugText(message)}`;
}

function buildNotificationTitle(dogName, type) {
  switch (type) {
    case "vaccine":
      return `${dogName} · Vaccine alert`;
    case "mood":
      return `${dogName} · Mood alert`;
    case "health":
      return `${dogName} · Health follow-up`;
    default:
      return `${dogName} · Update`;
  }
}

function collectDogNotifications(dog, dashboard) {
  const fetchedAt = new Date().toISOString();
  const list = [];
  const alerts = Array.isArray(dashboard?.alerts) ? dashboard.alerts : [];

  alerts.forEach((alert) => {
    const type = alert?.type || "info";
    const message = alert?.message || "New update available";
    list.push({
      id: buildNotificationId(dog.id, type, message),
      dogId: dog.id,
      dogName: dog.name,
      type,
      title: buildNotificationTitle(dog.name, type),
      message,
      createdAt: fetchedAt,
      targetPage: type === "mood" ? "analyze" : "dogs",
      priority: type === "vaccine" ? 1 : type === "health" ? 2 : type === "mood" ? 3 : 9,
    });
  });

  const ongoingHealthCount = Number(dashboard?.ongoing_health_count || 0);
  if (ongoingHealthCount > 0) {
    const message = `${ongoingHealthCount} ongoing health record(s) need follow-up.`;
    list.push({
      id: buildNotificationId(dog.id, "health", message),
      dogId: dog.id,
      dogName: dog.name,
      type: "health",
      title: buildNotificationTitle(dog.name, "health"),
      message,
      createdAt: fetchedAt,
      targetPage: "dogs",
      priority: 2,
    });
  }

  return list;
}

function MainApp() {
  const [page, setPage] = useState("dashboard");
  const [dogs, setDogs] = useState([]);
  const [selectedDog, setSelectedDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const fetchNotifications = useCallback(async (sourceDogs = dogs) => {
    if (!sourceDogs.length) {
      setNotifications([]);
      return;
    }

    setNotificationsLoading(true);
    try {
      const dashboards = await Promise.all(
        sourceDogs.map(async (dog) => {
          try {
            const dashboard = await apiFetch(`/dogs/${dog.id}/dashboard`);
            return { dog, dashboard };
          } catch {
            return null;
          }
        }),
      );

      const rawItems = dashboards
        .filter(Boolean)
        .flatMap(({ dog, dashboard }) => collectDogNotifications(dog, dashboard));

      const deduped = Array.from(new Map(rawItems.map((item) => [item.id, item])).values());
      deduped.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return String(a.dogName).localeCompare(String(b.dogName));
      });
      setNotifications(deduped);
    } finally {
      setNotificationsLoading(false);
    }
  }, [dogs]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      // Ignore network errors here; local token removal is still enough for local logout.
    }
    localStorage.removeItem("pawmind_token");
    window.location.reload();
  };

  const fetchDogs = async () => {
    try {
      const data = await apiFetch("/dogs");
      const normalizedDogs = data.map(normalizeDog);
      setDogs(normalizedDogs);
      setSelectedDog((prev) => {
        if (!normalizedDogs.length) return null;
        if (!prev) return normalizedDogs[0];
        return normalizedDogs.find((d) => String(d.id) === String(prev.id)) || normalizedDogs[0];
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDogs();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [dogs, fetchNotifications]);

  const handleNotificationClick = useCallback((item) => {
    const dog = dogs.find((d) => String(d.id) === String(item?.dogId));
    if (dog) setSelectedDog(dog);
    setPage(item?.targetPage || "dogs");
  }, [dogs]);

  // Keep a null-safe selected dog reference across pages.
  const activeDog = selectedDog || dogs[0] || null;

  if (loading) return <div style={{ padding: 40, fontFamily: G.ff }}>Fetching your dogs...</div>;

  return (
    <div style={{ fontFamily: G.fs, background: G.bg, minHeight: "100vh" }}>
      <style>{`${css}\n${appAnimations}`}</style>
      <Nav
        page={page}
        setPage={setPage}
        onLogout={handleLogout}
        notifications={notifications}
        notificationsLoading={notificationsLoading}
        onRefreshNotifications={() => fetchNotifications()}
        onNotificationClick={handleNotificationClick}
      />
      {page === "dashboard" && <Dashboard dogs={dogs} setPage={setPage} setSelectedDog={setSelectedDog} />}
      {page === "dogs" && <MyDogs dogs={dogs} selectedDog={activeDog} setSelectedDog={setSelectedDog} setPage={setPage} onDogAdded={fetchDogs} />}
      {page === "analyze" && <AnalyzeChat dogs={dogs} selectedDog={activeDog} setSelectedDog={setSelectedDog} />}
      {page === "reports" && <Reports dogs={dogs} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthWrapper>
      <MainApp />
    </AuthWrapper>
  );
}
