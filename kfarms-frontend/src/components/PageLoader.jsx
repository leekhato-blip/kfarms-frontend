import React from "react";

const THEME_KEY = "kf_theme";

function getPreferredTheme() {
  if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
    return "dark";
  }

  if (typeof window === "undefined") return "dark";

  const savedTheme = window.localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

export default function PageLoader({ label = "Opening your farm…" }) {
  const [theme, setTheme] = React.useState(getPreferredTheme);
  const isDark = theme === "dark";
  const fallbackBackground = isDark
    ? "radial-gradient(1200px 600px at 15% 0%, rgba(34, 197, 94, 0.12), transparent 60%), radial-gradient(900px 600px at 85% 20%, rgba(14, 116, 144, 0.18), transparent 55%), rgba(2, 6, 23, 0.92)"
    : "radial-gradient(920px 460px at 12% 0%, rgba(16, 185, 129, 0.12), transparent 58%), radial-gradient(760px 460px at 88% 18%, rgba(59, 130, 246, 0.12), transparent 54%), rgba(248, 250, 252, 0.94)";
  const cardSurface = isDark ? "rgba(15, 23, 42, 0.78)" : "rgba(255, 255, 255, 0.9)";
  const cardBorder = isDark ? "rgba(148, 163, 184, 0.22)" : "rgba(148, 163, 184, 0.22)";
  const cardShadow = isDark
    ? "0 22px 60px rgba(0, 0, 0, 0.35)"
    : "0 22px 56px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.82)";

  React.useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return undefined;

    const syncTheme = () => setTheme(getPreferredTheme());
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    const mediaQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;

    mediaQuery?.addEventListener?.("change", syncTheme);
    window.addEventListener("storage", syncTheme);

    return () => {
      observer.disconnect();
      mediaQuery?.removeEventListener?.("change", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  const fallback = {
    position: "fixed",
    inset: 0,
    zIndex: 9990,
    display: "grid",
    placeItems: "center",
    colorScheme: isDark ? "dark" : "light",
    background: fallbackBackground,
    backdropFilter: "blur(6px)",
  };
  const ring = {
    width: 24,
    height: 24,
    borderRadius: "50%",
    border: `3px solid ${isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(15, 23, 42, 0.18)"}`,
    borderTopColor: isDark ? "#ffffff" : "#0f172a",
    animation: "kf-spin 0.9s linear infinite",
  };

  return (
    <div className={isDark ? "dark" : undefined}>
      <div className="page-loader" style={fallback} role="status" aria-live="polite">
        <style>{`
          @keyframes kf-spin { to { transform: rotate(360deg); } }
        `}</style>
        <div
          className="page-loader-card"
          style={{
            background: cardSurface,
            borderColor: cardBorder,
            boxShadow: cardShadow,
          }}
        >
          <div className="page-loader-mark">
            <span className="page-loader-ring" style={ring} />
            <span className="page-loader-core" />
          </div>
          <div className="page-loader-text">
            <div className="page-loader-title">KFarms</div>
            <div className="page-loader-subtitle">{label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
