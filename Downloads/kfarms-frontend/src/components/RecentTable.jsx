import React from "react";
import { Info, CheckCircle, Clock } from "lucide-react";
import SkeletonLoader from "./SkeletonLoader";

export default function RecentTable({ items = [], loading = false }) {
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
    <div className="relative dark:bg-darkCard dark:border-white/10 shadow-neo dark:shadow-dark p-5 rounded-2xl transition-all duration-300 font-body">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg sm:text-xl font-semibold font-header text-lightText dark:text-darkText">
          Recent Activities
        </h3>

        {/* Info badge */}
        <div className="flex items-center gap-2 bg-accent-primary px-3 py-1 rounded-full shadow-md">
          <Info className="w-4 h-4 text-slate-100" />
          <span className="text-xs font-semibold text-slate-100">
            {items.length} Activities
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl">
        <table className="w-full table-auto text-left text-sm sm:text-base border-collapse">
          <thead className="bg-lightbg dark:bg-darkCard">
            <tr>
              {["Date", "Category", "Item", "Quantity", "Status"].map((h) => (
                <th
                  key={h}
                  className="py-3 px-3 text-lg sm:text-sm font-bold font-header uppercase tracking-wider text-lightText dark:text-darkText border-b border-slate-200 dark:border-white/10"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
            {items.length > 0
              ? items.map((r) => (
                  <tr
                    key={r.id || `${r.date}-${r.item}`}
                    className="transition-all duration-200 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
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
                      {r.category}
                    </td>

                    <td className="py-3 px-3 font-semibold text-lightText dark:text-darkText">
                      {r.item}
                    </td>

                    <td className="py-3 px-3 font-semibold text-lightText dark:text-darkText">
                      {r.quantity}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200
                          ${
                            r.status === "Completed"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          } hover:scale-105`}
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
