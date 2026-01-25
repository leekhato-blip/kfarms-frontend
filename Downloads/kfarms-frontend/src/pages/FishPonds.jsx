import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import SummaryCard from "../components/SummaryCard";
import GlassToast from "../components/GlassToast";
import ConfirmModal from "../components/ConfirmModal";
import { getFishPonds, getFishPondSummary } from "../services/fishPondService";
import {
  getFishHatches,
  getFishHatchSummary,
} from "../services/fishHatchService";

// icons
import {
  Plus,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Egg,
  AlertTriangle,
  SlidersHorizontal,
  BarChart3,
  Percent,
  Clock,
} from "lucide-react";
import { TbFish } from "react-icons/tb";

// charts
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  BarElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const neonShadowPlugin = {
  id: "neonShadow",
  beforeDatasetsDraw(chart, args, options) {
    if (chart.config.type !== "line") return;
    const ctx = chart.ctx;
    ctx.save();
    ctx.shadowColor = options.colorFallback || "rgba(127,90,240,0.9)";
    ctx.shadowBlur = typeof options.blur === "number" ? options.blur : 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  },
  afterDatasetsDraw(chart) {
    if (chart.config.type !== "line") return;
    chart.ctx.restore();
  },
};
ChartJS.register(neonShadowPlugin);

/* -------------------- Mobile Helpers -------------------- */

function MobileSummaryPager({ pages }) {
  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="font-header font-semibold text-sm">Summary</h2>
        <span className="text-xs text-slate-400">Swipe →</span>
      </div>

      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory">
        {pages.map((page, idx) => (
          <div key={idx} className="w-full min-w-full snap-start">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-xs font-semibold text-slate-400">
                {page.title}
              </h3>
              <span className="text-[11px] text-slate-500">
                {idx + 1}/{pages.length}
              </span>
            </div>

            {/* 2 cols x 2 rows */}
            <div className="grid grid-cols-2 gap-3">
              {page.items.map((it, i) => (
                <SummaryCard
                  key={i}
                  icon={it.icon}
                  title={it.title}
                  value={it.value}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileAccordion({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="md:hidden rounded-xl bg-white/10 dark:bg-darkCard/70 border border-white/10 dark:shadow-dark shadow-neo">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-header font-semibold">{title}</span>
        </div>
        <span className="text-xs text-slate-400">{open ? "Hide" : "Show"}</span>
      </button>

      {open && <div className="p-4 pt-0">{children}</div>}
    </div>
  );
}

export default function FishPondsPage() {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [showHeaderTooltips, setShowHeaderTooltips] = useState(true);

  useEffect(() => {
    const updateTheme = () =>
      setIsDark(document.documentElement.classList.contains("dark"));

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setShowHeaderTooltips(true);
      return;
    }
    const timer = setTimeout(() => setShowHeaderTooltips(false), 4000);
    return () => clearTimeout(timer);
  }, [isMobile]);

  const axisTextColor = isDark ? "#E5EDFF" : "#334155";
  const gridColor = isDark ? "rgba(127,90,240,0.08)" : "rgba(15,23,42,0.08)";

  // ------------------- DATA STATES -------------------
  const [ponds, setPonds] = useState([]);
  const [hatches, setHatches] = useState([]);
  const hasPondsData = ponds.length > 0;
  const hasHatchesData = hatches.length > 0;

  const [loadingPonds, setLoadingPonds] = useState(true);
  const [loadingHatches, setLoadingHatches] = useState(true);

  const [pondMeta, setPondMeta] = useState({
    page: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });

  // Filters (match your style)
  const [pondFilters, setPondFilters] = useState({
    pondName: "",
    pondType: "",
    status: "",
    lastWaterChange: "",
  });
  const hasActivePondFilters = Boolean(
    pondFilters.pondName ||
      pondFilters.pondType ||
      pondFilters.status ||
      pondFilters.lastWaterChange,
  );

  // Summary (two summary zones: ponds + hatch)
  const [pondSummary, setPondSummary] = useState({
    totalFishPonds: 0,
    totalFishes: 0,
    totalQuantity: 0,
    totalMortality: 0,
  });

  const [hatchSummary, setHatchSummary] = useState({
    totalHatchRecords: 0,
    fryHatchedTotal: 0, // optional (placeholder)
    avgHatchRate: 0, // optional (placeholder)
    dueWaterChangeCount: 0, // optional (placeholder)
  });

  // Alerts (kept as list for UI)
  const [alerts, setAlerts] = useState([]);

  // Modals + toast like Supplies
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ------------------- FETCH (hook these to your services) -------------------
  async function fetchPonds(page = 0) {
    setLoadingPonds(true);
    try {
      const res = await getFishPonds({ page, size: 10, ...pondFilters });
      const items = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res)
          ? res
          : [];
      setPonds(items);
      setPondMeta({
        page: res?.page ?? page,
        totalPages: res?.totalPages ?? 0,
        hasNext: res?.hasNext ?? false,
        hasPrevious: res?.hasPrevious ?? false,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPonds(false);
    }
  }

  async function fetchHatches() {
    setLoadingHatches(true);
    try {
      const res = await getFishHatches();
      setHatches(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHatches(false);
    }
  }

  async function fetchSummaries() {
    try {
      const [pondRes, hatchRes] = await Promise.all([
        getFishPondSummary(),
        getFishHatchSummary(),
      ]);

      setPondSummary(pondRes || {});
      setHatchSummary(hatchRes || {});

      const alertSource = pondRes?.alerts;
      const alertItems = Array.isArray(alertSource)
        ? alertSource
        : alertSource && typeof alertSource === "object"
          ? Object.values(alertSource)
          : [];
      setAlerts(alertItems);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchPonds(0);
    fetchHatches();
    fetchSummaries();
  }, [pondFilters]);

  function clearPondFilters() {
    setPondFilters({
      pondName: "",
      pondType: "",
      status: "",
      lastWaterChange: "",
    });
  }

  const isLoadingSummary = loadingPonds || loadingHatches;

  function formatSummaryCount(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric === 0) return "—";
    return numeric.toLocaleString();
  }

  // ------------------- SUMMARY CARDS (Desktop grid / Mobile carousel) -------------------
  const pondSummaryCards = useMemo(
    () => [
      {
        icon: <Droplets />,
        title: "Total Ponds",
        value: formatSummaryCount(pondSummary.totalFishPonds),
      },
      {
        icon: <TbFish />,
        title: "Total Fish",
        value: formatSummaryCount(pondSummary.totalFishes),
      },
      {
        icon: <BarChart3 />,
        title: "Capacity",
        value: formatSummaryCount(pondSummary.totalQuantity),
      },
      {
        icon: <AlertTriangle />,
        title: "Mortality",
        value: formatSummaryCount(pondSummary.totalMortality),
      },
    ],
    [pondSummary],
  );

  const hatchSummaryCards = useMemo(
    () => [
      {
        icon: <Egg />,
        title: "Hatch Records",
        value: formatSummaryCount(hatchSummary.totalHatchRecords),
      },
      {
        icon: <TbFish />,
        title: "Fry Hatched",
        value: formatSummaryCount(hatchSummary.fryHatchedTotal),
      },
      {
        icon: <Percent />,
        title: "Avg Hatch Rate",
        value:
          hatchSummary.avgHatchRate != null
            ? `${Number(hatchSummary.avgHatchRate || 0).toFixed(1)}%`
            : "—",
      },
      {
        icon: <Clock />,
        title: "Due Water Change",
        value: formatSummaryCount(hatchSummary.dueWaterChangeCount),
      },
    ],
    [hatchSummary],
  );

  // ------------------- CHARTS (styled like Supplies) -------------------
  const pondTrendData = useMemo(() => {
    // placeholder example - replace with real aggregation
    const labels = ["Jan", "Feb", "Mar", "Apr", "May"];
    const data = [1200, 1500, 1800, 2100, 2400];

    const lineColor = isDark ? "rgba(127, 90, 240, 1)" : "rgba(88, 80, 236, 1)";
    const fillColor = isDark
      ? "rgba(127, 90, 240, 0.14)"
      : "rgba(88, 80, 236, 0.10)";
    const pointBg = isDark ? "rgba(15, 23, 42, 1)" : "#fff";

    return {
      labels,
      datasets: [
        {
          label: "Fish Stock Trend",
          data,
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          borderColor: lineColor,
          backgroundColor: fillColor,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: pointBg,
          pointBorderColor: lineColor,
          pointBorderWidth: 2,
        },
      ],
    };
  }, [isDark]);

  const pondTrendOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        neonShadow: { blur: 18, colorFallback: "rgba(127, 90, 240, 0.9)" },
        legend: { labels: { color: axisTextColor } },
        title: {
          display: true,
          text: "Fish Stock Trend",
          color: isDark ? "#DDE6FF" : "#1e293b",
          font: { size: 16, weight: "600" },
        },
        tooltip: {
          displayColors: false,
          backgroundColor: isDark
            ? "rgba(15,23,42,0.95)"
            : "rgba(255,255,255,0.95)",
          borderColor: isDark
            ? "rgba(255,255,255,0.10)"
            : "rgba(15,23,42,0.10)",
          borderWidth: 1,
          titleColor: isDark ? "#E5EDFF" : "#0f172a",
          bodyColor: isDark ? "#E5EDFF" : "#0f172a",
          padding: 10,
        },
      },
      scales: {
        x: { ticks: { color: axisTextColor }, grid: { color: gridColor } },
        y: { ticks: { color: axisTextColor }, grid: { color: gridColor } },
      },
    }),
    [axisTextColor, gridColor, isDark],
  );

  const hatchStatsData = useMemo(() => {
    return {
      labels: ["Grow Out", "Hatching", "Broodstock", "Holding"],
      datasets: [
        {
          label: "Hatch Records by Pond Type",
          data: [40, 35, 15, 10], // placeholder
          backgroundColor: [
            "rgba(127, 90, 240, 0.35)",
            "rgba(56, 189, 248, 0.35)",
            "rgba(34, 197, 94, 0.35)",
            "rgba(245, 158, 11, 0.35)",
          ],
          borderColor: [
            "rgba(127, 90, 240, 0.85)",
            "rgba(56, 189, 248, 0.85)",
            "rgba(34, 197, 94, 0.85)",
            "rgba(245, 158, 11, 0.85)",
          ],
          borderWidth: 2,
        },
      ],
    };
  }, []);

  const hatchBarData = useMemo(() => {
    return {
      labels: ["Jan", "Feb", "Mar", "Apr", "May"],
      datasets: [
        {
          label: "Fry Hatched",
          data: [800, 1200, 1600, 2200, 2500], // placeholder
          backgroundColor: isDark
            ? "rgba(56, 189, 248, 0.25)"
            : "rgba(56, 189, 248, 0.18)",
          borderColor: "rgba(56, 189, 248, 0.85)",
          borderWidth: 2,
        },
      ],
    };
  }, [isDark]);

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: axisTextColor } } },
    }),
    [axisTextColor],
  );

  const barOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: axisTextColor } } },
      scales: {
        x: { ticks: { color: axisTextColor }, grid: { color: gridColor } },
        y: { ticks: { color: axisTextColor }, grid: { color: gridColor } },
      },
    }),
    [axisTextColor, gridColor],
  );

  // ------------------- ACTIONS -------------------
  function openCreatePond() {
    setToast({ message: "Open: New Pond modal (next step)", type: "info" });
  }
  function openCreateHatch() {
    setToast({ message: "Open: New Hatch modal (next step)", type: "info" });
  }
  function askDelete(record) {
    setDeleteTarget(record);
    setConfirmOpen(true);
  }
  async function confirmDelete() {
    setConfirmOpen(false);
    setDeleteTarget(null);
    setToast({ message: "Delete hooked (next step)", type: "success" });
  }

  return (
    <DashboardLayout>
      <div className="font-body space-y-8 animate-fadeIn">
        {/* HEADER */}
        <div className="animate-fadeIn flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-h2 font-semibold font-header">
              Fish Ponds
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
              Monitor ponds, hatches, and stock movement in one place.
            </p>
          </div>

          {/* ACTIONS (match Supplies layout) */}
          <div className="flex flex-col gap-2 w-[150px] sm:flex-row sm:items-center sm:justify-end sm:w-auto">
            <button
              onClick={openCreatePond}
              title={
                showHeaderTooltips ? "Create a new pond record" : undefined
              }
              className="flex items-center gap-2 bg-accent-primary text-darkText 
                px-4 py-2 rounded-lg hover:bg-primary/30 transition font-body"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span>New Pond</span>
            </button>

            <button
              onClick={openCreateHatch}
              className="flex items-center gap-2 
                px-4 py-2 rounded-lg bg-sky-500/10 text-sky-400
                hover:bg-sky-500/20 hover:text-sky-300 transition font-medium"
              title={showHeaderTooltips ? "Log a hatch record" : undefined}
            >
              <Egg className="w-4 h-4" />
              <span className="text-md font-body">New Hatch</span>
            </button>
          </div>
        </div>

        {isLoadingSummary ? (
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="skeleton-glass h-4 w-20 rounded" />
              <div className="skeleton-glass h-3 w-16 rounded" />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
              <div className="w-full min-w-full">
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={`pond-summary-skeleton-${idx}`}
                      className="rounded-2xl bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-4"
                    >
                      <div className="skeleton-glass h-8 w-8 rounded-lg mb-3" />
                      <div className="skeleton-glass h-3 w-20 rounded mb-2" />
                      <div className="skeleton-glass h-5 w-16 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <MobileSummaryPager
            pages={[
              { title: "Fish Ponds", items: pondSummaryCards },
              { title: "Fish Hatch", items: hatchSummaryCards },
            ]}
          />
        )}

        {/* DESKTOP/TABLET: same 2 rows x 4 cols */}
        {isLoadingSummary ? (
          <div className="hidden md:block space-y-4">
            {Array.from({ length: 2 }).map((_, rowIdx) => (
              <div
                key={`summary-row-skeleton-${rowIdx}`}
                className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
              >
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={`summary-card-skeleton-${rowIdx}-${idx}`}
                    className="rounded-2xl bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-5 lg:p-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="skeleton-glass w-12 h-12 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton-glass h-4 w-24 rounded" />
                        <div className="skeleton-glass h-6 w-20 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="hidden md:block space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {pondSummaryCards.map((c, idx) => (
                <SummaryCard
                  key={`pond-${idx}`}
                  icon={c.icon}
                  title={c.title}
                  value={c.value}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {hatchSummaryCards.map((c, idx) => (
                <SummaryCard
                  key={`hatch-${idx}`}
                  icon={c.icon}
                  title={c.title}
                  value={c.value}
                />
              ))}
            </div>
          </div>
        )}

        {/* MIDDLE GRID: pond table + hatch table + alerts (image architecture) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Pond Management */}
          <div className="lg:col-span-7 space-y-4">
            {/* FILTERS (match style) */}
            <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 dark:shadow-dark shadow-neo p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <input
                placeholder="Pond name"
                title="Filter by pond name"
                className="px-3 py-2 rounded-md bg-transparent border dark:border-white/10"
                value={pondFilters.pondName}
                onChange={(e) =>
                  setPondFilters({ ...pondFilters, pondName: e.target.value })
                }
              />
              <select
                title="Filter by pond type"
                className="px-3 py-2 rounded-md bg-transparent bg-lightCard dark:bg-darkCard border dark:border-white/10"
                value={pondFilters.pondType}
                onChange={(e) =>
                  setPondFilters({ ...pondFilters, pondType: e.target.value })
                }
              >
                <option value="">All Types</option>
                <option value="HATCHING">Hatching</option>
                <option value="GROW_OUT">Grow Out</option>
                <option value="BROODSTOCK">Broodstock</option>
                <option value="HOLDING">Holding</option>
              </select>
              <select
                title="Filter by status"
                className="px-3 py-2 rounded-md bg-transparent bg-lightCard dark:bg-darkCard border dark:border-white/10"
                value={pondFilters.status}
                onChange={(e) =>
                  setPondFilters({ ...pondFilters, status: e.target.value })
                }
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="RESTING">Resting</option>
                <option value="EMPTY">Empty</option>
              </select>
              <input
                type="date"
                title="Filter by last water change date"
                className="px-3 py-2 rounded-md bg-transparent border border-white/10"
                value={pondFilters.lastWaterChange}
                onChange={(e) =>
                  setPondFilters({
                    ...pondFilters,
                    lastWaterChange: e.target.value,
                  })
                }
              />
            </div>

            {/* TABLE CARD */}
            <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 border border-white/10 dark:shadow-dark shadow-neo p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-header font-semibold">Pond Management</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-body">
                Active ponds with capacity, stock, and water-change dates.
              </p>

              {loadingPonds ? (
                <div className="overflow-x-auto hide-scrollbar">
                  <div className="space-y-3" aria-hidden="true">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={`pond-row-skeleton-${idx}`}
                        className="skeleton-glass h-10 rounded-md"
                      />
                    ))}
                  </div>
                </div>
              ) : hasPondsData ? (
                <div className="overflow-x-auto hide-scrollbar">
                  <table className="w-full text-sm min-w-[980px]">
                    <thead className="text-lightText dark:text-darkText font-body border-b border-white/10">
                      <tr className="font-header">
                        <th className="py-3 text-left whitespace-nowrap">
                          Pond
                        </th>
                        <th className="text-left whitespace-nowrap">Type</th>
                        <th className="text-left whitespace-nowrap">Status</th>
                        <th className="text-right whitespace-nowrap">Stock</th>
                        <th className="text-right whitespace-nowrap">
                          Capacity
                        </th>
                        <th className="text-left whitespace-nowrap">
                          Last Water
                        </th>
                        <th className="text-left whitespace-nowrap">
                          Next Water
                        </th>
                        <th className="w-20" />
                      </tr>
                    </thead>

                    <tbody>
                      {ponds.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b font-body dark:border-white/10 hover:bg-accent-primary/25 dark:hover:bg-white/5"
                        >
                          <td className="py-3 text-left">{p.pondName}</td>
                          <td className="text-left">{p.pondType}</td>
                          <td className="text-left">{p.status}</td>
                          <td className="text-right">{p.currentStock}</td>
                          <td className="text-right">{p.capacity}</td>
                          <td className="text-left whitespace-nowrap">
                            {p.lastWaterChange || "-"}
                          </td>
                          <td className="text-left whitespace-nowrap">
                            {p.nextWaterChange || "-"}
                          </td>
                          <td className="flex gap-2 justify-center">
                            <button
                              onClick={() =>
                                setToast({
                                  message: "Edit pond (next)",
                                  type: "info",
                                })
                              }
                              className="p-2 rounded-md hover:bg-white/5 text-accent-primary"
                              title="Edit pond"
                            >
                              <Edit className="w-6 h-6" />
                            </button>
                            <button
                              onClick={() => askDelete(p)}
                              className="p-2 rounded-md hover:bg-white/5 text-status-danger"
                              title="Delete pond"
                            >
                              <Trash2 className="w-6 h-6" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  className="w-full flex items-center justify-center py-12 sm:py-16 font-body"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex flex-col items-center text-center gap-3 w-full max-w-sm">
                    <div
                      className="flex items-center justify-center w-20 h-20 rounded-full bg-sky-100 dark:bg-sky-900/30 shadow-sm"
                      aria-hidden="true"
                    >
                      <Droplets className="w-9 h-9 text-sky-600 dark:text-sky-200" />
                    </div>
                    <h4 className="text-sm font-semibold font-header text-slate-700 dark:text-slate-100">
                      {hasActivePondFilters
                        ? "No ponds match these filters"
                        : "No ponds recorded yet"}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {hasActivePondFilters
                        ? "Clear the filters to view more results."
                        : "Add your first pond to start tracking stock and water changes."}
                    </p>
                    <button
                      className="mt-2 w-full sm:w-auto px-5 py-2 bg-accent-primary text-white rounded-lg transition hover:opacity-90 active:scale-[0.98]"
                      onClick={
                        hasActivePondFilters ? clearPondFilters : openCreatePond
                      }
                    >
                      {hasActivePondFilters ? "Clear Filters" : "Add Pond"}
                    </button>
                  </div>
                </div>
              )}

              {/* PAGINATION (match style) */}
              {hasPondsData && !loadingPonds && (
                <div className="sticky bottom-0 mt-4 w-full">
                  <div className="flex items-center gap-4 justify-center sm:justify-end px-2 sm:px-0">
                    <button
                      disabled={!pondMeta.hasPrevious}
                      onClick={() => fetchPonds(pondMeta.page - 1)}
                      title="Previous page"
                      className="disabled:opacity-40 flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      <span className="font-semibold">Prev</span>
                    </button>

                    <span className="flex items-center whitespace-nowrap">
                      Page {pondMeta.page + 1} / {pondMeta.totalPages || 1}
                    </span>

                    <button
                      disabled={!pondMeta.hasNext}
                      onClick={() => fetchPonds(pondMeta.page + 1)}
                      title="Next page"
                      className="disabled:opacity-40 flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5"
                    >
                      <span className="font-semibold">Next</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hatchery Management */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 border border-white/10 dark:shadow-dark shadow-neo p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-header font-semibold">
                  Hatchery Management
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-body">
                Recent hatch records with pond, quantity, and hatch rate.
              </p>

              {loadingHatches ? (
                <div className="overflow-x-auto md:overflow-visible hide-scrollbar">
                  <div className="space-y-3" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <div
                        key={`hatch-row-skeleton-${idx}`}
                        className="skeleton-glass h-10 rounded-md"
                      />
                    ))}
                  </div>
                </div>
              ) : hasHatchesData ? (
                <div className="overflow-x-auto md:overflow-visible hide-scrollbar">
                  <table className="w-full text-sm min-w-[700px] md:min-w-0">
                    <thead className="text-lightText dark:text-darkText font-body border-b border-white/10">
                      <tr className="font-header">
                        <th className="py-3 text-left whitespace-nowrap">
                          Date
                        </th>
                        <th className="text-left whitespace-nowrap">Pond</th>
                        <th className="text-right whitespace-nowrap">
                          Hatched
                        </th>
                        <th className="text-right whitespace-nowrap">Rate</th>
                        <th className="w-20" />
                      </tr>
                    </thead>

                    <tbody>
                      {hatches.map((h) => (
                        <tr
                          key={h.id}
                          className="border-b font-body dark:border-white/10 hover:bg-accent-primary/25 dark:hover:bg-white/5"
                        >
                          <td className="py-3 text-left whitespace-nowrap">
                            {h.hatchDate}
                          </td>
                          <td className="text-left">{h.pondName}</td>
                          <td className="text-right">{h.quantityHatched}</td>
                          <td className="text-right">{h.hatchRate}%</td>
                          <td className="flex gap-2 justify-center">
                            <button
                              onClick={() =>
                                setToast({
                                  message: "Edit hatch (next)",
                                  type: "info",
                                })
                              }
                              className="p-2 rounded-md hover:bg-white/5 text-accent-primary"
                              title="Edit hatch record"
                            >
                              <Edit className="w-6 h-6" />
                            </button>
                            <button
                              onClick={() => askDelete(h)}
                              className="p-2 rounded-md hover:bg-white/5 text-status-danger"
                              title="Delete hatch record"
                            >
                              <Trash2 className="w-6 h-6" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  className="w-full flex items-center justify-center py-12 sm:py-16 font-body"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex flex-col items-center text-center gap-3 w-full max-w-sm">
                    <div
                      className="flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 shadow-sm"
                      aria-hidden="true"
                    >
                      <Egg className="w-9 h-9 text-amber-600 dark:text-amber-200" />
                    </div>
                    <h4 className="text-sm font-semibold font-header text-slate-700 dark:text-slate-100">
                      No hatch records yet
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Log a hatch record to track quantities and hatch rates.
                    </p>
                    <button
                      className="mt-2 w-full sm:w-auto px-5 py-2 bg-accent-primary text-white rounded-lg transition hover:opacity-90 active:scale-[0.98]"
                      onClick={openCreateHatch}
                    >
                      Add Hatch Record
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Alerts Panel (image architecture) */}
            <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 border border-white/10 dark:shadow-dark shadow-neo p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-header font-semibold">Alerts</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-body">
                Priority issues that may need immediate attention.
              </p>

              {alerts.length === 0 ? (
                <p className="text-sm text-slate-400">No alerts for now.</p>
              ) : (
                <div className="space-y-2">
                  {alerts.map((a, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg p-3 border border-white/10 bg-white/5"
                    >
                      <p className="text-sm">{a.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* -------------------- Stock Adjustment (Always visible: action-based) -------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 rounded-xl bg-white/10 dark:bg-darkCard/70 border border-white/10 dark:shadow-dark shadow-neo p-6">
            <h2 className="font-header font-semibold mb-4">Stock Adjustment</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-body">
              Add or remove stock with a reason for audit tracking.
            </p>

            <div className="space-y-3">
              <select
                className="w-full px-3 py-2 rounded-md bg-transparent bg-lightCard dark:bg-darkCard border dark:border-white/10"
                title="Select a pond to adjust"
              >
                <option value="">Select Pond</option>
              </select>

              <input
                type="number"
                placeholder="Adjust quantity (+ / -)"
                title="Enter a positive or negative adjustment"
                className="w-full px-3 py-2 rounded-md bg-transparent border dark:border-white/10"
              />

              <input
                placeholder="Reason (optional)"
                title="Optional note for why the stock changed"
                className="w-full px-3 py-2 rounded-md bg-transparent border dark:border-white/10"
              />

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() =>
                    setToast({
                      message: "Adjust stock (next step)",
                      type: "info",
                    })
                  }
                  title="Apply the stock adjustment"
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-accent-primary text-darkText hover:bg-primary/30 transition"
                >
                  Update Stock
                </button>
                <button
                  onClick={() =>
                    setToast({ message: "Cancelled", type: "info" })
                  }
                  title="Cancel the adjustment"
                  className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* DESKTOP ONLY: show these charts beside stock adjustment */}
          <div className="hidden md:block lg:col-span-4 rounded-xl bg-white/10 dark:bg-darkCard/70 border border-white/10 dark:shadow-dark shadow-neo p-6">
            <h2 className="font-header font-semibold mb-3">Hatch Statistics</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-body">
              Distribution of hatch records by pond type.
            </p>
            <div className="h-[240px]">
              {isLoadingSummary ? (
                <div className="skeleton-glass w-full h-full rounded-xl" />
              ) : hasHatchesData ? (
                <Doughnut data={hatchStatsData} options={doughnutOptions} />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center p-4 font-body"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex flex-col items-center text-center gap-3 w-full max-w-sm">
                    <div
                      className="flex items-center justify-center w-16 h-16 rounded-full bg-sky-100 dark:bg-sky-900/30 shadow-sm"
                      aria-hidden="true"
                    >
                      <Egg className="w-7 h-7 text-sky-600 dark:text-sky-200" />
                    </div>
                    <h4 className="text-sm font-semibold font-header text-slate-700 dark:text-slate-100">
                      No hatch data yet
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Add hatch records to see distribution by pond type.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:block lg:col-span-4 rounded-xl bg-lightCard dark:bg-darkCard/70 border border-white/10 dark:shadow-dark shadow-neo p-6">
            <h2 className="font-header font-semibold mb-3">
              Monthly Hatch Trend
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-body">
              Monthly hatch quantities for quick trend reading.
            </p>
            <div className="h-[240px]">
              {isLoadingSummary ? (
                <div className="skeleton-glass w-full h-full rounded-xl" />
              ) : hasHatchesData ? (
                <Bar data={hatchBarData} options={barOptions} />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center p-4 font-body"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex flex-col items-center text-center gap-3 w-full max-w-sm">
                    <div
                      className="flex items-center justify-center w-16 h-16 rounded-full bg-sky-100 dark:bg-sky-900/30 shadow-sm"
                      aria-hidden="true"
                    >
                      <Egg className="w-7 h-7 text-sky-600 dark:text-sky-200" />
                    </div>
                    <h4 className="text-sm font-semibold font-header text-slate-700 dark:text-slate-100">
                      No hatch data yet
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Add hatch records to see monthly trends.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE ONLY: collapsible charts */}
        <div className="md:hidden space-y-4">
          <MobileAccordion
            title="Hatch Statistics"
            icon={<Egg className="w-5 h-5 text-sky-400" />}
          >
            <div className="h-[240px]">
              {isLoadingSummary ? (
                <div className="skeleton-glass w-full h-full rounded-xl" />
              ) : hasHatchesData ? (
                <Doughnut data={hatchStatsData} options={doughnutOptions} />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center p-4 font-body"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex flex-col items-center text-center gap-3 w-full max-w-sm">
                    <div
                      className="flex items-center justify-center w-16 h-16 rounded-full bg-sky-100 dark:bg-sky-900/30 shadow-sm"
                      aria-hidden="true"
                    >
                      <Egg className="w-7 h-7 text-sky-600 dark:text-sky-200" />
                    </div>
                    <h4 className="text-sm font-semibold font-header text-slate-700 dark:text-slate-100">
                      No hatch data yet
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Add hatch records to see distribution by pond type.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </MobileAccordion>

          <MobileAccordion
            title="Monthly Hatch Trend"
            icon={<Egg className="w-5 h-5 text-sky-400" />}
          >
            <div className="h-[240px]">
              {isLoadingSummary ? (
                <div className="skeleton-glass w-full h-full rounded-xl" />
              ) : hasHatchesData ? (
                <Bar data={hatchBarData} options={barOptions} />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center p-4 font-body"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex flex-col items-center text-center gap-3 w-full max-w-sm">
                    <div
                      className="flex items-center justify-center w-16 h-16 rounded-full bg-sky-100 dark:bg-sky-900/30 shadow-sm"
                      aria-hidden="true"
                    >
                      <Egg className="w-7 h-7 text-sky-600 dark:text-sky-200" />
                    </div>
                    <h4 className="text-sm font-semibold font-header text-slate-700 dark:text-slate-100">
                      No hatch data yet
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Add hatch records to see monthly trends.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </MobileAccordion>

          <MobileAccordion
            title="Fish Stock Trend"
            icon={<TbFish className="w-5 h-5 text-accent-primary" />}
          >
            <div className="h-[260px]">
              {isLoadingSummary ? (
                <div className="skeleton-glass w-full h-full rounded-xl" />
              ) : hasPondsData ? (
                <Line data={pondTrendData} options={pondTrendOptions} />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center p-4 font-body"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex flex-col items-center text-center gap-3 w-full max-w-sm">
                    <div
                      className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 shadow-sm"
                      aria-hidden="true"
                    >
                      <TbFish className="w-7 h-7 text-indigo-600 dark:text-indigo-200" />
                    </div>
                    <h4 className="text-sm font-semibold font-header text-slate-700 dark:text-slate-100">
                      No stock trend data yet
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Add ponds to see stock movement trends over time.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </MobileAccordion>
        </div>

        {/* DESKTOP ONLY: full-width line chart (same vibe as Supplies chart card) */}
        <div
          className="hidden md:block mt-2 rounded-xl bg-white/6 dark:bg-darkCard/60 p-4 dark:shadow-dark shadow-neo"
          style={{ minHeight: 260 }}
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-body">
            Overall stock trend across recent months.
          </p>
          <div className="h-[260px] md:h-[300px]">
            {isLoadingSummary ? (
              <div className="skeleton-glass w-full h-full rounded-xl" />
            ) : hasPondsData ? (
              <Line data={pondTrendData} options={pondTrendOptions} />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center p-4 font-body"
                role="status"
                aria-live="polite"
              >
                <div className="flex flex-col items-center text-center gap-3 w-full max-w-sm">
                  <div
                    className="flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 shadow-sm"
                    aria-hidden="true"
                  >
                    <TbFish className="w-9 h-9 text-indigo-600 dark:text-indigo-200" />
                  </div>
                  <h4 className="text-sm font-semibold font-header text-slate-700 dark:text-slate-100">
                    No stock trend data yet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Add ponds to see stock movement trends over time.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Confirm Modal */}
        <ConfirmModal
          open={confirmOpen}
          title="Delete Record"
          message={`Are you sure you want to delete "${
            deleteTarget?.pondName || deleteTarget?.pondName || "this record"
          }"?`}
          confirmText="Delete"
          loading={false}
          onCancel={() => {
            setConfirmOpen(false);
            setDeleteTarget(null);
          }}
          onConfirm={confirmDelete}
        />

        <GlassToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "info" })}
        />
      </div>
    </DashboardLayout>
  );
}
