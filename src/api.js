export const API_BASE = "http://localhost:8000/api/v1";
export const API_ORIGIN = API_BASE.replace(/\/api\/v1$/, "");

// Simple helper to get token
export function getToken() {
  return localStorage.getItem("pawmind_token");
}

export function setToken(token) {
  localStorage.setItem("pawmind_token", token);
}

// Custom wrapper around fetch
export async function apiFetch(endpoint, options = {}) {
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
    });
  } catch (err) {
    throw new Error("Cannot connect to API server");
  }

  if (response.status === 401) {
    localStorage.removeItem("pawmind_token");
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "API Error");
  }

  // 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}
