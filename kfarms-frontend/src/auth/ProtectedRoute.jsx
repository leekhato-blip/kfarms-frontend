import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePlatformAuth } from "./AuthProvider";
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
  }

  return children;
}
