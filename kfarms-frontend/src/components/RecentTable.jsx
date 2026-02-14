import React from "react";
import { useNavigate } from "react-router-dom";
import { Info, CheckCircle, Clock } from "lucide-react";
import SkeletonLoader from "./SkeletonLoader";

export default function RecentTable({ items = [], loading = false }) {
  const navigate = useNavigate();
  const categoryRouteMap = {
    Sales: "/sales",
    Supplies: "/supplies",
    Fish: "/fish-ponds",
    Livestock: "/livestock",
    Feed: "/feeds",
  };
  if (loading) {
    return (
      <div className="font-body">
        <SkeletonLoader rows={5} />
      </div>
    );
  }

  const renderEmpty = () => (
    <tr>
      <td colSpan="5">
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center font-body">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 via-emerald-100 to-sky-100 dark:from-amber-900/40 dark:via-emerald-900/40 dark:to-sky-900/40 text-2xl shadow-md animate-pulse">
            📋
          </div>
          <h4 className="text-sm font-semibold font-header text-slate-700 dark:text-slate-100">
            No recent activities
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
            Actions like feed logs, sales, or supplies will appear here once recorded.
          </p>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 border border-white/10 dark:shadow-dark shadow-neo p-6 font-body">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg sm:text-xl font-semibold font-header text-lightText dark:text-darkText">
          Recent Activities
        </h3>

        {/* Info badge */}
        <div className="flex items-center gap-2 bg-accent-primary/10 text-accent-primary px-3 py-1 rounded-full border border-accent-primary/20">
          <Info className="w-4 h-4" />
          <span className="text-xs font-semibold">
            {items.length} Activities
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px] border-separate border-spacing-y-2 [&_th]:px-4 [&_th]:pb-2 [&_td]:px-4 [&_td]:py-3 [&_td:first-child]:rounded-l-xl [&_td:last-child]:rounded-r-xl [&_tbody_tr]:bg-white/5 dark:[&_tbody_tr]:bg-darkCard/60 [&_tbody_tr]:shadow-soft [&_tbody_tr:hover]:shadow-neo [&_tbody_tr]:transition">
          <thead className="text-lightText dark:text-darkText font-body">
            <tr>
              {["Date", "Category", "Item", "Quantity", "Status"].map((h) => (
                <th
                  key={h}
                  className="text-left whitespace-nowrap font-header text-[11px] uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {items.length > 0
              ? items.map((r) => (
                  <tr
                    key={r.id || `${r.date}-${r.item}`}
                    className="border-b font-body dark:border-white/10 hover:bg-accent-primary/25 dark:hover:bg-white/5"
                  >
                    <td className="py-3 px-3 text-lightText dark:text-darkText whitespace-nowrap font-mono text-xs sm:text-sm">
                      {new Date(r.date).toLocaleString(undefined, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="py-3 px-3 font-medium text-lightText dark:text-darkText flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500 dark:text-amber-300" />
                      <button
                        type="button"
                        onClick={() =>
                          navigate(categoryRouteMap[r.category] || "/")
                        }
                        className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold border border-white/10 bg-white/10 dark:bg-darkCard/70 hover:bg-white/20 transition"
                      >
                        {r.category}
                      </button>
                    </td>

                    <td className="py-3 px-3 font-semibold text-lightText dark:text-darkText">
                      {r.item}
                    </td>

                    <td className="py-3 px-3 font-semibold text-lightText dark:text-darkText">
                      {r.quantity}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold
                          ${
                            r.status === "Completed"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          }`}
                      >
                        {r.status === "Completed" ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              : renderEmpty()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
