import React from "react";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

function CircleSkeleton({ height = 64, className = "" }) {
  const size = Number.isFinite(Number(height)) ? Number(height) : 64;

  return (
    <div className={joinClasses("flex h-full w-full items-center justify-center", className)}>
      <div
        className="skeleton-glass rounded-full"
        style={{ width: `${size}px`, height: `${size}px` }}
        aria-hidden="true"
      />
    </div>
  );
}

function BarSkeleton({ rows = 4, className = "" }) {
  return (
    <div className={joinClasses("flex h-full w-full flex-col justify-end gap-3", className)}>
      {Array.from({ length: rows }).map((_, index) => {
        const widths = ["100%", "88%", "94%", "76%", "90%", "82%", "68%"];
        return (
          <div
            key={`bar-skeleton-${index}`}
            className="skeleton-glass rounded-lg"
            style={{
              height: `${32 + (index % 3) * 10}px`,
              width: widths[index % widths.length],
            }}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

function RowsSkeleton({ rows = 4, className = "" }) {
  return (
    <div className={joinClasses("flex w-full flex-col gap-3", className)}>
      {Array.from({ length: rows }).map((_, index) => {
        const widths = ["100%", "92%", "86%", "96%", "78%", "90%"];
        return (
          <div
            key={`row-skeleton-${index}`}
            className="skeleton-glass h-10 rounded-lg"
            style={{ width: widths[index % widths.length] }}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

export default function SkeletonLoader({
  rows = 4,
  type = "rows",
  height = 64,
  className = "",
}) {
  if (type === "circle") {
    return <CircleSkeleton height={height} className={className} />;
  }

  if (type === "bar") {
    return <BarSkeleton rows={rows} className={className} />;
  }

  return <RowsSkeleton rows={rows} className={className} />;
}
