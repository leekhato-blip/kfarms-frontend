import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Feather,
  LayoutGrid,
  Package,
  Plus,
  TrendingUp,
  Truck,
  Wheat,
  X,
} from "lucide-react";
import { KFARMS_ROUTE_REGISTRY } from "../apps/kfarms/paths";
import { WORKSPACE_QUICK_ACTION_EVENT } from "../constants/workspaceQuickActions";
import { FARM_MODULES, hasFarmModule } from "../tenant/tenantModules";
import { useTenant } from "../tenant/TenantContext";

const NAV_ITEMS = Object.freeze([
  {
    id: "dashboard",
    label: "Home",
    to: KFARMS_ROUTE_REGISTRY.dashboard.appPath,
    icon: LayoutGrid,
  },
  {
    id: "sales",
    label: "Sales",
    to: KFARMS_ROUTE_REGISTRY.sales.appPath,
    icon: TrendingUp,
  },
  {
    id: "supplies",
    label: "Supplies",
    to: KFARMS_ROUTE_REGISTRY.supplies.appPath,
    icon: Truck,
  },
  {
    id: "inventory",
    label: "Stock",
    to: KFARMS_ROUTE_REGISTRY.inventory.appPath,
    icon: Package,
  },
]);

const BASE_QUICK_ACTIONS = Object.freeze([
  {
    id: "sales",
    label: "Sale",
    action: "sales",
    icon: TrendingUp,
    iconTone:
      "bg-emerald-500/16 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  },
  {
    id: "supplies",
    label: "Buy",
    action: "supplies",
    icon: Truck,
    iconTone: "bg-sky-500/16 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
  },
  {
    id: "feeds",
    label: "Feed",
    action: "feeds",
    icon: Wheat,
    iconTone:
      "bg-amber-500/16 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  },
  {
    id: "inventory",
    label: "Stock",
    action: "inventory",
    icon: Package,
    iconTone:
      "bg-indigo-500/16 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200",
  },
]);

export default function WorkspaceBottomNav() {
  const location = useLocation();
  const { activeTenant } = useTenant();
  const [expanded, setExpanded] = React.useState(false);
  const rootRef = React.useRef(null);
  const poultryEnabled = hasFarmModule(activeTenant, FARM_MODULES.POULTRY);

  const quickActions = React.useMemo(() => {
    if (!poultryEnabled) {
      return BASE_QUICK_ACTIONS;
    }

    return [
      ...BASE_QUICK_ACTIONS,
      {
        id: "poultry",
        label: "Flock",
        action: "poultry",
        icon: Feather,
        iconTone:
          "bg-violet-500/16 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
      },
    ];
  }, [poultryEnabled]);

  React.useEffect(() => {
    setExpanded(false);
  }, [location.pathname, location.search]);

  React.useEffect(() => {
    if (!expanded) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setExpanded(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setExpanded(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [expanded]);

  const handleQuickAction = (action) => {
    window.dispatchEvent(
      new CustomEvent(WORKSPACE_QUICK_ACTION_EVENT, {
        detail: { action },
      }),
    );
    setExpanded(false);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[85] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.85rem)] md:hidden">
      <div ref={rootRef} className="pointer-events-auto mx-auto w-full max-w-[26rem]">
        <div
          className={`absolute inset-x-3 bottom-[4.85rem] transition-all duration-300 ${
            expanded
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0"
          }`}
        >
          <div className="rounded-[1.75rem] border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(233,244,255,0.92))] p-2.5 shadow-[0_26px_52px_rgba(15,23,42,0.2)] backdrop-blur-2xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(9,18,39,0.96),rgba(10,27,49,0.94))]">
            <div
              className={`grid gap-2 ${
                quickActions.length > 4 ? "grid-cols-5" : "grid-cols-4"
              }`}
            >
              {quickActions.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleQuickAction(item.action)}
                    className="group flex min-w-0 flex-col items-center gap-1.5 rounded-[1.25rem] border border-slate-200/65 bg-white/90 px-2 py-2.5 text-center text-[0.66rem] font-semibold text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-primary/28 hover:text-accent-primary dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:border-accent-primary/40"
                  >
                    <span
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 ${item.iconTone}`}
                    >
                      <Icon className="h-[1.05rem] w-[1.05rem]" />
                    </span>
                    <span className="block truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative flex items-end justify-between gap-1 rounded-[1.95rem] border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(235,244,255,0.9))] px-3 pb-2.5 pt-2 shadow-[0_22px_50px_rgba(15,23,42,0.22)] backdrop-blur-2xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(8,17,32,0.96),rgba(9,25,46,0.94))]">
          {NAV_ITEMS.slice(0, 2).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.to}
                className={({ isActive }) =>
                  `group flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[1.25rem] px-2 py-2 text-[0.68rem] font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-[linear-gradient(180deg,rgba(37,99,235,0.16),rgba(59,130,246,0.08))] text-accent-primary dark:bg-[linear-gradient(180deg,rgba(37,99,235,0.24),rgba(37,99,235,0.08))] dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-200 ${
                        isActive
                          ? "bg-white/85 text-accent-primary shadow-[0_10px_24px_rgba(37,99,235,0.18)] dark:bg-white/10 dark:text-white"
                          : "bg-slate-200/65 text-slate-600 group-hover:bg-slate-200 dark:bg-white/[0.05] dark:text-slate-200 dark:group-hover:bg-white/[0.08]"
                      }`}
                    >
                      <Icon className="h-[1.05rem] w-[1.05rem]" />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          <div className="w-[4.55rem] shrink-0" />

          {NAV_ITEMS.slice(2).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.to}
                className={({ isActive }) =>
                  `group flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[1.25rem] px-2 py-2 text-[0.68rem] font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-[linear-gradient(180deg,rgba(37,99,235,0.16),rgba(59,130,246,0.08))] text-accent-primary dark:bg-[linear-gradient(180deg,rgba(37,99,235,0.24),rgba(37,99,235,0.08))] dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-200 ${
                        isActive
                          ? "bg-white/85 text-accent-primary shadow-[0_10px_24px_rgba(37,99,235,0.18)] dark:bg-white/10 dark:text-white"
                          : "bg-slate-200/65 text-slate-600 group-hover:bg-slate-200 dark:bg-white/[0.05] dark:text-slate-200 dark:group-hover:bg-white/[0.08]"
                      }`}
                    >
                      <Icon className="h-[1.05rem] w-[1.05rem]" />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          <button
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? "Close quick actions" : "Open quick actions"}
            onClick={() => setExpanded((current) => !current)}
            className={`absolute left-1/2 top-0 inline-flex h-14 w-14 -translate-x-1/2 -translate-y-[38%] items-center justify-center rounded-full border border-white/20 text-white shadow-[0_20px_40px_rgba(37,99,235,0.34)] transition-all duration-300 ${
              expanded
                ? "bg-[linear-gradient(135deg,#0f172a,#1d4ed8)]"
                : "bg-[linear-gradient(135deg,#1d4ed8,#38bdf8)]"
            }`}
          >
            <span
              className={`inline-flex items-center justify-center transition-transform duration-300 ${
                expanded ? "rotate-180 scale-105" : "rotate-0"
              }`}
            >
              {expanded ? (
                <X className="h-5 w-5" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
