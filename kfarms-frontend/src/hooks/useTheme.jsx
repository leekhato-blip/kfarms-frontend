import React from "react";
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
