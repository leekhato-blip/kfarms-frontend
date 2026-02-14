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
import { TrendingUp, Wallet } from "lucide-react";

/* ------------------ Helpers ------------------ */
function formatMonth(value) {
  const [year, month] = value.split("-");
  const date = new Date(year, month - 1);
  return date.toLocaleString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

function formatCurrency(value) {
  if (value == null || isNaN(value)) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

/* ------------------ Tooltip ------------------ */
function CustomTooltip({ active, payload, label }) {
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
          <span className="font-semibold">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------ Component ------------------ */
export default function RevenueExpenseChart({ data = [] }) {
  const safeData = Array.isArray(data) ? data : [];

  const hasData =
    safeData.length > 0 &&
    safeData.some((d) => d.revenue || d.expense || d.profit);

  const totalRevenue = safeData.reduce((sum, d) => sum + (d.revenue || 0), 0);

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
            Monthly revenue and expenses will appear once transactions are
            recorded.
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
      <div className="mb-4">
        <p className="text-sm font-header text-lightText/70 dark:text-darkText/70">
          Revenue Generated
        </p>
        <h2 className="text-2xl font-bold font-header text-green-400">
          {formatCurrency(totalRevenue)}
        </h2>
        <p className="mt-2 text-xs text-lightText/70 dark:text-darkText/70">
          Monthly revenue, expense, and profit trends.
        </p>
      </div>

      {/* BODY */}
      <div className="flex-1 flex items-center overflow-hidden justify-center">
        {!hasData ? (
          renderEmpty()
        ) : (
          <div className="w-full h-72 overflow-hidden relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={safeData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  tickFormatter={formatMonth}
                />
                <YAxis stroke="#64748b" />
                <ReTooltip
                  content={<CustomTooltip />}
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
