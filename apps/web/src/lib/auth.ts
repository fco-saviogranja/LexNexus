"use client";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "student";
};

const ACCESS_KEY = "lexnexus_access_token";
const REFRESH_KEY = "lexnexus_refresh_token";
const USER_KEY = "lexnexus_user";

export function saveAuth(payload: { accessToken: string; refreshToken: string; user: AuthUser }) {
  localStorage.setItem(ACCESS_KEY, payload.accessToken);
  localStorage.setItem(REFRESH_KEY, payload.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}
