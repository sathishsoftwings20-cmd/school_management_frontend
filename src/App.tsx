import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/NotFound";
import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Home from "./pages/Dashboard/Home";
import UserCreatePage from "./pages/Users/UserCreatePage";
import UserListPage from "./pages/Users/UserListPage";

import StaffCreatePage from "./pages/Staff/StaffCreatePage";
import StaffListPage from "./pages/Staff/StaffListPage";
import ClassCreatePage from "./pages/Class/ClassCreatePage";
import ClassListPage from "./pages/Class/ClassListPage";

import StudentCreatePage from "./pages/Student/StudentCreatePage";
import StudentListPage from "./pages/Student/StudentListPage";
import AttendanceFormPage from "./pages/Attendance/AttendanceFormPage";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={<Home />} />

          {/* Users */}
          <Route path="/users" element={<UserListPage />} />
          <Route path="/users/add" element={<UserCreatePage />} />
          {/* <Route path="/users/:id" element={<UserViewPage />} /> */}
          <Route path="/users/edit/:id" element={<UserCreatePage />} />

          {/* Satff */}
          <Route path="/staffs" element={<StaffListPage />} />
          <Route path="/staff/add" element={<StaffCreatePage />} />
          <Route path="/staff/edit/:id" element={<StaffCreatePage />} />

          {/* Class */}
          <Route path="/class" element={<ClassListPage />} />
          <Route path="/class/add" element={<ClassCreatePage />} />
          <Route path="/class/edit/:id" element={<ClassCreatePage />} />

          {/* Student */}
          <Route path="/student" element={<StudentListPage />} />
          <Route path="/student/add" element={<StudentCreatePage />} />
          <Route path="/students/edit/:id" element={<StudentCreatePage />} />

          {/* Attendance */}
          <Route path="/attendance/mark" element={<AttendanceFormPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
