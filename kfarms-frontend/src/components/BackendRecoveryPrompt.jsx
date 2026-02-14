import React from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

export default function BackendRecoveryPrompt() {
  const [backendDown, setBackendDown] = React.useState(false);
  const [showRecovered, setShowRecovered] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const hideRecoveredTimerRef = React.useRef(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const clearRecoveredTimer = () => {
      if (!hideRecoveredTimerRef.current) return;
      clearTimeout(hideRecoveredTimerRef.current);
      hideRecoveredTimerRef.current = null;
    };

    const handleDown = () => {
      clearRecoveredTimer();
      setShowRecovered(false);
      setBackendDown(true);
      setDismissed(false);
    };

    const handleUp = () => {
      clearRecoveredTimer();
      setBackendDown(false);
      setShowRecovered(true);
      setDismissed(false);
      hideRecoveredTimerRef.current = setTimeout(() => {
        setShowRecovered(false);
      }, 6000);
    };

    const handleBrowserOffline = () => handleDown();

    window.addEventListener("kf-backend-down", handleDown);
    window.addEventListener("kf-backend-up", handleUp);
    window.addEventListener("offline", handleBrowserOffline);

    if (!window.navigator.onLine) {
      handleDown();
    }

    return () => {
      clearRecoveredTimer();
      window.removeEventListener("kf-backend-down", handleDown);
      window.removeEventListener("kf-backend-up", handleUp);
      window.removeEventListener("offline", handleBrowserOffline);
    };
  }, []);

  if ((!backendDown && !showRecovered) || dismissed) return null;

  return (
    <div className="fixed inset-x-4 top-4 z-[12000] mx-auto max-w-md">
      <div
        className={`rounded-2xl border px-4 py-3 shadow-neo dark:shadow-dark ${
          backendDown
            ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/50 dark:bg-amber-950 dark:text-amber-100"
            : "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-950 dark:text-emerald-100"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full ${
              backendDown
                ? "bg-amber-200 text-amber-700 dark:bg-amber-700/30 dark:text-amber-200"
                : "bg-emerald-200 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-200"
            }`}
          >
            {backendDown ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold font-header">
              {backendDown ? "Can’t reach server" : "Connection restored"}
            </div>
            <div className="mt-1 text-xs leading-relaxed opacity-90">
              {backendDown
                ? "We’re having trouble connecting right now. Check your internet or backend service."
                : "You’re back online. Data should refresh automatically."}
            </div>
            {backendDown && (
              <div className="mt-3">
                <button
                  type="button"
                  className="rounded-md border border-current/30 bg-transparent px-3 py-1.5 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label="Dismiss message"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
