import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * ProtectedRoute: wraps route elements that require auth.
 * Usage: <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children }) {
    const { token } = useAuth();
    if (!token) {
        return <Navigate to="/auth/login" replace/>
    }
    return children;
}