import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useMemo } from "react";
import SkeletonLoader from "./SkeletonLoader";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ProductionChart({ productionData, loading = false }) {
  // Helper to format "YYYY-MM" → "Jan '25"
  const formatMonth = (value) => {
    const [year, month] = value.split("-");
    const date = new Date(year, month - 1);
    return `${date.toLocaleString("en-US", { month: "short" })} '${year.slice(
      2
    )}`;
  };

  const hasData =
    Array.isArray(productionData) &&
    productionData.length > 0 &&
    productionData.some((p) => p.quantity > 0);

  /* Chart data */
  const data = useMemo(() => {
    if (!hasData) return { labels: [], datasets: [] };

    return {
      labels: productionData.map((p) => formatMonth(p.date)),
      datasets: [
        {
          label: "Production",
          data: productionData.map((p) => p.quantity),
          backgroundColor: "rgba(15, 192, 192, 0.5)",
          borderColor: "rgba(15, 192, 192, 1)",
        },
      ],
    };
  }, [productionData, hasData]);

  /* Chart options */
  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: false,
        },
      },
    }),
    []
  );

  /* 1️⃣ Loading state */
  if (loading) {
    return (
      <div className="relative w-full h-full min-h-[260px] p-4 font-body">
        <SkeletonLoader rows={7} type="bar" className="w-full h-full" />
      </div>
    );
  }

  /* 2️⃣ Empty state */
  if (!hasData) {
    return (
      <div className="flex h-full min-h-[260px] w-full items-center justify-center px-4 sm:px-6 font-body">
        <div className="flex max-w-sm flex-col items-center text-center">
          <div className="mb-4 text-4xl sm:text-5xl md:text-6xl">🥚</div>

          <h3 className="mb-2 text-base sm:text-lg font-semibold font-header text-lightText dark:text-darkText">
            No production recorded yet
          </h3>

          <p className="mb-5 text-sm text-lightText/70 dark:text-slate-400 leading-relaxed">
            Once you start recording egg collections, this chart will show monthly
            trends.
          </p>

          <button
            className="w-full sm:w-auto px-6 py-3 text-sm font-medium rounded-lg bg-accent-primary text-white hover:opacity-90 active:scale-[0.98] mb-8 transition"
            onClick={() => {
              window.location.href = "/production/add";
            }}
          >
            Record Production
          </button>
        </div>
      </div>
    );
  }

  /* 3️⃣ Chart render */
  return (
    <div className="relative w-full h-full min-h-[260px] font-body">
      <Bar data={data} options={options} />
    </div>
  );
}
