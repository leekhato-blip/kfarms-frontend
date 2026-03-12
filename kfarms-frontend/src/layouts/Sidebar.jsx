import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  Activity,
  Settings,
  LogOut,
  X,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import Button from "../components/Button";
import rootsLogo from "../assets/roots-logo.png";

const ATLAS_NAV_ITEMS = [
  { to: "/platform", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/platform/tenants", label: "Tenants", icon: Building2 },
  { to: "/platform/users", label: "Users", icon: Users },
  { to: "/platform/health", label: "Health", icon: Activity },
  { to: "/platform/settings", label: "Settings", icon: Settings },
];

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

function SidebarBody({
  onNavigate,
  onLogout,
  collapsed = false,
  onToggleCollapse,
  showCollapseToggle = true,
}) {
  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "relative border-b border-[color:var(--atlas-border)]",
          collapsed ? "px-3 py-3" : "px-5 py-4",
        )}
      >
        {showCollapseToggle && (
          <div className={cn(collapsed ? "mb-3 flex justify-center" : "absolute right-3 top-3")}>
            <button
              type="button"
              onClick={onToggleCollapse}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--atlas-surface-soft)]/75 text-[var(--atlas-text)] shadow-sm transition hover:bg-[color:var(--atlas-surface-hover)] dark:shadow-[0_10px_22px_rgba(0,0,0,0.2)]",
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
              </p>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-200">
            <Sparkles size={10} />
            Control Plane
          </div>
        )}
      </div>

      <nav className={cn("flex-1 space-y-1.5", collapsed ? "px-2 py-3" : "px-3 py-4")}>
        {ATLAS_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group relative flex items-center overflow-hidden rounded-xl py-2.5 text-sm transition-all duration-200 ${
                  collapsed ? "justify-center px-2.5" : "gap-2 px-3"
                } ${
                  isActive
                    ? "bg-gradient-to-r from-violet-500/20 via-blue-500/10 to-emerald-500/10 text-[var(--atlas-text-strong)] shadow-[0_12px_24px_rgba(15,23,42,0.14)] dark:shadow-[0_14px_28px_rgba(0,0,0,0.24)]"
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
                          ? "bg-gradient-to-b from-violet-300/90 via-blue-300/80 to-emerald-300/75 opacity-100 shadow-[0_0_12px_rgba(96,165,250,0.35)]"
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

      <div className={cn("border-t border-[color:var(--atlas-border)] p-3", collapsed && "flex justify-center")}>
        <Button
          variant="ghost"
          className={cn(
            collapsed ? "h-10 w-10 px-0" : "w-full justify-start",
            "rounded-xl bg-[color:var(--atlas-surface-soft)]/60 text-[var(--atlas-text-strong)] shadow-sm hover:bg-[color:var(--atlas-surface-hover)] dark:shadow-[0_12px_24px_rgba(0,0,0,0.16)]",
          )}
          onClick={onLogout}
          aria-label="Logout"
        >
          <LogOut size={15} />
          {!collapsed && "Logout"}
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
}) {
  return (
    <>
      <aside
        className={cn(
          "hidden shrink-0 border-r border-[color:var(--atlas-border)] backdrop-blur transition-[width] duration-300 xl:block",
          collapsed ? "w-20" : "w-72",
        )}
        style={{ background: "var(--atlas-sidebar-bg)" }}
      >
        <SidebarBody onNavigate={undefined} onLogout={onLogout} collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[80] xl:hidden">
          <div className="absolute inset-0 bg-[color:var(--atlas-overlay)]" onClick={onCloseMobile} />
          <aside
            className="absolute left-0 top-0 h-full w-80 max-w-[88vw] border-r border-[color:var(--atlas-border)] shadow-2xl"
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
              onNavigate={onCloseMobile}
              onLogout={onLogout}
              collapsed={false}
              onToggleCollapse={undefined}
              showCollapseToggle={false}
            />
          </aside>
        </div>
      )}
    </>
  );
}
