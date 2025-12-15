// src/api/attendance.api.ts
import api from "../api/api";
import axios from "axios";

/* ----------------------------- Types ----------------------------- */

export type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused" | "Half Day";

export interface AttendanceRecord {
    studentId: string;
    status: AttendanceStatus;
}

export interface AttendanceBase {
    _id: string;
    attendanceCode: string;
    studentId: string;
    classId: string;
    section: string;
    date: string;
    status: AttendanceStatus;
    createdBy?: string;
    updatedBy?: string;
    createdAt: string;
    updatedAt: string;
}

export type Attendance = AttendanceBase & Record<string, unknown>;

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

/** GET attendance for a class-section by date */
export async function getAttendance(
    classId: string,
    section: string,
    date: string
): Promise<Attendance[]> {
    try {
        const res = await api.get<Attendance[]>(
            `/attendance/class/${classId}/section/${section}?date=${date}`
        );
        return res.data;
    } catch (err) {
        throw new Error(extractErrorMessage(err));
    }
}

/** POST mark attendance (bulk) */
export async function markAttendance(
    classId: string,
    section: string,
    date: string,
    records: AttendanceRecord[]
): Promise<Attendance[]> {
    try {
        const res = await api.post<Attendance[]>("/attendance/mark", {
            classId,
            section,
            date,
            records,
        });
        return res.data;
    } catch (err) {
        throw new Error(extractErrorMessage(err));
    }
}

/** PUT update single attendance record */
export async function updateAttendance(
    attendanceId: string,
    status: AttendanceStatus
): Promise<Attendance> {
    try {
        const res = await api.put<Attendance>(`/attendance/${attendanceId}`, { status });
        return res.data;
    } catch (err) {
        throw new Error(extractErrorMessage(err));
    }
}

/** DELETE attendance record */
export async function deleteAttendance(attendanceId: string): Promise<void> {
    try {
        await api.delete(`/attendance/${attendanceId}`);
    } catch (err) {
        throw new Error(extractErrorMessage(err));
    }
}

/* -------------------------- Default export ------------------------ */
export default {
    getAttendance,
    markAttendance,
    updateAttendance,
    deleteAttendance,
};
