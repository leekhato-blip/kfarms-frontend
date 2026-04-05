import React, { useEffect, useMemo, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
<<<<<<< HEAD
import { useNavigate } from "react-router-dom";
=======
>>>>>>> 0babf4d (Update frontend application)
import { formatFeedLabel, resolveFeedColor } from "../utils/feedChart";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function FeedPie({
  breakdown = [],
  emptyTitle = "No feed consumption recorded",
  emptyMessage = "When you log feed usage for your layers, ducks, or fish, this chart will show the breakdown.",
  emptyActionLabel = "Log Feed Consumption",
  onEmptyAction,
}) {
  const [darkMode, setDarkMode] = useState(null);
  const [chartKey, setChartKey] = useState(0);
  const navigate = useNavigate();

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
  const preparedBreakdown = useMemo(
    () =>
      (Array.isArray(breakdown) ? breakdown : [])
        .map((item) => ({
          label: formatFeedLabel(item?.label || "Others"),
          value: Number(item?.value) || 0,
        }))
        .filter((item) => item.value > 0),
    [breakdown],
  );

  const hasData = preparedBreakdown.length > 0;

  /* Prepare chart data */
  const labels = preparedBreakdown.map((item) => item.label);
  const values = preparedBreakdown.map((item) => item.value);
  const colors = labels.map(resolveFeedColor);
  const total = values.reduce((sum, value) => sum + value, 0);

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderWidth: 1.5,
        borderColor: darkMode ? "#1F2937" : "#fff",
        hoverOffset: 10,
        borderRadius: 6,
      },
    ],
  };

  const textColor = darkMode ? "#F8FAFC" : "#1F2937";

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 12 },
    animation: {
      duration: 700,
      easing: "easeOutQuart",
    },
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
        displayColors: true,
        callbacks: {
          label(context) {
            const raw = Number(context.parsed) || 0;
            const percentage = total > 0 ? (raw / total) * 100 : 0;
            return `${context.label}: ${raw.toFixed(1)} (${percentage.toFixed(1)}%)`;
          },
        },
      },
    },
  };

  /* Empty State */
  const handleEmptyAction = () => {
    if (typeof onEmptyAction === "function") {
      onEmptyAction();
      return;
    }

<<<<<<< HEAD
    navigate("/feeds");
=======
    window.location.href = "/feeds";
>>>>>>> 0babf4d (Update frontend application)
  };

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
          {emptyTitle}
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
          {emptyMessage}
        </p>

        <div className="mt-2 text-[13px] text-slate-400 dark:text-slate-500 flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs">
            Tip
          </span>
          <span>Log a feed consumption or order to see this chart.</span>
        </div>

        {emptyActionLabel ? (
          <button
            className="mt-3 w-full sm:w-auto px-5 py-2 bg-accent-primary text-white rounded-lg transition hover:opacity-90 active:scale-[0.98]"
            onClick={handleEmptyAction}
          >
            {emptyActionLabel}
          </button>
        ) : null}
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
