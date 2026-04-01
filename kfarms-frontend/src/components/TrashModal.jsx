import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, RotateCcw, Trash2, X } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import ItemDetailsModal from "./ItemDetailsModal";
import PlanUpgradePrompt from "./PlanUpgradePrompt";
import { useTenant } from "../tenant/TenantContext";
import { isPlanAtLeast, normalizePlanId } from "../constants/plans";

function getAlignClass(align) {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

export default function TrashModal({
  open,
  title = "Trash",
  fetchData,
  columns,
  onRestore,
  onPermanentDelete,
  formatCell,
  onClose,
}) {
  const { activeTenant } = useTenant();
  const currentPlan = normalizePlanId(activeTenant?.plan, "FREE");
  const canUseTrashRestore = isPlanAtLeast(currentPlan, "PRO");

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({
    page: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [loading, setLoading] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [confirm, setConfirm] = useState({
    open: false,
    action: null,
    item: null,
  });

  const loadPage = useCallback(
    async (page = 0) => {
      if (page === undefined || page < 0) page = 0;
      setLoading(true);
      try {
        const res = await fetchData({ page, size: 10 });
        setItems(res?.items ?? []);
        setMeta({
          page: res?.page ?? 0,
          totalPages: Math.max(res?.totalPages ?? 1, 1),
          hasNext: Boolean(res?.hasNext),
          hasPrevious: Boolean(res?.hasPrevious),
        });
      } finally {
        setLoading(false);
      }
    },
    [fetchData],
  );

  useEffect(() => {
    if (!open || !canUseTrashRestore) return;
    loadPage(0);
  }, [canUseTrashRestore, loadPage, open]);

  const label = useMemo(
    () =>
      confirm.item?.itemName ??
      confirm.item?.name ??
      confirm.item?.batchName ??
      confirm.item?.pondName ??
      confirm.item?.batchType ??
      confirm.item?.type ??
      "item",
    [confirm.item],
  );

  function askRestore(item) {
    setConfirm({ open: true, action: "restore", item });
  }

  function askPermanentDelete(item) {
    setConfirm({ open: true, action: "delete", item });
  }

  function closeDetails() {
    setDetailItem(null);
  }

  function getCellValue(item, key) {
    if (!item) return "—";
    if (formatCell) return formatCell(item, key);
    return item?.[key];
  }

  async function handleConfirm() {
    const { action, item } = confirm;
    if (!item) return;

    if (action === "restore") {
      await onRestore(item);
      setItems((prev) => prev.filter((entry) => entry.id !== item.id));
    }

    if (action === "delete") {
      await onPermanentDelete?.(item);
      setItems((prev) => prev.filter((entry) => entry.id !== item.id));
    }

    setConfirm({ open: false, action: null, item: null });
  }

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-5xl rounded-2xl p-1 animate-fadeIn">
        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-lightCard/90 p-6 shadow-neo backdrop-blur-xl dark:bg-[#020817]/92 dark:shadow-dark">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(108deg,rgba(37,99,235,0.12)_0%,rgba(14,116,144,0.08)_48%,rgba(16,185,129,0.06)_100%)] dark:bg-[linear-gradient(108deg,rgba(6,19,43,0.88)_0%,rgba(7,32,63,0.84)_48%,rgba(6,58,55,0.7)_100%)]" />

          <div className="relative z-10 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500 dark:bg-red-500/15 dark:text-red-300">
                  <Trash2 className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Review deleted records and restore them when needed.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex aspect-square h-10 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:shadow-none dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!canUseTrashRestore ? (
              <PlanUpgradePrompt
                title="Trash restore requires Pro"
                description={`Your ${currentPlan.toLowerCase()} workspace can delete records, but reviewing deleted items and restoring them is available on the Pro plan.`}
                feature="Trash restore workflow"
                requiredPlan="PRO"
              />
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/40 dark:bg-white/5">
                  <table className="w-full min-w-[750px] text-sm">
                    <thead className="border-b border-white/10 text-slate-500 dark:text-slate-400">
                      <tr>
                        {columns.map((column) => (
                          <th
                            key={column.key}
                            className={`px-3 py-2.5 ${getAlignClass(column.align)}`}
                          >
                            {column.label}
                          </th>
                        ))}
                        <th className="w-28 px-3 py-2.5 text-center">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => setDetailItem(item)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setDetailItem(item);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`View details for ${item?.itemName ?? item?.name ?? "item"}`}
                          className="border-b border-white/10 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40"
                        >
                          {columns.map((column) => (
                            <td
                              key={column.key}
                              className={`px-3 py-2.5 ${getAlignClass(column.align)}`}
                            >
                              {formatCell ? formatCell(item, column.key) : item[column.key]}
                            </td>
                          ))}

                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  askRestore(item);
                                }}
                                title="Restore"
                                className="rounded-md p-2 text-emerald-600 transition hover:bg-emerald-500/10 dark:text-emerald-300"
                              >
                                <RotateCcw className="h-5 w-5" />
                              </button>

                              {onPermanentDelete ? (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    askPermanentDelete(item);
                                  }}
                                  title="Delete permanently"
                                  className="rounded-md p-2 text-red-500 transition hover:bg-red-500/10 dark:text-red-300"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end gap-4 pt-1 text-sm text-slate-600 dark:text-slate-300">
                  <button
                    type="button"
                    disabled={!meta.hasPrevious || loading}
                    onClick={() => loadPage((meta.page ?? 0) - 1)}
                    className="inline-flex items-center gap-1 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </button>

                  <span>
                    Page {meta.page + 1} / {meta.totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={!meta.hasNext || loading}
                    onClick={() => loadPage((meta.page ?? 0) + 1)}
                    className="inline-flex items-center gap-1 disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {!loading && items.length === 0 ? (
                  <div className="py-10 text-center text-slate-500 dark:text-slate-400">
                    <Trash2 className="mx-auto mb-3 h-8 w-8 opacity-40" />
                    <p className="text-sm">Trash is empty</p>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      {canUseTrashRestore ? (
        <>
          <ConfirmModal
            open={confirm.open}
            title={confirm.action === "restore" ? "Restore Item" : "Permanent Delete"}
            message={
              confirm.action === "restore"
                ? `Restore "${label}" back to records?`
                : `This will permanently delete "${label}". This action cannot be undone.`
            }
            confirmText={confirm.action === "restore" ? "Restore" : "Delete forever"}
            onConfirm={handleConfirm}
            onCancel={() => setConfirm({ open: false, action: null, item: null })}
          />

          {detailItem ? (
            <ItemDetailsModal
              open={Boolean(detailItem)}
              title={
                detailItem?.itemName ||
                detailItem?.name ||
                detailItem?.batchName ||
                detailItem?.pondName ||
                "Deleted Item"
              }
              subtitle={detailItem?.id ? `Deleted ID #${detailItem.id}` : "Deleted Item"}
              status={{ label: "Deleted", color: "#ef4444" }}
              fields={columns.map((column) => ({
                label: column.label,
                value: getCellValue(detailItem, column.key),
              }))}
              onClose={closeDetails}
              onEdit={
                onRestore
                  ? () => {
                      closeDetails();
                      askRestore(detailItem);
                    }
                  : undefined
              }
              onDelete={
                onPermanentDelete
                  ? () => {
                      closeDetails();
                      askPermanentDelete(detailItem);
                    }
                  : undefined
              }
              editLabel="Restore"
              deleteLabel="Delete forever"
            />
          ) : null}
        </>
      ) : null}
    </div>,
    document.body,
  );
}
