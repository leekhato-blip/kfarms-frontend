import { useEffect, useState } from "react";
import { X, RotateCcw, Trash2, AlertTriangle } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ItemDetailsModal from "./ItemDetailsModal";

export default function TrashModal({
  open,
  title = "Trash",
  fetchData,
  columns,
  onRestore,
  onPermanentDelete, // 🔴 backend tomorrow inshaAllah
  formatCell,
  onClose,
}) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({
    page: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [loading, setLoading] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  // confirm state
  const [confirm, setConfirm] = useState({
    open: false,
    action: null, // "restore" | "delete"
    item: null,
  });

  async function loadPage(page = 0) {
    if (page === undefined || page < 0) page = 0;
    setLoading(true);
    try {
      const res = await fetchData({ page, size: 10 });
      setItems(res?.items ?? []);
      setMeta({
        page: res.page ?? 0,
        totalPages: res.totalPages ?? 1,
        hasNext: res.hasNext ?? false,
        hasPrevious: res.hasPrevious ?? false,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    loadPage(0);
  }, [open, fetchData]);

  function askRestore(item) {
    setConfirm({ open: true, action: "restore", item });
  }

  function askPermanentDelete(item) {
    setConfirm({ open: true, action: "delete", item });
  }

  function openDetails(item) {
    setDetailItem(item);
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
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    }

    if (action === "delete") {
      await onPermanentDelete?.(item);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    }

    setConfirm({ open: false, action: null, item: null });
  }

  if (!open) return null;

  const label =
    confirm.item?.itemName ??
    confirm.item?.name ??
    confirm.item?.batchType ??
    confirm.item?.type ??
    "item";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-5xl rounded-2xl p-1 animate-fadeIn">
        <div className="absolute -inset-1 rounded-2xl blur-xl opacity-60" />

        <div className="relative rounded-2xl bg-darkCard/60 dark:shadow-dark shadow-neo p-px">
          <div className="rounded-2xl bg-lightCard/80 dark:bg-black/60 backdrop-blur-xl border border-white/20 p-6 space-y-5">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-status-danger" />
                <h2 className="text-lg font-semibold">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[750px]">
                <thead className="border-b border-white/10 text-slate-500">
                  <tr>
                    {columns.map((c) => (
                      <th
                        key={c.key}
                        className={`py-2 px-3 text-${c.align ?? "left"}`}
                      >
                        {c.label}
                      </th>
                    ))}
                    <th className="w-28 px-3 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => openDetails(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openDetails(item);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View details for ${item?.itemName ?? item?.name ?? "item"}`}
                      className="border-b border-white/10 hover:bg-white/5 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40"
                    >
                      {columns.map((c) => (
                        <td
                          key={c.key}
                          className={`py-2 px-3 text-${c.align ?? "left"}`}
                        >
                          {formatCell ? formatCell(item, c.key) : item[c.key]}
                        </td>
                      ))}

                      <td className="flex items-center justify-center gap-2 py-2 px-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            askRestore(item);
                          }}
                          title="Restore"
                          className="p-2 rounded-md text-green-500 hover:bg-green-500/10 transition"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>

                        {onPermanentDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              askPermanentDelete(item);
                            }}
                            title="Delete permanently"
                            className="p-2 rounded-md text-status-danger hover:bg-red-500/10 transition"
                          >
                            <AlertTriangle className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-end gap-4 items-center pt-3">
              <button
                disabled={!meta.hasPrevious}
                onClick={() => loadPage((meta.page ?? 0) - 1)}
                className="disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>

              <span>
                Page {meta.page + 1} / {meta.totalPages}
              </span>

              <button
                disabled={!meta.hasNext}
                onClick={() => loadPage(meta.page + 1)}
                className="disabled:opacity-40 flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {!loading && items.length === 0 && (
              <div className="py-10 text-center text-slate-500">
                <Trash2 className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">Trash is empty</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirm.open}
        title={
          confirm.action === "restore" ? "Restore Item" : "Permanent Delete"
        }
        message={
          confirm.action === "restore"
            ? `Restore "${label}" back to records?`
            : `This will permanently delete "${label}". This action cannot be undone.`
        }
        confirmText={
          confirm.action === "restore" ? "Restore" : "Delete forever"
        }
        onConfirm={handleConfirm}
        onCancel={() => setConfirm({ open: false, action: null, item: null })}
      />

      {detailItem && (
        <ItemDetailsModal
          open={Boolean(detailItem)}
          title={detailItem?.itemName || detailItem?.name || "Deleted Item"}
          subtitle={
            detailItem?.id ? `Deleted ID #${detailItem.id}` : "Deleted Item"
          }
          status={{ label: "Deleted", color: "#ef4444" }}
          fields={columns.map((c) => ({
            label: c.label,
            value: getCellValue(detailItem, c.key),
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
          deleteLabel="Delete"
        />
      )}
    </div>
  );
}
