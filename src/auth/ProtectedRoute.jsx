import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePlatformAuth } from "./AuthProvider";
<<<<<<< HEAD
import PlatformLoader from "../components/PlatformLoader";
import { resolvePlatformProtectedRedirect } from "./platformRouteGuards";

export default function PlatformProtectedRoute({ children, publicOnly = false }) {
  const location = useLocation();
  const { isAuthenticated, canAccessPlatform, profileLoading } = usePlatformAuth();
  const redirectTarget = resolvePlatformProtectedRedirect({
    publicOnly,
    isAuthenticated,
    canAccessPlatform,
    profileLoading,
  });

  if (redirectTarget === "loading") {
    return <PlatformLoader label="Opening the control plane..." />;
  }

  if (redirectTarget) {
    return <Navigate to={redirectTarget} replace state={{ from: location.pathname }} />;
=======

export default function PlatformProtectedRoute({ children, publicOnly = false }) {
  const location = useLocation();
  const { isAuthenticated } = usePlatformAuth();

  if (publicOnly && isAuthenticated) {
    return <Navigate to="/platform" replace />;
  }

  if (!publicOnly && !isAuthenticated) {
    return <Navigate to="/platform/login" replace state={{ from: location.pathname }} />;
>>>>>>> 0babf4d (Update frontend application)
  }

  return children;
}
