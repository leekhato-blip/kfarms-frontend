import React from "react";

export function Skeleton({ className = "" }) {
  return <div className={`atlas-skeleton rounded-md ${className}`} />;
}

export function MetricCardSkeleton() {
  return <Skeleton className="h-[150px] w-full rounded-[1.25rem]" />;
}

export function TableRowSkeleton({ columns = 6 }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
