import React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { formatThemePreferenceLabel } from "../constants/settings";

export default function AuthThemeSwitcher() {
  const { theme, themeMode, toggleTheme } = useTheme();
  const isDark = themeMode === "dark";
  const themeLabel = formatThemePreferenceLabel(theme);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="absolute right-3 top-3 z-20 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20 sm:right-4 sm:top-4"
      aria-label={`Theme: ${themeLabel}. Click to cycle theme.`}
      title={`Theme: ${themeLabel}`}
    >
      {theme === "system" ? (
        <Monitor className="h-4 w-4" />
      ) : isDark ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span>{themeLabel}</span>
    </button>
  );
}
