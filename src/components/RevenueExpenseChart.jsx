import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, RefreshCw, TrendingUp, Wallet } from "lucide-react";

/* ------------------ Helpers ------------------ */
function formatMonth(value) {
  const [year, month] = value.split("-");
  const date = new Date(year, month - 1);
  return date.toLocaleString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

function formatCurrency(value, currency = "NGN") {
  if (value == null || isNaN(value)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: String(currency || "NGN").toUpperCase(),
    maximumFractionDigits: 0,
  }).format(value);
}

/* ------------------ Tooltip ------------------ */
function CustomTooltip({ active, payload, label, currency = "NGN" }) {
  if (!active || !payload || !payload.length) return null;

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  return (
    <div
      className="rounded-lg p-3 shadow-xl border font-body"
      style={{
        background: isDark ? "#0b1220" : "#ffffff",
        color: isDark ? "#ffffff" : "#0b1220",
        borderColor: isDark ? "#1f2937" : "#e5e7eb",
      }}
    >
      <div className="text-xs opacity-70 mb-2">{formatMonth(label)}</div>

      {payload.map((p) => (
        <div
          key={p.dataKey}
          className="flex justify-between items-center gap-4 mb-1"
        >
          <div className="flex items-center gap-2 text-sm">
            <span
              className="w-2.5 h-2.5"
              style={{ background: p.stroke || p.color }}
            />
            {p.name || p.dataKey}
          </div>
          <span className="font-semibold">{formatCurrency(p.value, currency)}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------ Component ------------------ */
export default function RevenueExpenseChart({
  data = [],
<<<<<<< HEAD
  currency = "NGN",
=======
>>>>>>> 0babf4d (Update frontend application)
  onRefresh,
  refreshing = false,
}) {
  const safeData = Array.isArray(data)
    ? data.map((entry) => {
        const revenue = Number(entry?.revenue || 0);
        const expense = Number(entry?.expense || 0);
        const profit =
          typeof entry?.profit === "number"
            ? entry.profit
            : revenue - expense;

        return {
          ...entry,
          revenue,
          expense,
          profit,
        };
      })
    : [];

  const hasData =
    safeData.length > 0 &&
    safeData.some((d) => d.revenue || d.expense || d.profit);

  const totalRevenue = safeData.reduce((sum, d) => sum + (d.revenue || 0), 0);
  const latestMonth = safeData.at(-1) || null;
  const previousMonth = safeData.at(-2) || null;
  const currentProfit = latestMonth?.profit ?? 0;
  const previousProfit = previousMonth?.profit ?? 0;
  const latestMonthLabel = latestMonth?.month ? formatMonth(latestMonth.month) : "Latest month";
  const profitDelta = currentProfit - previousProfit;
  const canShowPercentChange =
    previousMonth && previousProfit !== 0 && Number.isFinite(previousProfit);
  const profitChangePercent = canShowPercentChange
    ? (profitDelta / Math.abs(previousProfit)) * 100
    : null;

  const profitTrend = profitDelta > 0 ? "up" : profitDelta < 0 ? "down" : "flat";
  const trendTone =
    profitTrend === "up"
      ? "text-emerald-600 dark:text-emerald-300"
      : profitTrend === "down"
        ? "text-rose-600 dark:text-rose-300"
        : "text-lightText/60 dark:text-darkText/60";

  let profitSummary = "No last-month comparison yet";
  if (latestMonth && previousMonth && profitChangePercent != null) {
    profitSummary = `${profitChangePercent >= 0 ? "↑" : "↓"} ${Math.abs(
      profitChangePercent,
    ).toFixed(Math.abs(profitChangePercent) >= 10 ? 0 : 1)}% from last month`;
  } else if (latestMonth && previousMonth && previousProfit === 0 && currentProfit !== 0) {
    profitSummary = currentProfit > 0 ? "New profit this month" : "New loss this month";
  } else if (latestMonth && previousMonth) {
    profitSummary = "Same as last month";
  } else if (latestMonth && currentProfit === 0) {
    profitSummary = "No profit recorded yet";
  }

  const renderEmpty = () => (
    <div className="w-full h-full flex items-center justify-center p-4 font-body">
      <div className="flex flex-col py-9 items-center text-center gap-2">
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center
                     bg-gradient-to-br from-emerald-100 to-indigo-100
                     dark:from-emerald-900/40 dark:to-indigo-900/40"
        >
          <TrendingUp className="w-9 h-9 text-emerald-500" />
        </div>

        {/* Text */}
        <div>
          <h3 className="text-lg font-semibold font-header text-lightText dark:text-darkText">
            No financial activity yet
          </h3>
          <p className="mt-2 text-sm text-lightText/70 dark:text-darkText/70">
            Monthly revenue and expenses will appear once sales and spending
            records are added.
          </p>
        </div>

        {/* Hint */}
        <div className="flex items-center gap-2 text-sm text-lightText/70 dark:text-darkText/70">
          <Wallet className="w-4 h-4" />
          Start by recording a sale or expense
        </div>

        {/* CTA */}
        {/* <button
          className="mt-2 px-6 py-3 text-sm font-medium rounded-lg
                     bg-accent-primary text-white
                     hover:opacity-90 active:scale-[0.98] transition"
          onClick={() => (window.location.href = "/financial/add")}
        >
          Record Transaction
        </button> */}
      </div>
    </div>
  );

  return (
    <div
      className="bg-white dark:bg-darkCard rounded-xl shadow-neo dark:shadow-dark p-5
                 flex flex-col font-body"
      tabIndex={-1}
      onFocus={(e) => e.currentTarget.blur()}
    >
      {/* HEADER */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-header text-lightText/70 dark:text-darkText/70">
            Revenue Generated
          </p>
          <h2 className="text-2xl font-bold font-header text-green-400">
<<<<<<< HEAD
            {formatCurrency(totalRevenue, currency)}
=======
            {formatCurrency(totalRevenue)}
>>>>>>> 0babf4d (Update frontend application)
          </h2>
          <p className="mt-2 text-xs text-lightText/70 dark:text-darkText/70">
            Monthly revenue, expense, and profit trends.
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh revenue chart"
            aria-label="Refresh revenue chart"
            className={`inline-flex items-center justify-center rounded-md border border-slate-200 p-1.5 text-xs text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 ${
              refreshing ? "cursor-not-allowed opacity-70" : ""
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200/70 bg-slate-50/70 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/30">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-lightText/60 dark:text-darkText/55">
            Profit this month
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-xl font-semibold font-header text-lightText dark:text-darkText">
<<<<<<< HEAD
              {formatCurrency(currentProfit, currency)}
=======
              {formatCurrency(currentProfit)}
>>>>>>> 0babf4d (Update frontend application)
            </h3>
            <div className={`flex items-center gap-1.5 text-xs font-medium ${trendTone}`}>
              {profitTrend === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : null}
              {profitTrend === "down" ? <ArrowDownRight className="h-3.5 w-3.5" /> : null}
              <span>{profitSummary}</span>
            </div>
          </div>
        </div>

        <div className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-lightText/65 shadow-sm dark:bg-slate-900 dark:text-darkText/65">
          {latestMonthLabel}
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 flex items-center overflow-hidden justify-center">
        {!hasData ? (
          renderEmpty()
        ) : (
          <div className="w-full h-72 overflow-hidden relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={safeData}
                margin={{ top: 8, right: 12, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  tickFormatter={formatMonth}
                />
                <YAxis
                  stroke="#64748b"
                  width={72}
                  tickMargin={10}
                />
                <ReTooltip
                  content={<CustomTooltip currency={currency} />}
                  wrapperStyle={{ zIndex: 30 }}
                />
                <Legend />

                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#818cf8"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  name="Expense"
                  stroke="#fda4af"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Profit"
                  stroke="#34d399"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
