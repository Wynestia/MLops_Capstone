export const API_BASE = "http://localhost:8000/api/v1";
export const API_ORIGIN = API_BASE.replace(/\/api\/v1$/, "");

// Simple helper to get token
export function getToken() {
  return localStorage.getItem("pawmind_token");
}

export function setToken(token) {
  localStorage.setItem("pawmind_token", token);
}

function normalizeApiError(err) {
  if (!err) return "API Error";
  if (typeof err === "string") return err;
  if (Array.isArray(err?.detail)) {
    const messages = err.detail
      .map((d) => d?.msg || d?.message || "")
      .filter(Boolean);
    if (messages.length) return messages.join(", ");
  }
  return err.detail || err.message || "API Error";
}

async function refreshAccessToken() {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const nextToken = data?.access_token;
    if (!nextToken) return null;
    setToken(nextToken);
    return nextToken;
  } catch {
    return null;
  }
}

// Custom wrapper around fetch
export async function apiFetch(endpoint, options = {}, canRetry = true) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch (err) {
    throw new Error("Cannot connect to API server");
  }

  if (response.status === 401) {
    if (canRetry) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiFetch(endpoint, options, false);
      }
    }
    localStorage.removeItem("pawmind_token");
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(normalizeApiError(err));
  }

  // 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}
