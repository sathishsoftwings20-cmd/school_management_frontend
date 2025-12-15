// src/api/class.api.ts
import api from "../api/api";
import axios from "axios";
export interface Section {
  _id?: string;  // Add this - section ObjectId
  name: string;
  staff?: string | null; // staff is staff._id when sending
  staffCode?: string;
  staffIdentifier?: string;
}

export interface ClassBase {
  _id: string;
  classCode?: string;
  className: string;
  sections: Section[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export type Class = ClassBase & Record<string, unknown>;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

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
    return err.message ?? "Unknown Axios error";
  }
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/** GET all classes */
export async function getAllClass(): Promise<Class[]> {
  try {
    const res = await api.get<Class[]>("/classes");
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/** GET class by ID */
export async function getClassById(id: string): Promise<Class> {
  try {
    const res = await api.get<Class>(`/classes/${id}`);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/** POST create class */
export async function createClass(payload: {
  className: string;
  sections?: Section[];
}): Promise<Class> {
  try {
    const res = await api.post<Class>("/classes", payload);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/** PUT update class */
export async function updateClass(
  id: string,
  payload: Partial<{ className: string; sections: Section[] }>
): Promise<Class> {
  try {
    const res = await api.put<Class>(`/classes/${id}`, payload);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/** DELETE class */
export async function deleteClass(id: string): Promise<void> {
  try {
    await api.delete(`/classes/${id}`);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

export default {
  getAllClass,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
};