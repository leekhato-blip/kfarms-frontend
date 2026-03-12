import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Squares2X2Icon } from "@heroicons/react/16/solid";
import { NavLink } from "react-router-dom";
import { Droplets } from "lucide-react";
import kfarmsLogo from "../assets/Kfarms_logo.png";
import OrgSwitcher from "./OrgSwitcher";
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../tenant/TenantContext";
import { isPlanAtLeast, normalizePlanId } from "../constants/plans";
import { getCachedOrganizationSettings } from "../services/settingsService";
import { FARM_MODULES, hasFarmModule } from "../tenant/tenantModules";
import {
  getWorkspaceRoleLabel,
} from "../utils/workspaceRoles";
import {
  WORKSPACE_PERMISSIONS,
  hasAnyWorkspacePermission,
} from "../utils/workspacePermissions";
import {
  Archive,
  Crown,
  Settings,
  Truck,
  CreditCard,
  Egg,
  Feather,
  Wallet,
  Wheat,
  LifeBuoy,
  Building2,
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Squares2X2Icon, minPlan: "FREE" },
  { to: "/sales", label: "Sales", icon: Wallet, minPlan: "FREE" },
  { to: "/supplies", label: "Supplies", icon: Truck, minPlan: "FREE" },
  {
    to: "/fish-ponds",
    label: "Fish Ponds",
    icon: Droplets,
    minPlan: "FREE",
    modules: [FARM_MODULES.FISH_FARMING],
  },
  {
    to: "/poultry",
    label: "Poultry",
    icon: Feather,
    minPlan: "FREE",
    modules: [FARM_MODULES.POULTRY],
  },
  { to: "/feeds", label: "Feeds", icon: Wheat, minPlan: "FREE" },
  {
    to: "/productions",
    label: "Productions",
    icon: Egg,
    minPlan: "FREE",
    modules: [FARM_MODULES.POULTRY],
  },
  { to: "/inventory", label: "Inventory", icon: Archive, minPlan: "FREE" },
  {
    to: "/billing",
    label: "Billing",
    icon: CreditCard,
    minPlan: "FREE",
    allow: (tenant) =>
      hasAnyWorkspacePermission(tenant, [
        WORKSPACE_PERMISSIONS.BILLING_VIEW,
        WORKSPACE_PERMISSIONS.BILLING_MANAGE,
      ]),
  },
  { to: "/support", label: "Support", icon: LifeBuoy, minPlan: "FREE" },
  {
    to: "/users",
    label: "Users",
    icon: Users,
    minPlan: "PRO",
    allow: (tenant) =>
      hasAnyWorkspacePermission(tenant, [
        WORKSPACE_PERMISSIONS.USERS_VIEW,
        WORKSPACE_PERMISSIONS.USERS_MANAGE,
        WORKSPACE_PERMISSIONS.AUDIT_VIEW,
      ]),
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
    minPlan: "FREE",
    allow: (tenant) =>
      hasAnyWorkspacePermission(tenant, [
        WORKSPACE_PERMISSIONS.SETTINGS_VIEW,
        WORKSPACE_PERMISSIONS.SETTINGS_MANAGE,
      ]),
  },
];

function PlanBadge({ planId }) {
  if (planId === "PRO") {
    return (
      <span className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-200">
        Pro
      </span>
    );
  }

  if (planId === "ENTERPRISE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/45 bg-gradient-to-r from-amber-400/18 via-yellow-300/14 to-orange-400/16 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700 shadow-[0_8px_18px_rgba(245,158,11,0.12)] dark:border-amber-300/25 dark:from-amber-300/18 dark:via-yellow-200/10 dark:to-orange-300/16 dark:text-amber-100">
        <Crown className="h-3 w-3" />
        Enterprise
      </span>
    );
  }

  return null;
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { activeTenant } = useTenant();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const userMenuRef = React.useRef(null);
  const currentPlan = normalizePlanId(activeTenant?.plan, "FREE");
  const cachedBranding = React.useMemo(
    () =>
      activeTenant?.tenantId
        ? getCachedOrganizationSettings({ tenantId: activeTenant.tenantId })
        : null,
    [activeTenant?.tenantId],
  );
  const visibleNavItems = navItems.filter((item) =>
    isPlanAtLeast(currentPlan, item.minPlan || "FREE") &&
    (!item.allow || item.allow(activeTenant)) &&
    (!Array.isArray(item.modules) ||
      item.modules.length === 0 ||
      item.modules.some((moduleId) => hasFarmModule(activeTenant, moduleId))),
  );
  const displayName = user?.username || "Farmer";
  const displayRole =
    activeTenant?.roleLabel || getWorkspaceRoleLabel(activeTenant?.myRole || user?.role || "STAFF");
  const enterpriseBrandingEnabled = currentPlan === "ENTERPRISE";
  const brandLogo =
    enterpriseBrandingEnabled && cachedBranding?.logoUrl ? cachedBranding.logoUrl : kfarmsLogo;
  const brandName = enterpriseBrandingEnabled
    ? cachedBranding?.organizationName || activeTenant?.name || "KFarms"
    : "KFarms";
  const brandPrimaryColor =
    enterpriseBrandingEnabled && cachedBranding?.brandPrimaryColor
      ? cachedBranding.brandPrimaryColor
      : "#2563EB";
  const badge = <PlanBadge planId={currentPlan} />;
  const avatarUrl =
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName,
    )}&background=4ADE80&color=fff&rounded=true&size=64`;

  React.useEffect(() => {
    const onClickOutside = (event) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    const onEscape = (event) => {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
        setConfirmingLogout(false);
      }
    };

    document.addEventListener("click", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("click", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  React.useEffect(() => {
    if (!open) {
      setUserMenuOpen(false);
    }
  }, [open]);

  return (
    <aside
      className={`
        relative z-40 h-screen sticky top-0 border-r border-slate-200/70 bg-gray-50 shadow-soft dark:border-slate-800/60 dark:bg-darkCard
        transition-[width,padding] duration-300 ease-in-out
        flex flex-col
        ${open ? "w-52 p-3 sm:w-56 sm:p-4 md:w-60 md:p-5" : "w-20 px-2 py-4 sm:w-24 sm:px-3 sm:py-5"}
      `}
    >
      {/* Toggle Button */}
      {!open && (
        <div className="flex justify-center mb-4 font-body">
          <button
            onClick={() => setOpen(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300/70 bg-white/70 text-slate-700 transition hover:bg-accent-primary/20 sm:h-9 sm:w-9 dark:border-slate-700 dark:bg-darkCard dark:text-gray-200 dark:hover:bg-accent-primary/25"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header (open state) */}
      <div
        className={`
          relative transition-all duration-300 overflow-hidden
          ${open ? "opacity-100 max-h-44" : "opacity-0 max-h-0"}
        `}
      >
        <div className="mb-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-9 w-9 shrink-0 grid place-items-center overflow-hidden sm:h-11 sm:w-11 md:h-12 md:w-12">
                <img
                  src={brandLogo}
                  alt={brandName}
                  className="h-full w-full object-contain scale-[2] saturate-110 contrast-110"
                />
              </div>

              <div className="min-w-0 pt-1">
                <div
                  className="text-xl leading-none font-semibold font-header text-gray-800 sm:text-[1.35rem] md:text-[1.45rem] dark:text-gray-200"
                  style={{ color: brandPrimaryColor }}
                >
                  {brandName}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <div className="whitespace-nowrap text-xs font-body text-gray-500 dark:text-gray-400">
                    {displayRole}
                  </div>
                  {badge}
                </div>
                <div className="sr-only">
                  Signed in as {displayName}
                </div>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-300/70 bg-white/70 text-slate-700 transition hover:bg-accent-primary/20 sm:h-9 sm:w-9 dark:border-slate-700 dark:bg-darkCard dark:text-gray-200 dark:hover:bg-accent-primary/25"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Closed state logo */}
      {!open && (
        <div className="flex flex-col items-center mb-6">
          <div className="h-9 w-9 grid place-items-center overflow-hidden sm:h-11 sm:w-11 md:h-12 md:w-12">
            <img
              src={brandLogo}
              alt={brandName}
              className="h-full w-full object-contain scale-[2] saturate-110 contrast-110"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 flex flex-col gap-1 font-body ${open ? "" : "items-center"}`}>
        {visibleNavItems.map((it) => {
          const Icon = it.icon;

          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) => `
  group relative flex items-center rounded-lg transition-all duration-200
  ${open ? "w-full gap-2 px-2.5 py-1.5 border-l-4 sm:gap-3 sm:px-3 sm:py-2" : "h-10 w-10 justify-center border-l-0 sm:h-11 sm:w-11"}

  ${
    isActive && open
      ? "bg-accent-primary text-white border-accent-primary"
      : isActive && !open
        ? "bg-accent-primary/20 text-accent-primary"
        : open
          ? "border-transparent text-gray-700 dark:text-gray-200 hover:bg-accent-primary/25 hover:text-white"
          : "text-gray-700 dark:text-gray-200 hover:bg-accent-primary/10"
  }
`}
            >
              <Icon className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6 md:h-7 md:w-7" />

              {/* Label */}
              <span
                className={`
                  whitespace-nowrap transition-all duration-300
                  ${
                    open
                      ? "opacity-100 translate-x-0"
                      : "w-0 overflow-hidden opacity-0 -translate-x-3"
                  }
                `}
              >
                {it.label}
              </span>

              {/* Tooltip (collapsed) */}
              {!open && (
                <span
                  className="
                    absolute left-full z-[80] ml-3 rounded-lg border border-accent-primary/30
                    bg-white px-3 py-1 text-sm text-slate-700 shadow-soft opacity-0
                    transition duration-200 group-hover:opacity-100 whitespace-nowrap
                    dark:bg-darkCard dark:text-darkText
                  "
                >
                  {it.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-3 border-t border-slate-200/30 pt-3 dark:border-slate-700/40">
        {open ? (
          <div className="space-y-2">
            <OrgSwitcher dropUp fullWidth />

            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((state) => !state)}
                className="flex w-full items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-left transition hover:bg-white/85 dark:border-slate-700 dark:bg-white/5 dark:hover:bg-white/10"
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
                aria-label="User menu"
              >
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                    {displayName}
                  </div>
                  <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {displayRole}
                  </div>
                </div>
                <ChevronDown
                  className={`ml-auto h-4 w-4 text-slate-400 transition ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`absolute bottom-full left-0 z-[90] mb-2 w-full origin-bottom overflow-hidden rounded-lg border border-white/10 bg-white shadow-lg transition-all dark:border-slate-700 dark:bg-darkCard ${
                  userMenuOpen
                    ? "scale-100 opacity-100"
                    : "pointer-events-none scale-95 opacity-0"
                }`}
              >
                <div className="p-3 text-sm">
                  Signed in as{" "}
                  <div className="truncate font-medium">
                    {user?.email || user?.username || "No account"}
                  </div>
                </div>
                <div className="border-t p-2 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingLogout(true);
                      setUserMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-red-600 p-2 text-white hover:opacity-95"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="group relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300/70 bg-white/70 text-slate-700 transition hover:bg-accent-primary/20 dark:border-slate-700 dark:bg-darkCard dark:text-gray-200 dark:hover:bg-accent-primary/25"
              aria-label="Open workspace switcher"
            >
              <Building2 className="h-4 w-4" />
              <span className="pointer-events-none absolute left-full z-[80] ml-3 whitespace-nowrap rounded-lg border border-accent-primary/30 bg-white px-3 py-1 text-sm text-slate-700 opacity-0 transition group-hover:opacity-100 dark:bg-darkCard dark:text-darkText">
                Workspace
              </span>
            </button>

            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((state) => !state)}
                className="group relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-300/70 bg-white/70 transition hover:bg-accent-primary/10 dark:border-slate-700 dark:bg-darkCard"
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
                aria-label="User menu"
              >
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              </button>

              <div
                className={`absolute bottom-0 left-full z-[90] ml-2 w-56 origin-left overflow-hidden rounded-lg border border-white/10 bg-white shadow-lg transition-all dark:border-slate-700 dark:bg-darkCard ${
                  userMenuOpen
                    ? "scale-100 opacity-100"
                    : "pointer-events-none scale-95 opacity-0"
                }`}
              >
                <div className="p-3 text-sm">
                  Signed in as{" "}
                  <div className="truncate font-medium">
                    {user?.email || user?.username || "No account"}
                  </div>
                </div>
                <div className="border-t p-2 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingLogout(true);
                      setUserMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-red-600 p-2 text-white hover:opacity-95"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {(typeof document !== "undefined" && confirmingLogout)
        ? createPortal(
            <div className="fixed inset-0 z-[12000] grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-xl border border-slate-200/80 bg-white/95 p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900/95">
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Confirm logout
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Are you sure you want to logout?
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingLogout(false)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingLogout(false);
                      logout();
                    }}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-500"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </aside>
  );
}
