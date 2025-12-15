/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import { getClassById } from "../../api/class.api";
import Label from "../ui/form/Label";
import Input from "../ui/form/InputField";
import Button from "../ui/button/Button";
import Select from "../ui/form/Select";
import { useToast } from "../../context/ToastContext";

// Types
type SectionEntry = {
  name: string;
  staff: string | null; // staff _id
};

interface ClassFormState {
  className: string;
  sections: SectionEntry[];
}

interface StaffOption {
  _id: string;
  staffId?: string;
  fullName?: string;
  email?: string;
}

interface Errors {
  className?: string;
  sections?: string;
}

export default function ClassForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const mounted = useRef(true);

  const [form, setForm] = useState<ClassFormState>({
    className: "",
    sections: [],
  });
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  // Load staff list for staff selects
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Try to call staff API (assumes getAllStaff exists and returns Staff[])
        const res = await api.get<StaffOption[]>("/staff");
        if (cancelled) return;
        setStaffList(res.data || []);
      } catch (err) {
        console.error("Failed to load staff list", err);
        // it's safe to continue without staff list — user can still create class and add staff later
      }
    })();
    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, []);

  // Load class when editing
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getClassById(id);
        if (cancelled) return;
        const sections = Array.isArray(data.sections)
          ? data.sections.map((s: any) => ({
              name: s.name || "",
              staff: s.staff?._id || s.staff || null,
            }))
          : [];
        setForm({ className: data.className || "", sections });
      } catch (err) {
        console.error("Failed to load class", err);
        showToast({
          variant: "error",
          title: "Error",
          message: "Failed to load class.",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, showToast]);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const addSection = () => {
    setForm((f) => ({
      ...f,
      sections: [...f.sections, { name: "", staff: null }],
    }));
  };

  const removeSection = (index: number) => {
    setForm((f) => ({
      ...f,
      sections: f.sections.filter((_, i) => i !== index),
    }));
  };

  const handleSectionChange = (
    index: number,
    field: keyof SectionEntry,
    value: string
  ) => {
    setForm((f) => {
      const copy = f.sections.map((s) => ({ ...s }));
      copy[index] = { ...copy[index], [field]: value } as SectionEntry;
      return { ...f, sections: copy };
    });
  };

  // simple validation
  const validate = (): boolean => {
    const err: Errors = {};
    if (!form.className || !form.className.trim())
      err.className = "Class name is required";
    // ensure every section has a name
    if (form.sections.some((s) => !s.name || !s.name.trim()))
      err.sections = "All sections must have a name";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const payload = {
        className: form.className,
        sections: form.sections.map((s) => ({
          name: s.name,
          staff: s.staff || null,
        })),
      };

      if (id) {
        await api.put(`/classes/${id}`, payload);
        showToast({
          variant: "success",
          title: "Updated",
          message: "Class updated.",
        });
      } else {
        await api.post("/classes", payload);
        showToast({
          variant: "success",
          title: "Created",
          message: "Class created.",
        });
      }

      // navigate back to class list
      navigate("/class");
    } catch (err: unknown) {
      console.error("save class error", err);
      let msg = "Error saving class";
      if (err instanceof Error) msg = err.message;
      showToast({ variant: "error", title: "Error", message: msg });
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border bg-white p-4 sm:p-6">
      <h2 className="text-lg font-semibold mb-4">
        {id ? "Edit Class" : "Create Class"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label>
            Class Name<span className="text-error-500">*</span>
          </Label>
          <Input
            name="className"
            value={form.className}
            onChange={handleChange}
            error={!!errors.className}
          />
          {errors.className && (
            <div className="text-red-600 text-sm">{errors.className}</div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label>Sections</Label>
            <button
              type="button"
              onClick={addSection}
              className="text-sm btn-link"
            >
              + Add section
            </button>
          </div>

          {form.sections.length === 0 && (
            <div className="mt-2 text-sm text-muted">
              No sections yet. Click "Add section" to create one.
            </div>
          )}

          <div className="space-y-3 mt-3">
            {form.sections.map((sec, i) => (
              <div key={i} className="border rounded p-3 flex gap-3 items-end">
                <div className="flex-1">
                  <Label>
                    Section Name<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    name={`section-name-${i}`}
                    value={sec.name}
                    onChange={(e) =>
                      handleSectionChange(i, "name", e.target.value)
                    }
                  />
                </div>

                <div className="w-64">
                  <Label>staff</Label>
                  <Select
                    name={`section-staff-${i}`}
                    options={[
                      { value: "", label: "— Select staff —" },
                      ...staffList.map((s) => ({
                        value: s._id,
                        label: `${s.fullName} - ${s.staffId}`,
                      })),
                    ]}
                    value={sec.staff || ""}
                    onChange={(v: string) => handleSectionChange(i, "staff", v)}
                  />
                </div>

                <div>
                  <button
                    type="button"
                    className="text-red-500 text-sm"
                    onClick={() => removeSection(i)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {errors.sections && (
            <div className="text-red-600 text-sm mt-2">{errors.sections}</div>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : id ? "Update" : "Create"}
          </Button>
          {/* <Button type="button" onClick={() => navigate("/class")}>
            Cancel
          </Button> */}
        </div>
      </form>
    </div>
  );
}
