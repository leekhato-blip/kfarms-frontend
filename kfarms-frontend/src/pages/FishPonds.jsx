import React, { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import SummaryCard from "../components/SummaryCard";
import GlassToast from "../components/GlassToast";
import ConfirmModal from "../components/ConfirmModal";
import TrashModal from "../components/TrashModal";
import ItemDetailsModal from "../components/ItemDetailsModal";
import {
  getFishPonds,
  getFishPondSummary,
  deleteFishPond,
  adjustFishPondStock,
  getDeletedFishPonds,
  restoreFishPond,
} from "../services/fishPondService";
import {
  getFishHatches,
  getFishHatchSummary,
  deleteFishHatch,
  getDeletedFishHatches,
  restoreFishHatch,
} from "../services/fishHatchService";
import FishPondFormModal from "../components/FishPondFormModal";
import FishHatchFormModal from "../components/FishHatchFormModal";
import { exportReport } from "../services/reportService";
import ExportModal from "../components/ExportModal";

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
  Skull,
  CircleOff,
  Download,
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
                  subtitle={it.subtitle}
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
  const [showHeaderSubtitle, setShowHeaderSubtitle] = useState(true);

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
    const timer = window.setTimeout(() => {
      setShowHeaderSubtitle(false);
    }, 4000);
    return () => window.clearTimeout(timer);
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
  const [pondPageLoading, setPondPageLoading] = useState(false);
  const [pondTrashOpen, setPondTrashOpen] = useState(false);
  const [hatchTrashOpen, setHatchTrashOpen] = useState(false);

  const [pondMeta, setPondMeta] = useState({
    page: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [hatchPage, setHatchPage] = useState(0);
  const hatchPageSize = 4;

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
  const [deleteType, setDeleteType] = useState(null);
  const pondTableRef = useRef(null);

  const [pondModalOpen, setPondModalOpen] = useState(false);
  const [pondEditing, setPondEditing] = useState(null);
  const [hatchModalOpen, setHatchModalOpen] = useState(false);
  const [hatchEditing, setHatchEditing] = useState(null);
  const [pondDetail, setPondDetail] = useState(null);
  const [hatchDetail, setHatchDetail] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const [stockForm, setStockForm] = useState({
    pondId: "",
    quantity: "",
    reason: "",
  });
  const [stockSaving, setStockSaving] = useState(false);

  // ------------------- FETCH (hook these to your services) -------------------
  async function fetchPonds(page = 0, options = {}) {
    const { showSkeleton = ponds.length === 0 } = options;
    setLoadingPonds(showSkeleton);
    setPondPageLoading(!showSkeleton);
    try {
      const res = await getFishPonds({ page, size: 8, ...pondFilters });

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
      setPondPageLoading(false);
    }
  }

  function focusPondTable() {
    if (!pondTableRef.current) return;
    requestAnimationFrame(() => {
      pondTableRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function handlePondPageChange(nextPage) {
    fetchPonds(nextPage, { showSkeleton: false });
    focusPondTable();
  }

  async function fetchHatches() {
    setLoadingHatches(true);
    try {
      const res = await getFishHatches();
      setHatches(Array.isArray(res) ? res : []);
      setHatchPage(0);
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

      const normalizeNumber = (value) => {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : 0;
      };

      setPondSummary({
        totalFishPonds: normalizeNumber(pondRes?.totalFishPonds),
        totalFishes: normalizeNumber(pondRes?.totalFishes),
        totalQuantity: normalizeNumber(pondRes?.totalQuantity),
        totalMortality: normalizeNumber(pondRes?.totalMortality),
        dueWaterChangeCount: normalizeNumber(pondRes?.dueWaterChangeCount),
        totalEmptyPonds: normalizeNumber(pondRes?.totalEmptyPonds),
        countByStatus: pondRes?.countByStatus || {},
        monthlyStockTotals: pondRes?.monthlyStockTotals || {},
        alerts: pondRes?.alerts,
      });

      setHatchSummary({
        totalHatchRecords: normalizeNumber(hatchRes?.totalHatchRecords),
        fryHatchedTotal: normalizeNumber(hatchRes?.fryHatchedTotal),
        avgHatchRate: normalizeNumber(hatchRes?.avgHatchRate),
        dueWaterChangeCount: normalizeNumber(hatchRes?.dueWaterChangeCount),
        monthlyHatchTotals: hatchRes?.monthlyHatchTotals || {},
        hatchCountByPondType: hatchRes?.hatchCountByPondType || {},
      });

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
    fetchPonds(0, { showSkeleton: true });
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

  const pondDetailFields = pondDetail
    ? [
        { label: "Pond", value: pondDetail.pondName },
        { label: "Type", value: pondDetail.pondType },
        { label: "Status", value: pondDetail.status },
        {
          label: "Current Stock",
          value: formatSummaryCount(pondDetail.currentStock),
        },
        { label: "Capacity", value: formatSummaryCount(pondDetail.capacity) },
        {
          label: "Last Water Change",
          value: pondDetail.lastWaterChange || "—",
        },
        {
          label: "Next Water Change",
          value: pondDetail.nextWaterChange || "—",
        },
        { label: "Note", value: pondDetail.note || "—", span: 2 },
      ]
    : [];

  const hatchDetailFields = hatchDetail
    ? [
        { label: "Date", value: hatchDetail.hatchDate || "—" },
        { label: "Pond", value: hatchDetail.pondName || "—" },
        {
          label: "Hatched",
          value: formatSummaryCount(hatchDetail.quantityHatched),
        },
        {
          label: "Male Count",
          value: formatSummaryCount(hatchDetail.maleCount),
        },
        {
          label: "Female Count",
          value: formatSummaryCount(hatchDetail.femaleCount),
        },
        { label: "Hatch Rate", value: formatRate(hatchDetail.hatchRate) },
        { label: "Note", value: hatchDetail.note || "—", span: 2 },
      ]
    : [];

  function getPondStatus(item) {
    const status = String(item?.status || "").toUpperCase();
    if (status === "ACTIVE") return { label: "Active", color: "#22c55e" };
    if (status === "MAINTENANCE") return { label: "Maintenance", color: "#f59e0b" };
    if (status === "INACTIVE") return { label: "Inactive", color: "#94a3b8" };
    return { label: item?.status || "Unknown", color: "#94a3b8" };
  }

  function getHatchStatus(item) {
    const recorded = Boolean(item?.hatchDate);
    return {
      label: recorded ? "Recorded" : "Pending",
      color: recorded ? "#22c55e" : "#f59e0b",
    };
  }

  function formatSummaryCount(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "—";
    return numeric.toLocaleString();
  }

  function formatRate(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "0%";
    return `${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 1,
    }).format(numeric)}%`;
  }

  // ------------------- SUMMARY CARDS (Desktop grid / Mobile carousel) -------------------
  const pondSummaryCards = useMemo(
    () => [
      {
        icon: <Droplets />,
        title: "Total Ponds",
        value: formatSummaryCount(pondSummary.totalFishPonds),
        subtitle: "Active ponds",
      },
      {
        icon: <TbFish />,
        title: "Total Fish",
        value: formatSummaryCount(pondSummary.totalFishes),
        subtitle: "Current stock",
      },
      {
        icon: <BarChart3 />,
        title: "Capacity",
        value: formatSummaryCount(pondSummary.totalQuantity),
        subtitle: "Total capacity",
      },
      {
        icon: <AlertTriangle />,
        title: "Mortality",
        value: formatSummaryCount(pondSummary.totalMortality),
        subtitle: "Losses recorded",
      },
    ],
    [pondSummary],
  );

  const hatchSummaryDerived = useMemo(() => {
    const totalHatchRecords = Number(hatchSummary.totalHatchRecords ?? 0);
    const fryHatchedTotal = hatches.reduce(
      (sum, h) => sum + Number(h?.quantityHatched ?? 0),
      0,
    );
    const avgHatchRate =
      hatches.length > 0
        ? hatches.reduce((sum, h) => sum + Number(h?.hatchRate ?? 0), 0) /
          hatches.length
        : 0;
    let dueWaterChangeCount = Number(pondSummary.dueWaterChangeCount ?? 0);
    if (!dueWaterChangeCount && pondSummary.alerts?.waterChangeDue) {
      const match = String(pondSummary.alerts.waterChangeDue).match(/(\d+)/);
      if (match) {
        dueWaterChangeCount = Number(match[1]) || 0;
      }
    }

    return {
      totalHatchRecords,
      fryHatchedTotal,
      avgHatchRate,
      dueWaterChangeCount,
    };
  }, [hatchSummary, hatches, pondSummary]);

  const hatchSummaryCards = useMemo(
    () => [
      {
        icon: <Egg />,
        title: "Hatch Records",
        value: formatSummaryCount(hatchSummaryDerived.totalHatchRecords),
        subtitle: "Records logged",
      },
      {
        icon: <TbFish />,
        title: "Fry Hatched",
        value: formatSummaryCount(hatchSummaryDerived.fryHatchedTotal),
        subtitle: "Total fry",
      },
      {
        icon: <Percent />,
        title: "Avg Hatch Rate",
        value: formatRate(hatchSummaryDerived.avgHatchRate),
        subtitle: "Average rate",
      },
      {
        icon: <Clock />,
        title: "Due Water Change",
        value: formatSummaryCount(hatchSummaryDerived.dueWaterChangeCount),
        subtitle: "Pending change",
      },
    ],
    [hatchSummaryDerived],
  );

  const hatchTotalPages = useMemo(
    () => Math.max(1, Math.ceil(hatches.length / hatchPageSize)),
    [hatches.length],
  );

  useEffect(() => {
    if (hatchPage > hatchTotalPages - 1) {
      setHatchPage(Math.max(hatchTotalPages - 1, 0));
    }
  }, [hatchPage, hatchTotalPages]);

  const pagedHatches = useMemo(() => {
    const start = hatchPage * hatchPageSize;
    return hatches.slice(start, start + hatchPageSize);
  }, [hatches, hatchPage]);

  const normalizeMonthKey = (key) => {
    if (!key) return null;
    const [yearRaw, monthRaw] = String(key).split("-");
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
    return `${year}-${String(month).padStart(2, "0")}`;
  };

  const buildMonthlyTotals = (items, dateKey, valueKey) => {
    if (!Array.isArray(items)) return {};
    return items.reduce((acc, item) => {
      const rawDate = item?.[dateKey];
      if (!rawDate) return acc;
      const parsed = new Date(rawDate);
      if (Number.isNaN(parsed.getTime())) return acc;
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      const key = `${year}-${month}`;
      acc[key] = (acc[key] || 0) + Number(item?.[valueKey] || 0);
      return acc;
    }, {});
  };

  const normalizeMonthlyTotals = (totals = {}) =>
    Object.keys(totals).reduce((acc, key) => {
      const normalized = normalizeMonthKey(key);
      if (!normalized) return acc;
      acc[normalized] = (acc[normalized] || 0) + Number(totals[key] || 0);
      return acc;
    }, {});

  const mergeMonthlyTotals = (baseTotals = {}, fallbackTotals = {}) => {
    const merged = { ...baseTotals };
    Object.keys(fallbackTotals).forEach((key) => {
      if (!(key in merged)) {
        merged[key] = fallbackTotals[key];
      }
    });
    return merged;
  };

  const getLatestYear = (totals = {}) => {
    const years = Object.keys(totals)
      .map((k) => Number(String(k).split("-")[0]))
      .filter((y) => Number.isFinite(y));
    if (years.length === 0) return new Date().getFullYear();
    return Math.max(...years);
  };

  const getCalendarYearKeys = (year) =>
    Array.from({ length: 12 }, (_, idx) => {
      const m = String(idx + 1).padStart(2, "0");
      return `${year}-${m}`;
    });

  // ------------------- CHARTS (styled like Supplies) -------------------
  const pondTrendData = useMemo(() => {
    const summaryTotals = normalizeMonthlyTotals(
      pondSummary.monthlyStockTotals || {},
    );
    const fallbackTotals = buildMonthlyTotals(
      ponds,
      "dateStocked",
      "currentStock",
    );
    const hasSummaryTotals = Object.values(summaryTotals).some(
      (val) => Number(val || 0) > 0,
    );
    const monthMap = hasSummaryTotals ? summaryTotals : fallbackTotals;
    const chartYear = getLatestYear(monthMap);
    const recentKeys = getCalendarYearKeys(chartYear);
    const labels = recentKeys.map((k) => {
      const [year, month] = k.split("-");
      const date = new Date(Number(year), Number(month) - 1, 1);
      return date.toLocaleDateString("en-GB", { month: "short" });
    });
    const data = recentKeys.map((k) => Number(monthMap[k] || 0));

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
  }, [isDark, pondSummary.monthlyStockTotals, ponds]);

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
    const pondTypeLabels = [
      { key: "HATCHING", label: "Hatching" },
      { key: "GROW_OUT", label: "Grow Out" },
      { key: "BROODSTOCK", label: "Broodstock" },
      { key: "HOLDING", label: "Holding" },
    ];

    const countsByType = pondTypeLabels.reduce((acc, t) => {
      acc[t.key] = 0;
      return acc;
    }, {});

    const pondTypeCounts = pondSummary.countByPondType || {};
    const hasSummaryCounts = Object.values(pondTypeCounts).some(
      (val) => Number(val || 0) > 0,
    );
    const fallbackCounts = pondTypeLabels.reduce((acc, t) => {
      acc[t.key] = 0;
      return acc;
    }, {});

    ponds.forEach((pond) => {
      if (pond?.pondType && fallbackCounts[pond.pondType] !== undefined) {
        fallbackCounts[pond.pondType] += 1;
      }
    });

    pondTypeLabels.forEach((t) => {
      const summaryValue = Number(pondTypeCounts[t.key] || 0);
      const fallbackValue = Number(fallbackCounts[t.key] || 0);
      countsByType[t.key] = hasSummaryCounts ? summaryValue : fallbackValue;
    });

    return {
      labels: pondTypeLabels.map((t) => t.label),
      datasets: [
        {
          label: "Ponds by Type",
          data: pondTypeLabels.map((t) => countsByType[t.key] || 0),
          backgroundColor: [
            "rgba(56, 189, 248, 0.35)",
            "rgba(127, 90, 240, 0.35)",
            "rgba(34, 197, 94, 0.35)",
            "rgba(245, 158, 11, 0.35)",
          ],
          borderColor: [
            "rgba(56, 189, 248, 0.85)",
            "rgba(127, 90, 240, 0.85)",
            "rgba(34, 197, 94, 0.85)",
            "rgba(245, 158, 11, 0.85)",
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [pondSummary.countByPondType, ponds]);

  const hatchBarData = useMemo(() => {
    const summaryTotals = normalizeMonthlyTotals(
      hatchSummary.monthlyHatchTotals || {},
    );
    const fallbackTotals = buildMonthlyTotals(
      hatches,
      "hatchDate",
      "quantityHatched",
    );
    const monthTotals = mergeMonthlyTotals(summaryTotals, fallbackTotals);
    const chartYear = getLatestYear(monthTotals);
    const recentKeys = getCalendarYearKeys(chartYear);
    const labels = recentKeys.map((k) => {
      const [year, month] = k.split("-");
      const date = new Date(Number(year), Number(month) - 1, 1);
      return date.toLocaleDateString("en-GB", { month: "short" });
    });

    return {
      labels,
      datasets: [
        {
          label: "Fry Hatched",
          data: recentKeys.map((k) => Number(monthTotals[k] || 0)),
          backgroundColor: isDark
            ? "rgba(56, 189, 248, 0.25)"
            : "rgba(56, 189, 248, 0.18)",
          borderColor: "rgba(56, 189, 248, 0.85)",
          borderWidth: 2,
        },
      ],
    };
  }, [hatchSummary.monthlyHatchTotals, hatches, isDark]);

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
    setPondEditing(null);
    setPondModalOpen(true);
  }
  function openEditPond(record) {
    setPondEditing(record);
    setPondModalOpen(true);
  }
  function openPondDetails(record) {
    setPondDetail(record);
  }
  function closePondDetails() {
    setPondDetail(null);
  }
  function openCreateHatch() {
    setHatchEditing(null);
    setHatchModalOpen(true);
  }
  function openEditHatch(record) {
    const pondMatch = ponds.find((p) => p.pondName === record?.pondName);
    setHatchEditing({
      ...record,
      pondId: record?.pondId ?? pondMatch?.id ?? "",
    });
    setHatchModalOpen(true);
  }
  function openHatchDetails(record) {
    setHatchDetail(record);
  }
  function closeHatchDetails() {
    setHatchDetail(null);
  }

  async function handleExport({ type, category, start, end }) {
    if (exporting) return;
    setExporting(true);
    try {
      const { blob, filename } = await exportReport({
        type,
        category,
        start: start || undefined,
        end: end || undefined,
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `${category || "fish-ponds"}.${type || "csv"}`;
      link.click();
      window.URL.revokeObjectURL(url);
      setToast({ message: "Export ready", type: "success" });
    } catch (error) {
      console.error("Export failed: ", error);
      setToast({ message: "Export failed", type: "error" });
    } finally {
      setExporting(false);
      setExportOpen(false);
    }
  }
  function askDelete(record, type) {
    setDeleteTarget(record);
    setDeleteType(type);
    setConfirmOpen(true);
  }
  async function confirmDelete() {
    if (!deleteTarget || !deleteType) return;
    try {
      if (deleteType === "pond") {
        await deleteFishPond(deleteTarget.id);
        await fetchPonds(pondMeta.page);
        await fetchSummaries();
        setToast({
          message: `"${deleteTarget.pondName}" deleted`,
          type: "success",
        });
      } else if (deleteType === "hatch") {
        await deleteFishHatch(deleteTarget.id);
        await fetchHatches();
        await fetchSummaries();
        setToast({
          message: "Hatch record deleted",
          type: "success",
        });
      }
    } catch (e) {
      console.error(e);
      setToast({ message: "Delete failed", type: "error" });
    } finally {
      setConfirmOpen(false);
      setDeleteTarget(null);
      setDeleteType(null);
    }
  }

  const deleteLabel =
    deleteTarget?.pondName ||
    deleteTarget?.hatchDate ||
    deleteTarget?.id ||
    "this record";

  async function submitStockAdjustment() {
    if (!stockForm.pondId || stockForm.quantity === "") {
      setToast({ message: "Select pond and enter quantity", type: "error" });
      return;
    }

    setStockSaving(true);
    try {
      await adjustFishPondStock(Number(stockForm.pondId), {
        quantity: Number(stockForm.quantity),
        reason: stockForm.reason?.trim() || null,
      });
      await fetchPonds(pondMeta.page);
      await fetchSummaries();

      setToast({ message: "Stock updated", type: "success" });
      setStockForm({ pondId: "", quantity: "", reason: "" });
    } catch (e) {
      console.error(e);
      setToast({ message: "Stock update failed", type: "error" });
    } finally {
      setStockSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="font-body space-y-8">
        <div className="space-y-8 animate-fadeIn">
          {/* HEADER */}
          <div className="animate-fadeIn flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-xl sm:text-h2 font-semibold font-header">
                Fish Ponds
              </h1>
              <div
                className={`overflow-hidden transition-all duration-500 ${
                  showHeaderSubtitle ? "max-h-10 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
                  Monitor ponds, hatches, and stock movement in one place.
                </p>
              </div>
            </div>

            {/* ACTIONS (match Supplies layout) */}
            <div className="flex flex-row gap-2 items-center w-full sm:justify-end sm:w-auto">
              <button
                onClick={openCreatePond}
                title={
                  showHeaderTooltips ? "Create a new pond record" : undefined
                }
                className="w-auto h-10 justify-center flex items-center gap-2 bg-accent-primary text-darkText px-4 py-2 rounded-lg hover:bg-primary/30 transition font-body"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span className="text-sm font-body">New Pond</span>
              </button>

              <button
                onClick={() => setExportOpen(true)}
                disabled={exporting}
                className="w-auto h-10 justify-center flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-lightText dark:text-darkText hover:bg-white/20 transition font-medium disabled:opacity-50"
                title="Export fish pond data"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-body">
                  {exporting ? "Exporting..." : "Export"}
                </span>
              </button>

              <button
                onClick={openCreateHatch}
                className="w-auto h-10 justify-center flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 transition font-medium"
                title={showHeaderTooltips ? "Log a hatch record" : undefined}
              >
                <Egg className="w-4 h-4" />
                <span className="text-sm font-body">New Hatch</span>
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
                  subtitle={c.subtitle}
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
                  subtitle={c.subtitle}
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
            <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 dark:shadow-dark shadow-neo p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-body">
                Filter ponds by name, type, status, or last water change.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                  <option value="MAINTENANCE">MAINTENANCE</option>
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
            </div>

            {/* TABLE CARD */}
            <div
              ref={pondTableRef}
              id="pond-table"
              className="rounded-xl bg-white/10 dark:bg-darkCard/70 border border-white/10 dark:shadow-dark shadow-neo p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-header font-semibold">Pond Management</h2>
                <button
                  onClick={() => setPondTrashOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition font-medium"
                  title="View deleted ponds"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-semibold">
                    Trash
                  </span>
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-body">
                Active ponds with capacity, stock, and water-change dates.
              </p>

              {loadingPonds && !hasPondsData ? (
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
                <div
                  className={`overflow-x-auto hide-scrollbar transition-opacity ${
                    pondPageLoading ? "opacity-60" : "opacity-100"
                  }`}
                >
                  <table className="w-full text-sm min-w-[980px] border-separate border-spacing-y-2 [&_th]:px-4 [&_th]:pb-2 [&_td]:px-4 [&_td]:py-3 [&_td:first-child]:rounded-l-xl [&_td:last-child]:rounded-r-xl [&_tbody_tr]:bg-white/5 dark:[&_tbody_tr]:bg-darkCard/60 [&_tbody_tr]:shadow-soft [&_tbody_tr:hover]:shadow-neo [&_tbody_tr]:transition">
                    <thead className="text-lightText dark:text-darkText font-body">
                      <tr className="font-header text-[11px] uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
                        <th className="text-left whitespace-nowrap">Pond</th>
                        <th className="text-left whitespace-nowrap">Type</th>
                        <th className="text-left whitespace-nowrap">Status</th>
                        <th className="text-left whitespace-nowrap">Stock</th>
                        <th className="text-right whitespace-nowrap">
                          Capacity
                        </th>
                        <th className="text-left whitespace-nowrap">
                          Last Water
                        </th>
                        <th className="text-left whitespace-nowrap">
                          Next Water
                        </th>
                        <th className="text-center whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {ponds.map((p) => (
                        <tr
                          key={p.id}
                          onClick={() => openPondDetails(p)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openPondDetails(p);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`View details for ${p.pondName}`}
                          className="font-body cursor-pointer hover:bg-accent-primary/25 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                        >
                          <td className="text-left">
                            <div className="font-semibold text-slate-800 dark:text-slate-100">
                              {p.pondName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              ID #{p.id}
                            </div>
                          </td>
                          <td className="text-left">{p.pondType}</td>
                          <td className="text-left">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                              {p.status}
                            </span>
                          </td>
                          <td className="text-left font-semibold">
                            {p.currentStock}
                          </td>
                          <td className="text-left font-semibold">
                            {p.capacity}
                          </td>
                          <td className="text-left whitespace-nowrap">
                            {p.lastWaterChange || "-"}
                          </td>
                          <td className="text-left whitespace-nowrap">
                            {p.nextWaterChange || "-"}
                          </td>
                          <td className="text-center">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditPond(p);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-accent-primary"
                                title="Edit pond"
                              >
                                <Edit className="w-6 h-6" />
                                <span className="text-xs font-semibold">
                                  Edit
                                </span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  askDelete(p, "pond");
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-status-danger"
                                title="Delete pond"
                              >
                                <Trash2 className="w-6 h-6" />
                                <span className="text-xs font-semibold">
                                  Delete
                                </span>
                              </button>
                            </div>
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
                      onClick={() => handlePondPageChange(pondMeta.page - 1)}
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
                      onClick={() => handlePondPageChange(pondMeta.page + 1)}
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
                <button
                  onClick={() => setHatchTrashOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition font-medium"
                  title="View deleted hatch records"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-semibold">
                    Trash
                  </span>
                </button>
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
                <>
                  <div className="overflow-x-auto md:overflow-visible hide-scrollbar">
                    <table className="w-full text-sm min-w-[700px] md:min-w-0 border-separate border-spacing-y-2 [&_th]:px-4 [&_th]:pb-2 [&_td]:px-4 [&_td]:py-3 [&_td:first-child]:rounded-l-xl [&_td:last-child]:rounded-r-xl [&_tbody_tr]:bg-white/5 dark:[&_tbody_tr]:bg-darkCard/60 [&_tbody_tr]:shadow-soft [&_tbody_tr:hover]:shadow-neo [&_tbody_tr]:transition">
                      <thead className="text-lightText dark:text-darkText font-body">
                        <tr className="font-header text-[11px] uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
                          <th className="py-3 text-left whitespace-nowrap">
                            Date
                          </th>
                          <th className="text-left whitespace-nowrap">Pond</th>
                          <th className="text-right whitespace-nowrap">
                            Hatched
                          </th>
                          <th className="text-right whitespace-nowrap">Rate</th>
                          <th className="text-center whitespace-nowrap">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {pagedHatches.map((h) => (
                          <tr
                            key={h.id}
                            onClick={() => openHatchDetails(h)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                openHatchDetails(h);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={`View details for hatch record ${h.id}`}
                            className="border-b font-body dark:border-white/10 hover:bg-accent-primary/25 dark:hover:bg-white/5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                          >
                            <td className="py-3 text-left whitespace-nowrap">
                              {h.hatchDate}
                            </td>
                            <td className="text-left">{h.pondName}</td>
                            <td className="text-right">{h.quantityHatched}</td>
                            <td className="text-right">
                              {formatRate(h.hatchRate)}
                            </td>
                            <td className="flex gap-2 justify-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditHatch(h);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-accent-primary"
                                title="Edit hatch record"
                              >
                                <Edit className="w-6 h-6" />
                                <span className="text-xs font-semibold">
                                  Edit
                                </span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  askDelete(h, "hatch");
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-status-danger"
                                title="Delete hatch record"
                              >
                                <Trash2 className="w-6 h-6" />
                                <span className="text-xs font-semibold">
                                  Delete
                                </span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {hatchTotalPages > 1 && !loadingHatches && (
                    <div className="mt-4 w-full">
                      <div className="flex items-center gap-4 justify-center sm:justify-end px-2 sm:px-0">
                        <button
                          disabled={hatchPage === 0}
                          onClick={() =>
                            setHatchPage((p) => Math.max(p - 1, 0))
                          }
                          title="Previous page"
                          className="disabled:opacity-40 flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5"
                        >
                          <ChevronLeft className="w-5 h-5" />
                          <span className="font-semibold">Prev</span>
                        </button>

                        <span className="flex items-center whitespace-nowrap">
                          Page {hatchPage + 1} / {hatchTotalPages}
                        </span>

                        <button
                          disabled={hatchPage >= hatchTotalPages - 1}
                          onClick={() =>
                            setHatchPage((p) =>
                              Math.min(p + 1, hatchTotalPages - 1),
                            )
                          }
                          title="Next page"
                          className="disabled:opacity-40 flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5"
                        >
                          <span className="font-semibold">Next</span>
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
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

              {(() => {
                const alertCards = [
                  {
                    key: "mortality",
                    label: "Mortality",
                    value: pondSummary.totalMortality ?? 0,
                    message:
                      alerts.find((a) =>
                        String(a.message || "")
                          .toLowerCase()
                          .includes("mortality"),
                      )?.message || null,
                    icon: <Skull className="w-5 h-5" />,
                    tone: "rose",
                  },
                  {
                    key: "water",
                    label: "Water Change",
                    value: pondSummary.dueWaterChangeCount ?? 0,
                    message:
                      alerts.find((a) =>
                        String(a.message || "")
                          .toLowerCase()
                          .includes("water"),
                      )?.message || null,
                    icon: <Droplets className="w-5 h-5" />,
                    tone: "sky",
                  },
                  {
                    key: "empty",
                    label: "Empty Ponds",
                    value: Number(
                      pondSummary.totalEmptyPonds ??
                        pondSummary.countByStatus?.EMPTY ??
                        0,
                    ),
                    message: Number(
                      pondSummary.totalEmptyPonds ??
                        pondSummary.countByStatus?.EMPTY ??
                        0,
                    )
                      ? "Some ponds are currently empty."
                      : "All ponds are active.",
                    icon: <CircleOff className="w-5 h-5" />,
                    tone: "slate",
                  },
                ];

                const activeCards = alertCards.filter(
                  (c) => Number(c.value || 0) > 0 || c.message,
                );

                if (activeCards.length === 0) {
                  return (
                    <p className="text-sm text-slate-400">No alerts for now.</p>
                  );
                }

                return (
                  <div className="grid gap-3">
                    {activeCards.map((card) => (
                      <div
                        key={card.key}
                        className="rounded-xl p-4 border border-white/10 bg-white/10 dark:bg-darkCard/70"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg grid place-items-center bg-white/10 dark:bg-white/5 text-slate-300">
                              {card.icon}
                            </div>
                            <div>
                              <div className="text-sm font-semibold font-header">
                                {card.label}
                              </div>
                              <div className="text-xs text-slate-400">
                                {card.message || "Requires attention"}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`text-lg font-semibold font-header
                            ${
                              card.tone === "rose"
                                ? "text-rose-300"
                                : card.tone === "sky"
                                  ? "text-sky-300"
                                  : "text-slate-300"
                            }`}
                          >
                            {Number(card.value || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
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
                value={stockForm.pondId}
                onChange={(e) =>
                  setStockForm({ ...stockForm, pondId: e.target.value })
                }
              >
                <option value="">Select Pond</option>
                {ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.pondName}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Adjust quantity (+ / -)"
                title="Enter a positive or negative adjustment"
                className="w-full px-3 py-2 rounded-md bg-transparent border dark:border-white/10"
                value={stockForm.quantity}
                onChange={(e) =>
                  setStockForm({ ...stockForm, quantity: e.target.value })
                }
              />

              <select
                className="w-full px-3 py-2 rounded-md bg-transparent bg-lightCard dark:bg-darkCard border dark:border-white/10"
                title="Select a reason for the adjustment"
                value={stockForm.reason}
                onChange={(e) =>
                  setStockForm({ ...stockForm, reason: e.target.value })
                }
              >
                <option value="">Reason (optional)</option>
                <option value="PURCHASE">Purchase</option>
                <option value="SALE">Sale</option>
                <option value="CONSUMPTION">Consumption</option>
                <option value="TRANSFER_IN">Transfer In</option>
                <option value="TRANSFER_OUT">Transfer Out</option>
                <option value="OTHER">Other</option>
              </select>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={submitStockAdjustment}
                  title="Apply the stock adjustment"
                  className="px-2 py-1 text-xs rounded-md bg-accent-primary text-darkText hover:bg-primary/30 transition disabled:opacity-60"
                  disabled={stockSaving}
                >
                  {stockSaving ? "Updating..." : "Update Stock"}
                </button>
                <button
                  onClick={() =>
                    setStockForm({ pondId: "", quantity: "", reason: "" })
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
            <h2 className="font-header font-semibold mb-3">Ponds by Type</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-body">
              Distribution of ponds by type.
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
            title="Ponds by Type"
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

        </div>

        <ItemDetailsModal
          open={Boolean(pondDetail)}
          title={pondDetail?.pondName || "Pond Details"}
          subtitle={pondDetail?.id ? `Pond ID #${pondDetail.id}` : undefined}
          status={pondDetail ? getPondStatus(pondDetail) : undefined}
          fields={pondDetailFields}
          onClose={closePondDetails}
          onEdit={
            pondDetail
              ? () => {
                  closePondDetails();
                  openEditPond(pondDetail);
                }
              : undefined
          }
          onDelete={
            pondDetail
              ? () => {
                  closePondDetails();
                  askDelete(pondDetail, "pond");
                }
              : undefined
          }
        />

        <ItemDetailsModal
          open={Boolean(hatchDetail)}
          title="Hatch Details"
          subtitle={hatchDetail?.id ? `Hatch ID #${hatchDetail.id}` : undefined}
          status={hatchDetail ? getHatchStatus(hatchDetail) : undefined}
          fields={hatchDetailFields}
          onClose={closeHatchDetails}
          onEdit={
            hatchDetail
              ? () => {
                  closeHatchDetails();
                  openEditHatch(hatchDetail);
                }
              : undefined
          }
          onDelete={
            hatchDetail
              ? () => {
                  closeHatchDetails();
                  askDelete(hatchDetail, "hatch");
                }
              : undefined
          }
        />

        <ExportModal
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          onSubmit={handleExport}
          exporting={exporting}
          defaultCategory="fish-ponds"
          defaultType="csv"
          defaultStart={pondFilters.lastWaterChange || ""}
          defaultEnd={pondFilters.lastWaterChange || ""}
        />

        {/* Confirm Modal */}
        <ConfirmModal
          open={confirmOpen}
          title="Delete Record"
          message={`Are you sure you want to delete "${deleteLabel}"?`}
          confirmText="Delete"
          loading={false}
          onCancel={() => {
            setConfirmOpen(false);
            setDeleteTarget(null);
            setDeleteType(null);
          }}
          onConfirm={confirmDelete}
        />

        <FishPondFormModal
          open={pondModalOpen}
          onClose={() => {
            setPondModalOpen(false);
            setPondEditing(null);
          }}
          initialData={pondEditing}
          onSuccess={async (pond) => {
            setPondModalOpen(false);
            setPondEditing(null);

            setToast({
              message: `"${pond.pondName}" ${pondEditing ? "updated" : "created"}`,
              type: "success",
            });

            if (pondEditing) {
              await fetchPonds(pondMeta.page);
            } else {
              await fetchPonds(0);
            }
            await fetchSummaries();
          }}
        />

        <FishHatchFormModal
          open={hatchModalOpen}
          onClose={() => {
            setHatchModalOpen(false);
            setHatchEditing(null);
          }}
          initialData={hatchEditing}
          pondOptions={ponds}
          onSuccess={async () => {
            setHatchModalOpen(false);
            setHatchEditing(null);

            setToast({
              message: `Hatch record ${hatchEditing ? "updated" : "created"}`,
              type: "success",
            });

            await fetchHatches();
            await fetchSummaries();
          }}
        />

        <TrashModal
          open={pondTrashOpen}
          onClose={() => setPondTrashOpen(false)}
          title="Deleted Ponds"
          fetchData={async ({ page = 0, size = 10 }) => {
            const res = await getDeletedFishPonds({ page, size });
            if (Array.isArray(res)) {
              return {
                items: res,
                page: 0,
                totalPages: 1,
                hasNext: false,
                hasPrevious: false,
              };
            }
            return res;
          }}
          onRestore={async (pond) => {
            await restoreFishPond(pond.id);
            await fetchPonds(pondMeta.page);
            await fetchSummaries();

            setToast({
              message: `"${pond.pondName}" restored successfully`,
              type: "success",
            });
          }}
          columns={[
            { key: "pondName", label: "Pond" },
            { key: "pondType", label: "Type" },
            { key: "status", label: "Status" },
            { key: "pondLocation", label: "Location" },
            { key: "dateStocked", label: "Stocked" },
          ]}
        />

        <TrashModal
          open={hatchTrashOpen}
          onClose={() => setHatchTrashOpen(false)}
          title="Deleted Hatch Records"
          fetchData={async ({ page = 0, size = 10 }) => {
            const res = await getDeletedFishHatches({ page, size });
            if (Array.isArray(res)) {
              return {
                items: res,
                page: 0,
                totalPages: 1,
                hasNext: false,
                hasPrevious: false,
              };
            }
            return res;
          }}
          onRestore={async (hatch) => {
            await restoreFishHatch(hatch.id);
            await fetchHatches();
            await fetchSummaries();

            setToast({
              message: "Hatch record restored successfully",
              type: "success",
            });
          }}
          columns={[
            { key: "hatchDate", label: "Date" },
            { key: "pondName", label: "Pond" },
            { key: "quantityHatched", label: "Hatched", align: "right" },
            { key: "hatchRate", label: "Rate", align: "right" },
          ]}
          formatCell={(item, key) => {
            if (key === "hatchRate") return formatRate(item.hatchRate);
            if (key === "quantityHatched")
              return Number(item.quantityHatched || 0).toLocaleString();
            return item[key] ?? "—";
          }}
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
