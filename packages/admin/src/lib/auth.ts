import type { User } from "./types";

import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from "./constants";

export interface JWTPayload {
  sub: string;
  exp: number;
  iat: number;
  [key: string]: unknown;
}

export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    if (!payload) return null;

    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as JWTPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

export function isTokenExpiringSoon(
  token: string,
  thresholdSeconds = 300,
): boolean {
  const payload = decodeJWT(token);
  if (!payload) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp - now < thresholdSeconds;
}

export function saveAuthData(
  token: string,
  refreshToken: string,
  user: User,
): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function loadAuthData(): {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
} {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const userStr = localStorage.getItem(USER_KEY);

  let user: User | null = null;
  if (userStr) {
    try {
      user = JSON.parse(userStr) as User;
    } catch {
      user = null;
    }
  }

  return { token, refreshToken, user };
}

export function clearAuthData(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
