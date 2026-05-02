import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Download,
  Droplets,
  Egg,
  LayoutGrid,
  Package,
  Plus,
  TrendingUp,
  Truck,
  Wheat,
  X,
  Feather,
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
    id: "export",
    label: "Export",
    action: "export",
    icon: Download,
    iconTone:
      "bg-blue-500/16 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
  },
]);

export default function WorkspaceBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeTenant } = useTenant();
  const [expanded, setExpanded] = React.useState(false);
  const rootRef = React.useRef(null);
  const poultryEnabled = hasFarmModule(activeTenant, FARM_MODULES.POULTRY);
  const fishEnabled = hasFarmModule(activeTenant, FARM_MODULES.FISH_FARMING);

  const isNavItemActive = React.useCallback(
    (to) => {
      const currentPath = location.pathname;
      if (to === KFARMS_ROUTE_REGISTRY.dashboard.appPath) {
        return currentPath === to;
      }
      return currentPath === to || currentPath.startsWith(`${to}/`);
    },
    [location.pathname]
  );

  const quickActions = React.useMemo(() => {
    if (!poultryEnabled) {
      return [
        ...BASE_QUICK_ACTIONS,
        {
          id: "inventory",
          label: "Stock",
          action: "inventory",
          icon: Package,
          iconTone:
            "bg-indigo-500/16 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200",
        },
      ];
    }

    return [
      ...BASE_QUICK_ACTIONS,
      {
        id: "eggs",
        label: "Egg",
        action: "eggs",
        icon: Egg,
        iconTone:
          "bg-amber-500/16 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
      },
      {
        id: "poultry-mortality",
        label: "Bird loss",
        action: "poultry-mortality",
        icon: Feather,
        iconTone:
          "bg-rose-500/16 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
      },
      ...(fishEnabled
        ? [
            {
              id: "fish-mortality",
              label: "Fish loss",
              action: "fish-mortality",
              icon: Droplets,
              iconTone:
                "bg-rose-500/16 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
            },
          ]
        : []),
      {
        id: "inventory",
        label: "Stock",
        action: "inventory",
        icon: Package,
        iconTone:
          "bg-indigo-500/16 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200",
      },
    ];
  }, [fishEnabled, poultryEnabled]);

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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[85] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.65rem)] md:hidden">
      <div ref={rootRef} className="pointer-events-auto relative mx-auto w-full max-w-[25.5rem]">
        <div
          className={`absolute inset-x-0 bottom-[6rem] z-20 transition-all duration-300 ${
            expanded
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0"
          }`}
        >
          <div className="rounded-[1.7rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,245,251,0.94))] px-2 py-2.5 shadow-[0_20px_40px_rgba(15,23,42,0.16)] backdrop-blur-2xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(8,17,32,0.98),rgba(11,25,45,0.96))]">
            <div className="grid grid-cols-3 gap-1.5">
              {quickActions.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleQuickAction(item.action)}
                    className="group flex min-w-0 flex-col items-center gap-1.5 rounded-[1.05rem] border border-slate-200/80 bg-white/90 px-1.5 py-2.5 text-center text-[0.62rem] font-semibold leading-tight text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-primary/28 hover:text-accent-primary dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:border-accent-primary/40"
                  >
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105 ${item.iconTone}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="block w-full truncate whitespace-nowrap text-[0.62rem] leading-none">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute left-1/2 top-0 z-0 h-[4.35rem] w-[7.4rem] -translate-x-1/2 -translate-y-[19%] overflow-hidden">
            <div className="absolute inset-x-[0.16rem] top-0 h-[4.12rem] rounded-[2.55rem] border border-slate-200/70 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.96),rgba(232,239,247,0.98)_58%,rgba(217,228,240,0.98)_100%)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_50%_0%,rgba(23,37,65,0.4),rgba(7,15,30,0.98)_62%,rgba(4,10,22,1)_100%)]" />
          </div>

          <div className="relative z-10 flex items-end justify-between gap-1 rounded-[1.7rem] border border-slate-200/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.91),rgba(239,245,251,0.93))] px-2.5 pb-2.5 pt-3.5 shadow-[0_16px_34px_rgba(15,23,42,0.14)] backdrop-blur-2xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(8,17,32,0.95),rgba(11,25,45,0.94))]">
          {NAV_ITEMS.slice(0, 2).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.to)}
                className={`relative z-10 group flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-[0.95rem] px-1 py-1.5 text-[0.58rem] font-semibold leading-[1.05rem] tracking-[0.01em] transition-all duration-200 ${
                  isNavItemActive(item.to)
                    ? "bg-accent-primary/10 text-accent-primary dark:bg-accent-primary/16 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                }`}
              >
                <span
                  className={`inline-flex h-[1.95rem] w-[1.95rem] items-center justify-center rounded-[0.9rem] transition-all duration-200 ${
                    isNavItemActive(item.to)
                      ? "bg-white text-accent-primary shadow-[0_8px_18px_rgba(37,99,235,0.16)] dark:bg-white/10 dark:text-white"
                      : "bg-slate-200/65 text-slate-600 group-hover:bg-slate-200 dark:bg-white/[0.05] dark:text-slate-200 dark:group-hover:bg-white/[0.08]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="block max-w-full whitespace-nowrap text-center">
                  {item.label}
                </span>
              </button>
            );
          })}

          <div className="w-[5.7rem] shrink-0" />

          {NAV_ITEMS.slice(2).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.to)}
                className={`relative z-10 group flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-[0.95rem] px-1 py-1.5 text-[0.58rem] font-semibold leading-[1.05rem] tracking-[0.01em] transition-all duration-200 ${
                  isNavItemActive(item.to)
                    ? "bg-accent-primary/10 text-accent-primary dark:bg-accent-primary/16 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                }`}
              >
                <span
                  className={`inline-flex h-[1.95rem] w-[1.95rem] items-center justify-center rounded-[0.9rem] transition-all duration-200 ${
                    isNavItemActive(item.to)
                      ? "bg-white text-accent-primary shadow-[0_8px_18px_rgba(37,99,235,0.16)] dark:bg-white/10 dark:text-white"
                      : "bg-slate-200/65 text-slate-600 group-hover:bg-slate-200 dark:bg-white/[0.05] dark:text-slate-200 dark:group-hover:bg-white/[0.08]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="block max-w-full whitespace-nowrap text-center">
                  {item.label}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? "Close quick actions" : "Open quick actions"}
            onClick={() => setExpanded((current) => !current)}
            className={`absolute left-1/2 top-0 z-30 inline-flex h-14 w-14 -translate-x-1/2 -translate-y-[22%] items-center justify-center rounded-full border border-white/25 text-white shadow-[0_16px_28px_rgba(37,99,235,0.24)] transition-all duration-300 ${
              expanded
                ? "bg-[linear-gradient(135deg,#0f172a,#1d4ed8)]"
                : "bg-[linear-gradient(135deg,#2563eb,#38bdf8)]"
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
    </div>
  );
}
