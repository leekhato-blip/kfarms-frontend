import React from "react";
import { createPortal } from "react-dom";

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

const LOADER_VARIANTS = {
  farm: {
    brand: "KFarms",
    eyebrow: "Farm workspace",
    darkBackground:
      "radial-gradient(900px 520px at 18% 10%, rgba(16, 185, 129, 0.14), transparent 58%), radial-gradient(880px 520px at 82% 12%, rgba(14, 165, 233, 0.16), transparent 55%), #020617",
    lightBackground:
      "radial-gradient(820px 460px at 18% 10%, rgba(16, 185, 129, 0.12), transparent 56%), radial-gradient(760px 420px at 82% 12%, rgba(14, 165, 233, 0.12), transparent 54%), #f8fafc",
    darkGlow: "linear-gradient(135deg, rgba(16, 185, 129, 0.34), rgba(14, 165, 233, 0.22))",
    lightGlow: "linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(14, 165, 233, 0.18))",
    darkRail: "rgba(148, 163, 184, 0.2)",
    lightRail: "rgba(148, 163, 184, 0.22)",
    darkTrackBorder: "rgba(148, 163, 184, 0.18)",
    lightTrackBorder: "rgba(148, 163, 184, 0.22)",
    darkSegment: "linear-gradient(90deg, #34d399 0%, #22c55e 45%, #38bdf8 100%)",
    lightSegment: "linear-gradient(90deg, #10b981 0%, #22c55e 45%, #0ea5e9 100%)",
  },
  platform: {
    brand: "ROOTS",
    eyebrow: "Network control room",
    darkBackground:
      "radial-gradient(920px 520px at 18% 10%, rgba(124, 58, 237, 0.16), transparent 58%), radial-gradient(840px 500px at 82% 12%, rgba(37, 99, 235, 0.15), transparent 56%), #010208",
    lightBackground:
      "radial-gradient(840px 460px at 18% 10%, rgba(124, 58, 237, 0.12), transparent 56%), radial-gradient(760px 420px at 82% 12%, rgba(37, 99, 235, 0.12), transparent 54%), #f8fafc",
    darkGlow: "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.24))",
    lightGlow: "linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(59, 130, 246, 0.16))",
    darkRail: "rgba(148, 163, 184, 0.18)",
    lightRail: "rgba(148, 163, 184, 0.2)",
    darkTrackBorder: "rgba(148, 163, 184, 0.16)",
    lightTrackBorder: "rgba(148, 163, 184, 0.2)",
    darkSegment: "linear-gradient(90deg, #8b5cf6 0%, #6366f1 48%, #3b82f6 100%)",
    lightSegment: "linear-gradient(90deg, #7c3aed 0%, #4f46e5 48%, #2563eb 100%)",
  },
};

export default function BrandedLoader({
  label,
  logoSrc,
  logoAlt,
  variant = "farm",
  portal = true,
  lockBody = true,
}) {
  const [theme, setTheme] = React.useState(getPreferredTheme);
  const palette = LOADER_VARIANTS[variant] || LOADER_VARIANTS.farm;
  const isDark = theme === "dark";

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

  React.useEffect(() => {
    if (!lockBody || typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [lockBody]);

  const content = (
    <div
      className={`${isDark ? "dark " : ""}fixed inset-0 z-[9990] overflow-hidden`}
      role="status"
      aria-live="polite"
    >
      <div
        className="flex h-full min-h-screen w-full items-center justify-center px-6 text-center"
        style={{
          colorScheme: isDark ? "dark" : "light",
          background: isDark ? palette.darkBackground : palette.lightBackground,
        }}
      >
        <style>{`
          @keyframes branded-loader-breathe {
            0%, 100% { opacity: 0.72; transform: scale(0.96); }
            50% { opacity: 1; transform: scale(1); }
          }
          @keyframes branded-loader-slide {
            0% { transform: translateX(-130%); }
            100% { transform: translateX(330%); }
          }
        `}</style>

        <div className="relative flex w-full max-w-sm flex-col items-center">
          <div
            className="pointer-events-none absolute inset-x-12 top-1 h-32 rounded-full blur-3xl"
            style={{
              background: isDark ? palette.darkGlow : palette.lightGlow,
              animation: "branded-loader-breathe 2.4s ease-in-out infinite",
            }}
          />

          {logoSrc ? (
            <img
              src={logoSrc}
              alt={logoAlt}
              className="relative z-10 h-16 w-auto object-contain sm:h-20"
            />
          ) : null}

          <div
            className="relative z-10 mt-6 text-[10px] font-semibold uppercase tracking-[0.34em]"
            style={{ color: isDark ? "rgba(148, 163, 184, 0.84)" : "rgba(71, 85, 105, 0.82)" }}
          >
            {palette.eyebrow}
          </div>

          <div
            className="relative z-10 mt-2 font-header text-[2rem] font-semibold tracking-[0.08em] sm:text-[2.35rem]"
            style={{ color: isDark ? "#f8fafc" : "#0f172a" }}
          >
            {palette.brand}
          </div>

          <div
            className="relative z-10 mt-3 max-w-xs text-sm leading-6"
            style={{ color: isDark ? "rgba(226, 232, 240, 0.72)" : "rgba(51, 65, 85, 0.78)" }}
          >
            {label}
          </div>

          <div
            className="relative z-10 mt-7 h-1.5 w-40 overflow-hidden rounded-full border"
            style={{
              background: isDark ? palette.darkRail : palette.lightRail,
              borderColor: isDark ? palette.darkTrackBorder : palette.lightTrackBorder,
            }}
          >
            <span
              className="absolute inset-y-0 left-0 w-16 rounded-full"
              style={{
                background: isDark ? palette.darkSegment : palette.lightSegment,
                animation: "branded-loader-slide 1.2s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined" || !portal) {
    return content;
  }

  return createPortal(content, document.body);
}
