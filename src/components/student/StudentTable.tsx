/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { getAllStudent } from "../../api/student.api"; // ✅ Fixed import name
import { Student as StudentBase } from "../../api/student.api";
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

export default function StudentTable() {
  const [students, setStudents] = useState<StudentBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllStudent(); // ✅ This matches the export
      setStudents(data ?? []);
    } catch (err: any) {
      console.error("Error fetching Students:", err);
      setError(err?.message || "Failed to load Students");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleEdit = (id: string) => navigate(`/students/edit/${id}`);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this student?")) return;
    try {
      await api.delete(`/student/${id}`);
      showToast?.({
        variant: "success",
        title: "Deleted",
        message: "Student deleted successfully",
      });
      await loadStudents();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to delete student";
      showToast?.({ variant: "error", title: "Error", message: msg });
    }
  };

  if (loading) return <div className="p-4">Loading students...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!students.length) return <div className="p-4">No students found</div>;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 sm:px-6 w-full">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Student List
          </h3>
        </div>
      </div>

      <div className="w-full overflow-x-auto px-2 sm:px-0 table-scroll">
        <Table className="min-w-[900px] sm:min-w-full">
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Admission No
              </TableCell>
              <TableCell
                isHeader
                className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Roll Number
              </TableCell>

              <TableCell
                isHeader
                className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Name
              </TableCell>

              <TableCell
                isHeader
                className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Class / Section
              </TableCell>

              <TableCell
                isHeader
                className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Email
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
            {students.map((st) => (
              <TableRow key={st._id}>
                <TableCell className="py-3 px-3 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                  {st.admissionNo ?? "-"}
                </TableCell>
                <TableCell className="py-3 px-3 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                  {st.rollNumber ?? "-"}
                </TableCell>
                <TableCell className="py-3 px-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {st.fullName ?? "-"}
                </TableCell>

                <TableCell className="py-3 px-3 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                  {st.className || "-"} <span className="mx-1">/</span>{" "}
                  {st.sectionName || "-"}{" "}
                </TableCell>

                <TableCell className="py-3 px-3 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                  {st.email || "-"}
                </TableCell>

                <TableCell className="py-3 px-3 text-theme-sm whitespace-nowrap">
                  <div className="inline-flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(st._id)}
                      className="icon-btn"
                      aria-label="Edit"
                    >
                      <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5 fill-gray-500 dark:fill-gray-400" />
                    </button>

                    <button
                      onClick={() => handleDelete(st._id)}
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
