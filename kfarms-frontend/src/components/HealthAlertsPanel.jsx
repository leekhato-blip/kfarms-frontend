import React, { useMemo, useState, useEffect } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Phone,
  ChevronDown,
} from "lucide-react";

export default function HealthAlertsPanel({
  alerts = [],
  onAcknowledge = () => {},
  onCall = () => {},
}) {
  const MOBILE_LIMIT = 3;

  const [filter, setFilter] = useState("ALL");
  const [isMobile, setIsMobile] = useState(false);
  const [showAllMobile, setShowAllMobile] = useState(false);

  /* Responsive detection */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(max-width: 639px)");
    const handler = (e) => setIsMobile(e.matches);

    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);

    return () => mq.removeEventListener("change", handler);
  }, []);

  /* Reset mobile expansion on filter change */
  useEffect(() => {
    setShowAllMobile(false);
  }, [filter]);

  const severityMap = {
    CRITICAL: {
      label: "Critical",
      colorClass:
        "bg-gradient-to-br from-[#FF0078] via-[#FF3D00] to-[#FFB74D] text-white",
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    WARNING: {
      label: "Warning",
      colorClass:
        "bg-gradient-to-br from-[#FFD54F] via-[#FFB300] to-[#FF6D00] text-black",
      icon: <Bell className="w-4 h-4" />,
    },
    INFO: {
      label: "Info",
      colorClass:
        "bg-gradient-to-br from-[#7EE7FF] via-[#4FC3F7] to-[#3B82F6] text-black",
      icon: <CheckCircle className="w-4 h-4" />,
    },
  };

  const filtered = useMemo(() => {
    if (filter === "ALL") return alerts;
    return alerts.filter((a) => a.severity === filter || a.category === filter);
  }, [alerts, filter]);

  const visibleAlerts = useMemo(() => {
    if (!isMobile) return filtered;
    if (showAllMobile) return filtered;
    return filtered.slice(0, MOBILE_LIMIT);
  }, [filtered, isMobile, showAllMobile]);

  /* Empty State */
  const renderEmpty = () => (
    <div className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3 px-4 text-center font-body">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-xl">
        ⚠️
      </div>
      <h4 className="text-sm font-semibold font-header text-slate-700 dark:text-slate-100">
        No alerts
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
        Any info alerts will appear here.
      </p>
    </div>
  );

  return (
    <div className="bg-white dark:bg-darkCard dark:shadow-dark shadow-neo p-4 rounded-xl w-full">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        {/* <div className="text-center sm:text-left">
          
          <h3 className="text-lg font-semibold font-header">
            Health Alerts
          </h3>
          <p className="text-xs text-slate-400 font-body">
            Diagnoses issues and recommends actions
          </p>
        </div> */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-gradient-to-br from-[#FF0078] via-[#FF3D00] to-[#FFB74D]">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold font-header">Health Alerts</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Diagnoses issues and recommends actions
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 font-body">
          <FilterChip
            label="All"
            active={filter === "ALL"}
            onClick={() => setFilter("ALL")}
          />
          <FilterChip
            label="Critical"
            active={filter === "CRITICAL"}
            onClick={() => setFilter("CRITICAL")}
          />
          <FilterChip
            label="Warning"
            active={filter === "WARNING"}
            onClick={() => setFilter("WARNING")}
          />
          <FilterChip
            label="Info"
            active={filter === "INFO"}
            onClick={() => setFilter("INFO")}
          />
        </div>
      </div>

      {/* Alerts */}
      {filtered.length === 0 ? (
        renderEmpty()
      ) : (
        <>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-start">
            {visibleAlerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                meta={severityMap[alert.severity] || severityMap.INFO}
                onAcknowledge={onAcknowledge}
                onCall={onCall}
              />
            ))}
          </div>

          {/* Mobile toggle */}
          {isMobile && filtered.length > MOBILE_LIMIT && (
            <div className="flex justify-center mt-4 font-body">
              <button
                onClick={() => setShowAllMobile((v) => !v)}
                className={`text-xs px-3 py-1 rounded ${
                  showAllMobile
                    ? "bg-slate-200 dark:bg-slate-800"
                    : "bg-accent-primary text-white"
                }`}
              >
                {showAllMobile ? "Show less" : `View all (${filtered.length})`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* Alert Item */
function AlertItem({ alert, meta, onAcknowledge, onCall }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col w-full border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-sm font-body">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 flex items-center justify-center rounded ${meta.colorClass}`}
        >
          {meta.icon}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold font-header text-sm truncate">
            {alert.title}
          </p>
          <div className="text-xs text-slate-400">
            {formatDate(alert.triggeredAt)}
          </div>
        </div>
      </div>

      {alert.contextNote && (
        <div className="text-xs text-slate-500 mt-1 truncate">
          {alert.contextNote}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-2">
        <button
          onClick={() => onAcknowledge(alert.id)}
          className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800"
        >
          Acknowledge
        </button>

        {alert.contact && (
          <button
            onClick={() => onCall(alert.contact)}
            className="text-xs px-2 py-1 rounded bg-green-500 text-white flex items-center gap-1"
          >
            <Phone className="w-4 h-4" />
          </button>
        )}

        {alert.adviceSteps?.length > 0 && (
          <button
            onClick={() => setOpen(!open)}
            className="text-xs text-accent-primary flex items-center gap-1"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
            {open ? "Close steps" : "Recommended steps"}
          </button>
        )}
      </div>

      {alert.adviceSteps?.length > 0 && (
        <div
          className="overflow-hidden transition-[max-height] duration-300 mt-2"
          style={{
            maxHeight: open ? `${alert.adviceSteps.length * 24}px` : "0",
          }}
        >
          <ul className="space-y-1">
            {alert.adviceSteps.map((step, i) => (
              <li
                key={i}
                className="flex gap-2 text-xs text-slate-600 dark:text-slate-300"
              >
                <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-accent-primary" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* Filter Chip */
function FilterChip({ label, active, onClick }) {
  const tooltip =
    label === "All" ? "Show all alerts" : `Show ${label.toLowerCase()} alerts`;
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      title={tooltip}
      className={`text-xs px-3 py-1 rounded whitespace-nowrap font-body ${
        active
          ? "bg-accent-primary text-white"
          : "bg-slate-100 dark:bg-slate-800 text-slate-600"
      }`}
    >
      {label}
    </button>
  );
}

/* Date Helper */
function formatDate(iso) {
  try {
    const d = new Date(String(iso).replace(" ", "T"));
    if (isNaN(d.getTime())) return iso || "—";
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso || "—";
  }
}
