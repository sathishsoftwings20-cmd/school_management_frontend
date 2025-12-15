/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/staff/StaffForm.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  getStaffById,
  createStaff,
  updateStaff,
  Staff as ApiStaff,
} from "../../api/staff.api";
import Label from "../ui/form/Label";
import Input from "../ui/form/InputField";
import FileInput from "../ui/form/FileInput";
import Button from "../ui/button/Button";
import Select from "../ui/form/Select";
import PhoneInput from "../ui/form/PhoneInput";
import DatePicker from "../ui/form/date-picker";
import { useToast } from "../../context/ToastContext";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
// add after your imports at top of file
const BACKEND_URL =
  (import.meta as any).env?.VITE_API_URL || window.location.origin;

type PreviewEntry = {
  url: string;
  name: string;
  type: string;
  path?: string;
  remote?: boolean;
};

interface DocumentEntry {
  originalName?: string;
  path?: string;
  url?: string;
}

interface FormStaffState {
  _id: string;
  staffId: string;
  fullName: string;
  email: string;
  role: string;
  designation: string;
  employmentStatus: string;
  experienceYears: number;
  salary: number;
  previousInstitution: string;
  dateOfJoining: string;
  dateOfBirth: string;
  gender: string;
  mobile: string;
  aadhaarNumber: string;
  emergencyContact: string;
  degree: string;
  major: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  branch: string;
  fatherName: string;
  fatherMobile: string;
  spouseName: string;
  spouseMobile: string;
  street: string;
  city: string;
  state: string;
  pin: string;
  country: string;

  // files / previews
  documentsFiles: File[]; // local files selected
  photoFile?: File | null;
  photoPath?: string; // <-- add this
  previewFiles: PreviewEntry[]; // existing remote + local preview entries
  documents: PreviewEntry[]; // server docs representation

  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

type FormErrors = Partial<
  Record<
    | keyof FormStaffState
    | "mobile"
    | "aadhaarNumber"
    | "fatherMobile"
    | "spouseMobile"
    | "emergencyPhone",
    string
  >
>;

export default function StaffForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const mounted = useRef(true);

  const initialState: FormStaffState = {
    _id: "",
    staffId: "",
    fullName: "",
    email: "",
    role: "Staff",
    designation: "",
    employmentStatus: "",
    experienceYears: 0,
    salary: 0,
    previousInstitution: "",
    dateOfJoining: "",
    dateOfBirth: "",
    gender: "",
    mobile: "",
    aadhaarNumber: "",
    emergencyContact: "",
    degree: "",
    major: "",
    accountName: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
    branch: "",
    fatherName: "",
    fatherMobile: "",
    spouseName: "",
    spouseMobile: "",
    street: "",
    city: "",
    state: "",
    pin: "",
    country: "",
    documentsFiles: [],
    photoFile: null,
    photoPath: undefined,
    previewFiles: [],
    documents: [],
  };

  const [staff, setStaff] = useState<FormStaffState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [removedRemoteFiles, setRemovedRemoteFiles] = useState<string[]>([]);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
  ];
  const employmentOptions = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ];

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getStaffById(id);
        if (cancelled) return;

        // helper to format to YYYY-MM-DD or empty string
        const mapDate = (v: unknown): string => {
          if (!v) return "";
          const d = new Date(String(v));
          if (isNaN(d.getTime())) return "";
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          return `${yyyy}-${mm}-${dd}`;
        };

        // documents may be string[] or DocumentEntry[]
        const docs = (data.documents ?? []) as Array<string | DocumentEntry>;
        const previewFiles: PreviewEntry[] = docs.map((d) => {
          if (typeof d === "string") {
            const normalized = d.replace(/\\/g, "/").trim();
            const base = String(BACKEND_URL).replace(/\/$/, "");
            const cleanPath = normalized.replace(/^\//, "");
            const url =
              normalized.startsWith("http") || normalized.startsWith("blob:")
                ? normalized
                : `${base}/${cleanPath}`;
            const name = cleanPath.split("/").pop() || "file";
            const ext = name.includes(".")
              ? name.split(".").pop() || "unknown"
              : "unknown";
            return { url, name, type: ext, path: normalized, remote: true };
          } else {
            const normalized = (d.path ?? d.url ?? "")
              .replace(/\\/g, "/")
              .trim();
            const base = String(BACKEND_URL).replace(/\/$/, "");
            const cleanPath = normalized.replace(/^\//, "");
            const url =
              (d.url && String(d.url)) ||
              (normalized.startsWith("http") || normalized.startsWith("blob:")
                ? normalized
                : cleanPath
                ? `${base}/${cleanPath}`
                : "");
            const name = d.originalName || cleanPath.split("/").pop() || "file";
            const ext = name.includes(".")
              ? name.split(".").pop() || "unknown"
              : "unknown";
            return {
              url,
              name,
              type: ext,
              path: normalized || undefined,
              remote: true,
            };
          }
        });

        // --- robust photo parsing: handles string | { path, url } | {photo: ...} | array ---
        let photoPathFromApi: string | undefined;
        let initialPhotoPreviewUrl: string | null = null;

        // helper: return first non-empty string or undefined
        // const strOrUndef = (v: unknown): string | undefined =>
        //   v && typeof v === "string" && v.trim() ? (v as string).trim() : undefined;

        // Raw candidates from common API shapes
        const rawCandidates: unknown[] = [];

        // common locations where backend might put photo
        rawCandidates.push((data as any).photo);
        rawCandidates.push((data as any).photoUrl);
        rawCandidates.push((data as any).photoPath);
        rawCandidates.push((data as any).avatar);
        rawCandidates.push((data as any).image);
        rawCandidates.push((data as any).thumbnail);

        // If backend returned an object wrapper like { photo: { path, url, originalName } }
        if ((data as any).photo && typeof (data as any).photo === "object") {
          rawCandidates.push((data as any).photo.path);
          rawCandidates.push((data as any).photo.url);
          rawCandidates.push((data as any).photo.originalName);
        }

        // If API returns an array, try the first item
        if (
          Array.isArray((data as any).photo) &&
          (data as any).photo.length > 0
        ) {
          const first = (data as any).photo[0];
          rawCandidates.push(first?.path ?? first?.url ?? first);
        }

        // normalize: pick the first usable string or object with url/path
        for (const candidate of rawCandidates) {
          if (!candidate) continue;
          if (typeof candidate === "string") {
            photoPathFromApi = candidate;
            break;
          }
          if (typeof candidate === "object") {
            // common object shapes
            const c = candidate as any;
            if (typeof c.url === "string" && c.url.trim()) {
              photoPathFromApi = c.url.trim();
              break;
            }
            if (typeof c.path === "string" && c.path.trim()) {
              photoPathFromApi = c.path.trim();
              break;
            }
            // fallback to string coercion if object has toString overridden (rare)
            if (c.toString && typeof c.toString === "function") {
              const s = String(c);
              if (s && s !== "[object Object]") {
                photoPathFromApi = s;
                break;
              }
            }
          }
        }

        // If still not found, try any direct string-ish fields on data
        if (!photoPathFromApi) {
          const fallback = (data as any).photo?.toString?.();
          if (
            typeof fallback === "string" &&
            fallback &&
            fallback !== "[object Object]"
          ) {
            photoPathFromApi = fallback;
          }
        }

        // Build an actual URL for preview if we have a path
        if (photoPathFromApi) {
          const base = String(BACKEND_URL).replace(/\/$/, "");
          const normalized = String(photoPathFromApi)
            .replace(/\\/g, "/")
            .trim();
          const clean = normalized.replace(/^\//, "");
          initialPhotoPreviewUrl =
            normalized.startsWith("http") || normalized.startsWith("blob:")
              ? normalized
              : clean
              ? `${base}/${clean}`
              : normalized;
          // store normalized path (use path if it looks like a server relative path,
          // otherwise store the raw string so removedRemoteFiles works)
          const storePath =
            normalized.startsWith("http") || normalized.startsWith("blob:")
              ? normalized
              : clean || normalized;
          photoPathFromApi = storePath;
        }

        setStaff((prev) => ({
          ...prev,
          _id: (data as ApiStaff)._id || "",
          staffId: (data as ApiStaff).staffId || "",
          fullName: (data as ApiStaff).fullName || "",
          email: (data as ApiStaff).email || "",
          role: (data as ApiStaff).role || "Staff",
          designation: String((data as any).designation || ""),
          employmentStatus: String((data as any).employmentStatus || ""),
          experienceYears: Number((data as any).experienceYears ?? 0),
          salary: Number((data as any).salary ?? 0),
          previousInstitution: String((data as any).previousInstitution || ""),
          dateOfJoining: mapDate((data as any).dateOfJoining),
          dateOfBirth: mapDate((data as any).dateOfBirth),
          gender: String((data as any).gender || ""),
          mobile: String((data as any).mobile || ""),
          aadhaarNumber: String((data as any).aadhaarNumber || ""),
          emergencyContact: String((data as any).emergencyContact || ""),
          degree: String((data as any).degree || ""),
          major: String((data as any).major || ""),
          accountName: String((data as any).accountName || ""),
          accountNumber: String((data as any).accountNumber || ""),
          ifsc: String((data as any).ifsc || ""),
          bankName: String((data as any).bankName || ""),
          branch: String((data as any).branch || ""),
          fatherName: String((data as any).fatherName || ""),
          fatherMobile: String((data as any).fatherMobile || ""),
          spouseName: String((data as any).spouseName || ""),
          spouseMobile: String((data as any).spouseMobile || ""),
          street: String((data as any).street || ""),
          city: String((data as any).city || ""),
          state: String((data as any).state || ""),
          pin: String((data as any).pin || ""),
          country: String((data as any).country || ""),
          documentsFiles: [],
          photoFile: null,
          photoPath: photoPathFromApi, // <-- keep remote path

          previewFiles,
          documents: previewFiles,
        }));
        if (initialPhotoPreviewUrl) {
          setPhotoPreviewUrl(initialPhotoPreviewUrl);
        }
      } catch (err) {
        console.error("load staff error", err);
        showToast({
          variant: "error",
          title: "Error",
          message: "Failed to load staff.",
        });
      }
    })();
    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, [id, showToast]);

  // revoke blob URLs on unmount and when previewFiles change
  useEffect(
    () => {
      return () => {
        staff.previewFiles.forEach((p) => {
          if (p.url && p.url.startsWith("blob:")) URL.revokeObjectURL(p.url);
        });
        if (photoPreviewUrl && photoPreviewUrl.startsWith("blob:"))
          URL.revokeObjectURL(photoPreviewUrl);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [
      /* run on unmount only */
    ]
  );

  // create and manage photo preview URL safely
  // create and manage photo preview URL safely (handles local file OR remote path)
  useEffect(() => {
    // 1) local file selected -> create blob URL and cleanup on change/unmount
    if (staff.photoFile) {
      const url = URL.createObjectURL(staff.photoFile);
      setPhotoPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }

    // 2) no local file but we have a remote photo path -> build a usable preview URL
    if (staff.photoPath) {
      const base = String(BACKEND_URL).replace(/\/$/, "");
      const normalized = String(staff.photoPath).replace(/\\/g, "/").trim();
      const clean = normalized.replace(/^\//, "");
      const previewUrl =
        normalized.startsWith("http") || normalized.startsWith("blob:")
          ? normalized
          : clean
          ? `${base}/${clean}`
          : normalized;
      setPhotoPreviewUrl(previewUrl);
      // nothing to cleanup (we didn't create a blob)
      return;
    }

    // 3) neither local nor remote -> clear preview
    setPhotoPreviewUrl(null);
  }, [staff.photoFile, staff.photoPath]);

  const handleDateChange = (
    field: "dateOfBirth" | "dateOfJoining",
    selectedDates: Date[]
  ) => {
    if (selectedDates && selectedDates.length > 0) {
      setStaff(
        (s) => ({ ...s, [field]: selectedDates[0].toISOString() } as any)
      );
    } else {
      setStaff((s) => ({ ...s, [field]: "" } as any));
    }
  };

  const handleField = (name: keyof FormStaffState | string, value: unknown) => {
    let val: unknown = value;

    // Normalize top-level phone fields (mobile, any key containing 'mobile'/'phone' or 'emergency')
    const lname = String(name).toLowerCase();
    if (name === "mobile" || /mobile|phone|emergency/.test(lname)) {
      const digits = String(value || "").replace(/\D/g, "");
      // keep the last 10 digits (works whether user includes country code or not)
      val = digits.slice(-10);
    }

    setStaff((s) => ({ ...s, [name]: val } as any));
    setErrors((e) => ({ ...e, [String(name)]: "" }));
  };

  // typed handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === "number") {
      const num = value === "" ? 0 : Number(value);
      setStaff((s) => ({ ...(s as any), [name]: Number.isNaN(num) ? 0 : num }));
      return;
    }
    setStaff((s) => ({ ...(s as any), [name]: value }));
  };

  const handleSelectChange = (name: keyof FormStaffState, value: string) => {
    setStaff((s) => ({ ...(s as any), [name]: value }));
  };

  const handleDocumentsChange = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    const previews = newFiles.map((f) => ({
      url: URL.createObjectURL(f),
      name: f.name,
      type: f.type || f.name.split(".").pop() || "file",
      remote: false,
    }));
    setStaff((s) => ({
      ...s,
      documentsFiles: [...s.documentsFiles, ...newFiles],
      previewFiles: [...s.previewFiles, ...previews],
    }));
  };

  const photoInputRef = useRef<HTMLInputElement | null>(null); // create near other refs

  const handlePhotoChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    // revoke previous blob preview if any
    if (
      staff.photoFile &&
      photoPreviewUrl &&
      photoPreviewUrl.startsWith("blob:")
    ) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    // choosing a new local file should clear remote path (we only remove remote on explicit Remove)
    setStaff((s) => ({ ...s, photoFile: files[0], photoPath: undefined }));
  };
  const removePhoto = () => {
    setStaff((s) => {
      // if there was a remote photo path set earlier, mark it for deletion
      if (s.photoPath) {
        setRemovedRemoteFiles((r) => [...r, s.photoPath!]);
      }
      // revoke any blob url
      if (photoPreviewUrl && photoPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
      // reset native file input
      if (photoInputRef.current) photoInputRef.current.value = "";
      // clear photo state
      return { ...s, photoFile: null, photoPath: undefined };
    });
    setPhotoPreviewUrl(null);
  };

  const removeDocument = (index: number) => {
    setStaff((s) => {
      const newDocs = [...s.documentsFiles];
      const newPreviews = [...s.previewFiles];
      const entry = newPreviews[index];
      if (!entry) return s;
      if (entry.remote && entry.path) {
        setRemovedRemoteFiles((r) => [...r, entry.path!]);
      } else {
        const idx = newDocs.findIndex((f) => f.name === entry.name);
        if (idx !== -1) newDocs.splice(idx, 1);
        if (entry.url && entry.url.startsWith("blob:"))
          URL.revokeObjectURL(entry.url);
      }
      newPreviews.splice(index, 1);
      return { ...s, documentsFiles: newDocs, previewFiles: newPreviews };
    });
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Required basics
    if (!staff.staffId || !String(staff.staffId).trim())
      newErrors.staffId = "Staff ID required";
    if (!staff.fullName || !String(staff.fullName).trim())
      newErrors.fullName = "Full name required";
    if (!staff.email || !String(staff.email).trim())
      newErrors.email = "Email required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staff.email))
      newErrors.email = "Invalid email";

    // Phones (10 digits)
    if (
      staff.mobile &&
      staff.mobile !== "" &&
      !/^\d{10}$/.test(String(staff.mobile))
    )
      newErrors.mobile = "Mobile must be 10 digits";

    if (
      staff.fatherMobile &&
      staff.fatherMobile !== "" &&
      !/^\d{10}$/.test(String(staff.fatherMobile))
    )
      newErrors.fatherMobile = "Father mobile must be 10 digits";

    if (
      staff.spouseMobile &&
      staff.spouseMobile !== "" &&
      !/^\d{10}$/.test(String(staff.spouseMobile))
    )
      newErrors.spouseMobile = "Spouse mobile must be 10 digits";

    if (
      staff.emergencyContact &&
      staff.emergencyContact !== "" &&
      !/^\d{10}$/.test(String(staff.emergencyContact))
    )
      newErrors.emergencyContact = "Emergency phone must be 10 digits";

    // Aadhaar
    if (
      staff.aadhaarNumber &&
      staff.aadhaarNumber !== "" &&
      !/^\d{12}$/.test(String(staff.aadhaarNumber))
    )
      newErrors.aadhaarNumber = "Aadhaar must be 12 digits";

    // PIN (optional but commonly 6 digits)
    if (staff.pin && staff.pin !== "" && !/^\d{6}$/.test(String(staff.pin)))
      newErrors.pin = "PIN must be 6 digits";

    // Account number (simple digits length check; adjust bounds as you like)
    if (
      staff.accountNumber &&
      staff.accountNumber !== "" &&
      !/^\d{6,20}$/.test(String(staff.accountNumber))
    )
      newErrors.accountNumber = "Account number must be 6–20 digits";

    // IFSC (common Indian pattern: 4 letters + 0 + 6 alnum)
    if (
      staff.ifsc &&
      staff.ifsc !== "" &&
      !/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(String(staff.ifsc))
    )
      newErrors.ifsc = "Invalid IFSC code";

    // Experience & Salary non-negative
    if (typeof staff.experienceYears === "number" && staff.experienceYears < 0)
      newErrors.experienceYears = "Experience cannot be negative";
    if (typeof staff.salary === "number" && staff.salary < 0)
      newErrors.salary = "Salary cannot be negative";

    // Date sanity (basic)
    if (
      staff.dateOfBirth &&
      staff.dateOfBirth !== "" &&
      isNaN(Date.parse(String(staff.dateOfBirth)))
    )
      newErrors.dateOfBirth = "Invalid Date of Birth";
    if (
      staff.dateOfJoining &&
      staff.dateOfJoining !== "" &&
      isNaN(Date.parse(String(staff.dateOfJoining)))
    )
      newErrors.dateOfJoining = "Invalid Date of Joining";

    setErrors(newErrors);

    // If any errors, show toast (first message) + focus first field
    const keys = Object.keys(newErrors);
    if (keys.length > 0) {
      const messages = Object.values(newErrors).filter(Boolean) as string[];
      // show first message as toast; join rest if you want combined message
      showToast({
        variant: "error",
        title: "Validation error",
        message: messages[0] || "Please fix validation errors.",
      });

      // focus first invalid input (best-effort)
      const firstField = String(keys[0]);
      setTimeout(() => {
        const el = document.querySelector(
          `[name="${firstField}"]`
        ) as HTMLElement | null;
        if (el && typeof el.focus === "function") el.focus();
        // if field is not found, try id fallback
        else {
          const byId = document.getElementById(
            firstField
          ) as HTMLElement | null;
          if (byId && typeof byId.focus === "function") byId.focus();
        }
      }, 50);

      return false;
    }

    return true;
  };

  // build FormData explicitly and call API wrapper
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const payload: Partial<ApiStaff> = {
        staffId: staff.staffId,
        fullName: staff.fullName,
        email: staff.email,
        role: staff.role,
        designation: staff.designation,
        employmentStatus: staff.employmentStatus,
        experienceYears: staff.experienceYears,
        salary: staff.salary,
        previousInstitution: staff.previousInstitution,
        dateOfJoining: staff.dateOfJoining || undefined,
        dateOfBirth: staff.dateOfBirth || undefined,
        gender: staff.gender,
        mobile: staff.mobile,
        aadhaarNumber: staff.aadhaarNumber,
        emergencyContact: staff.emergencyContact,
        degree: staff.degree,
        major: staff.major,
        accountName: staff.accountName,
        accountNumber: staff.accountNumber,
        ifsc: staff.ifsc,
        bankName: staff.bankName,
        branch: staff.branch,
        fatherName: staff.fatherName,
        fatherMobile: staff.fatherMobile,
        spouseName: staff.spouseName,
        spouseMobile: staff.spouseMobile,
        street: staff.street,
        city: staff.city,
        state: staff.state,
        pin: staff.pin,
        country: staff.country,
      };

      if (id) {
        await updateStaff(
          id,
          payload,
          staff.documentsFiles.length ? staff.documentsFiles : undefined,
          staff.photoFile ?? undefined,
          removedRemoteFiles.length ? removedRemoteFiles : undefined
        );
        showToast({
          variant: "success",
          title: "Saved",
          message: "Staff updated.",
        });
      } else {
        await createStaff(
          payload,
          staff.documentsFiles.length ? staff.documentsFiles : undefined,
          staff.photoFile ?? undefined
        );
        showToast({
          variant: "success",
          title: "Saved",
          message: "Staff created.",
        });
      }
      navigate("/staffs");
    } catch (err) {
      let message = "Error saving staff";

      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        // prefer server message
        if (data?.message) {
          message = String(data.message);
        } else if (data?.errors) {
          // common shapes: array of errors or object keyed by field
          if (Array.isArray(data.errors)) {
            message = data.errors
              .map((e: any) => e.msg || e.message || String(e))
              .join("; ");
          } else if (typeof data.errors === "object") {
            message = Object.values(data.errors)
              .map((v: any) => v.msg || v.message || String(v))
              .join("; ");
          }
        } else if (data) {
          // fallback to stringify small object
          try {
            message = typeof data === "string" ? data : JSON.stringify(data);
          } catch {
            message = String(data);
          }
        } else if (err.message) {
          message = err.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

      showToast({ variant: "error", title: "Error", message });
    } finally {
      {
        if (mounted.current) setLoading(false);
      }
    }
  };

  const dateValue = (iso?: string) => {
    if (!iso) return "";
    try {
      return new Date(iso).toISOString().slice(0, 10);
    } catch {
      return String(iso).slice(0, 10);
    }
  };

  return (
    <div className="w-full space-y-6">
      <h2 className="text-xl font-semibold">
        {id ? "Edit Staff" : "Create Staff"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info Card */}
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>
                Staff ID <span className="text-error-500">*</span>
              </Label>
              <Input
                name="staffId"
                value={staff.staffId}
                onChange={handleInputChange}
                disabled={!!id} // <-- disable if editing (id exists)
              />
              {errors.staffId && (
                <div className="text-red-600 text-sm">{errors.staffId}</div>
              )}
            </div>

            <div>
              <Label>
                Full Name <span className="text-error-500">*</span>
              </Label>
              <Input
                name="fullName"
                value={staff.fullName}
                onChange={handleInputChange}
              />
              {errors.fullName && (
                <div className="text-red-600 text-sm">{errors.fullName}</div>
              )}
            </div>

            <div>
              <Label>
                Email <span className="text-error-500">*</span>
              </Label>
              <Input
                name="email"
                value={staff.email}
                onChange={handleInputChange}
              />
              {errors.email && (
                <div className="text-red-600 text-sm">{errors.email}</div>
              )}
            </div>

            <div>
              <Label>Mobile</Label>

              <PhoneInput
                key={staff.mobile || "mobile"} // <-- forces remount on change
                countries={[{ code: "IN", label: "+91" }]}
                defaultCountry="IN"
                defaultNumber={
                  staff.mobile ? String(staff.mobile).replace(/\D/g, "") : ""
                }
                onChange={(val) => {
                  const digits = String(val || "").replace(/\D/g, "");
                  handleField("mobile", digits);
                }}
              />
              {errors.mobile && (
                <div className="text-red-600 text-sm">{errors.mobile}</div>
              )}
            </div>

            <div>
              <Label>Gender</Label>
              <Select
                name="gender"
                options={genderOptions}
                value={staff.gender}
                onChange={(v) => handleSelectChange("gender", v)}
              />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <DatePicker
                id="staff-dob"
                mode="single"
                defaultDate={
                  staff.dateOfBirth
                    ? dateValue(staff.dateOfBirth as string)
                    : undefined
                }
                onChange={(dates) => handleDateChange("dateOfBirth", dates)}
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>
        </div>

        {/* Job Info Card */}
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Job Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Designation</Label>
              <Input
                name="designation"
                value={staff.designation}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Employment Status</Label>
              <Select
                name="employmentStatus"
                options={employmentOptions}
                value={staff.employmentStatus}
                onChange={(v) => handleSelectChange("employmentStatus", v)}
              />
            </div>

            <div>
              <Label>Experience (years)</Label>
              <Input
                type="number"
                name="experienceYears"
                value={String(staff.experienceYears)}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Salary</Label>
              <Input
                type="number"
                name="salary"
                value={String(staff.salary)}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Previous Institution</Label>
              <Input
                name="previousInstitution"
                value={staff.previousInstitution}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label>Date of Joining</Label>
              <DatePicker
                id="staff-dateOfJoining"
                mode="single"
                defaultDate={
                  staff.dateOfJoining
                    ? dateValue(staff.dateOfJoining as string)
                    : undefined
                }
                onChange={(dates) => handleDateChange("dateOfJoining", dates)}
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>
        </div>

        {/* Bank Details Card */}
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Bank Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Account Name</Label>
              <Input
                name="accountName"
                value={staff.accountName}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input
                name="accountNumber"
                value={staff.accountNumber}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label>IFSC</Label>
              <Input
                name="ifsc"
                value={staff.ifsc}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label>Bank Name</Label>
              <Input
                name="bankName"
                value={staff.bankName}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label>Branch</Label>
              <Input
                name="branch"
                value={staff.branch}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Family Details Card */}
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Family Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Father Name</Label>
              <Input
                name="fatherName"
                value={staff.fatherName}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Father Mobile</Label>

              <PhoneInput
                key={staff.fatherMobile || "fatherMobile"}
                countries={[{ code: "IN", label: "+91" }]}
                defaultCountry="IN"
                defaultNumber={
                  staff.fatherMobile
                    ? String(staff.fatherMobile).replace(/\D/g, "")
                    : ""
                }
                onChange={(val) =>
                  handleField("fatherMobile", String(val).replace(/\D/g, ""))
                }
              />
              {errors.fatherMobile && (
                <div className="text-red-600 text-sm">
                  {errors.fatherMobile}
                </div>
              )}
            </div>

            <div>
              <Label>Husband / Spouse Name</Label>
              <Input
                name="spouseName"
                value={staff.spouseName}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Husband / Spouse Mobile</Label>
              <PhoneInput
                key={staff.spouseMobile || "spouseMobile"}
                countries={[{ code: "IN", label: "+91" }]}
                defaultCountry="IN"
                defaultNumber={
                  staff.spouseMobile
                    ? String(staff.spouseMobile).replace(/\D/g, "")
                    : ""
                }
                onChange={(val) =>
                  handleField("spouseMobile", String(val).replace(/\D/g, ""))
                }
              />

              {errors.spouseMobile && (
                <div className="text-red-600 text-sm">
                  {errors.spouseMobile}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Address Card */}
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Street</Label>
              <Input
                name="street"
                value={staff.street}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                name="city"
                value={staff.city}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                name="state"
                value={staff.state}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label>PIN</Label>
              <Input
                name="pin"
                value={staff.pin}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label>Country</Label>
              <Input
                name="country"
                value={staff.country}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Other Details*/}
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Other Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Aadhar Number</Label>
              <Input
                name="aadhaarNumber"
                value={staff.aadhaarNumber}
                onChange={handleInputChange}
              />{" "}
              {errors.aadhaarNumber && (
                <div className="text-red-600 text-sm">
                  {errors.aadhaarNumber}
                </div>
              )}
            </div>

            <div>
              <Label>Emergency Phone</Label>

              <PhoneInput
                key={staff.emergencyContact || "emergencyContact"}
                countries={[{ code: "IN", label: "+91" }]}
                defaultCountry="IN"
                defaultNumber={
                  staff.emergencyContact
                    ? String(staff.emergencyContact).replace(/\D/g, "")
                    : ""
                }
                onChange={(val) =>
                  handleField(
                    "emergencyContact",
                    String(val).replace(/\D/g, "")
                  )
                }
              />
              {errors.emergencyContact && (
                <div className="text-red-600 text-sm">
                  {errors.emergencyContact}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Education*/}
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Education</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Degree</Label>
              <Input
                name="degree"
                value={staff.degree}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label>Major</Label>
              <Input
                name="major"
                value={staff.major}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
        {/* Documents & Photo */}
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Documents & Photo</h3>
          <div className="space-y-3">
            <div>
              <Label>Documents</Label>
              <FileInput
                multiple
                onChange={(e) => handleDocumentsChange(e.target.files)}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {staff.previewFiles.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 border p-2 rounded"
                  >
                    {String(f.type).startsWith("image/") ? (
                      <img
                        src={f.url}
                        alt={f.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center text-xs bg-gray-100 rounded border">
                        {f.name.split(".").pop()}
                      </div>
                    )}
                    <span className="text-sm">{f.name}</span>
                    <button
                      type="button"
                      className="text-red-500 text-sm"
                      onClick={() => removeDocument(i)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Photo</Label>
              <FileInput
                ref={photoInputRef}
                onChange={(e) => handlePhotoChange(e.target.files)}
              />
              {photoPreviewUrl && (
                <div className="flex items-center gap-3 mt-2">
                  <img
                    src={photoPreviewUrl}
                    alt="photo"
                    className="w-24 h-24 object-cover rounded"
                  />
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="px-3 py-1 text-sm rounded shadow-sm hover:opacity-90 bg-red-500 text-white"
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="mt-2 px-3 py-1 text-sm rounded shadow-sm hover:opacity-90 bg-gray-200"
                    >
                      Replace
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 
            <div>
              <Label>Photo</Label>
              <FileInput onChange={(e) => handlePhotoChange(e.target.files)} />
              {photoPreviewUrl && (
                <img
                  src={photoPreviewUrl}
                  alt="photo"
                  className="w-24 h-24 mt-2 object-cover rounded"
                />
              )}

            </div> */}
          </div>
        </div>

        <div>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : id ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </div>
  );
}
