import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../tenant/TenantContext";
import {
  Sun,
  Moon,
  Search,
  Bell,
  PlusSquare,
  TrendingUp,
  Truck,
  Egg,
  ArrowLeft,
  Droplets,
  ShieldAlert,
  Info,
  Wheat,
  Package,
  CheckCheck,
  Check,
  ArrowUpRight,
} from "lucide-react";
import { Feather } from "lucide-react";
import SalesFormModal from "./SalesFormModal";
import SuppliesFormModal from "./SuppliesFormModal";
import LivestockFormModal from "./LivestockFormModal";
import FeedFormModal from "./FeedFormModal";
import EggProductionFormModal from "./EggProductionFormModal";
import InventoryFormModal from "./InventoryFormModal";
import GlassToast from "./GlassToast";
import api from "../api/apiClient";
import { search as searchApi } from "../services/searchService";
import { getLivestock, getLivestockOverview } from "../services/livestockService";
import { resolveSearchTarget } from "../search/searchUtils";
import useSmartBackNavigation from "../hooks/useSmartBackNavigation";
import {
  KFARMS_ROUTE_REGISTRY,
  toKfarmsAppPath,
} from "../apps/kfarms/paths";
import {
  SETTINGS_THEME_EVENT,
  THEME_STORAGE_KEY,
  getStoredThemeMode,
} from "../constants/settings";
import { WORKSPACE_QUICK_ACTION_EVENT } from "../constants/workspaceQuickActions";
import { getUserDisplayName } from "../services/userProfileService";
import { FARM_MODULES, hasFarmModule } from "../tenant/tenantModules";
import { resolveWorkspaceTopbarMeta } from "../utils/pageMeta";

async function fetchNotifications() {
  try {
    const res = await api.get("/notifications/unread");
    const data = res.data?.data ?? res.data;
    return { success: true, data };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

async function markNotificationRead(id) {
  try {
    await api.post(`/notifications/${id}/read`);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

async function markMultipleNotificationsRead(ids) {
  try {
    await api.post("/notifications/multiple-read", ids);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

const NOTIFICATION_RESYNC_MS = 180000;
const NOTIFICATION_FALLBACK_POLL_MS = 45000;
const NOTIFICATION_DROPDOWN_LIMIT = 8;

function notificationSignature(notification) {
  return [
    notification?.tenant?.id ?? notification?.tenantId ?? "",
    notification?.user?.id ?? notification?.userId ?? "",
    notification?.type ?? "",
    (notification?.title ?? "").trim().toLowerCase(),
    (notification?.message ?? notification?.body ?? "").trim().toLowerCase(),
  ].join("::");
}

function notificationTimestamp(notification) {
  const createdAt = notification?.createdAt ? new Date(notification.createdAt).getTime() : 0;
  return Number.isNaN(createdAt) ? 0 : createdAt;
}

function mergeNotifications(...notificationLists) {
  const merged = new Map();

  notificationLists.flat().filter(Boolean).forEach((notification) => {
    if (!notification || notification.read) {
      return;
    }

    const key = notificationSignature(notification);
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, notification);
      return;
    }

    const nextTime = notificationTimestamp(notification);
    const existingTime = notificationTimestamp(existing);
    const nextId = Number(notification?.id ?? 0);
    const existingId = Number(existing?.id ?? 0);

    if (nextTime > existingTime || (nextTime === existingTime && nextId > existingId)) {
      merged.set(key, notification);
    }
  });

  return [...merged.values()].sort((left, right) => {
    const timeDiff = notificationTimestamp(right) - notificationTimestamp(left);
    if (timeDiff !== 0) {
      return timeDiff;
    }
    return Number(right?.id ?? 0) - Number(left?.id ?? 0);
  });
}

function formatNotificationAge(createdAt) {
  const stamp = notificationTimestamp({ createdAt });
  if (!stamp) {
    return "Just now";
  }

  const diffMs = Date.now() - stamp;
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 1) {
    return "Just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(stamp));
}

function resolveNotificationTarget(notification) {
  const haystack = [
    notification?.type,
    notification?.title,
    notification?.message,
    notification?.body,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    haystack.includes("egg")
    || haystack.includes("layer")
    || haystack.includes("poultry")
    || haystack.includes("livestock")
    || haystack.includes("bird")
  ) {
    return KFARMS_ROUTE_REGISTRY.poultry.appPath;
  }
  if (
    haystack.includes("fish")
    || haystack.includes("pond")
    || haystack.includes("water")
    || haystack.includes("hatch")
  ) {
    return KFARMS_ROUTE_REGISTRY.fishPonds.appPath;
  }
  if (
    haystack.includes("sale")
    || haystack.includes("revenue")
    || haystack.includes("finance")
    || haystack.includes("cash")
  ) {
    return KFARMS_ROUTE_REGISTRY.sales.appPath;
  }
  if (
    haystack.includes("inventory")
    || haystack.includes("supply")
    || haystack.includes("feed")
    || haystack.includes("stock")
  ) {
    return KFARMS_ROUTE_REGISTRY.inventory.appPath;
  }

  return KFARMS_ROUTE_REGISTRY.dashboard.appPath;
}

function toLowerText(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeLivestockNotificationContext(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const totals =
    payload.totals && typeof payload.totals === "object" ? payload.totals : payload;
  const totalBatches = Number(
    totals.totalBatches ??
      payload.totalBatches ??
      payload.totalLivestockBatches ??
      payload.totalGroups ??
      0,
  );
  const totalAlive = Number(
    totals.totalAlive ??
      payload.totalAlive ??
      payload.totalQuantityAlive ??
      0,
  );

  return {
    totalBatches: Number.isFinite(totalBatches) ? totalBatches : 0,
    totalAlive: Number.isFinite(totalAlive) ? totalAlive : 0,
  };
}

function isEmptyWorkspaceLowLivestockNotification(notification, livestockContext) {
  if (!notification || !livestockContext) {
    return false;
  }

  const title = toLowerText(notification.title);
  const message = toLowerText(notification.message || notification.body);
  if (!title.includes("low livestock count")) {
    return false;
  }

  const looksLikeLowCountAlert =
    message.includes("below 50") || message.includes("please inspect");
  if (!looksLikeLowCountAlert) {
    return false;
  }

  return livestockContext.totalBatches <= 0 && livestockContext.totalAlive <= 0;
}

function filterWorkspaceNotifications(notifications = [], livestockContext = null) {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return [];
  }

  return notifications.filter(
    (notification) =>
      !isEmptyWorkspaceLowLivestockNotification(notification, livestockContext),
  );
}

function getNotificationMeta(type) {
  switch ((type || "").toUpperCase()) {
    case "FISH":
      return {
        label: "Fish",
        icon: Droplets,
        iconClass:
          "bg-cyan-500/12 text-cyan-600 ring-1 ring-cyan-500/20 dark:bg-cyan-500/18 dark:text-cyan-200 dark:ring-cyan-400/20",
        chipClass:
          "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/15 dark:text-cyan-100",
      };
    case "SUPPLIES":
      return {
        label: "Supplies",
        icon: Truck,
        iconClass:
          "bg-sky-500/12 text-sky-600 ring-1 ring-sky-500/20 dark:bg-sky-500/18 dark:text-sky-200 dark:ring-sky-400/20",
        chipClass:
          "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/15 dark:text-sky-100",
      };
    case "LIVESTOCK":
      return {
        label: "Poultry",
        icon: Feather,
        iconClass:
          "bg-violet-500/12 text-violet-600 ring-1 ring-violet-500/20 dark:bg-violet-500/18 dark:text-violet-200 dark:ring-violet-400/20",
        chipClass:
          "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/15 dark:text-violet-100",
      };
    case "LAYER":
      return {
        label: "Layers",
        icon: Egg,
        iconClass:
          "bg-amber-500/12 text-amber-600 ring-1 ring-amber-500/20 dark:bg-amber-500/18 dark:text-amber-200 dark:ring-amber-400/20",
        chipClass:
          "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/15 dark:text-amber-100",
      };
    case "FINANCE":
      return {
        label: "Finance",
        icon: TrendingUp,
        iconClass:
          "bg-emerald-500/12 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-500/18 dark:text-emerald-200 dark:ring-emerald-400/20",
        chipClass:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/15 dark:text-emerald-100",
      };
    case "FEED":
      return {
        label: "Feeds",
        icon: Wheat,
        iconClass:
          "bg-orange-500/12 text-orange-600 ring-1 ring-orange-500/20 dark:bg-orange-500/18 dark:text-orange-200 dark:ring-orange-400/20",
        chipClass:
          "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:border-orange-400/20 dark:bg-orange-500/15 dark:text-orange-100",
      };
    case "INVENTORY":
      return {
        label: "Inventory",
        icon: Package,
        iconClass:
          "bg-indigo-500/12 text-indigo-600 ring-1 ring-indigo-500/20 dark:bg-indigo-500/18 dark:text-indigo-200 dark:ring-indigo-400/20",
        chipClass:
          "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/15 dark:text-indigo-100",
      };
    case "SYSTEM":
      return {
        label: "System",
        icon: ShieldAlert,
        iconClass:
          "bg-rose-500/12 text-rose-600 ring-1 ring-rose-500/20 dark:bg-rose-500/18 dark:text-rose-200 dark:ring-rose-400/20",
        chipClass:
          "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/15 dark:text-rose-100",
      };
    default:
      return {
        label: "Update",
        icon: Info,
        iconClass:
          "bg-slate-500/12 text-slate-600 ring-1 ring-slate-500/20 dark:bg-slate-500/18 dark:text-slate-200 dark:ring-slate-400/20",
        chipClass:
          "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:border-slate-400/20 dark:bg-slate-500/15 dark:text-slate-100",
      };
  }
}

export default function Topbar() {
  const { user } = useAuth();
  const { activeTenant, activeTenantId } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const { goBack, showBackButton } = useSmartBackNavigation({
    fallbackPath: KFARMS_ROUTE_REGISTRY.dashboard.appPath,
    hiddenPaths: [KFARMS_ROUTE_REGISTRY.dashboard.appPath],
  });

  const hr = new Date().getHours();
  const greet =
    hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  const name = getUserDisplayName(user, "Farmer");
  const workspaceName = activeTenant?.name || "your farm";
  const topbarMeta = React.useMemo(
    () =>
      resolveWorkspaceTopbarMeta(location.pathname, {
        workspaceName,
      }),
    [location.pathname, workspaceName],
  );
  const poultryEnabled = hasFarmModule(activeTenant, FARM_MODULES.POULTRY);

  const rootRef = React.useRef(null);
  const searchInputRef = React.useRef(null);

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState([]);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [showSearch, setShowSearch] = React.useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [notifications, setNotifications] = React.useState([]);
  const [notificationsLoading, setNotificationsLoading] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [salesModalOpen, setSalesModalOpen] = React.useState(false);
  const [suppliesModalOpen, setSuppliesModalOpen] = React.useState(false);
  const [livestockModalOpen, setLivestockModalOpen] = React.useState(false);
  const [feedModalOpen, setFeedModalOpen] = React.useState(false);
  const [eggModalOpen, setEggModalOpen] = React.useState(false);
  const [inventoryModalOpen, setInventoryModalOpen] = React.useState(false);
  const [layerBatches, setLayerBatches] = React.useState([]);
  const [layerBatchesLoading, setLayerBatchesLoading] = React.useState(false);
  const [toast, setToast] = React.useState({
    message: "",
    type: "info",
  });
  const livestockNotificationContextRef = React.useRef(null);

  React.useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setShowSearch(false);
      setSearchLoading(false);
      setActiveIndex(-1);
      return;
    }

    setShowSearch(true);
    setSearchLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = await searchApi(trimmed, 20);
        setResults(Array.isArray(data) ? data : []);
        setActiveIndex(Array.isArray(data) && data.length > 0 ? 0 : -1);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          setToast({ message: "Session expired. Please log in again.", type: "error" });
          navigate("/auth/login");
        } else {
          setResults([]);
        }
      } finally {
        setSearchLoading(false);
      }
    }, 320);
    return () => clearTimeout(t);
  }, [query, navigate]);

  React.useEffect(() => {
    if (!activeTenantId) {
      setNotifications([]);
      setNotificationsLoading(false);
      return undefined;
    }

    let isActive = true;
    let source;
    let resyncId;
    let pollId;

    const syncNotifications = async ({ background = false } = {}) => {
      if (!isActive) {
        return;
      }

      if (!background) {
        setNotificationsLoading(true);
      }

      const [res, livestockContext] = await Promise.all([
        fetchNotifications(),
        poultryEnabled
          ? getLivestockOverview()
              .then((payload) => normalizeLivestockNotificationContext(payload))
              .catch(() => null)
          : Promise.resolve(null),
      ]);
      if (!isActive) {
        return;
      }

      livestockNotificationContextRef.current = livestockContext;

      if (res.success) {
        const filtered = filterWorkspaceNotifications(res.data || [], livestockContext);
        setNotifications((prev) => mergeNotifications(background ? prev : [], filtered));
      } else if (!background) {
        setNotifications([]);
      }

      if (!background) {
        setNotificationsLoading(false);
      }
    };

    const syncIfVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      void syncNotifications({ background: true });
    };

    const onVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void syncNotifications({ background: true });
      }
    };

    setNotifications([]);
    void syncNotifications();

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibilityChange);
    }

    if (typeof window !== "undefined" && user?.id && "EventSource" in window) {
      source = new EventSource(`/api/notifications/stream/${user.id}?tenantId=${activeTenantId}`);
      const handleNotification = (event) => {
        if (!isActive) {
          return;
        }

        try {
          const payload = JSON.parse(event.data);
          if (
            isEmptyWorkspaceLowLivestockNotification(
              payload,
              livestockNotificationContextRef.current,
            )
          ) {
            return;
          }
          setNotifications((prev) => mergeNotifications(prev, [payload]));
        } catch (err) {
          console.error("Failed to parse notification stream:", err);
        }
      };

      source.addEventListener("notification", handleNotification);
      source.addEventListener("error", () => {
        if (source.readyState === EventSource.CLOSED) {
          source.close();
        }
      });
      resyncId = window.setInterval(syncIfVisible, NOTIFICATION_RESYNC_MS);

      return () => {
        isActive = false;
        if (typeof document !== "undefined") {
          document.removeEventListener("visibilitychange", onVisibilityChange);
        }
        if (resyncId) {
          window.clearInterval(resyncId);
        }
        source.removeEventListener("notification", handleNotification);
        source.close();
      };
    }

    if (typeof window !== "undefined") {
      pollId = window.setInterval(syncIfVisible, NOTIFICATION_FALLBACK_POLL_MS);
    }

    return () => {
      isActive = false;
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
      if (pollId && typeof window !== "undefined") {
        window.clearInterval(pollId);
      }
    };
  }, [activeTenantId, poultryEnabled, user?.id]);

  const unreadCount = notifications.length;
  const visibleNotifications = notifications.slice(0, NOTIFICATION_DROPDOWN_LIMIT);

  async function handleMarkRead(id) {
    const res = await markNotificationRead(id);
    if (res.success) {
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
      return;
    }

    setToast({
      message: "We could not update that notification just now.",
      type: "error",
    });
  }

  async function handleMarkAllRead() {
    const ids = notifications.map((notification) => notification.id).filter(Boolean);
    if (ids.length === 0) {
      return;
    }

    const res = await markMultipleNotificationsRead(ids);
    if (res.success) {
      setNotifications([]);
      return;
    }

    setToast({
      message: "We could not clear the notification list just now.",
      type: "error",
    });
  }

  function handleNotificationOpen(notification) {
    setNotifOpen(false);
    if (notification?.id) {
      void handleMarkRead(notification.id);
    }
    navigate(resolveNotificationTarget(notification));
  }

  const [quickOpen, setQuickOpen] = React.useState(false);
  const quickAdd = React.useCallback(async (action) => {
    setQuickOpen(false);
    if (action === "sales") {
      setSalesModalOpen(true);
      return;
    }
    if (action === "supplies") {
      setSuppliesModalOpen(true);
      return;
    }
    if (action === "feeds") {
      setFeedModalOpen(true);
      return;
    }
    if (action === "poultry") {
      setLivestockModalOpen(true);
      return;
    }
    if (action === "inventory") {
      setInventoryModalOpen(true);
      return;
    }
    if (action === "eggs") {
      if (!layerBatchesLoading) {
        setLayerBatchesLoading(true);
        try {
          const data = await getLivestock({ page: 0, size: 200, type: "LAYER" });
          setLayerBatches(Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : []);
        } catch (error) {
          console.error("Failed to load layer batches for quick add", error);
          setLayerBatches([]);
          setToast({
            message: "Could not refresh layer batches. You can still review the form.",
            type: "error",
          });
        } finally {
          setLayerBatchesLoading(false);
        }
      }
      setEggModalOpen(true);
      return;
    }

    navigate(KFARMS_ROUTE_REGISTRY.dashboard.appPath);
  }, [layerBatchesLoading, navigate]);

  const [theme, setTheme] = React.useState(getStoredThemeMode);
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.body.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    window.dispatchEvent(
      new CustomEvent(SETTINGS_THEME_EVENT, {
        detail: { mode: theme },
      }),
    );
    document.documentElement.style.transition =
      "background-color 200ms, color 200ms";
  }, [theme]);

  React.useEffect(() => {
    const syncTheme = () => {
      setTheme(getStoredThemeMode());
    };

    window.addEventListener(SETTINGS_THEME_EVENT, syncTheme);
    window.addEventListener("storage", syncTheme);

    return () => {
      window.removeEventListener(SETTINGS_THEME_EVENT, syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  React.useEffect(() => {
    function onDocClick(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        setShowSearch(false);
        setMobileSearchOpen(false);
        setNotifOpen(false);
        setQuickOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") {
        setShowSearch(false);
        setMobileSearchOpen(false);
        setNotifOpen(false);
        setQuickOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const closeFloatingPanels = () => {
      setShowSearch(false);
      setMobileSearchOpen(false);
      setNotifOpen(false);
      setQuickOpen(false);
    };

    window.addEventListener("scroll", closeFloatingPanels, { passive: true });

    return () => {
      window.removeEventListener("scroll", closeFloatingPanels);
    };
  }, []);

  React.useEffect(() => {
    function handleWorkspaceQuickAction(event) {
      const action = String(event?.detail?.action || "").trim();
      if (!action) return;
      void quickAdd(action);
    }

    window.addEventListener(WORKSPACE_QUICK_ACTION_EVENT, handleWorkspaceQuickAction);
    return () => {
      window.removeEventListener(WORKSPACE_QUICK_ACTION_EVENT, handleWorkspaceQuickAction);
    };
  }, [quickAdd]);

  function clearSearch() {
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
    setShowSearch(false);
  }

  function toggleMobileSearch() {
    setMobileSearchOpen((open) => {
      const next = !open;
      if (!next) setShowSearch(false);
      if (next) {
        requestAnimationFrame(() => searchInputRef.current?.focus());
      }
      return next;
    });
  }


  function resolveSearchUrl(result) {
    return resolveSearchTarget(result);
  }

  function handleResultSelect(result) {
    if (!result) return;
    const target = resolveSearchUrl(result);
    setShowSearch(false);
    setMobileSearchOpen(false);
    if (target) {
      navigate(target);
    }
  }

  function handleSearchKeyDown(e) {
    if (!showSearch || searchLoading) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length === 0) return;
      setActiveIndex((idx) => Math.min(idx + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length === 0) return;
      setActiveIndex((idx) => Math.max(idx - 1, 0));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        handleResultSelect(results[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSearch(false);
      setMobileSearchOpen(false);
    }
  }

  const topActionIconClass =
    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.08)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-primary/35 hover:bg-white dark:border-slate-700/80 dark:bg-darkCard/85 dark:text-slate-100 dark:shadow-[0_10px_22px_rgba(0,0,0,0.28)] dark:hover:border-accent-primary/40 dark:hover:bg-slate-900/90";
  const topActionButtonClass =
    "inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.08)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-primary/35 hover:bg-white dark:border-slate-700/80 dark:bg-darkCard/85 dark:text-slate-100 dark:shadow-[0_10px_22px_rgba(0,0,0,0.28)] dark:hover:border-accent-primary/40 dark:hover:bg-slate-900/90";
  const topActionDropdownClass =
    "rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_20px_40px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-[#0b1220]/95 dark:shadow-[0_18px_38px_rgba(0,0,0,0.48)]";
  const quickMenuItemClass =
    "group mx-2 my-1 flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-all duration-200 hover:border-accent-primary/30 hover:bg-accent-primary/10 dark:hover:border-accent-primary/30 dark:hover:bg-white/5";

  return (
    <div
      ref={rootRef}
      className="w-full sticky top-0 z-50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 pr-24 sm:pr-0">
        {showBackButton && (
          <button
            type="button"
            onClick={goBack}
            className={`${topActionButtonClass} mb-2`}
            aria-label="Go back to the previous page"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
        )}
        {!topbarMeta.hideGreeting ? (
          <>
            <h1 className="text-2xl md:text-3xl font-bold font-header flex flex-wrap items-center gap-2">
              {greet},{" "}
              <span className="text-status-success max-w-[12rem] truncate whitespace-nowrap">
                {name}!
              </span>
            </h1>
            <p className="text-sm font-body text-slate-400">
              {topbarMeta.subtitle}
            </p>
          </>
        ) : null}
      </div>

      <div className="w-full sm:w-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        {/* Mobile search bar (icon-triggered) */}
        <div className="relative sm:hidden" aria-live="polite">
          <div
            className={`overflow-hidden transition-all duration-200 ease-out ${
              mobileSearchOpen
                ? "max-h-16 opacity-100 translate-y-0"
                : "max-h-0 opacity-0 -translate-y-1 pointer-events-none"
            }`}
          >
            <div className="flex items-center min-w-0 rounded-full px-3 py-2 w-full transition-colors dark:bg-darkCard border border-slate-800">
              <div className="text-lightText dark:text-darkText">
                <Search className="w-5 h-5" />
              </div>
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => {
                  const value = e.target.value;
                  setQuery(value);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search farm records..."
                className="ml-2 bg-transparent outline-none w-full min-w-0 text-sm placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />
              {query ? (
                <button
                  onClick={clearSearch}
                  aria-label="clear"
                  className="ml-2 text-xs opacity-80 hover:opacity-100"
                >
                  ✕
                </button>
              ) : searchLoading ? (
                <div className="ml-2 text-xs opacity-70">…</div>
              ) : null}
            </div>
          </div>

          {/* Search dropdown (mobile) */}
          <div
            className={`absolute left-0 right-0 mt-2 w-full max-w-[calc(100vw-2rem)] transform origin-top-right z-50
              ${
                showSearch && mobileSearchOpen
                  ? "scale-100 opacity-100"
                  : "scale-95 opacity-0 pointer-events-none"
              }
              transition-all duration-200`}
            style={{ willChange: "transform, opacity" }}
          >
            <div className="rounded-lg shadow-lg overflow-hidden bg-lightbg dark:bg-darkCard border border-white/10 dark:border-slate-700">
              <div className="p-2 text-xs text-slate-500 border-b dark:border-slate-700">
                Search results
              </div>
              <ul className="max-h-64 overflow-auto">
                {searchLoading && (
                  <li className="p-3 text-sm text-slate-600">Searching…</li>
                )}
                {!searchLoading && results.length === 0 && (
                  <li className="p-3 text-sm text-slate-600">Nothing matches yet</li>
                )}
                {results.map((r, idx) => (
                  <li
                    key={r.id || r.url || Math.random()}
                    className={`p-3 cursor-pointer ${
                      idx === activeIndex
                        ? "bg-lightText dark:bg-slate-800"
                        : "hover:bg-lightText dark:hover:bg-slate-800"
                    }`}
                    onClick={() => {
                      handleResultSelect(r);
                    }}
                    onMouseEnter={() => {
                      setActiveIndex(idx);
                    }}
                  >
                    <div className="text-sm font-medium">
                      {r.title
                        .split(new RegExp(`(${query})`, "gi"))
                        .map((part, i) =>
                          part.toLowerCase() === query.toLowerCase() ? (
                            <mark
                              key={i}
                              className="bg-emerald-200 dark:bg-emerald-600/50 rounded px-1"
                            >
                              {part}
                            </mark>
                          ) : (
                            part
                          ),
                        )}
                    </div>

                    {r.subtitle && (
                      <div className="text-xs text-slate-400">{r.subtitle}</div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="p-2 border-t text-xs dark:border-slate-700">
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setMobileSearchOpen(false);
                    navigate(`${toKfarmsAppPath("/search")}?q=${encodeURIComponent(query)}`);
                  }}
                  className="w-full text-left"
                >
                  See all results
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop search */}
        <div className="relative hidden sm:block" aria-live="polite">
          <div className="flex items-center rounded-full px-3 py-2 w-64 md:w-80 transition-colors dark:bg-darkCard border border-slate-800">
            <div className="text-lightText dark:text-darkText">
              <Search className="w-5 h-5" />
            </div>
            <input
              value={query}
              onChange={(e) => {
                const value = e.target.value;
                setQuery(value);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search ponds, feeds, sales, supplies..."
              className="ml-2 bg-transparent outline-none w-full text-sm placeholder:text-slate-500 dark:placeholder:text-slate-400"
            />
            {query ? (
              <button
                onClick={clearSearch}
                aria-label="clear"
                className="ml-2 text-xs opacity-80 hover:opacity-100"
              >
                ✕
              </button>
            ) : searchLoading ? (
              <div className="ml-2 text-xs opacity-70">…</div>
            ) : null}
          </div>

          {/* Search dropdown (desktop) */}
          <div
            className={`absolute right-0 mt-2 w-80 transform origin-top-right z-50
              ${
                showSearch ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
              }
              transition-all duration-200`}
            style={{ willChange: "transform, opacity" }}
          >
            <div className="rounded-lg shadow-lg overflow-hidden bg-lightbg dark:bg-darkCard border border-white/10 dark:border-slate-700">
              <div className="p-2 text-xs text-slate-500 border-b dark:border-slate-700">
                Search results
              </div>
              <ul className="max-h-64 overflow-auto">
                {searchLoading && (
                  <li className="p-3 text-sm text-slate-600">Searching…</li>
                )}
                {!searchLoading && results.length === 0 && (
                  <li className="p-3 text-sm text-slate-600">Nothing matches yet</li>
                )}
                {results.map((r, idx) => (
                  <li
                    key={r.id || r.url || Math.random()}
                    className={`p-3 cursor-pointer ${
                      idx === activeIndex
                        ? "bg-lightText dark:bg-slate-800"
                        : "hover:bg-lightText dark:hover:bg-slate-800"
                    }`}
                    onClick={() => {
                      handleResultSelect(r);
                    }}
                    onMouseEnter={() => {
                      setActiveIndex(idx);
                    }}
                  >
                    <div className="text-sm font-medium">
                      {r.title
                        .split(new RegExp(`(${query})`, "gi"))
                        .map((part, i) =>
                          part.toLowerCase() === query.toLowerCase() ? (
                            <mark
                              key={i}
                              className="bg-emerald-200 dark:bg-emerald-600/50 rounded px-1"
                            >
                              {part}
                            </mark>
                          ) : (
                            part
                          ),
                        )}
                    </div>

                    {r.subtitle && (
                      <div className="text-xs text-slate-400">{r.subtitle}</div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="p-2 border-t text-xs dark:border-slate-700">
                <button
                  onClick={() => {
                    setShowSearch(false);
                    navigate(`${toKfarmsAppPath("/search")}?q=${encodeURIComponent(query)}`);
                  }}
                  className="w-full text-left"
                >
                  See all results
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-nowrap items-center justify-end gap-2 sm:gap-3">
          {/* Search icon (mobile) */}
          <button
            type="button"
            onClick={toggleMobileSearch}
            className={`sm:hidden ${topActionIconClass}`}
            aria-label="Search"
            aria-haspopup="true"
            aria-expanded={mobileSearchOpen}
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <div className="relative shrink-0">
            <button
              onClick={() => {
                setQuickOpen(false);
                setNotifOpen((s) => !s);
              }}
              className={`${topActionIconClass} relative`}
              aria-haspopup="true"
              aria-expanded={notifOpen}
              aria-label="Notifications"
            >
              <div className="relative isolate">
                <Bell className={`w-5 h-5 transition-transform duration-200 ${notifOpen ? "scale-95" : ""}`} />
                {unreadCount > 0 && (
                  <span
                    className="absolute -right-2 -top-2 inline-flex min-w-[1.45rem] items-center justify-center rounded-full border border-white/75 bg-[linear-gradient(135deg,#2563eb,#14b8a6)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow-[0_10px_22px_rgba(37,99,235,0.28)] ring-4 ring-slate-950/10 dark:border-slate-950/80 dark:ring-white/5"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
            </button>

            <div
              className={`fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 mt-3 sm:mt-2 w-auto sm:w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] sm:max-w-[calc(100vw-2rem)] transform origin-top-right z-50
              ${
                notifOpen
                  ? "translate-y-0 scale-100 opacity-100"
                  : "pointer-events-none translate-y-2 scale-[0.98] opacity-0"
              }
              transition-all duration-200 ease-out`}
            >
              <div className={`${topActionDropdownClass} overflow-hidden`}>
                <div className="border-b border-slate-200/70 px-3 py-3 sm:px-4 sm:py-3.5 dark:border-slate-800/90">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Notifications
                        </p>
                        <span className="hidden sm:inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/15 dark:text-emerald-100">
                          Live
                        </span>
                      </div>
                      <p className="mt-1 hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                        {unreadCount > 0
                          ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"} waiting`
                          : "You are all caught up for now."}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 sm:hidden">
                        {unreadCount > 0
                          ? `${unreadCount} unread`
                          : "All caught up"}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white/85 px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-accent-primary/30 hover:text-accent-primary sm:gap-1.5 sm:rounded-full sm:px-2.5 sm:text-[11px] dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-accent-primary/35 dark:hover:text-white"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        <span className="sm:hidden">Clear</span>
                        <span className="hidden sm:inline">Mark all</span>
                      </button>
                    )}
                  </div>
                </div>
                {notificationsLoading ? (
                  <div className="px-3 py-6 text-center text-sm text-slate-500 sm:px-4 sm:py-8 dark:text-slate-400">
                    Pulling in your latest alerts...
                  </div>
                ) : visibleNotifications.length === 0 ? (
                  <div className="px-3 py-6 text-center sm:px-4 sm:py-8">
                    <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-500 sm:h-12 sm:w-12 sm:rounded-2xl dark:bg-slate-800 dark:text-slate-300">
                      <Bell className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      No fresh notifications
                    </p>
                    <p className="mt-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                      New farm alerts will land here without repeating the same noise.
                    </p>
                  </div>
                ) : (
                  <ul className="max-h-[17rem] overflow-y-auto px-1.5 py-1.5 sm:max-h-[26rem] sm:px-2 sm:py-2">
                    {visibleNotifications.map((notification) => {
                      const meta = getNotificationMeta(notification.type);
                      const NotificationIcon = meta.icon;
                      const description =
                        notification.message
                        || notification.body
                        || "Fresh activity was recorded in your workspace.";

                      return (
                        <li key={`${notificationSignature(notification)}::${notification.id ?? "live"}`}>
                          <div className="sm:hidden">
                            <button
                              type="button"
                              onClick={() => handleNotificationOpen(notification)}
                              className="group my-1 flex w-full items-start gap-3 rounded-xl border border-transparent px-2.5 py-2.5 text-left transition-all duration-200 hover:border-slate-200/80 hover:bg-slate-50/90 dark:hover:border-slate-700/80 dark:hover:bg-slate-900/65"
                            >
                              <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${meta.iconClass}`}>
                                <NotificationIcon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-[13px] font-semibold leading-5 text-slate-900 break-words dark:text-slate-100">
                                    {notification.title || "Workspace update"}
                                  </p>
                                  <span className="shrink-0 text-[10px] text-slate-500 dark:text-slate-400">
                                    {formatNotificationAge(notification.createdAt)}
                                  </span>
                                </div>
                                <p
                                  className="mt-0.5 text-[12px] leading-5 text-slate-600 dark:text-slate-300"
                                  style={{
                                    display: "-webkit-box",
                                    WebkitBoxOrient: "vertical",
                                    WebkitLineClamp: 2,
                                    overflow: "hidden",
                                  }}
                                >
                                  {description}
                                </p>
                              </div>
                            </button>
                          </div>
                          <div className="hidden sm:block">
                            <div className="group my-1 rounded-2xl border border-transparent px-3 py-3 transition-all duration-200 hover:border-slate-200/80 hover:bg-slate-50/90 dark:hover:border-slate-700/80 dark:hover:bg-slate-900/65">
                              <div className="flex items-start gap-3">
                                <div className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${meta.iconClass}`}>
                                  <NotificationIcon className="h-[18px] w-[18px]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-col gap-2">
                                    <p className="text-sm font-semibold leading-5 text-slate-900 break-words dark:text-slate-100">
                                      {notification.title || "Workspace update"}
                                    </p>
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${meta.chipClass}`}>
                                        {meta.label}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleMarkRead(notification.id)}
                                        className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 transition hover:border-emerald-500/30 hover:text-emerald-600 dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-emerald-400/30 dark:hover:text-emerald-200"
                                        aria-label={`Mark ${notification.title || "notification"} as read`}
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                        Mark
                                      </button>
                                    </div>
                                  </div>
                                  <p
                                    className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300"
                                    style={{
                                      display: "-webkit-box",
                                      WebkitBoxOrient: "vertical",
                                      WebkitLineClamp: 2,
                                      overflow: "hidden",
                                    }}
                                  >
                                    {description}
                                  </p>
                                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                                    <span>{formatNotificationAge(notification.createdAt)}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleNotificationOpen(notification)}
                                      className="inline-flex items-center gap-1 font-medium text-accent-primary transition-transform duration-200 hover:translate-x-0.5"
                                    >
                                      Open
                                      <ArrowUpRight className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {notifications.length > NOTIFICATION_DROPDOWN_LIMIT && (
                  <div className="border-t border-slate-200/70 px-3 py-2 text-[10px] text-slate-500 sm:px-4 sm:py-2.5 sm:text-[11px] dark:border-slate-800/90 dark:text-slate-400">
                    Showing the latest {NOTIFICATION_DROPDOWN_LIMIT} unread alerts first.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Add */}
          <div className="relative hidden md:block">
            <button
              onClick={() => {
                setNotifOpen(false);
                setQuickOpen((s) => !s);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-accent-primary/35 bg-accent-primary px-3.5 text-white shadow-[0_10px_22px_rgba(37,99,235,0.34)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-primary/90 dark:shadow-[0_14px_28px_rgba(0,0,0,0.24)]"
              aria-haspopup="true"
              aria-expanded={quickOpen}
              aria-label="Record something"
            >
              <PlusSquare className="w-5 h-5" />
              <span className="hidden md:inline text-sm font-body">
                Record
              </span>
            </button>

            <div
              className={`fixed sm:absolute left-6 right-6 sm:left-auto sm:right-0 mt-2 w-[calc(100vw-3rem)] sm:w-56 max-w-[calc(100vw-3rem)] transform origin-top-right z-50
              ${
                quickOpen
                  ? "scale-100 opacity-100"
                  : "scale-95 opacity-0 pointer-events-none"
              }
              transition-all duration-200`}
            >
              <div className={`${topActionDropdownClass} overflow-hidden`}>
                <ul className="py-2">
                  {/* Add Egg Record */}
                  {poultryEnabled && (
                    <li
                      className={`${quickMenuItemClass} cursor-pointer`}
                      onClick={() => {
                        void quickAdd("eggs");
                      }}
                    >
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-200/60 text-slate-700 transition group-hover:bg-amber-100 dark:bg-white/5 dark:text-slate-200 dark:group-hover:bg-amber-500/20">
                        <Egg className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Record eggs</div>
                        <div className="text-xs text-slate-500">
                          Save today&apos;s egg count
                        </div>
                      </div>
                    </li>
                  )}

                  <li
                    className={`${quickMenuItemClass} cursor-pointer`}
                    onClick={() => {
                      void quickAdd("feeds");
                    }}
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-200/60 text-slate-700 transition group-hover:bg-emerald-100 dark:bg-white/5 dark:text-slate-200 dark:group-hover:bg-emerald-500/20">
                      <Wheat className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Record feed</div>
                      <div className="text-xs text-slate-500">
                        Log feed usage or feed cost
                      </div>
                    </div>
                  </li>

                  {/* Add Sales */}
                  <li
                    title="Register income"
                    className={`${quickMenuItemClass} cursor-pointer`}
                    onClick={() => {
                      void quickAdd("sales");
                    }}
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-200/60 text-slate-700 transition group-hover:bg-emerald-100 dark:bg-white/5 dark:text-slate-200 dark:group-hover:bg-emerald-500/20">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Record sale</div>
                      <div className="text-xs text-slate-500">
                        Record income
                      </div>
                    </div>
                  </li>

                  {/* Add Supplies */}
                  <li
                    className={`${quickMenuItemClass} cursor-pointer`}
                    onClick={() => {
                      void quickAdd("supplies");
                    }}
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-200/60 text-slate-700 transition group-hover:bg-sky-100 dark:bg-white/5 dark:text-slate-200 dark:group-hover:bg-sky-500/20">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Record purchase</div>
                      <div className="text-xs text-slate-500">
                        Save feed, tools, or medicine
                      </div>
                    </div>
                  </li>

                  {poultryEnabled && (
                    <li
                      className={`${quickMenuItemClass} cursor-pointer`}
                      onClick={() => {
                        void quickAdd("poultry");
                      }}
                    >
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-200/60 text-slate-700 transition group-hover:bg-violet-100 dark:bg-white/5 dark:text-slate-200 dark:group-hover:bg-violet-500/20">
                        <Feather className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Add poultry flock</div>
                        <div className="text-xs text-slate-500">
                          Save a new flock or batch
                        </div>
                      </div>
                    </li>
                  )}

                  <li
                    className={`${quickMenuItemClass} cursor-pointer`}
                    onClick={() => {
                      void quickAdd("inventory");
                    }}
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-200/60 text-slate-700 transition group-hover:bg-indigo-100 dark:bg-white/5 dark:text-slate-200 dark:group-hover:bg-indigo-500/20">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Add stock item</div>
                      <div className="text-xs text-slate-500">
                        Save inventory for quick tracking
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${
              theme === "dark"
                ? "border-accent-primary/40 bg-accent-primary text-white shadow-[0_10px_22px_rgba(37,99,235,0.34)] hover:bg-accent-primary/90"
                : "border-amber-300/70 bg-amber-200/90 text-amber-900 shadow-[0_8px_18px_rgba(217,119,6,0.24)] hover:bg-amber-200"
            }`}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

        </div>
      </div>
      <SalesFormModal
        open={salesModalOpen}
        onClose={() => setSalesModalOpen(false)}
        onSuccess={() => {
          setSalesModalOpen(false);
          setToast({
            message: "Sales record added successfully",
            type: "success",
          });
        }}
      />
      <SuppliesFormModal
        open={suppliesModalOpen}
        onClose={() => setSuppliesModalOpen(false)}
        onSuccess={() => {
          setSuppliesModalOpen(false);
          setToast({
            message: "Supplies record added successfully",
            type: "success",
          });
        }}
      />
      <LivestockFormModal
        open={livestockModalOpen}
        onClose={() => setLivestockModalOpen(false)}
        onSuccess={() => {
          setLivestockModalOpen(false);
          setToast({
            message: "Poultry flock added successfully",
            type: "success",
          });
        }}
      />
      <FeedFormModal
        open={feedModalOpen}
        onClose={() => setFeedModalOpen(false)}
        onSuccess={() => {
          setFeedModalOpen(false);
          setToast({
            message: "Feed record added successfully",
            type: "success",
          });
        }}
      />
      <EggProductionFormModal
        open={eggModalOpen}
        onClose={() => setEggModalOpen(false)}
        layerBatches={layerBatches}
        onSuccess={() => {
          setEggModalOpen(false);
          setToast({
            message: "Egg record added successfully",
            type: "success",
          });
        }}
        onError={() => {
          setToast({
            message: "Could not save the egg record",
            type: "error",
          });
        }}
      />
      <InventoryFormModal
        open={inventoryModalOpen}
        onClose={() => setInventoryModalOpen(false)}
        onSuccess={() => {
          setInventoryModalOpen(false);
          setToast({
            message: "Inventory item added successfully",
            type: "success",
          });
        }}
      />

      <GlassToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />
    </div>
  );
}
