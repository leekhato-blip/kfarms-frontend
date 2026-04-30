import React from "react";
import { CheckCircle2, LoaderCircle, WifiOff } from "lucide-react";
import { getBackendConnectionSnapshot } from "../api/apiClient";

const ONLINE_CONFIRM_VISIBLE_MS = 2400;

function resolveVisibleStatus(pathname = "") {
  return (
    pathname === "/auth/login" ||
    pathname.startsWith("/app/") ||
    pathname.startsWith("/platform")
  );
}

export default function BackendRecoveryPrompt() {
  const [browserOffline, setBrowserOffline] = React.useState(
    () => typeof window !== "undefined" && window.navigator?.onLine === false,
  );
  const [backendDown, setBackendDown] = React.useState(
    () => getBackendConnectionSnapshot().backendDown,
  );
  const [showOnline, setShowOnline] = React.useState(false);
  const hadConnectionIssueRef = React.useRef(browserOffline || backendDown);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleOffline = () => {
      setBrowserOffline(true);
      setShowOnline(false);
    };

    const handleOnline = () => {
      setBrowserOffline(false);
    };

    const handleBackendDown = () => {
      setBackendDown(true);
      setShowOnline(false);
    };

    const handleBackendUp = () => {
      setBackendDown(false);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("kf-backend-down", handleBackendDown);
    window.addEventListener("kf-backend-up", handleBackendUp);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("kf-backend-down", handleBackendDown);
      window.removeEventListener("kf-backend-up", handleBackendUp);
    };
  }, []);

  React.useEffect(() => {
    const hasIssue = browserOffline || backendDown;
    const hadIssue = hadConnectionIssueRef.current;

    if (hasIssue) {
      hadConnectionIssueRef.current = true;
      setShowOnline(false);
      return undefined;
    }

    if (!hadIssue) {
      return undefined;
    }

    hadConnectionIssueRef.current = false;
    setShowOnline(true);

    const timerId = window.setTimeout(() => {
      setShowOnline(false);
    }, ONLINE_CONFIRM_VISIBLE_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [backendDown, browserOffline]);

  if (typeof window === "undefined") {
    return null;
  }

  if (!resolveVisibleStatus(window.location.pathname)) {
    return null;
  }

  const status = browserOffline
    ? {
        label: "Offline",
        detail: "Your device is offline.",
        icon: WifiOff,
        className:
          "border-amber-300/70 bg-amber-100/90 text-amber-900 shadow-[0_18px_38px_rgba(245,158,11,0.22)] dark:border-amber-300/20 dark:bg-amber-500/18 dark:text-amber-100",
      }
    : backendDown
      ? {
          label: "Reconnecting",
          detail: "Server connection is recovering.",
          icon: LoaderCircle,
          className:
            "border-blue-300/70 bg-blue-100/90 text-blue-900 shadow-[0_18px_38px_rgba(59,130,246,0.18)] dark:border-blue-300/20 dark:bg-blue-500/18 dark:text-blue-100",
        }
      : showOnline
        ? {
            label: "Online",
            detail: "Connection is back.",
            icon: CheckCircle2,
            className:
              "border-emerald-300/70 bg-emerald-100/90 text-emerald-900 shadow-[0_18px_38px_rgba(16,185,129,0.18)] dark:border-emerald-300/20 dark:bg-emerald-500/18 dark:text-emerald-100",
          }
        : null;

  if (!status) {
    return null;
  }

  const StatusIcon = status.icon;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[90]">
      <div
        className={`pointer-events-auto inline-flex items-center gap-3 rounded-full border px-4 py-2.5 backdrop-blur-xl ${status.className}`}
        role="status"
        aria-live="polite"
      >
        <StatusIcon className={`h-4 w-4 ${status.label === "Reconnecting" ? "animate-spin" : ""}`} />
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">{status.label}</span>
          <span className="hidden text-xs opacity-80 sm:inline">{status.detail}</span>
        </div>
      </div>
    </div>
  );
}
