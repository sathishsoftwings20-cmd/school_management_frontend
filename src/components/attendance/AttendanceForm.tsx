// /* eslint-disable @typescript-eslint/no-explicit-any */
// import React, { useEffect, useMemo, useState } from "react";
// import Label from "../ui/form/Label";
// import Input from "../ui/form/InputField";
// import Select from "../ui/form/Select";
// import Button from "../ui/button/Button";
// import { useToast } from "../../context/ToastContext";

// import { getAllClass, Class } from "../../api/class.api";
// import { getAllStudent, Student } from "../../api/student.api";
// import {
//   getAttendance,
//   markAttendance,
//   AttendanceRecord,
//   AttendanceStatus,
// } from "../../api/attendance.api";

// import authApi from "../../api/auth.api";
// import type { User } from "../../api/user.api";

// const TODAY = () => {
//   const d = new Date();
//   const yyyy = d.getFullYear();
//   const mm = String(d.getMonth() + 1).padStart(2, "0");
//   const dd = String(d.getDate()).padStart(2, "0");
//   return `${yyyy}-${mm}-${dd}`;
// };

// const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
//   { value: "Present", label: "Present" },
//   { value: "Absent", label: "Absent" },
//   { value: "Late", label: "Late" },
//   { value: "Excused", label: "Excused" },
//   { value: "Half Day", label: "Half Day" },
// ];

// // Helper function to extract ObjectId
// const extractObjectId = (obj: any): string => {
//   if (!obj) return "";
//   if (typeof obj === "string") return obj;
//   if (obj && typeof obj === "object") {
//     if (obj.$oid) return obj.$oid;
//     if (obj._id) return String(obj._id);
//     if (obj.id) return String(obj.id);
//   }
//   return String(obj);
// };

// export default function AttendanceForm(): React.JSX.Element {
//   const { showToast } = useToast();

//   const [currentUser, setCurrentUser] = useState<User | null>(null);
//   const [classes, setClasses] = useState<Class[]>([]);
//   const [students, setStudents] = useState<Student[]>([]);

//   const [classId, setClassId] = useState<string>("");
//   const [section, setSection] = useState<string>("");
//   const [date, setDate] = useState<string>(TODAY());

//   const [loading, setLoading] = useState(false);
//   const [loadingStudents, setLoadingStudents] = useState(false);

//   const [records, setRecords] = useState<
//     {
//       studentId: string;
//       studentName: string;
//       status: AttendanceStatus;
//       attendanceId?: string;
//     }[]
//   >([]);

//   const [assignedToSection, setAssignedToSection] = useState<boolean>(false);

//   // Load current user
//   useEffect(() => {
//     let cancelled = false;
//     (async () => {
//       try {
//         const u = await authApi.getCurrentUser();
//         if (cancelled) return;
//         setCurrentUser(u);
//         console.log("[Attendance] Current user loaded:", {
//           id: u._id,
//           name: u.fullName,
//           role: u.role,
//           isAdmin: ["Admin", "SuperAdmin"].includes(
//             String(u.role || "").trim()
//           ),
//         });
//       } catch (err) {
//         console.error("[Attendance] Failed to fetch current user:", err);
//         setCurrentUser(null);
//       }
//     })();
//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   const isAdmin = useMemo(() => {
//     return Boolean(
//       currentUser &&
//         ["Admin", "SuperAdmin"].includes(String(currentUser.role || "").trim())
//     );
//   }, [currentUser]);

//   // Log admin status
//   useEffect(() => {
//     console.log("[Attendance] Admin status:", {
//       isAdmin,
//       userRole: currentUser?.role,
//       currentUser: currentUser,
//     });
//   }, [isAdmin, currentUser]);

//   // Load classes
//   useEffect(() => {
//     let cancelled = false;
//     (async () => {
//       try {
//         const cs = await getAllClass();
//         if (cancelled) return;
//         setClasses(Array.isArray(cs) ? cs : []);
//       } catch (err) {
//         console.error("[Attendance] getAllClass error:", err);
//         setClasses([]);
//       }
//     })();
//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   // Load students
//   useEffect(() => {
//     let cancelled = false;
//     (async () => {
//       try {
//         setLoadingStudents(true);
//         const ss = await getAllStudent();
//         if (cancelled) return;
//         setStudents(Array.isArray(ss) ? ss : []);
//         console.log("[Attendance] Students loaded:", ss?.length || 0);
//       } catch (err) {
//         console.error("[Attendance] getAllStudent error:", err);
//         setStudents([]);
//       } finally {
//         if (!cancelled) setLoadingStudents(false);
//       }
//     })();
//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   const selectedClass = useMemo(
//     () => classes.find((c) => String(c._id) === String(classId)) ?? null,
//     [classes, classId]
//   );

//   const allSectionOptions = useMemo(() => {
//     if (!selectedClass || !Array.isArray(selectedClass.sections)) return [];
//     return selectedClass.sections.map((s) => ({
//       value: s.name,
//       label: s.name,
//       staff: (s as any).staff ?? (s as any).teacher ?? null,
//     }));
//   }, [selectedClass]);

//   const availableSectionOptions = useMemo(() => {
//     if (!selectedClass) return [];
//     // Admins see all sections
//     if (isAdmin) return allSectionOptions;

//     // Staff only see their assigned sections
//     const uid = String(currentUser?._id ?? "");
//     const staffIdOnUser = String((currentUser as any)?.staffId ?? "");
//     return allSectionOptions.filter(
//       (opt) =>
//         String(opt.staff ?? "") === uid ||
//         (staffIdOnUser && String(opt.staff ?? "") === staffIdOnUser)
//     );
//   }, [allSectionOptions, isAdmin, currentUser]);

//   // FIXED: Load students when class/section changes
//   useEffect(() => {
//     let cancelled = false;

//     if (!classId || !section) {
//       setRecords([]);
//       setAssignedToSection(false);
//       return;
//     }

//     (async () => {
//       setLoading(true);
//       try {
//         console.log("[Attendance] Loading for:", { classId, section, date });

//         // FIXED: Check assignment with better matching
//         if (isAdmin) {
//           setAssignedToSection(true);
//           console.log(
//             "[Attendance] Admin user - automatically assigned to section"
//           );
//         } else {
//           // For staff users, check if assigned to this section
//           const secObj = (selectedClass?.sections ?? []).find(
//             (s) => (s as any).name === section
//           );

//           if (secObj) {
//             const assignedStaffId = secObj.staff
//               ? extractObjectId(secObj.staff)
//               : null;
//             const currentUserId = extractObjectId(currentUser?._id);

//             // Also check if current user has a staffId field
//             const userStaffId = (currentUser as any)?.staffId
//               ? extractObjectId((currentUser as any).staffId)
//               : null;

//             console.log("[Attendance] Staff assignment check:", {
//               assignedStaffId,
//               currentUserId,
//               userStaffId,
//               secObj,
//             });

//             // Check if either user ID or staffId matches
//             const isAssigned =
//               assignedStaffId &&
//               (assignedStaffId === currentUserId ||
//                 assignedStaffId === userStaffId);

//             setAssignedToSection(Boolean(isAssigned));
//           } else {
//             setAssignedToSection(false);
//           }
//         }

//         // Filter students (same as before)
//         const studentsInClass = (students ?? []).filter((st) => {
//           const studentClassId = extractObjectId(st.class);
//           const studentSectionId = extractObjectId(st.section);
//           const studentSectionName = st.sectionName || "";

//           return (
//             studentClassId === classId &&
//             (studentSectionId === section || studentSectionName === section)
//           );
//         });

//         console.log(
//           "[Attendance] Students in class/section:",
//           studentsInClass.length
//         );

//         // ... rest of the code remains the same
//       } catch (err) {
//         console.error("[Attendance] Load failed:", err);
//         if (!cancelled) {
//           setRecords([]);
//           showToast({
//             variant: "error",
//             title: "Error",
//             message: "Failed to load attendance data",
//           });
//         }
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     })();

//     return () => {
//       cancelled = true;
//     };
//   }, [
//     classId,
//     section,
//     date,
//     selectedClass,
//     students,
//     currentUser,
//     isAdmin,
//     showToast,
//   ]);

//   const onStatusChange = (studentId: string, status: AttendanceStatus) => {
//     setRecords((prev) =>
//       prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
//     );
//   };

//   const handleSave = async () => {
//     if (!classId || !section) {
//       showToast({
//         variant: "error",
//         title: "Missing",
//         message: "Select class & section",
//       });
//       return;
//     }

//     if (!isAdmin && !assignedToSection) {
//       showToast({
//         variant: "error",
//         title: "Forbidden",
//         message: "You are not assigned to this section",
//       });
//       return;
//     }

//     if (!records.length) {
//       showToast({
//         variant: "error",
//         title: "Empty",
//         message: "No students to save",
//       });
//       return;
//     }

//     try {
//       setLoading(true);
//       const payload: AttendanceRecord[] = records.map((r) => ({
//         studentId: r.studentId,
//         status: r.status,
//       }));

//       console.log("[Attendance] Saving attendance:", {
//         classId,
//         section,
//         date,
//         count: payload.length,
//         isAdmin,
//         assignedToSection,
//       });

//       const resp = await markAttendance(classId, section, date, payload);
//       console.log("[Attendance] Save response:", resp);

//       showToast({
//         variant: "success",
//         title: "Saved",
//         message: `Attendance saved for ${records.length} student(s).`,
//       });
//     } catch (err) {
//       console.error("[Attendance] Save failed:", err);
//       showToast({
//         variant: "error",
//         title: "Error",
//         message: (err as any)?.message || "Failed to save attendance",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const classOptions = useMemo(() => {
//     return [
//       { value: "", label: "-- Select class --" },
//       ...(classes || []).map((c) => ({
//         value: c._id,
//         label: `${c.className} (${c.classCode || "No Code"})`,
//       })),
//     ];
//   }, [classes]);

//   const sectionOptionsForSelect = useMemo(() => {
//     if (!selectedClass) return [{ value: "", label: "-- Select section --" }];
//     const opts = (isAdmin ? allSectionOptions : availableSectionOptions) || [];
//     return [
//       { value: "", label: "-- Select section --" },
//       ...opts.map((o) => ({ value: o.value, label: o.label })),
//     ];
//   }, [selectedClass, allSectionOptions, availableSectionOptions, isAdmin]);

//   // Debug info panel
//   const renderDebugInfo = () => {
//     if (!process.env.NODE_ENV || process.env.NODE_ENV === "production") {
//       return null;
//     }

//     return (
//       <div className="mt-3 p-3 bg-gray-100 rounded text-xs">
//         <h4 className="font-semibold mb-2">Debug Info:</h4>
//         <div>
//           <strong>User:</strong> {currentUser?.fullName} ({currentUser?.role})
//         </div>
//         <div>
//           <strong>Is Admin:</strong> {isAdmin ? "Yes" : "No"}
//         </div>
//         <div>
//           <strong>Class Selected:</strong> {classId || "None"}
//         </div>
//         <div>
//           <strong>Section Selected:</strong> {section || "None"}
//         </div>
//         <div>
//           <strong>Assigned to Section:</strong>{" "}
//           {assignedToSection ? "Yes" : "No"}
//         </div>
//         <div>
//           <strong>Total Students:</strong> {students.length}
//         </div>
//         <div>
//           <strong>Records Found:</strong> {records.length}
//         </div>
//         {classId && section && (
//           <div className="mt-1">
//             <strong>Matching students:</strong>{" "}
//             {
//               students.filter(
//                 (st) =>
//                   extractObjectId(st.class) === classId &&
//                   (extractObjectId(st.section) === section ||
//                     st.sectionName === section)
//               ).length
//             }
//           </div>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="w-full rounded-xl border p-4 bg-white shadow">
//       <div className="flex items-center justify-between mb-4">
//         <h2 className="text-lg font-semibold">Record Attendance</h2>
//         <div className="text-sm text-gray-600">
//           {currentUser ? (
//             <>
//               <span className="font-medium">
//                 {currentUser.fullName || currentUser.userId}
//               </span>
//               <span
//                 className={`ml-2 px-2 py-1 rounded ${
//                   isAdmin
//                     ? "bg-blue-100 text-blue-800"
//                     : "bg-gray-100 text-gray-800"
//                 }`}
//               >
//                 {currentUser.role}
//                 {isAdmin && " (Admin)"}
//               </span>
//             </>
//           ) : (
//             "Loading user..."
//           )}
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <div>
//           <Label>Class</Label>
//           <Select
//             name="class"
//             options={classOptions}
//             value={classId}
//             onChange={(v) => {
//               setClassId(v);
//               setSection("");
//               setRecords([]);
//             }}
//             className="w-full"
//           />
//         </div>

//         <div>
//           <Label>Section</Label>
//           <Select
//             name="section"
//             options={sectionOptionsForSelect}
//             value={section}
//             onChange={(v) => {
//               setSection(v);
//               setRecords([]);
//             }}
//             className="w-full"
//           />
//           {selectedClass && (
//             <div className="mt-1 text-xs text-gray-500">
//               {isAdmin ? (
//                 <span className="text-blue-600">
//                   Admin: All sections visible
//                 </span>
//               ) : (
//                 <span>Your assigned sections only</span>
//               )}
//             </div>
//           )}
//         </div>

//         <div>
//           <Label>Date</Label>
//           <Input
//             name="attendanceDate"
//             type="date"
//             value={date}
//             onChange={(e) => setDate(e.target.value)}
//             className="w-full"
//           />
//         </div>
//       </div>

//       {/* Show admin status badge */}
//       {isAdmin && classId && section && (
//         <div className="mt-3 p-3 bg-blue-50 text-blue-800 rounded border border-blue-200">
//           <div className="flex items-center">
//             <svg
//               className="w-5 h-5 mr-2"
//               fill="currentColor"
//               viewBox="0 0 20 20"
//             >
//               <path
//                 fillRule="evenodd"
//                 d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
//                 clipRule="evenodd"
//               />
//             </svg>
//             <span>Admin Access: You can mark attendance for any section</span>
//           </div>
//         </div>
//       )}

//       {/* Show warning for non-admin, non-assigned users */}
//       {!isAdmin && classId && section && !assignedToSection && (
//         <div className="mt-3 p-3 bg-yellow-50 text-yellow-800 rounded border border-yellow-200">
//           <div className="flex items-center">
//             <svg
//               className="w-5 h-5 mr-2"
//               fill="currentColor"
//               viewBox="0 0 20 20"
//             >
//               <path
//                 fillRule="evenodd"
//                 d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
//                 clipRule="evenodd"
//               />
//             </svg>
//             <span>
//               You are not assigned to this section. Only assigned staff or
//               admins can record attendance.
//             </span>
//           </div>
//         </div>
//       )}

//       {renderDebugInfo()}

//       <div className="mt-5 border rounded-xl p-4">
//         <div className="flex justify-between items-center mb-3">
//           <h3 className="font-semibold">Students</h3>
//           <div className="flex items-center gap-2">
//             {loading && (
//               <span className="text-sm text-blue-600 animate-pulse">
//                 Loading...
//               </span>
//             )}
//             <span
//               className={`px-3 py-1 rounded-full text-sm ${
//                 records.length > 0
//                   ? "bg-green-100 text-green-800"
//                   : "bg-gray-100 text-gray-800"
//               }`}
//             >
//               {records.length} student{records.length !== 1 ? "s" : ""}
//             </span>
//           </div>
//         </div>

//         {loading ? (
//           <div className="py-8 text-center">
//             <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//             <p className="mt-2 text-gray-600">Loading student data...</p>
//           </div>
//         ) : records.length === 0 ? (
//           <div className="py-8 text-center text-gray-500">
//             {classId && section ? (
//               <div>
//                 <p className="mb-2">
//                   No students found for this class and section.
//                 </p>
//                 <p className="text-sm">Make sure students are assigned to:</p>
//                 <p className="font-medium mt-1">
//                   {classes.find((c) => c._id === classId)?.className || "Class"}{" "}
//                   / {section}
//                 </p>
//               </div>
//             ) : (
//               <div>
//                 <p>Please select a class and section</p>
//                 <p className="text-sm mt-1">Choose from the dropdowns above</p>
//               </div>
//             )}
//           </div>
//         ) : (
//           <div className="space-y-2">
//             {records.map((r) => (
//               <div
//                 key={r.studentId}
//                 className="flex items-center justify-between border rounded-lg p-3 hover:bg-gray-50 transition-colors"
//               >
//                 <div className="flex-1">
//                   <div className="font-medium">{r.studentName}</div>
//                   <div className="text-xs text-gray-500">
//                     ID: {r.studentId.slice(-8)}
//                   </div>
//                 </div>

//                 <Select
//                   name={`status-${r.studentId}`}
//                   options={STATUS_OPTIONS}
//                   value={r.status}
//                   onChange={(v) =>
//                     onStatusChange(r.studentId, v as AttendanceStatus)
//                   }
//                   className="w-40"
//                 />
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       <div className="flex justify-end mt-6 gap-2">
//         <Button
//           onClick={() => {
//             setClassId("");
//             setSection("");
//             setDate(TODAY());
//             setRecords([]);
//           }}
//           variant="outline"
//           className="border-gray-300 text-gray-700 hover:bg-gray-50"
//         >
//           Clear
//         </Button>

//         <Button
//           onClick={handleSave}
//           disabled={
//             loading ||
//             !classId ||
//             !section ||
//             (!isAdmin && !assignedToSection) ||
//             records.length === 0
//           }
//           className={`${
//             isAdmin
//               ? "bg-purple-600 hover:bg-purple-700"
//               : "bg-blue-600 hover:bg-blue-700"
//           } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
//         >
//           {loading ? (
//             <>
//               <span className="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
//               Saving...
//             </>
//           ) : isAdmin ? (
//             `Save as Admin (${records.length})`
//           ) : (
//             `Save Attendance (${records.length})`
//           )}
//         </Button>
//       </div>
//     </div>
//   );
// }
