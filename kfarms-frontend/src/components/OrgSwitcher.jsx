import React from "react";
import { Link } from "react-router-dom";
import { Building2, Check, ChevronDown } from "lucide-react";
import { useTenant } from "../tenant/TenantContext";
import { normalizePlanId } from "../constants/plans";

function formatLabel(value, fallback) {
  if (!value) return fallback;
  return String(value).replace(/_/g, " ");
}

export default function OrgSwitcher({ dropUp = false, fullWidth = false }) {
  const {
    tenants,
    activeTenant,
    activeTenantId,
    loadingTenants,
    tenantSwitchMessage,
    refreshTenants,
    setActiveTenant,
    clearTenantSwitchMessage,
  } = useTenant();

  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);

  React.useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEsc = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("click", handleOutsideClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const toggleMenu = () => {
    if (!open) {
      refreshTenants().catch(() => {
        // Keep existing tenant list if refresh fails.
      });
    }
    setOpen((state) => !state);
  };

  const handleTenantSelect = (tenant) => {
    const status = String(tenant?.status || "").toUpperCase();
    if (status === "SUSPENDED") return;

    const tenantId = Number(tenant?.tenantId);
    if (!Number.isFinite(tenantId)) return;
    if (tenantId === Number(activeTenantId)) {
      setOpen(false);
      return;
    }

    clearTenantSwitchMessage();
    setActiveTenant(tenantId);
    setOpen(false);
    window.dispatchEvent(
      new CustomEvent("kf-tenant-changed", {
        detail: { tenantId },
      }),
    );
    window.location.reload();
  };

  const menuPositionClass = dropUp
    ? fullWidth
      ? "bottom-full left-0 mb-2 origin-bottom-left"
      : "bottom-full right-0 mb-2 origin-bottom-right"
    : fullWidth
      ? "left-0 mt-2 origin-top-left"
      : "right-0 mt-2 origin-top-right";

  const menuWidthClass = fullWidth
    ? "w-[min(20rem,calc(100vw-1.25rem))] max-w-[calc(100vw-1.25rem)]"
    : "w-80 max-w-[calc(100vw-2rem)]";

  return (
    <div ref={rootRef} className={`relative ${fullWidth ? "w-full" : ""}`}>
      <button
        type="button"
        onClick={toggleMenu}
        className={`flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-left transition hover:bg-white/85 dark:border-slate-700 dark:bg-white/5 dark:hover:bg-white/10 ${
          fullWidth ? "w-full justify-between" : ""
        }`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Switch farm"
      >
        <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        <div className="leading-tight">
          <div className="max-w-[9rem] truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
            {activeTenant?.name || "Choose farm"}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {activeTenant?.myRole || "No role selected"}
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition dark:text-slate-300 ${open ? "rotate-180" : ""}`} />
      </button>

      <div
        className={`absolute overflow-hidden rounded-xl border border-white/10 bg-lightbg shadow-lg transition-all dark:border-slate-700 dark:bg-darkCard z-[70] ${menuPositionClass} ${menuWidthClass} ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        }`}
      >
        {tenantSwitchMessage && (
          <div className="border-b border-amber-400/20 bg-amber-100/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-400/30 dark:bg-amber-900/20 dark:text-amber-200">
            {tenantSwitchMessage}
          </div>
        )}

        <div className="border-b border-white/10 px-3 py-2 text-xs text-slate-500 dark:border-slate-800">
          Your farms
        </div>

        <div className="max-h-72 overflow-y-auto">
          {loadingTenants && (
            <div className="px-3 py-3 text-sm text-slate-500">Loading your farms…</div>
          )}

          {!loadingTenants && tenants.length === 0 && (
            <div className="px-3 py-3 text-sm text-slate-500">
              You don&apos;t have a farm here yet. Create one to get started.
            </div>
          )}

          {!loadingTenants &&
            tenants.map((tenant) => {
              const tenantId = Number(tenant?.tenantId);
              const isActive = tenantId === Number(activeTenantId);
              const status = String(tenant?.status || "").toUpperCase();
              const isSuspended = status === "SUSPENDED";

              return (
                <button
                  key={tenantId || tenant?.slug || tenant?.name}
                  type="button"
                  onClick={() => handleTenantSelect(tenant)}
                  disabled={isSuspended}
                  className={`w-full border-b border-white/5 px-3 py-3 text-left transition dark:border-slate-800 ${
                    isSuspended
                      ? "cursor-not-allowed opacity-55"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{tenant?.name || "Untitled farm"}</div>
                      <div className="text-xs text-slate-500">
                        Role: {tenant?.myRole || "Member"}
                      </div>
                    </div>
                    {isActive && <Check className="mt-0.5 h-4 w-4 text-emerald-500" />}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {normalizePlanId(tenant?.plan, "FREE")}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        isSuspended
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      }`}
                    >
                      {formatLabel(status, "ACTIVE")}
                    </span>
                  </div>
                </button>
              );
            })}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-white/10 px-3 py-2 text-xs dark:border-slate-800">
          <Link
            to="/onboarding/create-tenant"
            onClick={() => setOpen(false)}
            className="rounded-md border border-white/10 px-2 py-1.5 text-center hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Create farm
          </Link>
          <Link
            to="/onboarding/accept-invite"
            onClick={() => setOpen(false)}
            className="rounded-md border border-white/10 px-2 py-1.5 text-center hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Join by invite
          </Link>
        </div>
      </div>
    </div>
  );
}
