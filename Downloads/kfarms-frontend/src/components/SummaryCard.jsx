import React from "react";

export default function SummaryCard({
  icon,
  title,
  value,
  subtitle = null,
  delta = null,
  titleClass = "",
  valueClass = "",
  className = "",
}) {
  const deltaText = typeof delta === "string" ? delta.trim() : delta;
  const isNegative = typeof deltaText === "string" && deltaText.startsWith("-");

  return (
    <article
      role="group"
      aria-label={`${title} summary`}
      className={`flex flex-col rounded-2xl bg-lighCard shadow-neo dark:shadow-dark dark:bg-darkCard p-5 lg:p-6 xl:p-6 ${className}`}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-5">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl flex items-center justify-center shadow-neo bg-gradient-to-br from-emerald-400 to-indigo-500 dark:from-accent-primary dark:to-green-800">
            {React.cloneElement(icon, {
              className: "w-6 h-6 lg:w-7 lg:h-7 text-white",
              "aria-hidden": true,
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-4">
          <div className="flex-1 min-w-0">
            <div
              className={`text-sm sm:text-base lg:text-lg xl:text-xl font-semibold tracking-tight text-gray-700 dark:text-gray-100 leading-tight truncate ${titleClass}`}
            >
              {title}
            </div>

            {subtitle && (
              <div className="mt-0.5 text-xs sm:text-sm text-gray-500 dark:text-gray-300/80 truncate">
                {subtitle}
              </div>
            )}
          </div>

          {/* Value */}
          <div className="flex-shrink-0 text-right">
            <div
              className={`text-sm sm:text-2xl lg:text-3xl xl:text-3xl font-extrabold font-header text-gray-900 dark:text-white truncate ${valueClass}`}
            >
              {value}
            </div>

            {deltaText && (
              <div
                className={`mt-1 inline-flex items-center gap-1.5 text-xs sm:text-sm px-2 py-0.5 rounded-full font-medium ${
                  isNegative
                    ? "text-red-700 bg-red-50 dark:bg-red-900/30"
                    : "text-green-700 bg-green-50 dark:bg-green-900/30"
                }`}
                aria-hidden
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3 h-3"
                >
                  {isNegative ? (
                    <path d="M18 6 L6 18 M6 6 L18 18" />
                  ) : (
                    <path d="M12 19V5M5 12h14" />
                  )}
                </svg>

                <span className="whitespace-nowrap">{deltaText}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
