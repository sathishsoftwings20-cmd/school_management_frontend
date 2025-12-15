/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/student/StudentForm.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  getStudentById,
  createStudent,
  updateStudent,
  Student as ApiStudent,
} from "../../api/student.api";
import { getAllClass, ClassBase } from "../../api/class.api"; // Add this import
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

// Add interface for Class Options
interface ClassOption {
  value: string;
  label: string;
  classCode?: string;
  className?: string;
}

// Add interface for Section Options
interface SectionOption {
  value: string;
  label: string;
  sectionId?: string;
  sectionName?: string;
}

interface FormStudentState {
  _id: string;
  studentCode?: string;
  admissionNo?: string;
  rollNumber?: string;
  fullName: string;
  enrolementStatus?: string;
  dateOfBirth?: string;
  gender?: "Male" | "Female" | "Other";
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
  fatherAnnualIncome?: string;
  motherName?: string;
  motherMobile?: string;
  motherOccupation?: string;
  motherWorkspace?: string;
  motherAnnualIncome?: string;
  guardianName?: string;
  guardianMobile?: string;
  alternateMobile?: string;
  homeMobile?: string;
  class?: string;
  className?: string;
  // REMOVE: classCode?: string;
  section?: string;
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
  role?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  documentsFiles: File[];
  studentPhotoFile?: File | null;
  fatherPhotoFile?: File | null;
  motherPhotoFile?: File | null;
  studentPhotoPath?: string;
  fatherPhotoPath?: string;
  motherPhotoPath?: string;
  previewFiles: PreviewEntry[];
  documents: PreviewEntry[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

type FormErrors = Partial<
  Record<
    | keyof FormStudentState
    | "email"
    | "mobile"
    | "aadhaarNumber"
    | "fatherMobile"
    | "motherMobile"
    | "guardianMobile"
    | "currentPin"
    | "permanentPin",
    string
  >
>;

export default function StudentForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const mounted = useRef(true);

  // Add state for classes and sections
  const [classes, setClasses] = useState<ClassBase[]>([]);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [sectionOptions, setSectionOptions] = useState<SectionOption[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const initialState: FormStudentState = {
    _id: "",
    studentCode: "",
    admissionNo: "",
    rollNumber: "",
    fullName: "",
    email: "",
    role: "Student",
    enrolementStatus: "Active",
    gender: "Male",
    aadhaarNumber: "",
    birthPlace: "",
    nationality: "Indian",
    bloodGroup: "",
    caste: "",
    subCaste: "",
    disability_Allergy: "",
    fatherName: "",
    fatherMobile: "",
    fatherOccupation: "",
    fatherWorkspace: "",
    fatherAnnualIncome: "",
    motherName: "",
    motherMobile: "",
    motherOccupation: "",
    motherWorkspace: "",
    motherAnnualIncome: "",
    guardianName: "",
    guardianMobile: "",
    alternateMobile: "",
    homeMobile: "",
    class: "",
    className: "",
    // REMOVE: classCode: "",
    section: "",
    sectionName: "",
    currentStreet: "",
    currentCity: "",
    currentState: "",
    currentPin: "",
    currentCountry: "India",
    permanentStreet: "",
    permanentCity: "",
    permanentState: "",
    permanentPin: "",
    permanentCountry: "India",
    username: "",
    password: "",
    confirmPassword: "",
    documentsFiles: [],
    studentPhotoFile: null,
    fatherPhotoFile: null,
    motherPhotoFile: null,
    studentPhotoPath: "",
    fatherPhotoPath: "",
    motherPhotoPath: "",
    previewFiles: [],
    documents: [],
  };
  const [student, setStudent] = useState<FormStudentState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [removedRemoteFiles, setRemovedRemoteFiles] = useState<string[]>([]);
  const [studentPhotoPreviewUrl, setStudentPhotoPreviewUrl] = useState<
    string | null
  >(null);
  const [fatherPhotoPreviewUrl, setFatherPhotoPreviewUrl] = useState<
    string | null
  >(null);
  const [motherPhotoPreviewUrl, setMotherPhotoPreviewUrl] = useState<
    string | null
  >(null);

  const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
  ];

  const enrolementStatusOptions = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ];

  const bloodGroupOptions = [
    { value: "", label: "Select Blood Group" },
    { value: "A+", label: "A+" },
    { value: "A-", label: "A-" },
    { value: "B+", label: "B+" },
    { value: "B-", label: "B-" },
    { value: "O+", label: "O+" },
    { value: "O-", label: "O-" },
    { value: "AB+", label: "AB+" },
    { value: "AB-", label: "AB-" },
  ];

  // Refs for file inputs
  const studentPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const fatherPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const motherPhotoInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch classes on component mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        const classesData = await getAllClass();
        setClasses(classesData);

        // Create class options for dropdown
        const options = classesData.map((cls) => ({
          value: cls._id,
          label: `${cls.className}`,
          classCode: cls.classCode,
          className: cls.className,
        }));

        setClassOptions(options);
      } catch (error) {
        console.error("Error fetching classes:", error);
        showToast({
          variant: "error",
          title: "Error",
          message: "Failed to load classes",
        });
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, [showToast]);

  // Update section options when class is selected
  useEffect(() => {
    if (student.class) {
      const selectedClass = classes.find((cls) => cls._id === student.class);

      if (
        selectedClass &&
        selectedClass.sections &&
        selectedClass.sections.length > 0
      ) {
        const sectionOpts = selectedClass.sections.map((section) => ({
          value: section._id || "", // Use section._id instead of section.name
          label: section.name,
          sectionId: section._id,
          sectionName: section.name,
        }));

        setSectionOptions(sectionOpts);

        // If a section is already selected but not in the new list, clear it
        if (
          student.section &&
          !sectionOpts.find((s) => s.value === student.section)
        ) {
          setStudent((prev) => ({ ...prev, section: "", sectionName: "" }));
        }
      } else {
        setSectionOptions([]);
        setStudent((prev) => ({ ...prev, section: "", sectionName: "" }));
      }
    } else {
      setSectionOptions([]);
    }
  }, [student.class, classes]);

  // Update student info when class selection changes
  const handleClassChange = (classId: string) => {
    const selectedClass = classes.find((cls) => cls._id === classId);

    setStudent((prev) => ({
      ...prev,
      class: classId,
      className: selectedClass?.className || "",
      classCode: selectedClass?.classCode || "",
      // Clear section when class changes
      section: "",
      sectionName: "",
    }));
  };

  // Update student info when section selection changes
  const handleSectionChange = (sectionId: string) => {
    const selectedSection = sectionOptions.find((s) => s.value === sectionId);

    setStudent((prev) => ({
      ...prev,
      section: sectionId, // This is now the section ObjectId
      sectionName: selectedSection?.sectionName || "",
    }));
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getStudentById(id);
        if (cancelled) return;

        // Helper to format to YYYY-MM-DD or empty string
        const mapDate = (v: unknown): string => {
          if (!v) return "";
          const d = new Date(String(v));
          if (isNaN(d.getTime())) return "";
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          return `${yyyy}-${mm}-${dd}`;
        };

        // Process documents
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

        // Helper to extract photo path
        // Replace the existing extractPhotoPath function with this:
        const extractPhotoPath = (photoData: any): string | undefined => {
          if (!photoData) return undefined;

          // Handle empty object case
          if (
            typeof photoData === "object" &&
            Object.keys(photoData).length === 0
          ) {
            return undefined;
          }

          if (typeof photoData === "string") {
            return photoData.trim() || undefined;
          }

          if (typeof photoData === "object") {
            const path = photoData.path || photoData.url;
            if (typeof path === "string" && path.trim()) {
              return path.trim();
            }
          }

          return undefined;
        };

        // Extract photo paths
        const studentPhotoPath = extractPhotoPath(data.studentPhoto);
        const fatherPhotoPath = extractPhotoPath(data.fatherPhoto);
        const motherPhotoPath = extractPhotoPath(data.motherPhoto);

        // Create preview URLs
        const createPreviewUrl = (path?: string): string | null => {
          if (!path) return null;
          const base = String(BACKEND_URL).replace(/\/$/, "");
          const normalized = String(path).replace(/\\/g, "/").trim();
          const clean = normalized.replace(/^\//, "");
          return normalized.startsWith("http") || normalized.startsWith("blob:")
            ? normalized
            : clean
            ? `${base}/${clean}`
            : normalized;
        };

        setStudent((prev) => ({
          ...prev,
          _id: data._id || "",
          studentCode: data.studentCode || "",
          admissionNo: data.admissionNo || "",
          rollNumber: data.rollNumber || "",
          fullName: data.fullName || "",
          email: data.email || "",
          role: data.role || "Student",
          enrolementStatus: data.enrolementStatus || "Active",
          dateOfBirth: mapDate(data.dateOfBirth),
          gender: (data.gender as "Male" | "Female" | "Other") || "Male",
          mobile: data.mobile || "",

          // Identity
          aadhaarNumber: data.aadhaarNumber || "",
          birthPlace: data.birthPlace || "",
          nationality: data.nationality || "Indian",
          bloodGroup: data.bloodGroup || "",
          caste: data.caste || "",
          subCaste: data.subCaste || "",
          disability_Allergy: data.disability_Allergy || "",

          // Family
          fatherName: data.fatherName || "",
          fatherMobile: data.fatherMobile || "",
          fatherOccupation: data.fatherOccupation || "",
          fatherWorkspace: data.fatherWorkspace || "",
          fatherAnnualIncome: String(data.fatherAnnualIncome || ""),
          motherName: data.motherName || "",
          motherMobile: data.motherMobile || "",
          motherOccupation: data.motherOccupation || "",
          motherWorkspace: data.motherWorkspace || "",
          motherAnnualIncome: String(data.motherAnnualIncome || ""),
          guardianName: data.guardianName || "",
          guardianMobile: data.guardianMobile || "",
          alternateMobile: data.alternateMobile || "",
          homeMobile: data.homeMobile || "",

          // Class/Section
          class: data.class || "",
          className: data.className || "",
          classCode: data.classCode || "",
          section: data.section || "",
          sectionName: data.sectionName || "",

          // Address
          currentStreet: data.currentStreet || "",
          currentCity: data.currentCity || "",
          currentState: data.currentState || "",
          currentPin: data.currentPin || "",
          currentCountry: data.currentCountry || "India",
          permanentStreet: data.permanentStreet || "",
          permanentCity: data.permanentCity || "",
          permanentState: data.permanentState || "",
          permanentPin: data.permanentPin || "",
          permanentCountry: data.permanentCountry || "India",

          // Files
          documentsFiles: [],
          studentPhotoFile: null,
          fatherPhotoFile: null,
          motherPhotoFile: null,
          studentPhotoPath,
          fatherPhotoPath,
          motherPhotoPath,

          previewFiles,
          documents: previewFiles,

          // Audit
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          createdBy: data.createdBy || null,
          updatedBy: data.updatedBy || null,
        }));

        // Set photo preview URLs
        if (studentPhotoPath) {
          setStudentPhotoPreviewUrl(createPreviewUrl(studentPhotoPath));
        }
        if (fatherPhotoPath) {
          setFatherPhotoPreviewUrl(createPreviewUrl(fatherPhotoPath));
        }
        if (motherPhotoPath) {
          setMotherPhotoPreviewUrl(createPreviewUrl(motherPhotoPath));
        }
      } catch (err) {
        console.error("load student error", err);
        showToast({
          variant: "error",
          title: "Error",
          message: "Failed to load student.",
        });
      }
    })();
    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, [id, showToast]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      student.previewFiles.forEach((p) => {
        if (p.url && p.url.startsWith("blob:")) URL.revokeObjectURL(p.url);
      });
      if (studentPhotoPreviewUrl && studentPhotoPreviewUrl.startsWith("blob:"))
        URL.revokeObjectURL(studentPhotoPreviewUrl);
      if (fatherPhotoPreviewUrl && fatherPhotoPreviewUrl.startsWith("blob:"))
        URL.revokeObjectURL(fatherPhotoPreviewUrl);
      if (motherPhotoPreviewUrl && motherPhotoPreviewUrl.startsWith("blob:"))
        URL.revokeObjectURL(motherPhotoPreviewUrl);
    };
  }, []);

  // Manage photo preview URLs
  useEffect(() => {
    // Student photo
    if (student.studentPhotoFile) {
      const url = URL.createObjectURL(student.studentPhotoFile);
      setStudentPhotoPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (student.studentPhotoPath) {
      const base = String(BACKEND_URL).replace(/\/$/, "");
      const normalized = String(student.studentPhotoPath)
        .replace(/\\/g, "/")
        .trim();
      const clean = normalized.replace(/^\//, "");
      const previewUrl =
        normalized.startsWith("http") || normalized.startsWith("blob:")
          ? normalized
          : clean
          ? `${base}/${clean}`
          : normalized;
      setStudentPhotoPreviewUrl(previewUrl);
    } else {
      setStudentPhotoPreviewUrl(null);
    }
  }, [student.studentPhotoFile, student.studentPhotoPath]);

  useEffect(() => {
    // Father photo
    if (student.fatherPhotoFile) {
      const url = URL.createObjectURL(student.fatherPhotoFile);
      setFatherPhotoPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (student.fatherPhotoPath) {
      const base = String(BACKEND_URL).replace(/\/$/, "");
      const normalized = String(student.fatherPhotoPath)
        .replace(/\\/g, "/")
        .trim();
      const clean = normalized.replace(/^\//, "");
      const previewUrl =
        normalized.startsWith("http") || normalized.startsWith("blob:")
          ? normalized
          : clean
          ? `${base}/${clean}`
          : normalized;
      setFatherPhotoPreviewUrl(previewUrl);
    } else {
      setFatherPhotoPreviewUrl(null);
    }
  }, [student.fatherPhotoFile, student.fatherPhotoPath]);

  useEffect(() => {
    // Mother photo
    if (student.motherPhotoFile) {
      const url = URL.createObjectURL(student.motherPhotoFile);
      setMotherPhotoPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (student.motherPhotoPath) {
      const base = String(BACKEND_URL).replace(/\/$/, "");
      const normalized = String(student.motherPhotoPath)
        .replace(/\\/g, "/")
        .trim();
      const clean = normalized.replace(/^\//, "");
      const previewUrl =
        normalized.startsWith("http") || normalized.startsWith("blob:")
          ? normalized
          : clean
          ? `${base}/${clean}`
          : normalized;
      setMotherPhotoPreviewUrl(previewUrl);
    } else {
      setMotherPhotoPreviewUrl(null);
    }
  }, [student.motherPhotoFile, student.motherPhotoPath]);

  const handleDateChange = (field: "dateOfBirth", selectedDates: Date[]) => {
    if (selectedDates && selectedDates.length > 0) {
      setStudent(
        (s) => ({ ...s, [field]: selectedDates[0].toISOString() } as any)
      );
    } else {
      setStudent((s) => ({ ...s, [field]: "" } as any));
    }
  };

  const handleField = (
    name: keyof FormStudentState | string,
    value: unknown
  ) => {
    let val: unknown = value;

    // Normalize phone fields
    const lname = String(name).toLowerCase();
    if (name === "mobile" || /mobile|phone/.test(lname)) {
      const digits = String(value || "").replace(/\D/g, "");
      // keep the last 10 digits
      val = digits.slice(-10);
    }

    setStudent((s) => ({ ...s, [name]: val } as any));
    setErrors((e) => ({ ...e, [String(name)]: "" }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === "number") {
      const num = value === "" ? 0 : Number(value);
      setStudent((s) => ({
        ...(s as any),
        [name]: Number.isNaN(num) ? 0 : num,
      }));
      return;
    }

    // Handle class selection change
    if (name === "class") {
      handleClassChange(value);
      return;
    }

    // Handle section selection change
    if (name === "section") {
      handleSectionChange(value);
      return;
    }

    setStudent((s) => ({ ...(s as any), [name]: value }));
  };

  const handleSelectChange = (name: keyof FormStudentState, value: string) => {
    // Handle class selection change
    if (name === "class") {
      handleClassChange(value);
      return;
    }

    // Handle section selection change
    if (name === "section") {
      handleSectionChange(value);
      return;
    }

    setStudent((s) => ({ ...(s as any), [name]: value }));
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
    setStudent((s) => ({
      ...s,
      documentsFiles: [...s.documentsFiles, ...newFiles],
      previewFiles: [...s.previewFiles, ...previews],
    }));
  };

  const handlePhotoChange = (
    type: "student" | "father" | "mother",
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const field = `${type}PhotoFile` as keyof FormStudentState;
    const pathField = `${type}PhotoPath` as keyof FormStudentState;

    // Revoke previous blob preview if any
    const previewUrl =
      type === "student"
        ? studentPhotoPreviewUrl
        : type === "father"
        ? fatherPhotoPreviewUrl
        : motherPhotoPreviewUrl;

    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    // Clear the path when new file is selected
    setStudent((s) => ({
      ...s,
      [field]: file,
      [pathField]: undefined,
    }));
  };

  const removePhoto = (type: "student" | "father" | "mother") => {
    const field = `${type}PhotoFile` as keyof FormStudentState;
    const pathField = `${type}PhotoPath` as keyof FormStudentState;
    const inputRef =
      type === "student"
        ? studentPhotoInputRef
        : type === "father"
        ? fatherPhotoInputRef
        : motherPhotoInputRef;

    setStudent((s) => {
      // If there was a remote photo path, mark it for deletion
      if (s[pathField]) {
        setRemovedRemoteFiles((r) => [...r, s[pathField] as string]);
      }

      // Clear file input
      if (inputRef.current) inputRef.current.value = "";

      // Clear state
      return {
        ...s,
        [field]: null,
        [pathField]: undefined,
      };
    });

    // Clear preview
    if (type === "student") setStudentPhotoPreviewUrl(null);
    else if (type === "father") setFatherPhotoPreviewUrl(null);
    else setMotherPhotoPreviewUrl(null);
  };

  const removeDocument = (index: number) => {
    setStudent((s) => {
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

    // Required fields
    if (!student.fullName || !String(student.fullName).trim())
      newErrors.fullName = "Full name required";
    if (!student.email || !String(student.email).trim())
      newErrors.email = "Email required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email))
      newErrors.email = "Invalid email";
    if (!id) {
      if (!student.password || !String(student.password).trim())
        newErrors.password = "Password required for new student";
      else if (student.password.length < 6)
        newErrors.password = "Password must be at least 6 characters";

      if (!student.confirmPassword || !String(student.confirmPassword).trim())
        newErrors.confirmPassword = "Please confirm password";
      else if (student.password !== student.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match";
    }

    // Phone validation
    if (
      student.mobile &&
      student.mobile !== "" &&
      !/^\d{10}$/.test(String(student.mobile))
    )
      newErrors.mobile = "Mobile must be 10 digits";

    if (
      student.fatherMobile &&
      student.fatherMobile !== "" &&
      !/^\d{10}$/.test(String(student.fatherMobile))
    )
      newErrors.fatherMobile = "Father mobile must be 10 digits";

    if (
      student.motherMobile &&
      student.motherMobile !== "" &&
      !/^\d{10}$/.test(String(student.motherMobile))
    )
      newErrors.motherMobile = "Mother mobile must be 10 digits";

    if (
      student.guardianMobile &&
      student.guardianMobile !== "" &&
      !/^\d{10}$/.test(String(student.guardianMobile))
    )
      newErrors.guardianMobile = "Guardian mobile must be 10 digits";

    // Aadhaar validation
    if (
      student.aadhaarNumber &&
      student.aadhaarNumber !== "" &&
      !/^\d{12}$/.test(String(student.aadhaarNumber))
    )
      newErrors.aadhaarNumber = "Aadhaar must be 12 digits";

    // PIN validation
    if (
      student.currentPin &&
      student.currentPin !== "" &&
      !/^\d{6}$/.test(String(student.currentPin))
    )
      newErrors.currentPin = "Current PIN must be 6 digits";

    if (
      student.permanentPin &&
      student.permanentPin !== "" &&
      !/^\d{6}$/.test(String(student.permanentPin))
    )
      newErrors.permanentPin = "Permanent PIN must be 6 digits";

    // Date validation
    if (
      student.dateOfBirth &&
      student.dateOfBirth !== "" &&
      isNaN(Date.parse(String(student.dateOfBirth)))
    )
      newErrors.dateOfBirth = "Invalid Date of Birth";

    setErrors(newErrors);

    // Show first error in toast
    const keys = Object.keys(newErrors);
    if (keys.length > 0) {
      const messages = Object.values(newErrors).filter(Boolean) as string[];
      showToast({
        variant: "error",
        title: "Validation error",
        message: messages[0] || "Please fix validation errors.",
      });

      // Focus first invalid field
      const firstField = String(keys[0]);
      setTimeout(() => {
        const el = document.querySelector(
          `[name="${firstField}"]`
        ) as HTMLElement | null;
        if (el && typeof el.focus === "function") el.focus();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const payload: Partial<ApiStudent> = {
        admissionNo: student.admissionNo,
        rollNumber: student.rollNumber,
        fullName: student.fullName,
        enrolementStatus: student.enrolementStatus,
        dateOfBirth: student.dateOfBirth || undefined,
        gender: student.gender,
        email: student.email,
        mobile: student.mobile,
        aadhaarNumber: student.aadhaarNumber,
        birthPlace: student.birthPlace,
        nationality: student.nationality,
        bloodGroup: student.bloodGroup,
        caste: student.caste,
        subCaste: student.subCaste,
        disability_Allergy: student.disability_Allergy,
        fatherName: student.fatherName,
        fatherMobile: student.fatherMobile,
        fatherOccupation: student.fatherOccupation,
        fatherWorkspace: student.fatherWorkspace,
        fatherAnnualIncome: student.fatherAnnualIncome,
        motherName: student.motherName,
        motherMobile: student.motherMobile,
        motherOccupation: student.motherOccupation,
        motherWorkspace: student.motherWorkspace,
        motherAnnualIncome: student.motherAnnualIncome,
        guardianName: student.guardianName,
        guardianMobile: student.guardianMobile,
        alternateMobile: student.alternateMobile,
        homeMobile: student.homeMobile,
        class: student.class,
        className: student.className,
        section: student.section,
        sectionName: student.sectionName || "",
        currentStreet: student.currentStreet,
        currentCity: student.currentCity,
        currentState: student.currentState,
        currentPin: student.currentPin,
        currentCountry: student.currentCountry,
        permanentStreet: student.permanentStreet,
        permanentCity: student.permanentCity,
        permanentState: student.permanentState,
        permanentPin: student.permanentPin,
        permanentCountry: student.permanentCountry,
        role: student.role,
        username: student.username,
        ...(id ? {} : { password: student.password }),
      };

      if (id) {
        await updateStudent(
          id,
          payload,
          student.documentsFiles.length ? student.documentsFiles : undefined,
          // Only send photo files if they exist
          student.studentPhotoFile ?? undefined,
          student.fatherPhotoFile ?? undefined,
          student.motherPhotoFile ?? undefined,
          removedRemoteFiles.length ? removedRemoteFiles : undefined
        );
        showToast({
          variant: "success",
          title: "Saved",
          message: "Student updated successfully.",
        });
      } else {
        await createStudent(
          payload,
          student.documentsFiles.length ? student.documentsFiles : undefined,
          student.studentPhotoFile ?? undefined,
          student.fatherPhotoFile ?? undefined,
          student.motherPhotoFile ?? undefined
        );
        showToast({
          variant: "success",
          title: "Saved",
          message: "Student created successfully.",
        });
      }
      navigate("/student");
    } catch (err) {
      let message = "Error saving student";

      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (data?.message) {
          message = String(data.message);
        } else if (data?.errors) {
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
      if (mounted.current) setLoading(false);
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
        {id ? "Edit Student" : "Create Student"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Code & Basic Info */}
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Student Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Admission Number</Label>
              <Input
                name="admissionNo"
                value={student.admissionNo}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Roll Number</Label>
              <Input
                name="rollNumber"
                value={student.rollNumber}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>
                Full Name <span className="text-error-500">*</span>
              </Label>
              <Input
                name="fullName"
                value={student.fullName}
                onChange={handleInputChange}
              />
              {errors.fullName && (
                <div className="text-red-600 text-sm">{errors.fullName}</div>
              )}
            </div>

            <div>
              <Label>Enrolement Status</Label>
              <Select
                name="enrolementStatus"
                options={enrolementStatusOptions}
                value={student.enrolementStatus}
                onChange={(v) => handleSelectChange("enrolementStatus", v)}
              />
            </div>

            <div>
              <Label>Gender</Label>
              <Select
                name="gender"
                options={genderOptions}
                value={student.gender}
                onChange={(v) => handleSelectChange("gender", v)}
              />
            </div>

            <div>
              <Label>Date of Birth</Label>
              <DatePicker
                id="student-dob"
                mode="single"
                defaultDate={dateValue(student.dateOfBirth)}
                onChange={(dates) => handleDateChange("dateOfBirth", dates)}
                placeholder="YYYY-MM-DD"
              />
              {errors.dateOfBirth && (
                <div className="text-red-600 text-sm">{errors.dateOfBirth}</div>
              )}
            </div>
          </div>
        </div>

        {/* Class & Section */}
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Academic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Class</Label>
              {loadingClasses ? (
                <div className="p-2 border rounded bg-gray-50">
                  Loading classes...
                </div>
              ) : (
                <Select
                  name="class"
                  options={[
                    { value: "", label: "Select Class" },
                    ...classOptions,
                  ]}
                  value={student.class}
                  onChange={(v) => handleSelectChange("class", v)}
                />
              )}
            </div>

            <div>
              <Label>Section</Label>
              <Select
                name="section"
                options={[
                  {
                    value: "",
                    label: student.class
                      ? "Select Section"
                      : "Select Class First",
                  },
                  ...sectionOptions,
                ]}
                value={student.section}
                onChange={(v) => handleSelectChange("section", v)}
              />
            </div>

            <div>
              <Label>Class Name</Label>
              <Input
                name="className"
                value={student.className}
                disabled
                placeholder="Auto-filled from selected class"
              />
            </div>

            <div>
              <Label>Section Name</Label>
              <Input
                name="sectionName"
                value={student.sectionName}
                disabled
                placeholder="Auto-filled from selected section"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Contact Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>
                Email <span className="text-error-500">*</span>
              </Label>
              <Input
                name="email"
                type="email"
                value={student.email}
                onChange={handleInputChange}
              />
              {errors.email && (
                <div className="text-red-600 text-sm">{errors.email}</div>
              )}
            </div>

            <div>
              <Label>Mobile</Label>
              <PhoneInput
                key={student.mobile || "mobile"}
                countries={[{ code: "IN", label: "+91" }]}
                defaultCountry="IN"
                defaultNumber={
                  student.mobile
                    ? String(student.mobile).replace(/\D/g, "")
                    : ""
                }
                onChange={(val) => {
                  handleField("mobile", String(val).replace(/\D/g, ""));
                }}
              />
              {errors.mobile && (
                <div className="text-red-600 text-sm">{errors.mobile}</div>
              )}
            </div>

            <div>
              <Label>Alternate Mobile</Label>
              <PhoneInput
                key={student.alternateMobile || "alternateMobile"}
                countries={[{ code: "IN", label: "+91" }]}
                defaultCountry="IN"
                defaultNumber={
                  student.alternateMobile
                    ? String(student.alternateMobile).replace(/\D/g, "")
                    : ""
                }
                onChange={(val) => {
                  handleField(
                    "alternateMobile",
                    String(val).replace(/\D/g, "")
                  );
                }}
              />
            </div>

            <div>
              <Label>Home Phone</Label>
              <PhoneInput
                key={student.homeMobile || "homeMobile"}
                countries={[{ code: "IN", label: "+91" }]}
                defaultCountry="IN"
                defaultNumber={
                  student.homeMobile
                    ? String(student.homeMobile).replace(/\D/g, "")
                    : ""
                }
                onChange={(val) => {
                  handleField("homeMobile", String(val).replace(/\D/g, ""));
                }}
              />
            </div>
          </div>
        </div>

        {/* Identity Information */}
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Identity Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Aadhaar Number</Label>
              <Input
                name="aadhaarNumber"
                value={student.aadhaarNumber}
                onChange={handleInputChange}
              />
              {errors.aadhaarNumber && (
                <div className="text-red-600 text-sm">
                  {errors.aadhaarNumber}
                </div>
              )}
            </div>

            <div>
              <Label>Birth Place</Label>
              <Input
                name="birthPlace"
                value={student.birthPlace}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Nationality</Label>
              <Input
                name="nationality"
                value={student.nationality}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Blood Group</Label>
              <Select
                name="bloodGroup"
                options={bloodGroupOptions}
                value={student.bloodGroup}
                onChange={(v) => handleSelectChange("bloodGroup", v)}
              />
            </div>

            <div>
              <Label>Caste</Label>
              <Input
                name="caste"
                value={student.caste}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>Sub Caste</Label>
              <Input
                name="subCaste"
                value={student.subCaste}
                onChange={handleInputChange}
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Disability / Allergy</Label>
              <Input
                name="disability_Allergy"
                value={student.disability_Allergy}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Family Information */}
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Family Information</h3>

          <div className="mb-6">
            <h4 className="font-medium mb-3 text-gray-700">Father Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Father Name</Label>
                <Input
                  name="fatherName"
                  value={student.fatherName}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label>Father Mobile</Label>
                <PhoneInput
                  key={student.fatherMobile || "fatherMobile"}
                  countries={[{ code: "IN", label: "+91" }]}
                  defaultCountry="IN"
                  defaultNumber={
                    student.fatherMobile
                      ? String(student.fatherMobile).replace(/\D/g, "")
                      : ""
                  }
                  onChange={(val) => {
                    handleField("fatherMobile", String(val).replace(/\D/g, ""));
                  }}
                />
                {errors.fatherMobile && (
                  <div className="text-red-600 text-sm">
                    {errors.fatherMobile}
                  </div>
                )}
              </div>

              <div>
                <Label>Father Occupation</Label>
                <Input
                  name="fatherOccupation"
                  value={student.fatherOccupation}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label>Father Workplace</Label>
                <Input
                  name="fatherWorkspace"
                  value={student.fatherWorkspace}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label>Father Annual Income</Label>
                <Input
                  name="fatherAnnualIncome"
                  value={student.fatherAnnualIncome}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-medium mb-3 text-gray-700">Mother Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Mother Name</Label>
                <Input
                  name="motherName"
                  value={student.motherName}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label>Mother Mobile</Label>
                <PhoneInput
                  key={student.motherMobile || "motherMobile"}
                  countries={[{ code: "IN", label: "+91" }]}
                  defaultCountry="IN"
                  defaultNumber={
                    student.motherMobile
                      ? String(student.motherMobile).replace(/\D/g, "")
                      : ""
                  }
                  onChange={(val) => {
                    handleField("motherMobile", String(val).replace(/\D/g, ""));
                  }}
                />
                {errors.motherMobile && (
                  <div className="text-red-600 text-sm">
                    {errors.motherMobile}
                  </div>
                )}
              </div>

              <div>
                <Label>Mother Occupation</Label>
                <Input
                  name="motherOccupation"
                  value={student.motherOccupation}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label>Mother Workplace</Label>
                <Input
                  name="motherWorkspace"
                  value={student.motherWorkspace}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label>Mother Annual Income</Label>
                <Input
                  name="motherAnnualIncome"
                  value={student.motherAnnualIncome}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3 text-gray-700">Guardian Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Guardian Name</Label>
                <Input
                  name="guardianName"
                  value={student.guardianName}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label>Guardian Mobile</Label>
                <PhoneInput
                  key={student.guardianMobile || "guardianMobile"}
                  countries={[{ code: "IN", label: "+91" }]}
                  defaultCountry="IN"
                  defaultNumber={
                    student.guardianMobile
                      ? String(student.guardianMobile).replace(/\D/g, "")
                      : ""
                  }
                  onChange={(val) => {
                    handleField(
                      "guardianMobile",
                      String(val).replace(/\D/g, "")
                    );
                  }}
                />
                {errors.guardianMobile && (
                  <div className="text-red-600 text-sm">
                    {errors.guardianMobile}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Current Address */}
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Current Address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Street Address</Label>
              <Input
                name="currentStreet"
                value={student.currentStreet}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>City</Label>
              <Input
                name="currentCity"
                value={student.currentCity}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>State</Label>
              <Input
                name="currentState"
                value={student.currentState}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>PIN Code</Label>
              <Input
                name="currentPin"
                value={student.currentPin}
                onChange={handleInputChange}
              />
              {errors.currentPin && (
                <div className="text-red-600 text-sm">{errors.currentPin}</div>
              )}
            </div>

            <div>
              <Label>Country</Label>
              <Input
                name="currentCountry"
                value={student.currentCountry}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Permanent Address */}
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Permanent Address</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Street Address</Label>
              <Input
                name="permanentStreet"
                value={student.permanentStreet}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>City</Label>
              <Input
                name="permanentCity"
                value={student.permanentCity}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>State</Label>
              <Input
                name="permanentState"
                value={student.permanentState}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>PIN Code</Label>
              <Input
                name="permanentPin"
                value={student.permanentPin}
                onChange={handleInputChange}
              />
              {errors.permanentPin && (
                <div className="text-red-600 text-sm">
                  {errors.permanentPin}
                </div>
              )}
            </div>

            <div>
              <Label>Country</Label>
              <Input
                name="permanentCountry"
                value={student.permanentCountry}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Photos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Student Photo */}
            <div className="space-y-3">
              <Label>Student Photo</Label>
              <FileInput
                ref={studentPhotoInputRef}
                onChange={(e) => handlePhotoChange("student", e.target.files)}
              />
              {studentPhotoPreviewUrl && (
                <div className="flex flex-col items-center gap-2 mt-2">
                  <img
                    src={studentPhotoPreviewUrl}
                    alt="Student"
                    className="w-32 h-32 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto("student")}
                    className="px-3 py-1 text-sm rounded shadow-sm hover:opacity-90 bg-red-500 text-white"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Father Photo */}
            <div className="space-y-3">
              <Label>Father Photo</Label>
              <FileInput
                ref={fatherPhotoInputRef}
                onChange={(e) => handlePhotoChange("father", e.target.files)}
              />
              {fatherPhotoPreviewUrl && (
                <div className="flex flex-col items-center gap-2 mt-2">
                  <img
                    src={fatherPhotoPreviewUrl}
                    alt="Father"
                    className="w-32 h-32 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto("father")}
                    className="px-3 py-1 text-sm rounded shadow-sm hover:opacity-90 bg-red-500 text-white"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Mother Photo */}
            <div className="space-y-3">
              <Label>Mother Photo</Label>
              <FileInput
                ref={motherPhotoInputRef}
                onChange={(e) => handlePhotoChange("mother", e.target.files)}
              />
              {motherPhotoPreviewUrl && (
                <div className="flex flex-col items-center gap-2 mt-2">
                  <img
                    src={motherPhotoPreviewUrl}
                    alt="Mother"
                    className="w-32 h-32 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto("mother")}
                    className="px-3 py-1 text-sm rounded shadow-sm hover:opacity-90 bg-red-500 text-white"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Authentication Information - Add this section */}
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Authentication Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Username</Label>
              <Input
                name="username"
                value={student.username}
                onChange={handleInputChange}
                placeholder="Leave empty to auto-generate"
              />
            </div>

            <div>
              <Label>Role</Label>
              <Input
                name="role"
                value={student.role}
                onChange={handleInputChange}
                disabled
                placeholder="Student"
              />
            </div>

            {!id && (
              <>
                <div>
                  <Label>
                    Password {!id && <span className="text-error-500">*</span>}
                  </Label>
                  <Input
                    name="password"
                    type="password"
                    value={student.password}
                    onChange={handleInputChange}
                    placeholder="Required for new student"
                  />
                </div>

                <div>
                  <Label>
                    Confirm Password{" "}
                    {!id && <span className="text-error-500">*</span>}
                  </Label>
                  <Input
                    name="confirmPassword"
                    type="password"
                    value={student.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm password"
                  />
                  {student.password &&
                    student.confirmPassword &&
                    student.password !== student.confirmPassword && (
                      <div className="text-red-600 text-sm">
                        Passwords do not match
                      </div>
                    )}
                </div>
              </>
            )}

            {id && (
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-500">
                  <i>
                    Password can only be changed through the user profile or
                    reset password feature.
                  </i>
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Documents */}
        <div className="rounded-2xl border p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Documents</h3>
          <div className="space-y-3">
            <div>
              <Label>Upload Documents</Label>
              <FileInput
                multiple
                onChange={(e) => handleDocumentsChange(e.target.files)}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {student.previewFiles.map((f, i) => (
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
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="px-6 py-2">
            {loading ? "Saving..." : id ? "Update Student" : "Create Student"}
          </Button>
        </div>
      </form>
    </div>
  );
}
