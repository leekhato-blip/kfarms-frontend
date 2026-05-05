const root = document.documentElement;
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeLabel = document.querySelector("[data-theme-label]");
const storageKey = "alh-isah-kato-theme";

function setTheme(theme) {
  root.dataset.theme = theme;

  try {
    localStorage.setItem(storageKey, theme);
  } catch (error) {
    // Ignore storage failures and keep the in-memory theme.
  }

  const isDark = theme === "dark";

  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("title", isDark ? "Switch to light mode" : "Switch to dark mode");
  }

  if (themeLabel) {
    themeLabel.textContent = isDark ? "Switch to light mode" : "Switch to dark mode";
  }
}

setTheme(root.dataset.theme || "light");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  });
}

const currentYear = document.querySelector("[data-current-year]");

if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}
