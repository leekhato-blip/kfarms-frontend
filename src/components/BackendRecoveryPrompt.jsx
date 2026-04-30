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
        detail: "Your device is offline.",
        icon: WifiOff,
        className:
          "border-amber-300/75 bg-amber-50/95 text-amber-950 shadow-[0_18px_38px_rgba(245,158,11,0.18)] dark:border-amber-400/45 dark:bg-[linear-gradient(135deg,rgba(120,53,15,0.97),rgba(69,26,3,0.96))] dark:text-amber-50",
        iconClassName:
          "bg-amber-500/12 text-amber-800 dark:bg-amber-300/14 dark:text-amber-100",
      };
    }

    if (backendDown) {
      return {
        label: "Reconnecting",
        detail: "Server connection is recovering.",
        icon: LoaderCircle,
        className:
          "border-sky-300/75 bg-sky-50/95 text-sky-950 shadow-[0_18px_38px_rgba(59,130,246,0.16)] dark:border-sky-400/40 dark:bg-[linear-gradient(135deg,rgba(10,18,35,0.98),rgba(8,47,73,0.95))] dark:text-sky-50",
        iconClassName:
          "bg-sky-500/12 text-sky-700 dark:bg-sky-300/14 dark:text-sky-100",
      };
    }

    if (showOnline) {
      return {
        label: "Online",
        detail: "Connection is back.",
        icon: CheckCircle2,
        className:
          "border-emerald-300/75 bg-emerald-50/95 text-emerald-950 shadow-[0_18px_38px_rgba(16,185,129,0.16)] dark:border-emerald-400/40 dark:bg-[linear-gradient(135deg,rgba(6,78,59,0.97),rgba(2,44,34,0.96))] dark:text-emerald-50",
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
      className={`pointer-events-none fixed bottom-4 right-4 z-[90] transition-all duration-300 ease-out motion-reduce:transition-none ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      <div
        className={`pointer-events-auto inline-flex max-w-[min(92vw,360px)] items-center gap-3 rounded-2xl border px-3.5 py-3 backdrop-blur-xl transition-[background-color,border-color,color,box-shadow] duration-300 ease-out motion-reduce:transition-none ${renderedStatus.className}`}
        role="status"
        aria-live="polite"
      >
        <span
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${renderedStatus.iconClassName}`}
        >
          <StatusIcon
            className={`h-4 w-4 ${
              renderedStatus.label === "Reconnecting" ? "animate-spin" : ""
            }`}
          />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold">{renderedStatus.label}</div>
          <div className="text-xs opacity-85">{renderedStatus.detail}</div>
        </div>
      </div>
    </div>
  );
}
