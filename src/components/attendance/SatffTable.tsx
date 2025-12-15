import { useCallback, useEffect, useState } from "react";
import { getAllStaff, StaffBase } from "../../api/staff.api";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import api from "../../api/api";

export default function SatffTable() {
  const [staffList, setStaffList] = useState<StaffBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const loadSatff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllStaff();
      setStaffList(data ?? []);
    } catch (err: any) {
      console.error("Error fetching Satffs:", err);
      setError(err?.message || "Failed to load Satffs");
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSatff();
  }, [loadSatff]);

  function roleColor(role?: string) {
    switch (role) {
      case "SuperAdmin":
        return "success";
      case "Admin":
        return "warning";
      case "Staff":
        return "error";
      default:
        return "primary";
    }
  }

  const handleEdit = (id: string) => navigate(`/staff/edit/${id}`);
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this staff?")) return;
    try {
      await api.delete(`/staff/${id}`);
      showToast?.({
        variant: "success",
        title: "Deleted",
        message: "Satff deleted successfully",
      });
      await loadSatff();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to delete staff";
      showToast?.({ variant: "error", title: "Error", message: msg });
    }
  };

  if (loading) return <div className="p-4">Loading Staffs...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!staffList.length) return <div className="p-4">No staff found</div>;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 w-full">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Staff List
          </h3>
        </div>
      </div>

      {/* wrapper: full width + padding + custom scrollbar class */}
      <div className="w-full overflow-x-auto px-2 sm:px-0 table-scroll">
        {/* make table wider on mobile so the scroll span is longer */}
        <Table className="min-w-[700px] sm:min-w-full">
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Staff Id
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
                Email
              </TableCell>
              <TableCell
                isHeader
                className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Role
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
            {staffList.map((staff) => (
              <TableRow key={staff._id}>

                <TableCell className="py-3 px-3 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                  {staff.staffId ?? "-"}
                </TableCell>


                <TableCell className="py-3 px-3 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                  {staff.fullName ?? "-"}
                </TableCell>

                <TableCell className="py-3 px-3 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                  {staff.email ?? "-"}
                </TableCell>

                <TableCell className="py-3 px-3 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                  <Badge size="sm" color={roleColor(staff.role)}>
                    {staff.role ?? "Staff"}
                  </Badge>
                </TableCell>
                <TableCell
                  className={"py-3 px-3 text-theme-sm whitespace-nowrap"}
                >
                  <div className="inline-flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(staff._id)}
                      className={`icon-btn ${staff.role === "SuperAdmin"
                        ? "cursor-not-allowed opacity-50"
                        : ""
                        }`}
                      aria-label="Edit"
                      disabled={staff.role === "SuperAdmin"} // prevent edit if SuperAdmin
                    >
                      <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5 fill-gray-500 dark:fill-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(staff._id)}
                      className={`icon-btn text-red-600 ${staff.role === "SuperAdmin"
                        ? "cursor-not-allowed opacity-50"
                        : ""
                        }`}
                      aria-label="Delete"
                      disabled={staff.role === "SuperAdmin"} // prevent delete if SuperAdmin
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
