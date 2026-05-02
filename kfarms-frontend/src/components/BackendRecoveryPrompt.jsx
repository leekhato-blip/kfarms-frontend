import React from "react";
import { CheckCircle2, LoaderCircle, WifiOff } from "lucide-react";
import { getBackendConnectionSnapshot } from "../api/apiClient";

const ONLINE_CONFIRM_VISIBLE_MS = 2400;
const STATUS_HIDE_TRANSITION_MS = 280;

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
  const [renderedStatus, setRenderedStatus] = React.useState(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const hadConnectionIssueRef = React.useRef(browserOffline || backendDown);
  const hideTimerRef = React.useRef(null);
  const enterFrameRef = React.useRef(null);

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

  const status = React.useMemo(() => {
    if (browserOffline) {
      return {
        label: "Offline",
        icon: WifiOff,
        className:
          "border-amber-300/75 bg-amber-50/96 text-amber-950 shadow-[0_12px_28px_rgba(245,158,11,0.18)] dark:border-amber-400/40 dark:bg-[linear-gradient(135deg,rgba(120,53,15,0.94),rgba(69,26,3,0.92))] dark:text-amber-50",
        iconClassName:
          "bg-amber-500/12 text-amber-800 dark:bg-amber-300/14 dark:text-amber-100",
      };
    }

    if (backendDown) {
      return {
        label: "Syncing",
        icon: LoaderCircle,
        className:
          "border-sky-300/75 bg-sky-50/96 text-sky-950 shadow-[0_12px_28px_rgba(59,130,246,0.16)] dark:border-sky-400/40 dark:bg-[linear-gradient(135deg,rgba(10,18,35,0.95),rgba(8,47,73,0.94))] dark:text-sky-50",
        iconClassName:
          "bg-sky-500/12 text-sky-700 dark:bg-sky-300/14 dark:text-sky-100",
      };
    }

    if (showOnline) {
      return {
        label: "Online",
        icon: CheckCircle2,
        className:
          "border-emerald-300/75 bg-emerald-50/96 text-emerald-950 shadow-[0_12px_28px_rgba(16,185,129,0.16)] dark:border-emerald-400/40 dark:bg-[linear-gradient(135deg,rgba(6,78,59,0.94),rgba(2,44,34,0.92))] dark:text-emerald-50",
        iconClassName:
          "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-300/14 dark:text-emerald-100",
      };
    }

    return null;
  }, [backendDown, browserOffline, showOnline]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (enterFrameRef.current) {
      window.cancelAnimationFrame(enterFrameRef.current);
      enterFrameRef.current = null;
    }

    if (!status) {
      setIsVisible(false);
      hideTimerRef.current = window.setTimeout(() => {
        setRenderedStatus(null);
      }, STATUS_HIDE_TRANSITION_MS);

      return () => {
        if (hideTimerRef.current) {
          window.clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
      };
    }

    setRenderedStatus(status);
    enterFrameRef.current = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      if (enterFrameRef.current) {
        window.cancelAnimationFrame(enterFrameRef.current);
        enterFrameRef.current = null;
      }
    };
  }, [status]);

  if (typeof window === "undefined") {
    return null;
  }

  if (!resolveVisibleStatus(window.location.pathname)) {
    return null;
  }

  if (!renderedStatus) {
    return null;
  }

  const StatusIcon = renderedStatus.icon;

  return (
    <div
      className={`pointer-events-none fixed left-1/2 top-3 z-[90] -translate-x-1/2 transition-all duration-300 ease-out motion-reduce:transition-none ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      <div
        className={`pointer-events-auto inline-flex min-h-10 items-center gap-2.5 rounded-full border px-3 py-2 backdrop-blur-xl transition-[background-color,border-color,color,box-shadow] duration-300 ease-out motion-reduce:transition-none ${renderedStatus.className}`}
        role="status"
        aria-live="polite"
      >
        <span
          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${renderedStatus.iconClassName}`}
        >
          <StatusIcon
            className={`h-4 w-4 ${
              renderedStatus.label === "Syncing" ? "animate-spin" : ""
            }`}
          />
        </span>
        <div className="text-sm font-semibold">{renderedStatus.label}</div>
      </div>
    </div>
  );
}
