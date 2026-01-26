import React from "react";

export default function BackendRecoveryPrompt() {
  const [wasDown, setWasDown] = React.useState(false);
  const [showPrompt, setShowPrompt] = React.useState(false);

  React.useEffect(() => {
    const handleDown = () => {
      setWasDown(true);
      setShowPrompt(false);
    };
    const handleUp = () => {
      if (wasDown) {
        setShowPrompt(true);
        setWasDown(false);
      }
    };

    window.addEventListener("kf-backend-down", handleDown);
    window.addEventListener("kf-backend-up", handleUp);
    return () => {
      window.removeEventListener("kf-backend-down", handleDown);
      window.removeEventListener("kf-backend-up", handleUp);
    };
  }, [wasDown]);

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-md">
      <div className="glass rounded-lg px-4 py-3 shadow-neo dark:shadow-dark text-lightText dark:text-darkText">
        <div className="text-sm font-semibold font-header">Connection restored</div>
        <div className="mt-1 text-xs text-lightText/70 dark:text-darkText/70">
          We can reach the server again. Refresh to load the latest data.
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            className="rounded-md bg-accent-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            onClick={() => window.location.reload()}
          >
            Reload data
          </button>
          <button
            type="button"
            className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-lightText dark:text-darkText hover:bg-white/10"
            onClick={() => setShowPrompt(false)}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
