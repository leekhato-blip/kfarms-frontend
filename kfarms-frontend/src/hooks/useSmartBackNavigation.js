import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function isHiddenPath(pathname, hiddenPaths) {
  return hiddenPaths.some((path) => pathname === path || pathname === `${path}/`);
}

export function hasInAppHistory(historyState) {
  const historyIndex = historyState?.idx;
  return typeof historyIndex === "number" ? historyIndex > 0 : false;
}

export default function useSmartBackNavigation({
  fallbackPath,
  hiddenPaths = [],
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const canGoBack = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return hasInAppHistory(window.history.state);
  }, [location.key]);

  const showBackButton = !isHiddenPath(location.pathname, hiddenPaths);

  const goBack = React.useCallback(() => {
    if (canGoBack) {
      navigate(-1);
      return;
    }

    navigate(fallbackPath, { replace: true });
  }, [canGoBack, fallbackPath, navigate]);

  return {
    canGoBack,
    goBack,
    showBackButton,
  };
}
