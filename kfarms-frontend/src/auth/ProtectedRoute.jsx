import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePlatformAuth } from "./AuthProvider";

export default function PlatformProtectedRoute({ children, publicOnly = false }) {
  const location = useLocation();
  const { isAuthenticated } = usePlatformAuth();

  if (publicOnly && isAuthenticated) {
    return <Navigate to="/platform" replace />;
  }

  if (!publicOnly && !isAuthenticated) {
    return <Navigate to="/platform/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
