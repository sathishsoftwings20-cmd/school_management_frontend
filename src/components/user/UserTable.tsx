import { useCallback, useEffect, useState } from "react";
import { getAllUsers, User } from "../../api/user.api";
const BACKEND_URL = import.meta.env.VITE_API_URL || window.location.origin;

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

export default function UserTable() {
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllUsers();
      setUserList(data ?? []);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err?.message || "Failed to load users");
      setUserList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

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

  const handleEdit = (id: string) => navigate(`/users/edit/${id}`);
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      showToast?.({
        variant: "success",
        title: "Deleted",
        message: "User deleted successfully",
      });
      await loadUser();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to delete user";
      showToast?.({ variant: "error", title: "Error", message: msg });
    }
  };

  if (loading) return <div className="p-4">Loading users...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!userList.length) return <div className="p-4">No user found</div>;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 w-full">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            User List
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
            {userList.map((user) => (
              <TableRow key={user._id}>
                <TableCell className="py-3 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="h-[50px] w-[50px] overflow-hidden rounded-md flex-shrink-0">
                      <img
                        src={
                          user.avatar
                            ? `${BACKEND_URL}/${user.avatar}`
                            : "/images/default-avatar.png"
                        }
                        className="h-[50px] w-[50px] object-cover"
                        alt={
                          user.fullName
                            ? `${user.fullName} avatar`
                            : "User avatar"
                        }
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-theme-sm sm:text-base dark:text-white/90">
                        {user.fullName ?? "No name"}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-3 px-3 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                  {user.email ?? "-"}
                </TableCell>

                <TableCell className="py-3 px-3 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                  <Badge size="sm" color={roleColor(user.role)}>
                    {user.role ?? "User"}
                  </Badge>
                </TableCell>
                <TableCell
                  className={"py-3 px-3 text-theme-sm whitespace-nowrap"}
                >
                  <div className="inline-flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(user._id)}
                      className={`icon-btn ${user.role === "SuperAdmin"
                        ? "cursor-not-allowed opacity-50"
                        : ""
                        }`}
                      aria-label="Edit"
                      disabled={user.role === "SuperAdmin"} // prevent edit if SuperAdmin
                    >
                      <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5 fill-gray-500 dark:fill-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(user._id)}
                      className={`icon-btn text-red-600 ${user.role === "SuperAdmin"
                        ? "cursor-not-allowed opacity-50"
                        : ""
                        }`}
                      aria-label="Delete"
                      disabled={user.role === "SuperAdmin"} // prevent delete if SuperAdmin
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
