import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { hasRole } from "./authStore";

export function ProtectedRoute({
    children,
    roles,
}: {
    children: React.ReactNode;
    roles?: string[];
}) {
    const auth = useAuth();

    if (!auth.token) return <Navigate to="/login" replace />;

    if (roles && roles.length > 0) {
        const ok = roles.some(r => hasRole(auth, r));
        if (!ok) return <Navigate to="/forbidden" replace />;
    }

    return children;
}
