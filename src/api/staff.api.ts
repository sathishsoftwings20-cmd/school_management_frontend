// src/api/staff.api.ts
import api from "../api/api";
import axios from "axios";

/* ----------------------------- Types ----------------------------- */

export interface DocumentEntry {
  originalName?: string;
  path?: string;
  url?: string;
  uploadedAt?: string | Date;
}

export interface StaffBase {
  _id: string;
  staffId: string;
  fullName: string;
  email: string;
  role: string;
  designation?: string;
  employmentStatus?: string;
  experienceYears?: number;
  salary?: number;
  previousInstitution?: string;
  dateOfJoining?: string;
  dateOfBirth?: string;
  gender?: string;
  mobile?: string;
  aadhaarNumber?: string;
  emergencyContact?: string;
  degree?: string;
  major?: string;
  accountName?: string;
  accountNumber?: string;
  ifsc?: string;
  bankName?: string;
  branch?: string;
  fatherName?: string;
  fatherMobile?: string;
  spouseName?: string;
  spouseMobile?: string;
  street?: string;
  city?: string;
  state?: string;
  pin?: string;
  country?: string;
  // documents can be strings (paths) or structured objects returned from server
  documents?: Array<string | DocumentEntry>;
  photo?: string | DocumentEntry; // photo can be path string or object
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export type Staff = StaffBase & Record<string, unknown>;

/* ------------------------- Error helper -------------------------- */
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

/* ----------------------------- API Calls ------------------------- */

/** GET all staff */
export async function getAllStaff(): Promise<Staff[]> {
  try {
    const res = await api.get<Staff[]>("/staff");
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/** GET staff by ID */
export async function getStaffById(id: string): Promise<Staff> {
  try {
    const res = await api.get<Staff>(`/staff/${id}`);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/** Helper to append all staff fields to FormData */
function appendStaffFields(formData: FormData, payload: Partial<Staff>) {
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
   else {
      formData.append(key, String(value));
    }
  });
}

/** POST create staff (with optional files) */
export async function createStaff(
  payload: Partial<Staff>,
  documents?: File[],
  photo?: File
): Promise<Staff> {
  try {
    const formData = new FormData();
    appendStaffFields(formData, payload);

    if (documents) documents.forEach((file) => formData.append("documents", file));
    if (photo) formData.append("photo", photo);

    const res = await api.post<Staff>("/staff", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/** PUT update staff (with optional files) */
export async function updateStaff(
  id: string,
  payload: Partial<Staff>,
  documents?: File[],
  photo?: File, removedRemoteFiles?: string[]
): Promise<Staff> {
  try {
    const formData = new FormData();
    appendStaffFields(formData, payload);

    if (documents) documents.forEach((file) => formData.append("documents", file));
    if (photo) formData.append("photo", photo);
     // include removed remote files as JSON so backend can parse easily
    if (removedRemoteFiles && removedRemoteFiles.length) {
  // append each path so server can read as array
  removedRemoteFiles.forEach(p => formData.append("removedFiles[]", p));
}


    const res = await api.put<Staff>(`/staff/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/** DELETE staff */
export async function deleteStaff(id: string): Promise<void> {
  try {
    await api.delete(`/staff/${id}`);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/* -------------------------- Default export ------------------------ */
export default {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
};
