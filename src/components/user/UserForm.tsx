/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/user/UserForm.tsx
import React, { useEffect, useRef, useState } from "react";
import { getUserById } from "../../api/user.api";
import { getAllStaff, StaffBase } from "../../api/staff.api";
import api from "../../api/api";
import Label from "../ui/form/Label";
import Input from "../ui/form/InputField";
import FileInput from "../ui/form/FileInput";
import Button from "../ui/button/Button";
import Select from "../ui/form/Select";
import { useToast } from "../../context/ToastContext";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

/* ---------------------- Types ---------------------- */
type FormUser = {
  fullName: string;
  email: string;
  password?: string;
  passwordConfirm?: string;
  role: "SuperAdmin" | "Admin" | "Staff";
  staffId?: string;
  avatar?: File | null;
  avatarUrl?: string | null;
};

type Errors = {
  fullName?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  avatar?: string;
};

/* ---------------------- Defaults ---------------------- */
const defaultForm: FormUser = {
  fullName: "",
  email: "",
  password: "",
  passwordConfirm: "",
  role: "Staff",
  staffId: "",
  avatar: null,
  avatarUrl: null,
};

/* ---------------------- Helper to normalize staff photo ---------------------- */
function getStaffPhotoUrl(photo: StaffBase["photo"]): string | null {
  if (!photo) return null;
  const base = api.defaults.baseURL?.replace(/\/api\/?$/, "") ?? "";
  if (typeof photo === "string")
    return photo.startsWith("http")
      ? photo
      : `${base}${photo.startsWith("/") ? "" : "/"}${photo}`;
  if ("url" in photo && photo.url) return photo.url;
  if ("path" in photo && photo.path)
    return `${base}${photo.path.startsWith("/") ? "" : "/"}${photo.path}`;
  return null;
}

/* ===================== Component ===================== */
export default function UserForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const mounted = useRef(true);

  const [staffList, setStaffList] = useState<StaffBase[]>([]);
  const [staffOptions, setStaffOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [user, setUser] = useState<FormUser>(defaultForm);
  const [preview, setPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  /* ---------------- Load Staff ---------------- */
  useEffect(() => {
    let cancelled = false;
    const loadStaff = async () => {
      try {
        const data = await getAllStaff();
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setStaffList(list);
        setStaffOptions(
          list.map((s) => ({
            value: s._id,
            label: `${s.fullName ?? "Unknown"}${
              s.staffId ? ` — ${s.staffId}` : ""
            }`,
          }))
        );
      } catch (err) {
        console.error("Failed to load staff list", err);
      }
    };
    loadStaff();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------- Load User for Edit ---------------- */
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getUserById(id);
        if (cancelled) return;

        let avatarUrl: string | null = null;
        const maybeAvatar = (data as any).avatar;
        if (typeof maybeAvatar === "string" && maybeAvatar.length > 0) {
          const base = (api.defaults.baseURL ?? "").replace(/\/api\/?$/, "");
          avatarUrl = maybeAvatar.startsWith("http")
            ? maybeAvatar
            : `${base}${maybeAvatar.startsWith("/") ? "" : "/"}${maybeAvatar}`;
        }

        setUser({
          fullName: data.fullName || "",
          email: data.email || "",
          role: (data.role || "Staff") as FormUser["role"],
          password: "",
          passwordConfirm: "",
          avatar: null,
          avatarUrl,
          staffId: data.staffId || "",
        });
        setPreview(avatarUrl);
      } catch (err) {
        console.error("Failed to load user", err);
        showToast({
          variant: "error",
          title: "Error",
          message: "Failed to load user",
        });
      }
    })();

    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, [id]);

  /* ---------------- Revoke blob URL ---------------- */
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  /* ---------------- Handle Input/File Change ---------------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const name = target.name as keyof FormUser;

    if (target.type === "file") {
      const file = target.files?.[0] ?? null;

      if (file) {
        const allowed = ["image/png", "image/jpeg", "image/webp"];
        if (!allowed.includes(file.type)) {
          setErrors((s) => ({
            ...s,
            avatar: "Only PNG, JPG, JPEG, WEBP are allowed",
          }));
          setUser((s) => ({ ...s, avatar: null }));
          return;
        }
        if (file.size > 2 * 1024 * 1024) {
          setErrors((s) => ({ ...s, avatar: "File too large (max 2MB)" }));
          setUser((s) => ({ ...s, avatar: null }));
          return;
        }
        setErrors((s) => ({ ...s, avatar: undefined }));
        setUser((s) => ({ ...s, avatar: file }));
        if (preview && preview.startsWith("blob:"))
          URL.revokeObjectURL(preview);
        setPreview(URL.createObjectURL(file));
      } else {
        setUser((s) => ({ ...s, avatar: null }));
        if (user.staffId) handleStaffSelectChange(user.staffId);
        else setPreview(user.avatarUrl ?? null);
      }
    } else {
      setUser((s) => ({ ...s, [name]: target.value } as FormUser));
    }
  };

  /* ---------------- Role Options ---------------- */
  const roleOptions = [
    { value: "SuperAdmin", label: "SuperAdmin" },
    { value: "Admin", label: "Admin" },
    { value: "Staff", label: "Staff" },
  ];

  const handleRoleChange = (value: string) => {
    setUser((s) => ({
      ...s,
      role: value as FormUser["role"],
      staffId: value === "Staff" ? s.staffId : "",
    }));
  };

  /* ---------------- Staff Selection with autofill ---------------- */
  const handleStaffSelectChange = (value: string) => {
    // If cleared selection, unset staffId and keep existing values (inputs will re-enable)
    if (!value) {
      setUser((s) => ({ ...s, staffId: "" }));
      setPreview(user.avatarUrl ?? null);
      return;
    }

    const selectedStaff = staffList.find((s) => s._id === value);
    if (!selectedStaff) return;

    const photoUrl = getStaffPhotoUrl(selectedStaff.photo);

    setUser((s) => ({
      ...s,
      staffId: value,
      fullName: selectedStaff.fullName || "",
      email: selectedStaff.email || "",
      avatar: null,
      avatarUrl: photoUrl,
    }));
    setPreview(photoUrl);
  };

  /* ---------------- Validation ---------------- */
  const validate = (): boolean => {
    const newErrors: Errors = {};
    if (!user.fullName?.trim()) newErrors.fullName = "Full name is required";
    if (!user.email?.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email.trim()))
      newErrors.email = "Email is invalid";

    if (!id) {
      if (!user.password) newErrors.password = "Password is required";
      else if ((user.password ?? "").length < 6)
        newErrors.password = "Password must be at least 6 characters";
      if (!user.passwordConfirm)
        newErrors.passwordConfirm = "Confirm password is required";
      else if (user.password !== user.passwordConfirm)
        newErrors.passwordConfirm = "Passwords do not match";
    } else {
      if (user.password && user.password.length < 6)
        newErrors.password = "Password must be at least 6 characters";
      if (user.password && user.password !== user.passwordConfirm)
        newErrors.passwordConfirm = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------------- Submit Form ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("fullName", user.fullName);
      fd.append("email", user.email);
      fd.append("role", user.role);
      if (user.staffId) fd.append("staffId", user.staffId);
      if (user.password) fd.append("password", user.password);

      // If user uploaded a new file, send it
      if (user.avatar) {
        fd.append("avatar", user.avatar);
      }
      // If no uploaded file but linked to staff photo, fetch it as blob and send
      else if (user.avatarUrl && user.avatarUrl.startsWith("http")) {
        const res = await fetch(user.avatarUrl);
        const blob = await res.blob();
        const filename = user.avatarUrl.split("/").pop() || "avatar.jpg";
        fd.append("avatar", new File([blob], filename, { type: blob.type }));
      }

      if (id) {
        await api.put(`/users/${id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast({
          variant: "success",
          title: "Updated",
          message: "User updated successfully.",
        });
      } else {
        await api.post(`/users`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast({
          variant: "success",
          title: "Created",
          message: "User created.",
        });
      }

      setTimeout(() => navigate("/users"), 800);
    } catch (err: unknown) {
      console.error(err);
      let msg = "Error saving user.";
      if (axios.isAxiosError(err)) {
        const respData = err.response?.data as
          | Record<string, unknown>
          | undefined;
        const maybeMessage = respData?.["message"];
        if (typeof maybeMessage === "string") msg = maybeMessage;
      } else if (err instanceof Error) msg = err.message;
      showToast({ variant: "error", title: "Error", message: msg });
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  /* ---------------- Render ---------------- */
  const isStaffSelected = user.role === "Staff" && !!user.staffId;

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 overflow-hidden">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {id ? "Edit User" : "Create User"}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Role */}
          <div>
            <Label>Role</Label>
            <Select
              name="role"
              options={roleOptions}
              value={user.role}
              onChange={handleRoleChange}
              className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm"
            />
          </div>

          {/* Staff ID */}
          {user.role === "Staff" && (
            <div>
              <Label>Staff Id</Label>
              <Select
                name="staffId"
                options={staffOptions}
                value={user.staffId}
                onChange={handleStaffSelectChange}
                className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm"
              />
            </div>
          )}

          {/* Full Name */}
          <div>
            <Label>
              Full Name <span className="text-error-500">*</span>
            </Label>
            <Input
              name="fullName"
              value={user.fullName}
              onChange={handleChange}
              error={!!errors.fullName}
              disabled={isStaffSelected}
            />
            {errors.fullName && (
              <div className="text-sm text-red-600 mt-1">{errors.fullName}</div>
            )}
          </div>

          {/* Email */}
          <div>
            <Label>
              Email <span className="text-error-500">*</span>
            </Label>
            <Input
              name="email"
              value={user.email}
              onChange={handleChange}
              error={!!errors.email}
              disabled={isStaffSelected}
            />
            {errors.email && (
              <div className="text-sm text-red-600 mt-1">{errors.email}</div>
            )}
          </div>

          {/* Password */}
          <div>
            <Label>Password {id ? "(leave blank to keep current)" : "*"}</Label>
            <div className="relative">
              <Input
                name="password"
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                value={user.password ?? ""}
                onChange={handleChange}
                error={!!errors.password}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
              >
                {showPassword ? (
                  <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                ) : (
                  <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                )}
              </span>
            </div>
            {errors.password && (
              <div className="text-sm text-red-600 mt-1">{errors.password}</div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <Label>
              Confirm Password {id ? "(leave blank to keep current)" : "*"}
            </Label>
            <div className="relative">
              <Input
                name="passwordConfirm"
                placeholder="Confirm password"
                type={showConfirmPassword ? "text" : "password"}
                value={user.passwordConfirm ?? ""}
                onChange={handleChange}
                error={!!errors.passwordConfirm}
              />
              <span
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
              >
                {showConfirmPassword ? (
                  <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                ) : (
                  <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                )}
              </span>
            </div>
            {errors.passwordConfirm && (
              <div className="text-sm text-red-600 mt-1">
                {errors.passwordConfirm}
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="md:col-span-2 flex gap-6 items-start">
            <div className="flex-1">
              <Label>Avatar</Label>
              <FileInput onChange={handleChange} disabled={isStaffSelected} />
              {errors.avatar && (
                <div className="text-sm text-red-600 mt-1">{errors.avatar}</div>
              )}
            </div>
            <div className="flex-shrink-0">
              {preview ? (
                <img
                  src={preview}
                  alt="avatar preview"
                  className="w-24 h-24 rounded-full object-cover border"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 border flex items-center justify-center text-sm text-gray-500">
                  No image
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="md:col-span-2 flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
            >
              {loading ? "Saving..." : id ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
