// src/components/auth/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({
    children,
    roles,
}: {
    children: React.ReactNode;
    roles?: string[];
}) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/signin" replace />;
    }
    if (roles && !roles.includes(user.role || "")) {
        return <Navigate to="/" replace />;
    }
    return children;
}
