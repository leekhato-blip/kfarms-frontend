import React from "react";
import { createPortal } from "react-dom";
import rootsLogo from "../assets/roots-logo-trimmed.png";

const THEME_KEY = "kf_theme";

function getPreferredTheme() {
  if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
    return "dark";
  }

  if (typeof window === "undefined") return "light";

  const savedTheme = window.localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

const PALETTES = {
  light: {
    background:
      "radial-gradient(640px 280px at 50% 18%, rgba(59, 130, 246, 0.1), transparent 62%), linear-gradient(180deg, #f4f7fd 0%, #f8fbff 56%, #ffffff 100%)",
    surface: "rgba(255, 255, 255, 0.74)",
    surfaceBorder: "rgba(148, 163, 184, 0.2)",
    frame: "rgba(255, 255, 255, 0.72)",
    frameBorder: "rgba(148, 163, 184, 0.18)",
    overline: "rgba(79, 70, 229, 0.72)",
    title: "#0f172a",
    text: "rgba(71, 85, 105, 0.82)",
    line: "rgba(203, 213, 225, 0.8)",
    signal: "linear-gradient(90deg, #4f46e5 0%, #2563eb 60%, #06b6d4 100%)",
  },
  dark: {
    background:
      "radial-gradient(640px 280px at 50% 18%, rgba(96, 165, 250, 0.12), transparent 62%), linear-gradient(180deg, #040813 0%, #07111d 56%, #0b1625 100%)",
    surface: "rgba(8, 15, 29, 0.72)",
    surfaceBorder: "rgba(100, 116, 139, 0.2)",
    frame: "rgba(15, 23, 42, 0.72)",
    frameBorder: "rgba(100, 116, 139, 0.18)",
    overline: "rgba(147, 197, 253, 0.76)",
    title: "#f8fafc",
    text: "rgba(203, 213, 225, 0.8)",
    line: "rgba(30, 41, 59, 0.9)",
    signal: "linear-gradient(90deg, #818cf8 0%, #60a5fa 60%, #22d3ee 100%)",
  },
};

export default function PlatformLoader({
  label = "Loading ROOTS platform...",
  portal = true,
  lockBody = true,
}) {
  const [theme, setTheme] = React.useState(getPreferredTheme);
  const isDark = theme === "dark";
  const palette = isDark ? PALETTES.dark : PALETTES.light;

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
        className="flex min-h-screen items-center justify-center px-6 py-10"
        style={{
          background: palette.background,
          colorScheme: isDark ? "dark" : "light",
        }}
      >
        <style>{`
          @keyframes platform-loader-signal {
            0% { transform: translateX(-120%); }
            100% { transform: translateX(285%); }
          }
        `}</style>

        <div className="w-full max-w-[18rem]">
          <div
            className="rounded-[1.75rem] border px-8 py-8 text-center backdrop-blur-xl"
            style={{
              background: palette.surface,
              borderColor: palette.surfaceBorder,
              boxShadow: isDark
                ? "0 18px 50px rgba(2, 6, 23, 0.35)"
                : "0 18px 48px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div
              className="mx-auto mb-5 h-[2px] w-12 rounded-full"
              style={{ background: palette.overline }}
            />

            <div
              className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.5rem] border"
              style={{
                borderColor: palette.frameBorder,
                background: palette.frame,
              }}
            >
              <img
                src={rootsLogo}
                alt="ROOTS"
                className="h-10 w-auto object-contain"
              />
            </div>

            <div
              className="mt-5 font-header text-[1.45rem] font-semibold tracking-[0.18em] sm:text-[1.65rem]"
              style={{ color: palette.title }}
            >
              ROOTS
            </div>

            <p
              className="mx-auto mt-2 max-w-[14rem] text-sm leading-6"
              style={{ color: palette.text }}
            >
              {label}
            </p>

            <div
              className="mx-auto mt-6 h-1 w-24 overflow-hidden rounded-full"
              style={{ background: palette.line }}
            >
              <span
                className="block h-full w-10 rounded-full"
                style={{
                  background: palette.signal,
                  animation: "platform-loader-signal 1.35s ease-in-out infinite",
                }}
              />
            </div>
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
