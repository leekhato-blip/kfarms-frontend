import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import { AuthProvider, AuthContext } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashbordPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SalesPage from "./pages/SalesPage";
import SuppliesPage from "./pages/SuppliesPage";
import FishPonds from "./pages/FishPonds";

/**
 * App routes:
 * - "/" -> if authenticated -> dashboard, else -> auth page
 * - "/auth" -> auth page (login/signup)
 *
 * Wrap with AuthProvider to give hooks access to auth state
 */
export default function App() {
  return (
    <Routes>
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

      {/* Protected root */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      {/* Protected Sales route */}
      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <SalesPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Supplies route */}
      <Route
        path="/supplies"
        element={
          <ProtectedRoute>
            <SuppliesPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Fish Ponds route */}
      <Route
        path="/fish-ponds"
        element={
          <ProtectedRoute>
            <FishPonds />
          </ProtectedRoute>
        }
      />

      {/* fallback to login */}
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}
