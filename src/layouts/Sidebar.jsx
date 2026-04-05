import React from "react";
<<<<<<< HEAD
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Blocks,
  Building2,
  Users,
  MessageSquareText,
=======
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
>>>>>>> 0babf4d (Update frontend application)
  Activity,
  Settings,
  LogOut,
  X,
  Sparkles,
<<<<<<< HEAD
  RadioTower,
  Shield,
=======
>>>>>>> 0babf4d (Update frontend application)
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import Button from "../components/Button";
import rootsLogo from "../assets/roots-logo.png";
<<<<<<< HEAD
import { PLATFORM_ENDPOINTS } from "../api/endpoints";
import { platformAxios, unwrapApiResponse } from "../api/platformClient";
import {
  buildPlatformDemoSnapshot,
  buildPlatformLiveSnapshot,
} from "../pages/platform/platformWorkbench";
import { formatNumber } from "../utils/formatters";

const ATLAS_NAV_ITEMS = [
  { to: "/platform", label: "Hub", icon: LayoutDashboard, end: true },
  { to: "/platform/apps", label: "Apps", icon: Blocks },
  { to: "/platform/messages", label: "Messages", icon: MessageSquareText },
=======

const ATLAS_NAV_ITEMS = [
  { to: "/platform", label: "Overview", icon: LayoutDashboard, end: true },
>>>>>>> 0babf4d (Update frontend application)
  { to: "/platform/tenants", label: "Tenants", icon: Building2 },
  { to: "/platform/users", label: "Users", icon: Users },
  { to: "/platform/health", label: "Health", icon: Activity },
  { to: "/platform/settings", label: "Settings", icon: Settings },
];

<<<<<<< HEAD
const SIDEBAR_PULSE_BARS = [26, 44, 62, 48, 72, 38];
const SIDEBAR_PULSE_SIGNALS = [
  {
    id: "apps",
    key: "totalApps",
    label: "Apps",
    to: "/platform/apps",
    tone: "from-sky-400 via-blue-400 to-indigo-300",
    glow: "shadow-[0_0_18px_rgba(96,165,250,0.26)]",
    describe: (value) => `${formatNumber(value)} lanes rooted in ROOTS.`,
  },
  {
    id: "liveApps",
    key: "liveApps",
    label: "Live",
    to: "/platform/apps",
    tone: "from-cyan-400 via-sky-400 to-blue-300",
    glow: "shadow-[0_0_18px_rgba(56,189,248,0.24)]",
    describe: (value) => `${formatNumber(value)} running live now.`,
  },
  {
    id: "tenants",
    key: "totalTenants",
    label: "Tenants",
    to: "/platform/tenants",
    tone: "from-violet-400 via-fuchsia-400 to-indigo-300",
    glow: "shadow-[0_0_18px_rgba(168,85,247,0.24)]",
    describe: (value) => `${formatNumber(value)} workspaces in the network.`,
  },
  {
    id: "activeTenants",
    key: "activeTenants",
    label: "Active",
    to: "/platform/health",
    tone: "from-fuchsia-400 via-violet-400 to-pink-300",
    glow: "shadow-[0_0_18px_rgba(217,70,239,0.24)]",
    describe: (value) => `${formatNumber(value)} active in the field.`,
  },
  {
    id: "users",
    key: "totalUsers",
    label: "Users",
    to: "/platform/users",
    tone: "from-emerald-400 via-green-400 to-teal-300",
    glow: "shadow-[0_0_18px_rgba(52,211,153,0.24)]",
    describe: (value) => `${formatNumber(value)} operators on deck.`,
  },
  {
    id: "admins",
    key: "platformAdmins",
    label: "Admins",
    to: "/platform/settings",
    tone: "from-lime-300 via-emerald-400 to-green-300",
    glow: "shadow-[0_0_18px_rgba(74,222,128,0.24)]",
    describe: (value) => `${formatNumber(value)} holding the control plane.`,
  },
];

function clampPulseHeight(value, minimum = 22, maximum = 82) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizePlatformPathname(pathname = "") {
  const normalized = String(pathname || "").replace(/\/+$/, "");
  return normalized || "/";
}

function isPulseRouteActive(pathname, targetPath) {
  const currentPath = normalizePlatformPathname(pathname);
  const normalizedTargetPath = normalizePlatformPathname(targetPath);
  if (!normalizedTargetPath) return false;
  return currentPath === normalizedTargetPath || currentPath.startsWith(`${normalizedTargetPath}/`);
}

function buildSidebarPulseSignals(metrics = {}, pathname = "") {
  const numericValues = SIDEBAR_PULSE_SIGNALS.map((signal) => Number(metrics?.[signal.key] ?? 0));
  const maximumValue = numericValues.some((value) => value > 0) ? Math.max(...numericValues) : 0;

  return SIDEBAR_PULSE_SIGNALS.map((signal, index) => {
    const value = Number(metrics?.[signal.key] ?? 0);
    const fallbackHeight = SIDEBAR_PULSE_BARS[index] ?? 40;
    const scaledHeight =
      maximumValue > 0
        ? clampPulseHeight(Math.round(24 + (Math.max(value, 0) / maximumValue) * 52))
        : fallbackHeight;

    return {
      ...signal,
      value,
      height: scaledHeight,
      active: isPulseRouteActive(pathname, signal.to),
    };
  });
}

=======
>>>>>>> 0babf4d (Update frontend application)
function cn(...values) {
  return values.filter(Boolean).join(" ");
}

function SidebarBody({
<<<<<<< HEAD
  onOpenPulseTarget,
=======
>>>>>>> 0babf4d (Update frontend application)
  onNavigate,
  onLogout,
  collapsed = false,
  onToggleCollapse,
  showCollapseToggle = true,
<<<<<<< HEAD
  showSupportPanels = true,
  messageMenuHasNew = false,
  pulseSignals = [],
  pulseSource = "demo",
  hoveredPulseId = "",
  onHoverPulse,
}) {
  const hoveredSignal =
    pulseSignals.find((signal) => signal.id === hoveredPulseId) || pulseSignals.find((signal) => signal.active) || null;
  const pulseStatusLabel =
    pulseSource === "live" ? "Live" : pulseSource === "fallback" ? "Snapshot" : "Demo";
  const pulseStatusTone =
    pulseSource === "live"
      ? "border border-emerald-300/50 bg-emerald-50/92 text-emerald-700 shadow-[0_10px_22px_rgba(16,185,129,0.08)] dark:border-emerald-300/25 dark:bg-emerald-400/12 dark:text-emerald-200 dark:ring-1 dark:ring-emerald-300/25"
      : pulseSource === "fallback"
        ? "border border-amber-300/50 bg-amber-50/94 text-amber-700 shadow-[0_10px_22px_rgba(245,158,11,0.08)] dark:border-amber-300/20 dark:bg-amber-400/12 dark:text-amber-100 dark:ring-1 dark:ring-amber-300/20"
        : "border border-blue-300/50 bg-blue-50/92 text-blue-700 shadow-[0_10px_22px_rgba(59,130,246,0.08)] dark:border-blue-300/20 dark:bg-blue-400/12 dark:text-blue-100 dark:ring-1 dark:ring-blue-300/20";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          "atlas-dot-grid relative border-b border-[color:var(--atlas-border)]",
          collapsed ? "px-3 py-3" : "px-5 py-5",
=======
}) {
  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "relative border-b border-[color:var(--atlas-border)]",
          collapsed ? "px-3 py-3" : "px-5 py-4",
>>>>>>> 0babf4d (Update frontend application)
        )}
      >
        {showCollapseToggle && (
          <div className={cn(collapsed ? "mb-3 flex justify-center" : "absolute right-3 top-3")}>
            <button
              type="button"
              onClick={onToggleCollapse}
              className={cn(
<<<<<<< HEAD
                "atlas-icon-button inline-flex h-10 w-10 items-center justify-center rounded-xl text-[var(--atlas-text)] transition hover:bg-[color:var(--atlas-surface-hover)]",
=======
                "inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--atlas-surface-soft)]/75 text-[var(--atlas-text)] shadow-sm transition hover:bg-[color:var(--atlas-surface-hover)] dark:shadow-[0_10px_22px_rgba(0,0,0,0.2)]",
>>>>>>> 0babf4d (Update frontend application)
                collapsed && "h-9 w-9",
              )}
              aria-label={collapsed ? "Expand sidebar" : "Toggle sidebar"}
              title={collapsed ? "Expand sidebar" : "Toggle sidebar"}
            >
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={15} />}
            </button>
          </div>
        )}

        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
<<<<<<< HEAD
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-[1.4rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/88",
              collapsed ? "h-12 w-12" : "h-14 w-14",
            )}
          >
            <img
              src={rootsLogo}
              alt="ROOTS"
              className={cn(
                "shrink-0 object-contain saturate-125 contrast-125 brightness-110",
                collapsed ? "h-10 w-10" : "h-12 w-12",
              )}
            />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-header text-[1.7rem] font-black leading-none tracking-[0.18em] text-[var(--atlas-text-strong)]">
                ROOTS
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.26em] text-[var(--atlas-muted)]">
                Platform Console
=======
          <img
            src={rootsLogo}
            alt="ROOTS"
            className={cn(
              "shrink-0 object-contain saturate-125 contrast-125 brightness-110",
              "drop-shadow-[0_8px_18px_rgba(2,6,23,0.22)] dark:drop-shadow-[0_12px_24px_rgba(0,0,0,0.42)]",
              collapsed ? "h-11 w-11" : "h-14 w-14",
            )}
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-header text-2xl font-black leading-none tracking-[0.14em] text-[var(--atlas-text-strong)]">
                ROOTS
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-[var(--atlas-muted)]">
                Platform
>>>>>>> 0babf4d (Update frontend application)
              </p>
            </div>
          )}
        </div>

        {!collapsed && (
<<<<<<< HEAD
          <div className="atlas-signal-chip mt-4">
            <Sparkles size={10} />
            ROOTS Platform
=======
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-200">
            <Sparkles size={10} />
            Control Plane
>>>>>>> 0babf4d (Update frontend application)
          </div>
        )}
      </div>

<<<<<<< HEAD
      <nav className={cn("hide-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto", collapsed ? "px-2 py-3" : "px-3 py-4")}>
        {ATLAS_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const showMessageIndicator = item.to === "/platform/messages" && messageMenuHasNew;
=======
      <nav className={cn("flex-1 space-y-1.5", collapsed ? "px-2 py-3" : "px-3 py-4")}>
        {ATLAS_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
>>>>>>> 0babf4d (Update frontend application)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
<<<<<<< HEAD
                `group relative flex items-center overflow-hidden rounded-2xl py-3 text-sm transition-all duration-200 ${
                  collapsed ? "justify-center px-2.5" : "gap-2 px-3"
                } ${
                  isActive
                    ? "bg-[color:var(--atlas-surface-soft)]/92 text-[var(--atlas-text-strong)]"
=======
                `group relative flex items-center overflow-hidden rounded-xl py-2.5 text-sm transition-all duration-200 ${
                  collapsed ? "justify-center px-2.5" : "gap-2 px-3"
                } ${
                  isActive
                    ? "bg-gradient-to-r from-violet-500/20 via-blue-500/10 to-emerald-500/10 text-[var(--atlas-text-strong)] shadow-[0_12px_24px_rgba(15,23,42,0.14)] dark:shadow-[0_14px_28px_rgba(0,0,0,0.24)]"
>>>>>>> 0babf4d (Update frontend application)
                    : "text-[var(--atlas-text)] hover:bg-[color:var(--atlas-surface-soft)]/70 hover:text-[var(--atlas-text-strong)]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {!collapsed && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full transition-all duration-200",
                        isActive
<<<<<<< HEAD
                          ? "bg-gradient-to-b from-violet-300/90 via-indigo-300/85 to-blue-300/75 opacity-100"
=======
                          ? "bg-gradient-to-b from-violet-300/90 via-blue-300/80 to-emerald-300/75 opacity-100 shadow-[0_0_12px_rgba(96,165,250,0.35)]"
>>>>>>> 0babf4d (Update frontend application)
                          : "opacity-0",
                      )}
                    />
                  )}

                  <Icon
                    size={collapsed ? 18 : 16}
                    className={cn(
                      "shrink-0 transition-colors duration-200",
                      isActive
                        ? "text-[var(--atlas-text-strong)]"
                        : "text-[var(--atlas-muted)] group-hover:text-[var(--atlas-text-strong)]",
                    )}
                  />

                  {!collapsed && <span className="font-medium tracking-[0.01em]">{item.label}</span>}

<<<<<<< HEAD
                  {showMessageIndicator ? (
                    <span
                      aria-label="New messages"
                      className={cn(
                        "pointer-events-none absolute inline-flex h-2.5 w-2.5 rounded-full border border-[color:var(--atlas-surface)] bg-emerald-300 shadow-[0_0_0_4px_rgba(16,185,129,0.16)]",
                        collapsed ? "right-3 top-3" : "right-3 top-1/2 -translate-y-1/2",
                      )}
                    />
                  ) : null}

=======
>>>>>>> 0babf4d (Update frontend application)
                  {collapsed && (
                    <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface)] px-2 py-1 text-xs text-[var(--atlas-text-strong)] opacity-0 shadow-lg transition group-hover:opacity-100">
                      {item.label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

<<<<<<< HEAD
      {!collapsed && showSupportPanels && (
        <div className="space-y-3 px-3 pb-3">
          <div
            className="atlas-stage-card group rounded-[1.5rem] p-4 transition duration-300 hover:shadow-[0_20px_46px_rgba(46,37,92,0.26)]"
            role="button"
            tabIndex={0}
            onClick={() => onOpenPulseTarget("/platform")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpenPulseTarget("/platform");
              }
            }}
            aria-label="Open platform hub overview"
          >
            <style>
              {`
                @keyframes sidebar-pulse-wave {
                  0%, 100% {
                    opacity: 0.84;
                    transform: translateY(0) scaleY(0.96);
                  }
                  50% {
                    opacity: 1;
                    transform: translateY(-3px) scaleY(1.04);
                  }
                }

                @keyframes sidebar-pulse-beacon {
                  0%, 100% {
                    opacity: 0.74;
                    transform: scale(1);
                    filter: drop-shadow(0 0 0 rgba(196, 181, 253, 0));
                  }
                  50% {
                    opacity: 1;
                    transform: scale(1.08);
                    filter: drop-shadow(0 0 10px rgba(216, 180, 254, 0.55));
                  }
                }

                @media (prefers-reduced-motion: reduce) {
                  [data-sidebar-pulse-bar],
                  [data-sidebar-pulse-icon] {
                    animation: none !important;
                    transform: none !important;
                  }
                }
              `}
            </style>
            <div className="relative z-10 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--atlas-muted)]">
                  Platform Pulse
                </div>
                <div className="mt-1 text-sm font-semibold text-[var(--atlas-text-strong)]">
                  Platform overview
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]", pulseStatusTone)}>
                  {pulseStatusLabel}
                </span>
                <RadioTower
                  size={16}
                  data-sidebar-pulse-icon
                  className="text-violet-600 transition-transform duration-300 dark:text-fuchsia-300"
                  style={{
                    animation:
                      pulseSource === "live"
                        ? "sidebar-pulse-beacon 2.2s ease-in-out infinite"
                        : "sidebar-pulse-beacon 3.1s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
            <div className="relative z-10 mt-4 flex h-16 items-end gap-1.5">
              {pulseSignals.map((signal, index) => (
                <button
                  key={signal.id}
                  type="button"
                  data-sidebar-pulse-bar
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenPulseTarget(signal.to);
                  }}
                  onMouseEnter={() => onHoverPulse(signal.id)}
                  onMouseLeave={() => onHoverPulse("")}
                  onFocus={() => onHoverPulse(signal.id)}
                  onBlur={() => onHoverPulse("")}
                  className={cn(
                    "relative flex h-full w-full items-end rounded-full transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--atlas-surface)]",
                    signal.active || hoveredSignal?.id === signal.id ? "opacity-100" : "opacity-90",
                  )}
                  title={`${signal.label}: ${formatNumber(signal.value)}`}
                  aria-label={`${signal.label}: ${formatNumber(signal.value)}. Open ${signal.label.toLowerCase()} lane.`}
                >
                  <span
                    className={cn(
                      "w-full rounded-full bg-gradient-to-t transition-all duration-300",
                      signal.tone,
                      signal.active || hoveredSignal?.id === signal.id
                        ? `${signal.glow} brightness-110`
                        : "",
                    )}
                    style={{
                      height: `${signal.height}%`,
                      animation: `sidebar-pulse-wave 2.8s ease-in-out ${index * 140}ms infinite`,
                      transformOrigin: "bottom center",
                    }}
                  />
                </button>
              ))}
            </div>
            <div className="relative z-10 mt-3 grid min-h-[5rem] grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                  {hoveredSignal ? hoveredSignal.label : "Quick jump"}
                </div>
                <div className="mt-1 min-h-[2.5rem] text-xs leading-5 text-[var(--atlas-muted)]">
                  {hoveredSignal
                    ? hoveredSignal.describe(hoveredSignal.value)
                    : "Click a signal to jump into its lane, or open the hub for the full picture."}
                </div>
              </div>
              <div className="shrink-0 rounded-2xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/70 px-3 py-2 text-right">
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                  Focus
                </div>
                <div className="mt-1 text-sm font-semibold text-[var(--atlas-text-strong)]">
                  {hoveredSignal ? formatNumber(hoveredSignal.value) : "Hub"}
                </div>
              </div>
            </div>
          </div>

          <div className="atlas-glass-card rounded-[1.3rem] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-200/70 via-violet-200/75 to-blue-200/70 text-violet-700 dark:from-indigo-400/20 dark:via-violet-400/20 dark:to-fuchsia-400/20 dark:text-violet-200">
                <Shield size={16} />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                  Secure Session
                </div>
                <div className="mt-1 text-sm text-[var(--atlas-text-strong)]">
                  Admin access
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={cn("border-t border-[color:var(--atlas-border)] p-3", collapsed && "flex justify-center py-4")}>
        <Button
          variant="ghost"
          className={cn(
            collapsed
              ? "group relative h-12 w-12 border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface)] px-0 text-[var(--atlas-text-strong)] shadow-[0_16px_34px_rgba(15,23,42,0.18)]"
              : "w-full justify-start",
            "rounded-2xl bg-[color:var(--atlas-surface-soft)]/70 text-[var(--atlas-text-strong)] hover:bg-[color:var(--atlas-surface-hover)]",
=======
      <div className={cn("border-t border-[color:var(--atlas-border)] p-3", collapsed && "flex justify-center")}>
        <Button
          variant="ghost"
          className={cn(
            collapsed ? "h-10 w-10 px-0" : "w-full justify-start",
            "rounded-xl bg-[color:var(--atlas-surface-soft)]/60 text-[var(--atlas-text-strong)] shadow-sm hover:bg-[color:var(--atlas-surface-hover)] dark:shadow-[0_12px_24px_rgba(0,0,0,0.16)]",
>>>>>>> 0babf4d (Update frontend application)
          )}
          onClick={onLogout}
          aria-label="Logout"
        >
          <LogOut size={15} />
<<<<<<< HEAD
          {!collapsed ? "Logout" : null}
          {collapsed ? (
            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface)] px-2 py-1 text-xs text-[var(--atlas-text-strong)] opacity-0 shadow-lg transition group-hover:opacity-100">
              Logout
            </span>
          ) : null}
=======
          {!collapsed && "Logout"}
>>>>>>> 0babf4d (Update frontend application)
        </Button>
      </div>
    </div>
  );
}

export default function Sidebar({
  mobileOpen,
  onCloseMobile,
  onLogout,
  collapsed = false,
  onToggleCollapse,
<<<<<<< HEAD
  messageMenuHasNew = false,
  platformDataMode = "live",
  customApps = [],
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const demoSnapshot = React.useMemo(() => buildPlatformDemoSnapshot(customApps), [customApps]);
  const liveSnapshot = React.useMemo(() => buildPlatformLiveSnapshot(), []);
  const [pulseMetrics, setPulseMetrics] = React.useState(
    () => (platformDataMode === "demo" ? demoSnapshot.metrics : liveSnapshot.metrics),
  );
  const [pulseSource, setPulseSource] = React.useState(() => (platformDataMode === "demo" ? "demo" : "live"));
  const [hoveredPulseId, setHoveredPulseId] = React.useState("");

  React.useEffect(() => {
    if (platformDataMode === "demo") {
      setPulseMetrics(demoSnapshot.metrics);
      setPulseSource("demo");
      return;
    }

    let cancelled = false;

    async function loadPulseMetrics() {
      try {
        const response = await platformAxios.get(PLATFORM_ENDPOINTS.overview);
        const payload = unwrapApiResponse(response.data, "Failed to load platform overview");
        if (!cancelled) {
          setPulseMetrics({ ...liveSnapshot.metrics, ...(payload || {}) });
          setPulseSource("live");
        }
      } catch {
        if (!cancelled) {
          setPulseMetrics(liveSnapshot.metrics);
          setPulseSource("live");
        }
      }
    }

    loadPulseMetrics();

    return () => {
      cancelled = true;
    };
  }, [demoSnapshot.metrics, liveSnapshot.metrics, platformDataMode]);

  const pulseSignals = React.useMemo(
    () => buildSidebarPulseSignals(pulseMetrics, location.pathname),
    [location.pathname, pulseMetrics],
  );

  const handleOpenPulseTarget = React.useCallback(
    (targetPath) => {
      if (!targetPath) return;
      onCloseMobile?.();
      navigate(targetPath);
    },
    [navigate, onCloseMobile],
  );

=======
}) {
>>>>>>> 0babf4d (Update frontend application)
  return (
    <>
      <aside
        className={cn(
<<<<<<< HEAD
          "atlas-sidebar-shell hidden h-full shrink-0 border-r border-[color:var(--atlas-border)] backdrop-blur transition-[width] duration-300 xl:block",
=======
          "hidden shrink-0 border-r border-[color:var(--atlas-border)] backdrop-blur transition-[width] duration-300 xl:block",
>>>>>>> 0babf4d (Update frontend application)
          collapsed ? "w-20" : "w-72",
        )}
        style={{ background: "var(--atlas-sidebar-bg)" }}
      >
<<<<<<< HEAD
        <SidebarBody
          onOpenPulseTarget={handleOpenPulseTarget}
          onNavigate={undefined}
          onLogout={onLogout}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          messageMenuHasNew={messageMenuHasNew}
          pulseSignals={pulseSignals}
          pulseSource={pulseSource}
          hoveredPulseId={hoveredPulseId}
          onHoverPulse={setHoveredPulseId}
        />
=======
        <SidebarBody onNavigate={undefined} onLogout={onLogout} collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
>>>>>>> 0babf4d (Update frontend application)
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[80] xl:hidden">
          <div className="absolute inset-0 bg-[color:var(--atlas-overlay)]" onClick={onCloseMobile} />
          <aside
<<<<<<< HEAD
            className="atlas-sidebar-shell absolute left-0 top-0 h-full w-80 max-w-[88vw] border-r border-[color:var(--atlas-border)] shadow-2xl"
=======
            className="absolute left-0 top-0 h-full w-80 max-w-[88vw] border-r border-[color:var(--atlas-border)] shadow-2xl"
>>>>>>> 0babf4d (Update frontend application)
            style={{ background: "var(--atlas-sidebar-bg)" }}
          >
            <div className="flex items-center justify-end border-b border-[color:var(--atlas-border)] px-3 py-2">
              <button
                type="button"
                onClick={onCloseMobile}
                className="rounded-md p-1.5 text-[var(--atlas-text)] hover:bg-[color:var(--atlas-surface-soft)]"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarBody
<<<<<<< HEAD
              onOpenPulseTarget={handleOpenPulseTarget}
=======
>>>>>>> 0babf4d (Update frontend application)
              onNavigate={onCloseMobile}
              onLogout={onLogout}
              collapsed={false}
              onToggleCollapse={undefined}
              showCollapseToggle={false}
<<<<<<< HEAD
              showSupportPanels={false}
              messageMenuHasNew={messageMenuHasNew}
              pulseSignals={pulseSignals}
              pulseSource={pulseSource}
              hoveredPulseId={hoveredPulseId}
              onHoverPulse={setHoveredPulseId}
=======
>>>>>>> 0babf4d (Update frontend application)
            />
          </aside>
        </div>
      )}
    </>
  );
}
