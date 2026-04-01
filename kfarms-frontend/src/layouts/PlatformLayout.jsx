import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { ToastProvider, useToast } from "../components/ToastProvider";
import CommandPalette from "../components/CommandPalette";
import ConfirmDialog from "../components/ConfirmDialog";
import { usePlatformAuth } from "../auth/AuthProvider";
import { isPlatformDevToken } from "../auth/platformDevSession";
import { useTheme } from "../hooks/useTheme";
import PlatformAppModal from "../pages/platform/PlatformAppModal";
import { PLATFORM_ENDPOINTS } from "../api/endpoints";
import { platformAxios, unwrapApiResponse } from "../api/platformClient";
import {
  createStoredPlatformApp,
  readPlatformDataMode,
  readStoredPlatformApps,
  writePlatformDataMode,
  writeStoredPlatformApps,
} from "../pages/platform/platformWorkbench";
import { resolvePlatformAccessTier } from "../pages/platform/platformInsights";

const PAGE_TITLES = {
  "/platform": "Hub",
  "/platform/apps": "Apps",
  "/platform/messages": "Messages",
  "/platform/tenants": "Tenants",
  "/platform/users": "Users",
  "/platform/health": "Health",
  "/platform/settings": "Settings",
};

const COMMAND_NAV_ITEMS = [
  { to: "/platform", label: "Hub" },
  { to: "/platform/apps", label: "Apps" },
  { to: "/platform/messages", label: "Messages" },
  { to: "/platform/tenants", label: "Tenants" },
  { to: "/platform/users", label: "Users" },
  { to: "/platform/health", label: "Health" },
  { to: "/platform/settings", label: "Settings" },
];

const PLATFORM_SIDEBAR_PREF_KEY = "kf_platform_sidebar_collapsed";
const PLATFORM_MESSAGES_VIEWED_AT_KEY = "kf_platform_messages_viewed_at";

function normalizePlatformPathname(pathname = "") {
  const normalized = String(pathname || "").replace(/\/+$/, "");
  return normalized || "/";
}

function resolveTitle(pathname) {
  return PAGE_TITLES[normalizePlatformPathname(pathname)] || "Platform";
}

function canUseBrowserStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readViewedPlatformMessagesAt() {
  if (!canUseBrowserStorage()) return 0;
  const parsed = Number(window.localStorage.getItem(PLATFORM_MESSAGES_VIEWED_AT_KEY));
  return Number.isFinite(parsed) ? parsed : 0;
}

function writeViewedPlatformMessagesAt(timestamp = Date.now()) {
  if (!canUseBrowserStorage()) return;
  window.localStorage.setItem(PLATFORM_MESSAGES_VIEWED_AT_KEY, String(timestamp));
}

function normalizeSupportTicketItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

function getLastSupportTicketMessage(ticket) {
  const messages = Array.isArray(ticket?.messages) ? ticket.messages : [];
  return messages.length ? messages[messages.length - 1] : null;
}

function getInboundMessageTimestamp(ticket) {
  const lastMessage = getLastSupportTicketMessage(ticket);
  if (!lastMessage) return 0;
  const authorType = String(lastMessage.authorType || "").toUpperCase();
  if (authorType === "SUPPORT") return 0;
  const parsed = Date.parse(lastMessage.createdAt || ticket.updatedAt || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function PlatformShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, token, user } = usePlatformAuth();
  const { notify } = useToast();
  const { theme, toggleTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [appComposerOpen, setAppComposerOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(PLATFORM_SIDEBAR_PREF_KEY) === "1";
  });
  const [platformDataMode, setPlatformDataMode] = React.useState(() => readPlatformDataMode());
  const [customApps, setCustomApps] = React.useState(() => readStoredPlatformApps());
  const [messageMenuHasNew, setMessageMenuHasNew] = React.useState(false);
  const devPlatformSession = isPlatformDevToken(token);
  const currentAccessTier = React.useMemo(() => resolvePlatformAccessTier(user), [user]);
  const canManagePortfolio =
    currentAccessTier === "PLATFORM_OWNER" || currentAccessTier === "PLATFORM_ADMIN";
  const limitedLiveAccess = Boolean(user) && !canManagePortfolio;
  const effectivePlatformDataMode = canManagePortfolio ? platformDataMode : "live";
  const isMessagesRoute = location.pathname.startsWith("/platform/messages");
  const limitedLiveNoticeShownRef = React.useRef(false);
  const demoModeLockNoticeShownRef = React.useRef(false);

  const requestLogout = React.useCallback(() => {
    setMobileOpen(false);
    setCommandOpen(false);
    setAppComposerOpen(false);
    setLogoutDialogOpen(true);
  }, []);

  const handleLogout = React.useCallback(() => {
    setLogoutDialogOpen(false);
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

  React.useEffect(() => {
    writePlatformDataMode(platformDataMode);
  }, [platformDataMode]);

  React.useEffect(() => {
    if (!devPlatformSession || platformDataMode !== "live") return;

    setPlatformDataMode("demo");
    writePlatformDataMode("demo");

    if (demoModeLockNoticeShownRef.current) return;
    demoModeLockNoticeShownRef.current = true;
    notify(
      "Demo sessions stay in demo mode. Sign in with a real platform account to use live data.",
      "info",
    );
  }, [devPlatformSession, notify, platformDataMode]);

  React.useEffect(() => {
    if (!limitedLiveAccess || limitedLiveNoticeShownRef.current) return;
    limitedLiveNoticeShownRef.current = true;
    notify(
      "Live access is active for this ROOTS lane. Some admin-only sections may stay unavailable.",
      "info",
    );
  }, [limitedLiveAccess, notify]);

  React.useEffect(() => {
    writeStoredPlatformApps(customApps);
  }, [customApps]);

  React.useEffect(() => {
    if (!isMessagesRoute) return;
    writeViewedPlatformMessagesAt(Date.now());
    setMessageMenuHasNew(false);
  }, [isMessagesRoute]);

  React.useEffect(() => {
    if (effectivePlatformDataMode !== "live") {
      setMessageMenuHasNew(false);
      return undefined;
    }

    let cancelled = false;

    async function refreshMessageMenuState() {
      if (isMessagesRoute) {
        if (!cancelled) {
          setMessageMenuHasNew(false);
        }
        return;
      }

      try {
        const response = await platformAxios.get(PLATFORM_ENDPOINTS.supportTickets);
        const payload = unwrapApiResponse(response.data, "Failed to load platform messages");
        const tickets = normalizeSupportTicketItems(payload);
        const viewedAt = readViewedPlatformMessagesAt();
        const hasNew = tickets.some((ticket) => getInboundMessageTimestamp(ticket) > viewedAt);

        if (!cancelled) {
          setMessageMenuHasNew(hasNew);
        }
      } catch {
        if (!cancelled) {
          setMessageMenuHasNew(false);
        }
      }
    }

    refreshMessageMenuState();
    const intervalId = window.setInterval(refreshMessageMenuState, 45000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [effectivePlatformDataMode, isMessagesRoute]);

  const toggleSidebarCollapsed = React.useCallback(() => {
    setSidebarCollapsed((current) => !current);
  }, []);

  const openCreateApp = React.useCallback(() => {
    if (!canManagePortfolio) {
      notify("Only platform admins can stage a new planned app.", "info");
      return;
    }

    setCommandOpen(false);
    setAppComposerOpen(true);
  }, [canManagePortfolio, notify]);

  const closeCreateApp = React.useCallback(() => {
    setAppComposerOpen(false);
  }, []);

  const handleDataModeChange = React.useCallback((nextMode) => {
    if (devPlatformSession) {
      setPlatformDataMode("demo");
      writePlatformDataMode("demo");
      if (nextMode === "live") {
        notify(
          "Demo sessions stay in demo mode. Sign in with a real platform account to use live data.",
          "info",
        );
      }
      return;
    }

    if (!canManagePortfolio) {
      setPlatformDataMode("live");
      notify("Live access is active for this ROOTS lane.", "info");
      return;
    }

    setPlatformDataMode(nextMode === "demo" ? "demo" : "live");
  }, [canManagePortfolio, devPlatformSession, notify]);

  const createCustomApp = React.useCallback((draft) => {
    if (!canManagePortfolio) {
      throw new Error("Only platform admins can create planned app lanes.");
    }

    const createdApp = createStoredPlatformApp(
      {
        ...draft,
        lifecycle: "PLANNED",
      },
      customApps,
    );
    setCustomApps((current) => [...current, createdApp]);
    return createdApp;
  }, [canManagePortfolio, customApps]);

  const handleCreateCustomApp = React.useCallback((draft) => {
    try {
      const createdApp = createCustomApp(draft);
      setAppComposerOpen(false);
      notify(
        createdApp?.name
          ? `${createdApp.name} was added to the planned portfolio.`
          : "Planned app lane added.",
        "success",
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to add planned app.", "error");
    }
  }, [createCustomApp, notify]);

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
      ...(canManagePortfolio
        ? [
            {
              id: "action-create-planned-app",
              label: "Create planned app",
              hint: "Stage a new app lane",
              onSelect: openCreateApp,
            },
          ]
        : []),
      ...navActions,
      {
        id: "action-logout",
        label: "Logout",
        hint: "End session",
        onSelect: requestLogout,
      },
    ];
  }, [canManagePortfolio, navigate, openCreateApp, requestLogout]);

  return (
    <div className="atlas-theme atlas-root-network atlas-shell-grid h-[100dvh] min-h-[100dvh] overflow-hidden px-1.5 py-1.5 sm:px-2 sm:py-2 md:px-4 md:py-4">
      <div className="atlas-neon-frame flex h-full min-h-0 overflow-hidden rounded-[1.5rem] md:rounded-[2rem]">
        <div className="pointer-events-none absolute -left-20 top-6 h-72 w-72 rounded-full bg-blue-500/8 blur-[110px]" />
        <div className="pointer-events-none absolute right-4 top-10 h-80 w-80 rounded-full bg-blue-500/12 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-500/12 blur-[120px]" />
        <div className="pointer-events-none absolute inset-x-[12%] top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <Sidebar
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onLogout={requestLogout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          messageMenuHasNew={messageMenuHasNew}
          platformDataMode={effectivePlatformDataMode}
          customApps={customApps}
        />

        <div className="atlas-shell-main relative z-10 flex min-w-0 min-h-0 flex-1 flex-col">
          <Topbar
            title={resolveTitle(location.pathname)}
            onOpenMenu={() => setMobileOpen(true)}
            onOpenCommandPalette={() => setCommandOpen(true)}
            theme={theme}
            onToggleTheme={toggleTheme}
            onRequestLogout={requestLogout}
            dataMode={effectivePlatformDataMode}
            limitedLiveAccess={limitedLiveAccess}
            onChangeDataMode={handleDataModeChange}
            customApps={customApps}
            onOpenCreateApp={openCreateApp}
            messageMenuHasNew={messageMenuHasNew}
          />

          <main
            data-route-scroll
            className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6"
          >
            <Outlet
              context={{
                platformDataMode: effectivePlatformDataMode,
                platformLimitedAccess: limitedLiveAccess,
                setPlatformDataMode: handleDataModeChange,
                customApps,
                createCustomApp,
                openCreateApp,
              }}
            />
          </main>
        </div>
      </div>

      <PlatformAppModal
        open={appComposerOpen}
        onClose={closeCreateApp}
        onSubmit={handleCreateCustomApp}
      />
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} actions={commandActions} />
      <ConfirmDialog
        open={logoutDialogOpen}
        title="Logout from platform"
        message="You are about to close the current platform admin session. Continue?"
        confirmLabel="Logout"
        cancelLabel="Stay signed in"
        onConfirm={handleLogout}
        onCancel={() => setLogoutDialogOpen(false)}
      />
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
