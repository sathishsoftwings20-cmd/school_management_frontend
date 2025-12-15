// src/api/student.api.ts
import api from "../api/api";
import axios from "axios";

/* ----------------------------- Types ----------------------------- */

export interface DocumentEntry {
  originalName?: string;
  path?: string;
  url?: string;
  uploadedAt?: string | Date;
}

export interface PhotoEntry {
  originalName?: string;
  path?: string;
  url?: string;
  uploadedAt?: string | Date;
}

export interface StudentBase {
  _id: string;
  studentCode?: string;
  admissionNo?: string;
  rollNumber?: string;
  fullName: string;
  enrolementStatus?: string;
  dateOfBirth?: string;
  gender?: string;
  email: string;
  mobile?: string;
  aadhaarNumber?: string;
  birthPlace?: string;
  nationality?: string;
  bloodGroup?: string;
  caste?: string;
  subCaste?: string;
  disability_Allergy?: string;
  fatherName?: string;
  fatherMobile?: string;
  fatherOccupation?: string;
  fatherWorkspace?: string;
  fatherAnnualIncome?: number | string;
  motherName?: string;
  motherMobile?: string;
  motherOccupation?: string;
  motherWorkspace?: string;
  motherAnnualIncome?: number | string;
  guardianName?: string;
  guardianMobile?: string;
  alternateMobile?: string;
  homeMobile?: string;
  class?: string; // This is ObjectId string
  className?: string;
  // REMOVE: classCode?: string; // No longer exists
  section?: string; // This is ObjectId string
  sectionName?: string;
  currentStreet?: string;
  currentCity?: string;
  currentState?: string;
  currentPin?: string;
  currentCountry?: string;
  permanentStreet?: string;
  permanentCity?: string;
  permanentState?: string;
  permanentPin?: string;
  permanentCountry?: string;
  documents?: Array<string | DocumentEntry>;
  studentPhoto?: string | PhotoEntry;
  fatherPhoto?: string | PhotoEntry;
  motherPhoto?: string | PhotoEntry;
  role?: string;
  [k: string]: any;
  username?: string;
  password?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
export type Student = StudentBase & Record<string, unknown>;

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

/** GET all student */
export async function getAllStudent(): Promise<Student[]> {
  try {
    const res = await api.get<Student[]>("/student");
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/** GET student by ID */
export async function getStudentById(id: string): Promise<Student> {
  try {
    const res = await api.get<Student>(`/student/${id}`);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/** Helper to append all student fields to FormData */
// Add this helper function for ObjectId validation/conversion
function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Update appendPayloadToForm function:
function appendPayloadToForm(form: FormData, payload: Record<string, any>) {
  Object.entries(payload).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    
    // Skip classCode entirely (removed from model)
    if (k === 'classCode') return;
    
    // Handle class and section ObjectIds
    if ((k === 'class' || k === 'section') && typeof v === 'string') {
      if (v === '' || !isValidObjectId(v)) {
        // Send as null if invalid or empty
        form.append(k, 'null');
      } else {
        form.append(k, v);
      }
      return;
    }
    
    // If it's an object/array (not file), send JSON string
    if (typeof v === "object" && !(v instanceof File)) {
      form.append(k, JSON.stringify(v));
    } else {
      form.append(k, String(v));
    }
  });
}
/** POST create student (with optional files) */
export async function createStudent(
  payload: Partial<Student>,
  documents?: File[],
  studentPhoto?: File,
  fatherPhoto?: File,
  motherPhoto?: File
) {
  const form = new FormData();
  
  // Clean payload - remove empty class/section fields
  const cleanPayload = { ...payload };
  if (cleanPayload.class === '') delete cleanPayload.class;
  if (cleanPayload.section === '') delete cleanPayload.section;
  
  appendPayloadToForm(form, cleanPayload);

  if (documents && documents.length) {
    for (const file of documents) {
      form.append("documents", file);
    }
  }

  if (studentPhoto) form.append("studentPhoto", studentPhoto);
  if (fatherPhoto) form.append("fatherPhoto", fatherPhoto);
  if (motherPhoto) form.append("motherPhoto", motherPhoto);

  const res = await api.post("/student", form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  
  return res.data;
}

export async function updateStudent(
  id: string,
  payload: Partial<Student>,
  documents?: File[],
  studentPhoto?: File,
  fatherPhoto?: File,
  motherPhoto?: File,
  removedRemoteFiles?: string[]
) {
  const form = new FormData();
  
  // Clean payload - remove empty class/section fields
  const cleanPayload = { ...payload };
  if (cleanPayload.class === '') delete cleanPayload.class;
  if (cleanPayload.section === '') delete cleanPayload.section;
  
  appendPayloadToForm(form, cleanPayload);

  if (documents && documents.length) {
    for (const file of documents) {
      form.append("documents", file);
    }
  }

  if (studentPhoto) form.append("studentPhoto", studentPhoto);
  if (fatherPhoto) form.append("fatherPhoto", fatherPhoto);
  if (motherPhoto) form.append("motherPhoto", motherPhoto);

  if (removedRemoteFiles && removedRemoteFiles.length) {
    form.append("removedRemoteFiles", JSON.stringify(removedRemoteFiles));
  }

  const res = await api.put(`/student/${id}`, form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  
  return res.data;
}

/** DELETE student */
export async function deleteStudent(id: string): Promise<void> {
  try {
    await api.delete(`/student/${id}`);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/* -------------------------- Default export ------------------------ */
export default {
  getAllStudent,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};