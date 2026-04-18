const BASE_URL = import.meta.env.VITE_API_URL ?? "";

let accessToken: string | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
  sessionStorage.setItem("access_token", token);
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  const stored = sessionStorage.getItem("access_token");
  if (stored) {
    accessToken = stored;
    return stored;
  }
  return null;
}

export function logout() {
  accessToken = null;
  sessionStorage.removeItem("access_token");
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${accessToken}`;
      const retryRes = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
      });
      if (!retryRes.ok) throw new Error("Request failed after refresh");
      return retryRes.json();
    }
    accessToken = null;
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    const data = await res.json();
    accessToken = data.accessToken;
    return true;
  } catch {
    return false;
  }
}

export const api = {
  login: (email: string, password: string) =>
    request<{ accessToken: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      credentials: "include",
    }),

  getPods: () => request<import("../types").PodSummary[]>("/api/pods"),

  getSystemMetrics: () =>
    request<import("../types").SystemMetrics>("/api/metrics/system"),
};
