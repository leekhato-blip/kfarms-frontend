import React from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Bell,
  Blocks,
  Building2,
  CheckCheck,
  ChevronRight,
  Command,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  MessageSquareText,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Sun,
  UserCircle2,
  Users,
} from "lucide-react";
import Button from "../components/Button";
import Card from "../components/Card";
import Badge from "../components/Badge";
import useSmartBackNavigation from "../hooks/useSmartBackNavigation";
import { usePlatformAuth } from "../auth/AuthProvider";
import { cleanQueryParams, PLATFORM_ENDPOINTS } from "../api/endpoints";
import {
  getApiErrorMessage,
  platformAxios,
  unwrapApiResponse,
} from "../api/platformClient";
import { normalizePagination } from "../utils/formatters";
import { normalizeAppPortfolio } from "../pages/platform/appHub";
import {
  buildPlatformDemoSnapshot,
  buildPlatformLiveSnapshot,
  mergeLivePlatformPortfolio,
} from "../pages/platform/platformWorkbench";
import { resolvePlatformAccessTier } from "../pages/platform/platformInsights";
import {
  buildPlatformNotifications,
  buildPlatformSearchResults,
  filterUnreadPlatformNotifications,
  formatPlatformNotificationAge,
  markPlatformNotificationsRead,
  readPlatformNotificationReadIds,
  writePlatformNotificationReadIds,
} from "./platformTopbarUtils";
import { getUserDisplayName } from "../services/userProfileService";

const COMPACT_NAV_ITEMS = [
  { to: "/platform", label: "Hub", icon: LayoutDashboard, end: true },
  { to: "/platform/apps", label: "Apps", icon: Blocks },
  { to: "/platform/messages", label: "Messages", icon: MessageSquareText },
  { to: "/platform/tenants", label: "Tenants", icon: Building2 },
  { to: "/platform/users", label: "Users", icon: Users },
  { to: "/platform/health", label: "Health", icon: Activity },
  { to: "/platform/settings", label: "Settings", icon: Settings },
];

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

function normalizePlatformPathname(pathname = "") {
  const normalized = String(pathname || "").replace(/\/+$/, "");
  return normalized || "/";
}

function isCompactNavItemActive(pathname, item) {
  const currentPath = normalizePlatformPathname(pathname);
  const targetPath = normalizePlatformPathname(item?.to);

  if (!targetPath) return false;
  if (item?.end) return currentPath === targetPath;
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

function quickActionToneClasses(tone) {
  if (tone === "blue") {
    return "border-blue-300/35 bg-blue-50/80 text-blue-700 dark:border-blue-400/25 dark:bg-blue-500/10 dark:text-blue-100";
  }
  if (tone === "green") {
    return "border-emerald-300/35 bg-emerald-50/80 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-100";
  }
  return "border-violet-300/35 bg-violet-50/85 text-violet-700 dark:border-violet-400/25 dark:bg-violet-500/10 dark:text-violet-100";
}

function searchKindClasses(kind) {
  if (kind === "App") {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/40 dark:bg-blue-500/10 dark:text-blue-200";
  }
  if (kind === "Tenant") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-200";
  }
  if (kind === "User") {
    return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-400/40 dark:bg-fuchsia-500/10 dark:text-fuchsia-200";
  }
  return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/40 dark:bg-violet-500/10 dark:text-violet-200";
}

function notificationLevelClasses(level) {
  if (level === "critical") {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200";
  }
  if (level === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200";
  }
  return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/40 dark:bg-blue-500/10 dark:text-blue-200";
}

function formatNotificationLevelLabel(level) {
  const normalized = String(level || "info").trim().toLowerCase();
  return normalized ? `${normalized.slice(0, 1).toUpperCase()}${normalized.slice(1)}` : "Info";
}

function getPlatformNotificationVisual(notification) {
  const category = String(notification?.category || "").trim().toLowerCase();
  const level = String(notification?.level || "info").trim().toLowerCase();

  if (category.includes("tenant") || category.includes("workspace")) {
    return {
      icon: Building2,
      iconClass:
        "border-emerald-300/35 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-100",
      railClass: "from-emerald-400/70 via-emerald-400/18 to-transparent",
    };
  }

  if (category.includes("portfolio") || category.includes("app")) {
    return {
      icon: Blocks,
      iconClass:
        "border-blue-300/35 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-100",
      railClass: "from-blue-400/70 via-blue-400/18 to-transparent",
    };
  }

  if (category.includes("user") || category.includes("access") || category.includes("team")) {
    return {
      icon: Users,
      iconClass:
        "border-violet-300/35 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-100",
      railClass: "from-violet-400/70 via-violet-400/18 to-transparent",
    };
  }

  if (level === "critical") {
    return {
      icon: Activity,
      iconClass:
        "border-rose-300/35 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-100",
      railClass: "from-rose-400/70 via-rose-400/18 to-transparent",
    };
  }

  if (level === "warning") {
    return {
      icon: Activity,
      iconClass:
        "border-amber-300/35 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100",
      railClass: "from-amber-400/70 via-amber-400/18 to-transparent",
    };
  }

  return {
    icon: Bell,
    iconClass:
      "border-slate-300/35 bg-white/80 text-slate-700 dark:border-slate-400/20 dark:bg-white/5 dark:text-slate-100",
    railClass: "from-slate-400/65 via-slate-300/12 to-transparent",
  };
}

function isPortfolioAdmin(accessTier) {
  return accessTier === "PLATFORM_OWNER" || accessTier === "PLATFORM_ADMIN";
}

async function loadLiveSearchResults(query, customApps = []) {
  const [appsResponse, tenantsResponse, usersResponse] = await Promise.all([
    platformAxios.get(PLATFORM_ENDPOINTS.apps),
    platformAxios.get(PLATFORM_ENDPOINTS.tenants, {
      params: cleanQueryParams({ search: query, page: 0, size: 8 }),
    }),
    platformAxios.get(PLATFORM_ENDPOINTS.users, {
      params: cleanQueryParams({ search: query, page: 0, size: 8, platformOnly: true }),
    }),
  ]);

  const appsPayload = unwrapApiResponse(appsResponse.data, "Failed to load app portfolio");
  const tenantsPayload = unwrapApiResponse(tenantsResponse.data, "Failed to load tenants");
  const usersPayload = unwrapApiResponse(usersResponse.data, "Failed to load platform users");

  const portfolio = mergeLivePlatformPortfolio(normalizeAppPortfolio(appsPayload), customApps);
  const tenants = normalizePagination(tenantsPayload, { page: 0, size: 8 }).items;
  const users = normalizePagination(usersPayload, { page: 0, size: 8 }).items;

  return buildPlatformSearchResults({
    query,
    apps: portfolio.apps,
    tenants,
    users,
    limit: 10,
  });
}

async function loadLiveNotifications(customApps = []) {
  const [overviewResponse, appsResponse, tenantsResponse, usersResponse] = await Promise.all([
    platformAxios.get(PLATFORM_ENDPOINTS.overview),
    platformAxios.get(PLATFORM_ENDPOINTS.apps),
    platformAxios.get(PLATFORM_ENDPOINTS.tenants, {
      params: cleanQueryParams({ page: 0, size: 12 }),
    }),
    platformAxios.get(PLATFORM_ENDPOINTS.users, {
      params: cleanQueryParams({ page: 0, size: 20, platformOnly: true }),
    }),
  ]);

  const overview = unwrapApiResponse(
    overviewResponse.data,
    "Failed to load platform overview",
  );
  const appsPayload = unwrapApiResponse(appsResponse.data, "Failed to load app portfolio");
  const tenantsPayload = unwrapApiResponse(tenantsResponse.data, "Failed to load tenants");
  const usersPayload = unwrapApiResponse(usersResponse.data, "Failed to load platform users");

  const portfolio = mergeLivePlatformPortfolio(normalizeAppPortfolio(appsPayload), customApps);
  const tenants = normalizePagination(tenantsPayload, { page: 0, size: 12 }).items;
  const users = normalizePagination(usersPayload, { page: 0, size: 20 }).items;

  return buildPlatformNotifications({
    overview,
    portfolio,
    tenants,
    users,
  });
}

export default function Topbar({
  title,
  onOpenMenu,
  onOpenCommandPalette,
  theme = "dark",
  onToggleTheme,
  onRequestLogout,
  dataMode = "live",
  limitedLiveAccess = false,
  onChangeDataMode,
  customApps = [],
  onOpenCreateApp,
  messageMenuHasNew = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, profileLoading } = usePlatformAuth();
  const [quickOpen, setQuickOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = React.useState(-1);
  const [notifications, setNotifications] = React.useState([]);
  const [notificationsLoading, setNotificationsLoading] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [notificationsError, setNotificationsError] = React.useState("");
  const [notificationReadIds, setNotificationReadIds] = React.useState(() =>
    readPlatformNotificationReadIds(),
  );
  const [profileOpen, setProfileOpen] = React.useState(false);
  const deferredSearchQuery = React.useDeferredValue(searchQuery.trim());
  const isDark = theme === "dark";
  const normalizedPathname = React.useMemo(
    () => normalizePlatformPathname(location.pathname),
    [location.pathname],
  );
  const accessTier = React.useMemo(
    () => resolvePlatformAccessTier(currentUser),
    [currentUser],
  );
  const canManagePortfolio = isPortfolioAdmin(accessTier);
  const rootRef = React.useRef(null);
  const searchRef = React.useRef(null);
  const searchPanelRef = React.useRef(null);
  const notificationRef = React.useRef(null);
  const notificationPanelRef = React.useRef(null);
  const profileRef = React.useRef(null);
  const profilePanelRef = React.useRef(null);
  const [searchPopoverStyle, setSearchPopoverStyle] = React.useState(null);
  const [notificationPopoverStyle, setNotificationPopoverStyle] = React.useState(null);
  const [profilePopoverStyle, setProfilePopoverStyle] = React.useState(null);
  const { goBack, showBackButton } = useSmartBackNavigation({
    fallbackPath: "/platform",
    hiddenPaths: ["/platform"],
  });

  const demoSnapshot = React.useMemo(
    () => buildPlatformDemoSnapshot(customApps),
    [customApps],
  );
  const liveSnapshot = React.useMemo(() => buildPlatformLiveSnapshot(), []);

  const closeInlinePanels = React.useCallback(() => {
    setSearchOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
  }, []);

  React.useEffect(() => {
    writePlatformNotificationReadIds(notificationReadIds);
  }, [notificationReadIds]);

  React.useEffect(() => {
    setQuickOpen(false);
    closeInlinePanels();
    setSearchQuery("");
  }, [closeInlinePanels, location.pathname]);

  const quickActionGroups = React.useMemo(() => {
    const provisionItems = [];

    if (canManagePortfolio) {
      provisionItems.push({
        id: "create-planned-app",
        title: "Create planned app",
        description: "Add the next product to ROOTS.",
        icon: Blocks,
        tone: "blue",
        onSelect: onOpenCreateApp,
      });
    }

    provisionItems.push({
      id: "create-tenant",
      title: "Create tenant",
      description: "Plant a new workspace and assign its first owner.",
      icon: Plus,
      tone: "purple",
      onSelect: () => navigate("/onboarding/create-tenant"),
    });

    return [
      {
        title: "Provision",
        items: provisionItems,
      },
      {
        title: "Navigate",
        items: [
          {
            id: "hub",
            title: "Open hub",
            description: "Return to the main platform overview.",
            icon: LayoutDashboard,
            tone: "purple",
            onSelect: () => navigate("/platform"),
          },
          {
            id: "apps",
            title: "Open apps",
            description: "Review live and planned apps.",
            icon: Blocks,
            tone: "blue",
            onSelect: () => navigate("/platform/apps"),
          },
          {
            id: "tenants",
            title: "Open tenants",
            description: "Inspect workspace status, plans, and team limits.",
            icon: Building2,
            tone: "green",
            onSelect: () => navigate("/platform/tenants"),
          },
          {
            id: "users",
            title: "Open users",
            description: "Manage operator access and admin coverage.",
            icon: Users,
            tone: "blue",
            onSelect: () => navigate("/platform/users"),
          },
        ],
      },
      {
        title: "Controls",
        items: [
          ...(canManagePortfolio
            ? [
                {
                  id: "data-mode",
                  title: dataMode === "demo" ? "Switch to live data" : "Switch to demo preview",
                  description: "Choose live backend data or restored demo data.",
                  icon: Sparkles,
                  tone: "purple",
                  onSelect: () => onChangeDataMode?.(dataMode === "demo" ? "live" : "demo"),
                },
              ]
            : []),
          {
            id: "health",
            title: "Open health",
            description: "See live health, risk, and capacity signals.",
            icon: Activity,
            tone: "green",
            onSelect: () => navigate("/platform/health"),
          },
          {
            id: "settings",
            title: "Open settings",
            description: "Review platform defaults and rules.",
            icon: Settings,
            tone: "purple",
            onSelect: () => navigate("/platform/settings"),
          },
          {
            id: "theme",
            title: isDark ? "Switch to light mode" : "Switch to dark mode",
            description: "Update the current platform appearance.",
            icon: isDark ? Sun : Moon,
            tone: "blue",
            onSelect: onToggleTheme,
          },
          {
            id: "command-palette",
            title: "Open command palette",
            description: "Jump anywhere with keyboard-first commands.",
            icon: Command,
            tone: "blue",
            onSelect: onOpenCommandPalette,
          },
          {
            id: "logout",
            title: "Logout",
            description: "End the current admin session safely.",
            icon: LogOut,
            tone: "green",
            onSelect: onRequestLogout,
          },
        ],
      },
    ].filter((group) => group.items.length > 0);
  }, [
    canManagePortfolio,
    dataMode,
    isDark,
    navigate,
    onChangeDataMode,
    onOpenCommandPalette,
    onOpenCreateApp,
    onRequestLogout,
    onToggleTheme,
  ]);

  const loadNotifications = React.useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationsError("");

    try {
      let nextNotifications = [];

      if (dataMode === "demo") {
        nextNotifications = buildPlatformNotifications({
          overview: demoSnapshot.metrics,
          portfolio: demoSnapshot.portfolio,
          tenants: demoSnapshot.tenants,
          users: demoSnapshot.users,
        });
      } else {
        nextNotifications = await loadLiveNotifications(customApps);
      }

      setNotifications(nextNotifications);
    } catch (error) {
      setNotificationsError(
        limitedLiveAccess ? "" : getApiErrorMessage(error, "Unable to load notifications"),
      );
      setNotifications(
        buildPlatformNotifications({
          overview: liveSnapshot.metrics,
          portfolio: liveSnapshot.portfolio,
          tenants: liveSnapshot.tenants,
          users: liveSnapshot.users,
        }),
      );
    } finally {
      setNotificationsLoading(false);
    }
  }, [customApps, dataMode, demoSnapshot, limitedLiveAccess, liveSnapshot]);

  React.useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  React.useEffect(() => {
    let cancelled = false;

    if (deferredSearchQuery.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setActiveSearchIndex(-1);
      return undefined;
    }

    setSearchLoading(true);

    async function loadResults() {
      try {
        let nextResults = [];

        if (dataMode === "demo") {
          nextResults = buildPlatformSearchResults({
            query: deferredSearchQuery,
            apps: demoSnapshot.portfolio.apps,
            tenants: demoSnapshot.tenants,
            users: demoSnapshot.users,
            limit: 10,
          });
        } else {
          nextResults = await loadLiveSearchResults(deferredSearchQuery, customApps);
        }

        if (cancelled) return;

        setSearchResults(nextResults);
        setActiveSearchIndex(nextResults.length > 0 ? 0 : -1);
      } catch {
        if (cancelled) return;

        const nextResults = buildPlatformSearchResults({
          query: deferredSearchQuery,
          apps: liveSnapshot.portfolio.apps,
          tenants: liveSnapshot.tenants,
          users: liveSnapshot.users,
          limit: 10,
        });

        setSearchResults(nextResults);
        setActiveSearchIndex(nextResults.length > 0 ? 0 : -1);
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }

    loadResults();

    return () => {
      cancelled = true;
    };
  }, [customApps, dataMode, deferredSearchQuery, demoSnapshot, limitedLiveAccess, liveSnapshot]);

  React.useEffect(() => {
    if (!(searchOpen || notificationsOpen || profileOpen)) return undefined;

    const onPointerDown = (event) => {
      const target = event.target;
      const refs = [
        searchRef,
        searchPanelRef,
        notificationRef,
        notificationPanelRef,
        profileRef,
        profilePanelRef,
      ];
      const clickedInside = refs.some((ref) => ref.current && ref.current.contains(target));

      if (!clickedInside) {
        closeInlinePanels();
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeInlinePanels();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeInlinePanels, notificationsOpen, profileOpen, searchOpen]);

  React.useEffect(() => {
    if (!quickOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setQuickOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [quickOpen]);

  const measureSearchPopoverPosition = React.useCallback(() => {
    if (typeof window === "undefined") return null;

    const anchor = searchRef.current;
    const header = rootRef.current;
    if (!anchor || !header) return null;

    const rect = anchor.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const viewportPadding = 16;
    const gap = 12;
    const width = Math.min(rect.width, window.innerWidth - viewportPadding * 2);
    const left = Math.min(
      Math.max(viewportPadding, rect.left),
      window.innerWidth - width - viewportPadding,
    );
    const top = Math.max(rect.bottom, headerRect.bottom) + gap;

    return {
      left,
      top,
      width,
      maxHeight: Math.max(220, window.innerHeight - top - viewportPadding),
    };
  }, []);

  const measurePopoverPosition = React.useCallback((anchorRef, width) => {
    if (typeof window === "undefined") return null;

    const anchor = anchorRef.current;
    if (!anchor) return null;

    const rect = anchor.getBoundingClientRect();
    const viewportPadding = 16;
    const gap = 12;
    const left = Math.min(
      Math.max(viewportPadding, rect.right - width),
      window.innerWidth - width - viewportPadding,
    );
    const top = rect.bottom + gap;

    return {
      left,
      top,
      width,
      maxHeight: Math.max(220, window.innerHeight - top - viewportPadding),
    };
  }, []);

  React.useEffect(() => {
    if (!searchOpen) {
      setSearchPopoverStyle(null);
      return undefined;
    }

    const syncPopoverPosition = () => {
      setSearchPopoverStyle(measureSearchPopoverPosition());
    };

    syncPopoverPosition();
    window.addEventListener("resize", syncPopoverPosition);
    window.addEventListener("scroll", syncPopoverPosition, true);

    return () => {
      window.removeEventListener("resize", syncPopoverPosition);
      window.removeEventListener("scroll", syncPopoverPosition, true);
    };
  }, [measureSearchPopoverPosition, searchOpen]);

  React.useEffect(() => {
    if (!(notificationsOpen || profileOpen)) return undefined;

    const syncPopoverPositions = () => {
      if (notificationsOpen) {
        const notificationWidth =
          typeof window !== "undefined" && window.innerWidth < 640
            ? Math.min(332, window.innerWidth - 24)
            : 376;
        setNotificationPopoverStyle(measurePopoverPosition(notificationRef, notificationWidth));
      }

      if (profileOpen) {
        setProfilePopoverStyle(measurePopoverPosition(profileRef, 320));
      }
    };

    syncPopoverPositions();
    window.addEventListener("resize", syncPopoverPositions);
    window.addEventListener("scroll", syncPopoverPositions, true);

    return () => {
      window.removeEventListener("resize", syncPopoverPositions);
      window.removeEventListener("scroll", syncPopoverPositions, true);
    };
  }, [measurePopoverPosition, notificationsOpen, profileOpen]);

  const unreadNotifications = React.useMemo(
    () => filterUnreadPlatformNotifications(notifications, notificationReadIds),
    [notificationReadIds, notifications],
  );

  const markNotificationsRead = React.useCallback((idsToMark) => {
    setNotificationReadIds((current) => {
      const next = markPlatformNotificationsRead(current, idsToMark);
      writePlatformNotificationReadIds(next);
      return next;
    });
  }, []);

  const openSearchResult = React.useCallback(
    (result) => {
      if (!result?.target) return;
      setSearchQuery("");
      closeInlinePanels();
      navigate(result.target);
    },
    [closeInlinePanels, navigate],
  );

  const handleSearchKeyDown = React.useCallback(
    (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSearchOpen(true);
        setActiveSearchIndex((current) => {
          if (searchResults.length === 0) return -1;
          if (current < 0) return 0;
          return (current + 1) % searchResults.length;
        });
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSearchOpen(true);
        setActiveSearchIndex((current) => {
          if (searchResults.length === 0) return -1;
          if (current < 0) return searchResults.length - 1;
          return (current - 1 + searchResults.length) % searchResults.length;
        });
        return;
      }

      if (event.key === "Enter") {
        if (deferredSearchQuery.length < 2) return;

        const nextResult =
          searchResults[activeSearchIndex] || searchResults[0];

        if (nextResult) {
          event.preventDefault();
          openSearchResult(nextResult);
        }
        return;
      }

      if (event.key === "Escape") {
        closeInlinePanels();
      }
    },
    [
      activeSearchIndex,
      closeInlinePanels,
      deferredSearchQuery.length,
      openSearchResult,
      searchResults,
    ],
  );

  const toggleNotifications = React.useCallback(() => {
    setNotificationsOpen((current) => {
      const next = !current;
      if (next) {
        setProfileOpen(false);
        setSearchOpen(false);
      }
      return next;
    });
  }, []);

  const toggleProfile = React.useCallback(() => {
    setProfileOpen((current) => {
      const next = !current;
      if (next) {
        setNotificationsOpen(false);
        setSearchOpen(false);
      }
      return next;
    });
  }, []);

  const openQuickActions = React.useCallback(() => {
    closeInlinePanels();
    setQuickOpen(true);
  }, [closeInlinePanels]);

  const runQuickAction = React.useCallback((action) => {
    setQuickOpen(false);
    action?.onSelect?.();
  }, []);

  const handleCreateAppClick = React.useCallback(() => {
    if (canManagePortfolio && onOpenCreateApp) {
      onOpenCreateApp();
      return;
    }

    openQuickActions();
  }, [canManagePortfolio, onOpenCreateApp, openQuickActions]);

  const handleNotificationSelect = React.useCallback(
    (notification) => {
      markNotificationsRead([notification?.id]);
      closeInlinePanels();

      if (notification?.target) {
        navigate(notification.target);
      }
    },
    [closeInlinePanels, markNotificationsRead, navigate],
  );

  const currentLabel = getUserDisplayName(currentUser, "Platform");
  const currentEmail = currentUser?.email || "No account email";
  const dataModeLabel = dataMode === "demo" ? "Demo" : "Live";

  const searchPanel =
    searchOpen &&
    searchPopoverStyle &&
    typeof document !== "undefined"
      ? createPortal(
          <div
            ref={searchPanelRef}
            className="atlas-theme fixed z-[110]"
            style={{
              left: `${searchPopoverStyle.left}px`,
              top: `${searchPopoverStyle.top}px`,
              width: `${searchPopoverStyle.width}px`,
            }}
          >
            <Card className="w-full p-2 shadow-[0_24px_80px_rgba(15,23,42,0.32)]">
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 px-2 pb-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                    Platform Search
                  </div>
                  {searchLoading ? (
                    <LoaderCircle size={14} className="animate-spin text-[var(--atlas-muted)]" />
                  ) : null}
                </div>

                <div
                  className="overflow-y-auto"
                  style={{ maxHeight: `${Math.min(searchPopoverStyle.maxHeight, 480)}px` }}
                >
                  {deferredSearchQuery.length < 2 ? (
                    <div className="rounded-[1rem] border border-dashed border-[color:var(--atlas-border)] px-3 py-4 text-sm text-[var(--atlas-muted)]">
                      Search pages, apps, tenants, and platform users.
                    </div>
                  ) : searchLoading ? (
                    <div className="rounded-[1rem] border border-dashed border-[color:var(--atlas-border)] px-3 py-4 text-sm text-[var(--atlas-muted)]">
                      Searching platform...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="rounded-[1rem] border border-dashed border-[color:var(--atlas-border)] px-3 py-4 text-sm text-[var(--atlas-muted)]">
                      No platform matches found for <span className="font-semibold text-[var(--atlas-text-strong)]">{deferredSearchQuery}</span>.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {searchResults.map((result, index) => (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => openSearchResult(result)}
                          className={`flex w-full items-start justify-between gap-3 rounded-[1rem] px-3 py-3 text-left transition ${
                            index === activeSearchIndex
                              ? "bg-[color:var(--atlas-surface-hover)]"
                              : "hover:bg-[color:var(--atlas-surface-hover)]/80"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${searchKindClasses(result.kind)}`}
                              >
                                {result.kind}
                              </span>
                              <div className="truncate text-sm font-semibold text-[var(--atlas-text-strong)]">
                                {result.title}
                              </div>
                            </div>
                            <div className="mt-1 truncate text-xs text-[var(--atlas-muted)]">
                              {result.subtitle}
                            </div>
                          </div>
                          <ChevronRight size={14} className="mt-0.5 shrink-0 text-[var(--atlas-muted)]" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>,
          document.body,
        )
      : null;

  const notificationsPanel =
    notificationsOpen &&
    notificationPopoverStyle &&
    typeof document !== "undefined"
      ? createPortal(
          <div
            ref={notificationPanelRef}
            className="atlas-theme fixed z-[110]"
            style={{
              left: `${notificationPopoverStyle.left}px`,
              top: `${notificationPopoverStyle.top}px`,
              width: `${notificationPopoverStyle.width}px`,
            }}
          >
            <Card className="w-full overflow-hidden border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface)]/96 p-0 shadow-[0_28px_88px_rgba(15,23,42,0.28)] backdrop-blur-2xl">
              <div className="relative z-10">
                <div className="border-b border-[color:var(--atlas-border)]/85 px-3.5 py-3.5 sm:px-4 sm:py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-violet-300/30 bg-violet-500/12 text-violet-700 shadow-[0_14px_34px_rgba(124,58,237,0.12)] dark:border-violet-400/20 dark:bg-violet-500/12 dark:text-violet-100">
                        <Bell size={17} />
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                          Platform alerts
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--atlas-muted)]">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Live
                          </span>
                          <span>
                            {unreadNotifications.length > 0
                              ? `${unreadNotifications.length} unread platform alert${unreadNotifications.length === 1 ? "" : "s"}`
                              : "Everything is read for now."}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={loadNotifications}
                        className="atlas-icon-button rounded-xl p-2 text-[var(--atlas-text)] hover:bg-[color:var(--atlas-surface-hover)]"
                        aria-label="Refresh notifications"
                      >
                        <RefreshCw size={14} className={notificationsLoading ? "animate-spin" : ""} />
                      </button>
                      {unreadNotifications.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => markNotificationsRead(unreadNotifications.map((item) => item.id))}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 px-3 text-xs font-semibold text-[var(--atlas-text)] transition hover:bg-[color:var(--atlas-surface-hover)]"
                        >
                          <CheckCheck size={13} />
                          <span className="hidden sm:inline">Mark all</span>
                          <span className="sm:hidden">Clear</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                {notificationsError ? (
                  <div className="mx-3.5 mt-3 rounded-[1rem] border border-violet-300/40 bg-violet-50/70 px-3 py-2 text-xs text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200 sm:mx-4">
                    {notificationsError}
                  </div>
                ) : null}

                <div
                  className="mt-3 space-y-2.5 overflow-y-auto px-3.5 pb-3.5 pr-2 sm:px-4 sm:pb-4"
                  style={{
                    maxHeight: `${Math.min(
                      notificationPopoverStyle.maxHeight,
                      typeof window !== "undefined" && window.innerWidth < 640 ? 420 : 520,
                    )}px`,
                  }}
                >
                  {notificationsLoading && notifications.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-[1.1rem] border border-dashed border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/55 px-3.5 py-4 text-sm text-[var(--atlas-muted)]">
                      <LoaderCircle size={16} className="animate-spin" />
                      Loading platform alerts...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="rounded-[1.1rem] border border-dashed border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/55 px-3.5 py-5 text-center">
                      <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface)] text-[var(--atlas-text-strong)]">
                        <Bell size={16} />
                      </div>
                      <div className="mt-3 text-sm font-semibold text-[var(--atlas-text-strong)]">
                        All clear
                      </div>
                      <div className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">
                        No active platform alerts right now.
                      </div>
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const isUnread = unreadNotifications.some((item) => item.id === notification.id);
                      const visual = getPlatformNotificationVisual(notification);
                      const VisualIcon = visual.icon;

                      return (
                        <div
                          key={notification.id}
                          className={`relative overflow-hidden rounded-[1.15rem] border border-[color:var(--atlas-border)] p-3 transition sm:p-3.5 ${
                            isUnread
                              ? "bg-[color:var(--atlas-surface-soft)]/88 shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
                              : "bg-[color:var(--atlas-surface-soft)]/58"
                          }`}
                        >
                          <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${visual.railClass}`} />
                          <div className="flex items-start gap-3">
                            <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${visual.iconClass}`}>
                              <VisualIcon size={16} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${notificationLevelClasses(notification.level)}`}
                                    >
                                      {notification.category}
                                    </span>
                                    {isUnread ? (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-violet-300/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-100">
                                        <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden="true" />
                                        New
                                      </span>
                                    ) : null}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleNotificationSelect(notification)}
                                    className="mt-2 block text-left"
                                  >
                                    <div className="text-[13px] font-semibold leading-5 text-[var(--atlas-text-strong)] sm:text-sm">
                                      {notification.title}
                                    </div>
                                    <div className="mt-1 text-[11px] leading-5 text-[var(--atlas-muted)] sm:text-xs">
                                      {notification.message}
                                    </div>
                                  </button>
                                </div>
                                <div className="shrink-0 text-[11px] text-[var(--atlas-muted)]">
                                  {formatPlatformNotificationAge(notification.createdAt)}
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                <span
                                  className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${notificationLevelClasses(notification.level)}`}
                                >
                                  {formatNotificationLevelLabel(notification.level)}
                                </span>
                                <div className="flex items-center gap-2">
                                  {isUnread ? (
                                    <button
                                      type="button"
                                      onClick={() => markNotificationsRead([notification.id])}
                                      className="rounded-full px-2 py-1 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-500/10 hover:text-violet-800 dark:text-violet-200 dark:hover:bg-violet-400/10 dark:hover:text-violet-100"
                                    >
                                      Mark read
                                    </button>
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={() => handleNotificationSelect(notification)}
                                    className="inline-flex items-center gap-1 rounded-full border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface)]/85 px-2.5 py-1 text-[11px] font-semibold text-[var(--atlas-text)] transition hover:bg-[color:var(--atlas-surface-hover)]"
                                  >
                                    Open
                                    <ChevronRight size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </Card>
          </div>,
          document.body,
        )
      : null;

  const profilePanel =
    profileOpen &&
    profilePopoverStyle &&
    typeof document !== "undefined"
      ? createPortal(
          <div
            ref={profilePanelRef}
            className="atlas-theme fixed z-[110]"
            style={{
              left: `${profilePopoverStyle.left}px`,
              top: `${profilePopoverStyle.top}px`,
              width: `${profilePopoverStyle.width}px`,
            }}
          >
            <Card className="w-full p-3 shadow-[0_24px_80px_rgba(15,23,42,0.32)]">
              <div className="relative z-10">
                <div className="rounded-[1.1rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/78 p-3">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] text-[var(--atlas-text-strong)]">
                      <UserCircle2 size={18} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[var(--atlas-text-strong)]">
                        {profileLoading ? "Loading session..." : currentLabel}
                      </div>
                      <div className="mt-1 truncate text-xs text-[var(--atlas-muted)]">
                        {profileLoading ? "Checking account details" : currentEmail}
                      </div>
                      {!profileLoading ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge kind="platform-role" value={accessTier} />
                          <span className="inline-flex rounded-full border border-[color:var(--atlas-border)] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[var(--atlas-text)]">
                            {dataModeLabel}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      closeInlinePanels();
                      navigate("/platform/settings");
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-[1rem] px-3 py-3 text-left transition hover:bg-[color:var(--atlas-surface-hover)]"
                  >
                    <div className="flex items-center gap-3">
                      <Settings size={15} className="text-[var(--atlas-muted)]" />
                      <div>
                        <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                          Open settings
                        </div>
                        <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                          Review account preferences and platform defaults.
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-[var(--atlas-muted)]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      closeInlinePanels();
                      navigate("/platform/users");
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-[1rem] px-3 py-3 text-left transition hover:bg-[color:var(--atlas-surface-hover)]"
                  >
                    <div className="flex items-center gap-3">
                      <Users size={15} className="text-[var(--atlas-muted)]" />
                      <div>
                        <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                          Manage platform users
                        </div>
                        <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                          Check admin coverage and operator status.
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-[var(--atlas-muted)]" />
                  </button>

                  {canManagePortfolio ? (
                    <button
                      type="button"
                      onClick={() => {
                        closeInlinePanels();
                        onOpenCreateApp?.();
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-[1rem] px-3 py-3 text-left transition hover:bg-[color:var(--atlas-surface-hover)]"
                    >
                      <div className="flex items-center gap-3">
                        <Blocks size={15} className="text-[var(--atlas-muted)]" />
                        <div>
                        <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                          Create planned app
                        </div>
                        <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                          Add the next product to ROOTS.
                        </div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-[var(--atlas-muted)]" />
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => {
                      closeInlinePanels();
                      onRequestLogout?.();
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-[1rem] px-3 py-3 text-left transition hover:bg-[color:var(--atlas-surface-hover)]"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut size={15} className="text-[var(--atlas-muted)]" />
                      <div>
                        <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                          Logout
                        </div>
                        <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                          End the current platform session safely.
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-[var(--atlas-muted)]" />
                  </button>
                </div>
              </div>
            </Card>
          </div>,
          document.body,
        )
      : null;

  const quickActionsDialog =
    quickOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="atlas-theme fixed inset-0 z-[120] overflow-y-auto bg-[color:var(--atlas-overlay)] px-4 py-5 md:px-6 md:py-8"
            onMouseDown={() => setQuickOpen(false)}
          >
            <div className="flex min-h-full items-start justify-center">
              <Card
                className="atlas-stage-card my-auto w-full max-w-4xl p-5 md:p-6"
                interactive
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="relative z-10">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-2xl">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--atlas-muted)]">
                        Quick Add
                      </div>
                      <h3 className="mt-1 text-xl font-semibold text-[var(--atlas-text-strong)]">
                        Take the next platform action quickly
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--atlas-muted)]">
                        Create workspaces, move across platform views, switch appearance, or end the current session from one place.
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setQuickOpen(false)}>
                      Close
                    </Button>
                  </div>

                  <div className="mt-5 space-y-5">
                    {quickActionGroups.map((group) => (
                      <section key={group.title}>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                          {group.title}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-3">
                          {group.items.map((action) => {
                            const Icon = action.icon;

                            return (
                              <button
                                key={action.id}
                                type="button"
                                onClick={() => runQuickAction(action)}
                                className="group min-w-0 rounded-[1.25rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/82 p-3 text-left transition hover:border-[color:var(--atlas-border-strong)] hover:bg-[color:var(--atlas-surface-hover)] sm:p-4"
                              >
                                <div className="flex flex-col items-start gap-2.5 sm:flex-row sm:gap-3">
                                  <span
                                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border sm:h-11 sm:w-11 ${quickActionToneClasses(action.tone)}`}
                                  >
                                    <Icon size={17} />
                                  </span>
                                  <div className="min-w-0">
                                    <div className="text-[13px] font-semibold text-[var(--atlas-text-strong)] sm:text-sm">
                                      {action.title}
                                    </div>
                                    <div className="mt-1 text-[11px] leading-5 text-[var(--atlas-muted)] sm:text-xs">
                                      {action.description}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <header
      ref={rootRef}
      className="sticky top-0 z-40 border-b border-[color:var(--atlas-border)] bg-[color:var(--atlas-topbar)]/90 px-3 py-3 backdrop-blur-2xl sm:px-4 sm:py-4 md:px-6"
    >
      <div className="atlas-command-chrome rounded-[1.35rem] px-3 py-2.5 sm:px-4 sm:py-3 md:rounded-[1.6rem] md:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onOpenMenu}
                className="atlas-icon-button rounded-xl p-2 text-[var(--atlas-text)] hover:bg-[color:var(--atlas-surface-hover)] xl:hidden"
                aria-label="Open sidebar"
              >
                <Menu size={17} />
              </button>

              {showBackButton && (
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)]/80 text-sm font-semibold text-[var(--atlas-text)] shadow-[0_10px_22px_rgba(15,23,42,0.08)] transition hover:bg-[color:var(--atlas-surface-hover)] md:h-auto md:w-auto md:gap-2 md:px-3 md:py-2"
                  aria-label="Go back to the previous page"
                >
                  <ArrowLeft size={15} />
                  <span className="hidden md:inline">Back</span>
                </button>
              )}
            </div>

            <div className="min-w-0">
              <h2 className="font-header text-[1.4rem] font-semibold leading-tight text-[var(--atlas-text-strong)] sm:text-xl md:text-2xl">
                {title}
              </h2>
            </div>
            <span
              className={`hidden items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] md:inline-flex ${
                limitedLiveAccess
                  ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200"
                  : dataMode === "demo"
                  ? "border-blue-300/25 bg-blue-500/10 text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200"
                  : "border-violet-400/20 bg-violet-500/10 text-violet-700 dark:border-violet-400/25 dark:bg-violet-400/10 dark:text-violet-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  limitedLiveAccess
                    ? "bg-emerald-500 dark:bg-emerald-300"
                    : dataMode === "demo"
                    ? "bg-blue-500 dark:bg-blue-300"
                    : "bg-violet-500 dark:bg-fuchsia-300"
                }`}
              />
              {dataMode === "demo" ? "Demo" : "Live"}
            </span>
          </div>

          <div className="flex w-full min-w-0 items-center gap-2 md:min-w-[360px] md:flex-1 md:justify-end">
            <div ref={searchRef} className="relative min-w-0 flex-1 md:max-w-xl">
              <label className="atlas-command-chrome atlas-glow-rail flex h-10 w-full items-center gap-2 rounded-2xl px-3 text-[var(--atlas-text)] sm:h-11 sm:px-3.5">
                <Search size={15} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setSearchOpen(true);
                    setNotificationsOpen(false);
                    setProfileOpen(false);
                  }}
                  onFocus={() => {
                    setSearchOpen(true);
                    setNotificationsOpen(false);
                    setProfileOpen(false);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search pages, apps, tenants..."
                  className="h-full w-full bg-transparent text-sm text-[var(--atlas-text-strong)] outline-none placeholder:text-[var(--atlas-muted-soft)]"
                />
                <button
                  type="button"
                  onClick={handleCreateAppClick}
                  className="atlas-icon-button rounded-xl p-1.5 text-[var(--atlas-text)] shadow-[0_0_14px_rgba(96,165,250,0.25)] hover:bg-[color:var(--atlas-surface-hover)]"
                  aria-label={canManagePortfolio ? "Create planned app" : "Open quick actions"}
                  title={canManagePortfolio ? "Create planned app" : "Open quick actions"}
                >
                  <Plus size={14} />
                </button>
              </label>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={openQuickActions}
              className="hidden shrink-0 rounded-2xl px-3.5 lg:inline-flex"
            >
              <Sparkles size={15} />
              Quick Actions
            </Button>

            <Button variant="ghost" className="hidden md:inline-flex" onClick={onOpenCommandPalette}>
              <Command size={15} />
              Ctrl+K
            </Button>

            {onChangeDataMode ? (
              <div className="hidden items-center rounded-2xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)]/85 p-1 md:flex">
                <button
                  type="button"
                  onClick={() => onChangeDataMode?.("demo")}
                  className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                    dataMode === "demo"
                      ? "bg-blue-500/15 text-blue-700 dark:bg-blue-400/20 dark:text-blue-100"
                      : "text-[var(--atlas-muted)] hover:bg-[color:var(--atlas-surface-hover)]"
                  }`}
                >
                  Demo
                </button>
                <button
                  type="button"
                  onClick={() => onChangeDataMode?.("live")}
                  className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                    dataMode === "live"
                      ? "bg-violet-500/15 text-violet-700 dark:bg-violet-400/20 dark:text-violet-100"
                      : "text-[var(--atlas-muted)] hover:bg-[color:var(--atlas-surface-hover)]"
                  }`}
                >
                  Live
                </button>
              </div>
            ) : null}

            <div className="hidden h-5 w-px bg-[color:var(--atlas-border-strong)] md:block" />

            <button
              type="button"
              onClick={onToggleTheme}
              className="atlas-icon-button inline-flex shrink-0 rounded-xl p-2 text-[var(--atlas-text)] hover:bg-[color:var(--atlas-surface-hover)]"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <div ref={notificationRef} className="relative shrink-0">
              <button
                type="button"
                onClick={toggleNotifications}
                className="atlas-icon-button relative inline-flex shrink-0 rounded-xl p-2 text-[var(--atlas-text)] hover:bg-[color:var(--atlas-surface-hover)]"
                aria-label="Notifications"
              >
                <Bell size={15} />
                {unreadNotifications.length > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-semibold text-white">
                    {Math.min(unreadNotifications.length, 9)}
                  </span>
                ) : null}
              </button>
            </div>

            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={toggleProfile}
                className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)]/85 px-2.5 py-2 text-[var(--atlas-text)] transition hover:bg-[color:var(--atlas-surface-hover)] sm:px-3"
                aria-label="Account"
              >
                <UserCircle2 size={15} />
                <span className="hidden max-w-[8rem] truncate text-xs font-semibold tracking-[0.12em] text-[var(--atlas-text-strong)] lg:inline">
                  {getUserDisplayName(currentUser, "Platform")}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 xl:hidden">
          <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
            {COMPACT_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = isCompactNavItemActive(normalizedPathname, item);
              const showUnread = item.to === "/platform/messages" && messageMenuHasNew;

              return (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => navigate(item.to)}
                  className={cn(
                    "relative inline-flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition",
                    isActive
                      ? "border-violet-400/45 bg-violet-500/15 text-violet-800 shadow-[0_10px_26px_rgba(124,58,237,0.18)] ring-1 ring-violet-300/15 dark:border-violet-300/30 dark:bg-violet-400/16 dark:text-violet-50"
                      : "border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/78 text-[var(--atlas-text)] hover:bg-[color:var(--atlas-surface-hover)]",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                  {showUnread ? (
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {searchPanel}
      {notificationsPanel}
      {profilePanel}
      {quickActionsDialog}
    </header>
  );
}
