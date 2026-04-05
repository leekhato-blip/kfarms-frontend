import React from "react";
<<<<<<< HEAD
import {
  PLATFORM_THEME_STORAGE_KEY,
  SETTINGS_THEME_EVENT,
  THEME_STORAGE_KEY,
  THEME_SCOPES,
  applyThemePreference,
  cycleThemePreference,
  getStoredThemeMode,
  getStoredThemePreference,
  normalizeThemePreference,
  resolveThemeMode,
} from "../constants/settings";

function normalizeThemeKey(value) {
  return normalizeThemePreference(value).toLowerCase();
}

export function useTheme(scope = THEME_SCOPES.KFARMS) {
  const resolvedScope = React.useMemo(
    () =>
      String(scope || "")
        .trim()
        .toLowerCase() === THEME_SCOPES.PLATFORM
        ? THEME_SCOPES.PLATFORM
        : THEME_SCOPES.KFARMS,
    [scope],
  );
  const [theme, setThemeState] = React.useState(() => getStoredThemePreference(resolvedScope));
  const [themeMode, setThemeMode] = React.useState(() => getStoredThemeMode(resolvedScope));

  const setTheme = React.useCallback((nextValue) => {
    setThemeState((current) => {
      const resolvedValue =
        typeof nextValue === "function" ? nextValue(current) : nextValue;
      return normalizeThemeKey(resolvedValue);
    });
  }, []);

  React.useEffect(() => {
    setThemeMode(resolveThemeMode(theme));
    applyThemePreference(theme, resolvedScope);
  }, [resolvedScope, theme]);

  const toggleTheme = React.useCallback(() => {
    setThemeState((current) => cycleThemePreference(current));
  }, []);

  React.useEffect(() => {
    setThemeState(getStoredThemePreference(resolvedScope));
    setThemeMode(getStoredThemeMode(resolvedScope));
  }, [resolvedScope]);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncTheme = () => {
      setThemeState(getStoredThemePreference(resolvedScope));
      setThemeMode(getStoredThemeMode(resolvedScope));
    };

    const mediaQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;

    const handleThemeEvent = (event) => {
      const eventScope = event?.detail?.scope;
      if (eventScope && eventScope !== resolvedScope) {
        return;
      }
      syncTheme();
    };

    const handleStorage = (event) => {
      if (!event?.key) {
        syncTheme();
        return;
      }

      const isPlatformScope = resolvedScope === THEME_SCOPES.PLATFORM;
      const expectedKey = isPlatformScope
        ? PLATFORM_THEME_STORAGE_KEY
        : THEME_STORAGE_KEY;
      if (event.key === expectedKey) {
        syncTheme();
      }
    };

    window.addEventListener(SETTINGS_THEME_EVENT, handleThemeEvent);
    window.addEventListener("storage", handleStorage);
    mediaQuery?.addEventListener?.("change", syncTheme);

    return () => {
      window.removeEventListener(SETTINGS_THEME_EVENT, handleThemeEvent);
      window.removeEventListener("storage", handleStorage);
      mediaQuery?.removeEventListener?.("change", syncTheme);
    };
  }, [resolvedScope]);

  return {
    theme,
    themeMode,
    setTheme,
    toggleTheme,
    isDark: themeMode === "dark",
  };
}
=======

const THEME_KEY = "kf_theme";

function getInitialTheme() {
  if (typeof window === "undefined") return "dark";

  const savedTheme = window.localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  const prefersDark =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  return prefersDark ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = React.useState(getInitialTheme);

  React.useEffect(() => {
    if (typeof document === "undefined") return;

    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.body.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = React.useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === "dark",
  };
}

>>>>>>> 0babf4d (Update frontend application)
