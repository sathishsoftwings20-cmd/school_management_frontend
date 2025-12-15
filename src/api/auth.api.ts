// src/api/auth.api.ts
import api, { setAuthToken } from "../api/api";
import axios from "axios";
import type { User } from "./user.api";

export interface LoginPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  token?: string;
  user: User;
}

const TOKEN_KEY = "school_auth_token";

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  setToken(null);
}

/* Helper: narrow plain objects */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/* Better error extractor without `any` */
function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (typeof data === "string") return data;
    if (isRecord(data)) {
      const maybeMessage = data["message"];
      const maybeError = data["error"];
      if (typeof maybeMessage === "string" && maybeMessage.length) return maybeMessage;
      if (typeof maybeError === "string" && maybeError.length) return maybeError;
    }
    return err.message ?? "An Axios error occurred";
  }

  if (err instanceof Error) return err.message;
  try {
    return String(err);
  } catch {
    return "Unknown error";
  }
}

/* ----------------------------- API Calls ------------------------------- */

export async function login(payload: LoginPayload): Promise<User> {
  try {
    const res = await api.post<AuthResponse>("/auth/login", payload);
    const { token, user } = res.data;
    if (token) setToken(token);
    return user;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

export async function logout(): Promise<void> {
  try {
    // optionally call backend to invalidate token
    // await api.post("/auth/logout");
  } catch (err) {
    // If backend returns useful info, you could log it
    throw new Error(extractErrorMessage(err));
  } finally {
    clearToken();
  }
}

/**
 * Returns the current user, or null if not authenticated / request fails
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await api.get<User>("/auth/me");
    return res.data;
  } catch (err) {
    // treat any failure as "not authenticated" on client
    return null;
  }
}

/* default export */
export default {
  login,
  logout,
  getCurrentUser,
  setToken,
  getToken,
  clearToken,
};
