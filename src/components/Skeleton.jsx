import React from "react";

export function Skeleton({ className = "" }) {
  return <div className={`atlas-skeleton rounded-md ${className}`} />;
}

export function MetricCardSkeleton() {
<<<<<<< HEAD
  return <Skeleton className="h-[150px] w-full rounded-[1.25rem]" />;
=======
  return <Skeleton className="h-24 w-full" />;
>>>>>>> 0babf4d (Update frontend application)
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
