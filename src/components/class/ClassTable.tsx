/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { getAllClass, ClassBase } from "../../api/class.api";
import { StaffBase } from "../../api/staff.api"; // optional - we'll call api directly if you don't have exported helper

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import api from "../../api/api";

export default function ClassTable() {
  const [classList, setClassList] = useState<ClassBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<StaffBase[]>([]);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // maps for quick lookup
  const staffById = new Map<string, StaffBase>();
  const staffByCode = new Map<string, StaffBase>();

  // load staff once for staff display lookups
  const loadStaff = useCallback(async () => {
    try {
      // try to use api.get('/staff') so it respects auth headers
      const res = await api.get<StaffBase[]>("/staff");
      const data = res.data || [];
      setStaffList(data);
    } catch (err) {
      console.error("Failed to load staff for class table", err);
      setStaffList([]);
    }
  }, []);

  // load classes
  const loadClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllClass();
      setClassList(data ?? []);
    } catch (err: any) {
      console.error("Error fetching Classes:", err);
      setError(err?.message || "Failed to load Classes");
      setClassList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  // build lookup maps from staffList (recomputed each render; tiny cost)
  staffList.forEach((s) => {
    if (s._id) staffById.set(s._id, s);
    // store by staffId/classic code too (e.g. STAFF0003)
    if ((s as any).staffId) staffByCode.set((s as any).staffId, s);
    if ((s as any).staffCode) staffByCode.set((s as any).staffCode, s);
  });

  // returns a readable label for a staff value
  function getstaffLabel(staff: any): string {
    if (!staff) return "—";
    // populated object from server
    if (typeof staff === "object") {
      const t = staff as any;
      return t.fullName || t.staffId || t.staffCode || t.email || t._id || "—";
    }
    // string: could be ObjectId ("64ab...") or staff code ("STAFF0003")
    if (typeof staff === "string") {
      // try objectId lookup in staffById
      const byId = staffById.get(staff);
      if (byId) return byId.fullName || byId.staffId || byId.email || byId._id;

      // try staff code lookup (exact match)
      const byCode = staffByCode.get(staff);
      if (byCode)
        return byCode.fullName || byCode.staffId || byCode.email || byCode._id;

      // fallback: if string looks like an object (JSON), try parse
      try {
        const parsed = JSON.parse(staff);
        if (parsed && typeof parsed === "object") {
          return parsed.fullName || parsed.staffId || JSON.stringify(parsed);
        }
      } catch {
        /* not JSON */
      }

      // final fallback: show raw string (maybe staffCode or ObjectId)
      return staff;
    }
    return String(staff);
  }

  const handleEdit = (id: string) => navigate(`/class/edit/${id}`);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this class?")) return;
    try {
      await api.delete(`/classes/${id}`);
      showToast?.({
        variant: "success",
        title: "Deleted",
        message: "Class deleted successfully",
      });
      await loadClasses();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to delete class";
      showToast?.({ variant: "error", title: "Error", message: msg });
    }
  };

  if (loading) return <div className="p-4">Loading Classes...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!classList.length) return <div className="p-4">No classes found</div>;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 w-full">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Class List
          </h3>
        </div>
      </div>

      <div className="w-full overflow-x-auto px-2 sm:px-0 table-scroll">
        <Table className="min-w-[700px] sm:min-w-full">
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Class Name
              </TableCell>

              <TableCell
                isHeader
                className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Sections (staff)
              </TableCell>

              <TableCell
                isHeader
                className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Action
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {classList.map((cls) => (
              <TableRow key={cls._id}>
                <TableCell className="py-3 px-3 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                  {cls.className ?? "-"}
                </TableCell>

                <TableCell className="py-3 px-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {Array.isArray(cls.sections) && cls.sections.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {cls.sections.map((s, idx) => {
                        const staffLabel = getstaffLabel((s as any).staff);
                        return (
                          <div key={idx} className="text-sm">
                            <strong>{s.name ?? "—"}</strong>
                            <span className="mx-2">—</span>
                            <span className="text-slate-600">
                              {" "}
                              {staffLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-600">No sections</div>
                  )}
                </TableCell>

                <TableCell className="py-3 px-3 text-theme-sm whitespace-nowrap">
                  <div className="inline-flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(cls._id)}
                      className="icon-btn"
                      aria-label="Edit"
                    >
                      <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5 fill-gray-500 dark:fill-gray-400" />
                    </button>

                    <button
                      onClick={() => handleDelete(cls._id)}
                      className="icon-btn text-red-600"
                      aria-label="Delete"
                    >
                      <TrashBinIcon className="w-4 h-4 sm:w-5 sm:h-5 fill-gray-500 dark:fill-gray-400" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
