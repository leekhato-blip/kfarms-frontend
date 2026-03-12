import React from "react";
import { TableRowSkeleton } from "./Skeleton";

export default function Table({
  columns,
  data,
  loading,
  renderRow,
  rowKey,
  onRowClick,
  emptyTitle = "No records",
  emptyMessage = "No records available for this query.",
  skeletonRows = 6,
  tableClassName = "",
  wrapperClassName = "",
  scrollClassName = "",
  headClassName = "",
  bodyClassName = "",
  rowClassName = "",
  emptyCellClassName = "",
}) {
  const hasColumnWidths = columns.some((column) => column.width);
  const getAlignClass = (align) => {
    if (align === "right") return "text-right";
    if (align === "center") return "text-center";
    return "text-left";
  };

  return (
    <div
      className={`overflow-hidden rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] ${wrapperClassName}`}
    >
      <div className={`overflow-x-auto ${scrollClassName}`}>
        <table
          className={`min-w-full divide-y divide-[color:var(--atlas-border)] ${hasColumnWidths ? "table-fixed" : ""} ${tableClassName}`}
        >
          {hasColumnWidths && (
            <colgroup>
              {columns.map((column) => (
                <col key={`col-${column.key}`} style={column.width ? { width: column.width } : undefined} />
              ))}
            </colgroup>
          )}
          <thead className={`${headClassName || "bg-[color:var(--atlas-surface-strong)]"}`}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--atlas-muted)] ${getAlignClass(
                    column.align
                  )} ${column.className || ""}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-[color:var(--atlas-border)] text-sm text-[var(--atlas-text)] ${bodyClassName}`}
          >
            {loading &&
              Array.from({ length: skeletonRows }).map((_, idx) => (
                <TableRowSkeleton key={`skeleton-${idx}`} columns={columns.length} />
              ))}

            {!loading && data.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className={`px-4 py-10 text-center ${emptyCellClassName}`}
                >
                  <div className="text-base font-semibold text-[var(--atlas-text-strong)]">{emptyTitle}</div>
                  <div className="mt-1 text-sm text-[var(--atlas-muted)]">{emptyMessage}</div>
                </td>
              </tr>
            )}

            {!loading &&
              data.map((item, idx) => (
                <tr
                  key={rowKey(item, idx)}
                  className={`transition ${
                    onRowClick ? "cursor-pointer hover:bg-[color:var(--atlas-surface-hover)]" : ""
                  } ${rowClassName}`}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {renderRow(item, idx)}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
