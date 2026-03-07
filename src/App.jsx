import { useState, useEffect } from "react";
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

function MainApp() {
  const [page, setPage] = useState("dashboard");
  const [dogs, setDogs] = useState([]);
  const [selectedDog, setSelectedDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const handleLogout = () => {
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

  // Keep a null-safe selected dog reference across pages.
  const activeDog = selectedDog || dogs[0] || null;

  if (loading) return <div style={{ padding: 40, fontFamily: G.ff }}>Fetching your dogs...</div>;

  return (
    <div style={{ fontFamily: G.fs, background: G.bg, minHeight: "100vh" }}>
      <style>{`${css}\n${appAnimations}`}</style>
      <Nav page={page} setPage={setPage} onLogout={handleLogout} />
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
