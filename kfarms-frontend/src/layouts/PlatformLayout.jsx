import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { ToastProvider, useToast } from "../components/ToastProvider";
import CommandPalette from "../components/CommandPalette";
import { usePlatformAuth } from "../auth/AuthProvider";
import { useTheme } from "../hooks/useTheme";

const PAGE_TITLES = {
  "/platform": "Overview",
  "/platform/tenants": "Tenants",
  "/platform/users": "Users",
  "/platform/health": "Health",
  "/platform/settings": "Settings",
};

const COMMAND_NAV_ITEMS = [
  { to: "/platform", label: "Overview" },
  { to: "/platform/tenants", label: "Tenants" },
  { to: "/platform/users", label: "Users" },
  { to: "/platform/health", label: "Health" },
  { to: "/platform/settings", label: "Settings" },
];

const PLATFORM_SIDEBAR_PREF_KEY = "kf_platform_sidebar_collapsed";

function resolveTitle(pathname) {
  return PAGE_TITLES[pathname] || "Platform";
}

function PlatformShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = usePlatformAuth();
  const { notify } = useToast();
  const { theme, toggleTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(PLATFORM_SIDEBAR_PREF_KEY) === "1";
  });

  const handleLogout = React.useCallback(() => {
    logout();
    notify("Logged out", "info");
    navigate("/platform/login", { replace: true });
  }, [logout, navigate, notify]);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    window.localStorage.setItem(PLATFORM_SIDEBAR_PREF_KEY, sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  const toggleSidebarCollapsed = React.useCallback(() => {
    setSidebarCollapsed((current) => !current);
  }, []);

  React.useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const commandActions = React.useMemo(() => {
    const navActions = COMMAND_NAV_ITEMS.map((item) => ({
      id: `nav-${item.to}`,
      label: `Go to ${item.label}`,
      hint: item.to,
      onSelect: () => navigate(item.to),
    }));

    return [
      ...navActions,
      {
        id: "action-logout",
        label: "Logout",
        hint: "End session",
        onSelect: handleLogout,
      },
    ];
  }, [handleLogout, navigate]);

  return (
    <div className="atlas-theme atlas-root-network min-h-screen px-2 py-2 md:px-4 md:py-4">
      <div className="atlas-neon-frame flex min-h-[calc(100vh-1rem)] overflow-hidden rounded-2xl md:min-h-[calc(100vh-2rem)]">
        <div className="pointer-events-none absolute -left-16 top-8 h-52 w-52 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-10 top-16 h-56 w-56 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-8 right-1/3 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />

        <Sidebar
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
        />

        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <Topbar
            title={resolveTitle(location.pathname)}
            onOpenMenu={() => setMobileOpen(true)}
            onOpenCommandPalette={() => setCommandOpen(true)}
            theme={theme}
            onToggleTheme={toggleTheme}
          />

          <main className="flex-1 px-4 py-5 md:px-6 md:py-6">
            <Outlet />
          </main>
        </div>
      </div>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} actions={commandActions} />
    </div>
  );
}

export default function PlatformLayout() {
  return (
    <ToastProvider>
      <PlatformShell />
    </ToastProvider>
  );
}
