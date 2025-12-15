// src/api/user.api.ts
import api from "../api/api";
import axios from "axios";

/**
 * Shared User type — keep fields minimal and add more as your backend returns them
 * Use `Record<string, unknown>` for any extra dynamic fields (safer than `any`)
 */
export interface UserBase {
  _id: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
  staffId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

/** If you want to allow extra dynamic fields, use this */
export type User = UserBase & Record<string, unknown>;

/* ------------------------- Error helper ------------------------------- */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function extractErrorMessage(err: unknown): string {
  // Use axios' type guard which narrows the type correctly
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;

    // data might be a string
    if (typeof data === "string") return data;

    // If data is an object, try to read `message` or `error` safely
    if (isRecord(data)) {
      // explicit type access with checks (no any)
      const maybeMessage = data["message"];
      const maybeError = data["error"];

      if (typeof maybeMessage === "string" && maybeMessage.length) return maybeMessage;
      if (typeof maybeError === "string" && maybeError.length) return maybeError;
    }

    // fallback to axios message
    return err.message ?? "Unknown Axios error";
  }

  // Non-axios errors: coerce to string safely
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/* ----------------------------- API Calls ------------------------------- */

/** GET /api/users */
export async function getAllUsers(): Promise<User[]> {
  try {
    const res = await api.get<User[]>("/users");
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/** GET /api/users/:id */
export async function getUserById(id: string): Promise<User> {
  try {
    const res = await api.get<User>(`/users/${id}`);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/** POST /api/users — admin create (if your backend exposes it) */
export async function createUser(payload: Partial<User>): Promise<User> {
  try {
    const res = await api.post<User>("/users", payload);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/** PUT /api/users/:id */
export async function updateUser(id: string, payload: Partial<User>): Promise<User> {
  try {
    const res = await api.put<User>(`/users/${id}`, payload);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/** DELETE /api/users/:id */
export async function deleteUser(id: string): Promise<void> {
  try {
    await api.delete(`/users/${id}`);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

export async function uploadUserAvatar(id: string, file: File): Promise<User> {
  const formData = new FormData();
  formData.append("avatar", file);
  try {
    const res = await api.post<User>(`/users/${id}/avatar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/* ----------------------------- Default export -------------------------- */

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
