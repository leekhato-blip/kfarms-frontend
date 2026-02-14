import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = {
  layer: "#D7A86E",
  poultry: "#D7A86E",
  fish: "#1565C0",
  duck: "#2E7D32",
  ducks: "#2E7D32",
  other: "#9CA3AF",
  others: "#9CA3AF",
};

const getColor = (label = "") => {
  const l = label.toLowerCase();
  if (l.includes("layer") || l.includes("poul")) return COLORS.layer;
  if (l.includes("fish")) return COLORS.fish;
  if (l.includes("duck")) return COLORS.duck;
  return COLORS.other;
};

export default function FeedPie({ breakdown = [] }) {
  const [darkMode, setDarkMode] = useState(null);
  const [chartKey, setChartKey] = useState(0);

  /* Sync theme + resize */
  useEffect(() => {
    const sync = () => {
      setDarkMode(document.documentElement.classList.contains("dark"));
      setChartKey((k) => k + 1); // force redraw (needed for canvas)
    };

    sync();

    window.addEventListener("resize", sync);

    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.removeEventListener("resize", sync);
      observer.disconnect();
    };
  }, []);

  /* Check meaningful data */
  const hasData =
    Array.isArray(breakdown) &&
    breakdown.length > 0 &&
    breakdown.some((b) => {
      const numericValue = Number(b?.value);
      if (Number.isFinite(numericValue)) return numericValue > 0;
      return Boolean(b?.value);
    });

  /* Prepare chart data */
  const labels = breakdown.map((b) => b.label);
  const values = breakdown.map((b) => Number(b?.value) || 0);
  const colors = labels.map(getColor);

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: darkMode ? "#1F2937" : "#fff",
        hoverOffset: 12,
        borderRadius: 8,
      },
    ],
  };

  const textColor = darkMode ? "#F8FAFC" : "#1F2937";

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 12 },
    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        backgroundColor: darkMode ? "#020617" : "#F8FAFC",
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: darkMode ? "#334155" : "#CBD5E1",
        borderWidth: 1,
      },
    },
  };

  /* Empty State */
  const renderEmpty = () => (
    <div
      className="w-full h-full flex items-center justify-center p-4 font-body"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center text-center gap-3">
        <div
          className={`flex items-center justify-center w-20 h-20 rounded-full
            ${
              darkMode
                ? "bg-gradient-to-br from-yellow-900/30 to-amber-900/20"
                : "bg-yellow-100"
            }
            shadow-sm`}
          aria-hidden="true"
        >
          <span className="text-3xl leading-none">🌾</span>
        </div>

        <h3 className="text-sm font-semibold font-header text-slate-700 dark:text-slate-100">
          No feed consumption recorded
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
          When you log feed usage for your layers, ducks, or fish, this chart
          will show the breakdown.
        </p>

        <div className="mt-2 text-[13px] text-slate-400 dark:text-slate-500 flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs">
            Tip
          </span>
          <span>Log a feed consumption or order to see this chart.</span>
        </div>

        <button
          className="mt-3 w-full sm:w-auto px-5 py-2 bg-accent-primary text-white rounded-lg transition hover:opacity-90 active:scale-[0.98]"
          onClick={() => {
            window.location.href = "/feed/add";
          }}
        >
          Log Feed Consumption
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full h-[260px] sm:h-[300px] md:h-[340px] min-h-[260px]">
      {!hasData ? (
        renderEmpty()
      ) : (
        <Pie key={chartKey} data={data} options={options} />
      )}
    </div>
  );
}

export { COLORS };
