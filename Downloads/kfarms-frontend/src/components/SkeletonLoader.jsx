import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import SkeletonLoader from "./SkeletonLoader";

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
  /* ------------------------------
     UI STATE
  ------------------------------ */
  const [darkMode, setDarkMode] = useState(
    typeof document !== "undefined" &&
      document.body.classList.contains("dark")
  );
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );
  const [chartKey, setChartKey] = useState(0);
  const [loading, setLoading] = useState(true);

  /* ------------------------------
     LOADING (simulate fetch)
  ------------------------------ */
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200); // skeleton visible briefly

    return () => clearTimeout(timer);
  }, []);

  /* ------------------------------
     THEME + RESIZE SYNC
  ------------------------------ */
  useEffect(() => {
    const sync = () => {
      setDarkMode(document.body.classList.contains("dark"));
      setIsMobile(window.innerWidth < 640);
      setChartKey(k => k + 1);
    };

    sync();
    window.addEventListener("resize", sync);

    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.removeEventListener("resize", sync);
      observer.disconnect();
    };
  }, []);

  /* ------------------------------
     DATA CHECK
  ------------------------------ */
  const hasData =
    Array.isArray(breakdown) &&
    breakdown.length > 0 &&
    breakdown.some(b => Number(b.value) > 0);

  /* ------------------------------
     CHART DATA
  ------------------------------ */
  const labels = breakdown.map(b => b.label);
  const values = breakdown.map(b => b.value || 0);
  const colors = labels.map(getColor);

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 6,
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
        display: !isMobile,
        position: "right",
        labels: {
          color: textColor,
          font: { size: 14 },
          boxWidth: 14,
          padding: 12,
        },
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

  /* ------------------------------
     EMPTY STATE
  ------------------------------ */
  const renderEmpty = () => (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="flex flex-col items-center text-center gap-3">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center
            ${
              darkMode
                ? "bg-gradient-to-br from-yellow-900/30 to-amber-900/20"
                : "bg-yellow-100"
            }`}
        >
          <span className="text-3xl">🌾</span>
        </div>

        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-100">
          No feed consumption recorded
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
          When you log feed usage for layers, ducks, or fish, this chart will
          display the breakdown.
        </p>

        <button
          className="mt-2 px-5 py-2 bg-accent-primary text-white rounded-lg"
          onClick={() => (window.location.href = "/feed/add")}
        >
          Log Feed Consumption
        </button>
      </div>
    </div>
  );

  /* ------------------------------
     RENDER
  ------------------------------ */
  return (
    <div className="w-full h-52 sm:h-64 md:h-72 min-h-[13rem]">
      {loading ? (
        <SkeletonLoader type="circle" height={50} />
      ) : !hasData ? (
        renderEmpty()
      ) : (
        <Pie key={chartKey} data={data} options={options} />
      )}
    </div>
  );
}

export { COLORS };
