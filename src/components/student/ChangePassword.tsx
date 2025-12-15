import React, { useState } from "react";
import { useToast } from "../../context/ToastContext";
import Button from "../ui/button/Button";
import Input from "../ui/form/InputField";
import Label from "../ui/form/Label";
import api from "../../api/api";

interface ChangePasswordProps {
  studentId?: string;
  isAdmin?: boolean;
  onSuccess?: () => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({
  studentId,
  isAdmin = false,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!isAdmin && !currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      if (isAdmin && studentId) {
        // Admin reset password
        await api.post(`/student-auth/reset-password/${studentId}`, {
          newPassword,
        });

        showToast({
          variant: "success",
          title: "Success",
          message: "Password reset successfully",
        });
      } else {
        // Student change password
        await api.post("/student-auth/change-password", {
          currentPassword,
          newPassword,
        });

        showToast({
          variant: "success",
          title: "Success",
          message: "Password changed successfully",
        });
      }

      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Password change error:", error);
      showToast({
        variant: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to change password",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border p-6 bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">
        {isAdmin ? "Reset Student Password" : "Change Password"}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isAdmin && (
          <div>
            <Label>
              Current Password <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showCurrent ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-500 text-sm">{errors.currentPassword}</p>
            )}
          </div>
        )}

        <div>
          <Label>
            New Password <span className="text-error-500">*</span>
          </Label>
          <div className="relative">
            <Input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
            >
              {showNew ? "🙈" : "👁️"}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Must be at least 6 characters
          </p>
          {errors.newPassword && (
            <p className="text-red-500 text-sm">{errors.newPassword}</p>
          )}
        </div>

        <div>
          <Label>
            Confirm New Password <span className="text-error-500">*</span>
          </Label>
          <div className="relative">
            <Input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
            >
              {showConfirm ? "🙈" : "👁️"}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
          )}
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading
              ? "Processing..."
              : isAdmin
              ? "Reset Password"
              : "Change Password"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
