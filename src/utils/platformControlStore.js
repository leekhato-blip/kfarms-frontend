import {
  PLATFORM_CONTROL_SETTINGS_CHANGED_EVENT,
  PLATFORM_CONTROL_SETTINGS_KEY,
} from "../constants/platformControlSettings";

export function getPlatformControlSettingsSnapshot() {
  if (typeof window === "undefined") return "";

  return window.localStorage.getItem(PLATFORM_CONTROL_SETTINGS_KEY) || "";
}

export function readPlatformControlSettingsFromSnapshot(snapshot = "") {
  try {
    return snapshot ? JSON.parse(snapshot) : {};
  } catch {
    return {};
  }
}

export function readPlatformControlSettings() {
  return readPlatformControlSettingsFromSnapshot(
    getPlatformControlSettingsSnapshot(),
  );
}

export function writePlatformControlSettings(value) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    PLATFORM_CONTROL_SETTINGS_KEY,
    JSON.stringify(value),
  );
  window.dispatchEvent(new Event(PLATFORM_CONTROL_SETTINGS_CHANGED_EVENT));
}

export function subscribePlatformControlSettings(listener) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event) => {
    if (!event.key || event.key === PLATFORM_CONTROL_SETTINGS_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(
    PLATFORM_CONTROL_SETTINGS_CHANGED_EVENT,
    listener,
  );

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(
      PLATFORM_CONTROL_SETTINGS_CHANGED_EVENT,
      listener,
    );
  };
}
