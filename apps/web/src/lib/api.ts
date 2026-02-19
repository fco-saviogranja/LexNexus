"use client";

import { clearAuth, getAccessToken, getRefreshToken, saveAuth } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuth();
    return null;
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    clearAuth();
    return null;
  }

  const data = await response.json();
  const userRaw = localStorage.getItem("lexnexus_user");
  if (userRaw) {
    saveAuth({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: JSON.parse(userRaw)
    });
  }

  return data.accessToken as string;
}

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}, allowRetry = true): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers ?? {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401 && allowRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch(path, options, false);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message ?? `Erro HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
