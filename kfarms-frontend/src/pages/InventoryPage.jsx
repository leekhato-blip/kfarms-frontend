import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import SummaryCard from "../components/SummaryCard";
import FarmerGuideCard from "../components/FarmerGuideCard";
import FilteredResultsHint from "../components/FilteredResultsHint";
import GlassToast from "../components/GlassToast";
import ItemDetailsModal from "../components/ItemDetailsModal";
import ConfirmModal from "../components/ConfirmModal";
import TrashModal from "../components/TrashModal";
import ExportModal from "../components/ExportModal";
import InventoryFormModal from "../components/InventoryFormModal";
import { useTenant } from "../tenant/TenantContext";
import { isOfflinePendingRecord } from "../offline/offlineResources";
import { useOfflineSyncRefresh } from "../offline/useOfflineSyncRefresh";
import { exportReport } from "../services/reportService";
import useQuickCreateModal from "../hooks/useQuickCreateModal";
import {
  adjustInventoryStock,
  deleteInventory,
  getAllInventory,
  getDeletedInventory,
  getInventorySummary,
  permanentDeleteInventory,
  restoreInventory,
} from "../services/inventoryService";
import {
  INVENTORY_CATEGORIES,
  formatInventoryCategoryLabel,
} from "../constants/inventory";
import {
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowUp,
  Ban,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Package2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  Truck,
} from "lucide-react";

const EDITOR_ROLES = new Set(["OWNER", "ADMIN", "MANAGER"]);
const ADMIN_ROLES = new Set(["OWNER", "ADMIN"]);
const PAGE_SIZE = 10;
const EXPORT_CATEGORIES = [{ label: "Inventory", value: "inventory" }];
const EXPORT_RANGE_START = "2000-01-01";
const EMPTY_SUMMARY = {
  totalInventoryItems: 0,
  totalQuantity: 0,
  inventoryValue: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
  healthyCount: 0,
  lowStockItems: [],
  quantityByCategory: {},
  lastUpdated: null,
};

function normalizeRole(value) {
  return String(value || "").trim().toUpperCase();
}

function formatCurrency(value, currency = "NGN") {
  const numeric = Number(value || 0);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: String(currency || "NGN").toUpperCase(),
    maximumFractionDigits: 0,
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

function formatCount(value) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : "0";
}

function formatDate(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function relativeDateLabel(value) {
  if (!value) return "Recently";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recently";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(parsed);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today - target) / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function currentYearStart() {
  return `${new Date().getFullYear()}-01-01`;
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function getItemName(item) {
  return item?.itemName ?? item?.name ?? "Inventory item";
}

function getItemCategory(item) {
  return item?.category || "OTHER";
}

function getItemQuantity(item) {
  return Number(item?.quantity ?? item?.onHand ?? 0) || 0;
}

function getItemThreshold(item) {
  return Number(item?.minThreshold ?? item?.threshold ?? item?.reorderLevel ?? 0) || 0;
}

function getItemUnit(item) {
  return item?.unit || "units";
}

function getItemUnitCost(item) {
  return Number(item?.unitCost ?? 0) || 0;
}

function getItemTotalValue(item) {
  const directValue = Number(item?.totalValue);
  if (Number.isFinite(directValue) && directValue > 0) {
    return directValue;
  }
  return getItemQuantity(item) * getItemUnitCost(item);
}

function getItemSupplier(item) {
  return item?.supplierName ?? item?.supplier ?? "—";
}

function getItemLocation(item) {
  return item?.storageLocation ?? item?.location ?? "—";
}

function resolveStockStatus(item) {
  const quantity = getItemQuantity(item);
  const threshold = getItemThreshold(item);

  if (quantity <= 0) {
    return {
      key: "out",
      label: "Out",
      color: "#ef4444",
      classes:
        "border-red-300/50 bg-red-500/10 text-status-danger dark:border-red-400/40 dark:bg-red-500/20 dark:text-red-100",
    };
  }

  if (quantity <= threshold) {
    return {
      key: "low",
      label: "Low",
      color: "#f59e0b",
      classes:
        "border-amber-300/50 bg-amber-500/10 text-amber-600 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-100",
    };
  }

  return {
    key: "healthy",
    label: "Healthy",
    color: "#22c55e",
    classes:
      "border-emerald-300/50 bg-emerald-500/10 text-emerald-600 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-100",
  };
}

function signalToneClasses(tone) {
  if (tone === "success") {
    return {
      icon: "text-emerald-400",
      dot: "bg-emerald-400",
    };
  }

  if (tone === "danger") {
    return {
      icon: "text-status-danger",
      dot: "bg-status-danger",
    };
  }

  return {
    icon: "text-amber-400",
    dot: "bg-amber-400",
  };
}

function InventoryEmptyState({
  title,
  message,
  actionLabel,
  onAction,
  compact = false,
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-dashed border-slate-200/70 bg-white/50 text-center shadow-soft dark:border-white/10 dark:bg-white/[0.04] ${
        compact ? "p-4" : "p-6"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_42%)] dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_42%)]" />

      <div className="relative flex h-full flex-col items-center justify-center gap-3">
        <span
          className={`inline-flex items-center justify-center rounded-2xl border border-white/60 bg-white/80 text-accent-primary shadow-soft dark:border-white/10 dark:bg-white/10 dark:text-emerald-200 ${
            compact ? "h-12 w-12" : "h-14 w-14"
          }`}
          aria-hidden="true"
        >
          <Archive className={compact ? "h-5 w-5" : "h-6 w-6"} />
        </span>

        <div className="space-y-1">
          <h4
            className={`font-header font-semibold text-slate-800 dark:text-slate-100 ${
              compact ? "text-sm" : "text-base"
            }`}
          >
            {title}
          </h4>
          <p
            className={`mx-auto max-w-md leading-relaxed text-slate-500 dark:text-slate-400 ${
              compact ? "text-xs" : "text-sm"
            }`}
          >
            {message}
          </p>
        </div>

        {actionLabel && typeof onAction === "function" ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center justify-center rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function buildSystemSignals(summary) {
  const signals = [];
  const lowStockItems = Array.isArray(summary?.lowStockItems)
    ? summary.lowStockItems
    : [];

  if (summary?.lastUpdated) {
    signals.push({
      id: `summary-${summary.lastUpdated}`,
      tone: "success",
      title: "Inventory Snapshot Updated",
      detail: `Latest inventory activity was recorded on ${formatDate(summary.lastUpdated)}.`,
      at: relativeDateLabel(summary.lastUpdated),
    });
  }

  lowStockItems.slice(0, 5).forEach((item) => {
    const quantity = getItemQuantity(item);
    const unit = getItemUnit(item);
    const isOut = quantity <= 0;

    signals.push({
      id: `inventory-alert-${item?.id ?? getItemName(item)}`,
      tone: isOut ? "danger" : "warning",
      title: isOut ? "Stockout Alert" : "Reorder Threshold",
      detail: isOut
        ? `${getItemName(item)} is out of stock and needs attention.`
        : `${getItemName(item)} is down to ${formatCount(quantity)} ${unit}.`,
      at: relativeDateLabel(item?.lastUpdated || summary?.lastUpdated),
    });
  });

  return signals;
}

export default function InventoryPage() {
  const { activeTenant, activeTenantId, tenantBootstrapDone } = useTenant();
  const workspaceCurrency = String(activeTenant?.currency || "NGN").trim().toUpperCase() || "NGN";
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({
    page: 0,
    totalPages: 0,
    totalItems: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [activitySignals, setActivitySignals] = useState([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query]);

  const tenantRole = normalizeRole(activeTenant?.myRole);
  const canCreateOrEdit = EDITOR_ROLES.has(tenantRole);
  const canDeleteOrRestore = ADMIN_ROLES.has(tenantRole);

  const firstInventoryCtaLabel = canCreateOrEdit ? "Add first stock item" : null;
  const firstInventoryMessage = canCreateOrEdit
    ? "Add your first inventory item to start tracking stock levels, reorder pressure, and total store value from one view."
    : "Inventory tips will appear here once a farm manager records the first stock item.";

  const loadSummary = React.useCallback(async ({ silent = false } = {}) => {
    if (!tenantBootstrapDone) return null;
    if (!activeTenantId) {
      setSummary(EMPTY_SUMMARY);
      setSummaryLoading(false);
      return EMPTY_SUMMARY;
    }

    setSummaryLoading(true);
    try {
      const payload = await getInventorySummary();
      const nextSummary = {
        ...EMPTY_SUMMARY,
        ...(payload || {}),
        lowStockItems: Array.isArray(payload?.lowStockItems)
          ? payload.lowStockItems
          : [],
      };
      setSummary(nextSummary);
      return nextSummary;
    } catch (error) {
      console.error("Failed to fetch inventory summary", error);
      if (!silent) {
        setToast({
          message: getErrorMessage(error, "Failed to load inventory summary"),
          type: "error",
        });
      }
      return null;
    } finally {
      setSummaryLoading(false);
    }
  }, [activeTenantId, tenantBootstrapDone]);

  const loadInventory = React.useCallback(async (page = 0, { silent = false } = {}) => {
    if (!tenantBootstrapDone) return null;
    if (!activeTenantId) {
      setItems([]);
      setMeta({
        page: 0,
        totalPages: 0,
        totalItems: 0,
        hasNext: false,
        hasPrevious: false,
      });
      setListLoading(false);
      return {
        items: [],
        page: 0,
        totalPages: 0,
        totalItems: 0,
        hasNext: false,
        hasPrevious: false,
      };
    }

    setListLoading(true);
    try {
      const payload = await getAllInventory({
        page,
        size: PAGE_SIZE,
        itemName: debouncedQuery || undefined,
        category: category !== "all" ? category : undefined,
        status: status !== "all" ? status.toUpperCase() : undefined,
      });

      const nextItems = Array.isArray(payload?.items) ? payload.items : [];
      setItems(nextItems);
      setMeta({
        page: payload?.page ?? 0,
        totalPages: payload?.totalPages ?? 0,
        totalItems: payload?.totalItems ?? 0,
        hasNext: payload?.hasNext ?? false,
        hasPrevious: payload?.hasPrevious ?? false,
      });
      return payload;
    } catch (error) {
      console.error("Failed to fetch inventory items", error);
      if (!silent) {
        setToast({
          message: getErrorMessage(error, "Failed to load inventory items"),
          type: "error",
        });
      }
      return null;
    } finally {
      setListLoading(false);
    }
  }, [activeTenantId, category, debouncedQuery, status, tenantBootstrapDone]);

  useEffect(() => {
    if (!tenantBootstrapDone) return;
    void loadSummary({ silent: true });
  }, [loadSummary, tenantBootstrapDone]);

  useEffect(() => {
    if (!tenantBootstrapDone) return;
    void loadInventory(0, { silent: true });
  }, [loadInventory, tenantBootstrapDone]);

  useEffect(() => {
    if (!detailItem?.id) return;
    const nextItem = items.find((item) => item.id === detailItem.id);
    if (nextItem && nextItem !== detailItem) {
      setDetailItem(nextItem);
    }
  }, [detailItem, items]);

  const hasActiveFilters = Boolean(
    debouncedQuery || category !== "all" || status !== "all",
  );

  const hasInventoryOverview =
    Number(summary.totalInventoryItems) > 0 ||
    Number(summary.totalQuantity) > 0 ||
    Number(summary.inventoryValue) > 0 ||
    Number(summary.lowStockCount) > 0 ||
    Number(summary.outOfStockCount) > 0;

  const reorderQueue = useMemo(() => {
    return Array.isArray(summary.lowStockItems) ? summary.lowStockItems : [];
  }, [summary.lowStockItems]);

  const recentSignals = useMemo(() => {
    const merged = [...activitySignals, ...buildSystemSignals(summary)];
    const seen = new Set();
    return merged
      .filter((signal) => {
        const key = `${signal.title}|${signal.detail}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);
  }, [activitySignals, summary]);

  const detailFields = detailItem
    ? [
        { label: "Item", value: getItemName(detailItem) },
        { label: "SKU", value: detailItem?.sku || "—" },
        {
          label: "Category",
          value: formatInventoryCategoryLabel(getItemCategory(detailItem)),
        },
        { label: "Supplier", value: getItemSupplier(detailItem) },
        { label: "Location", value: getItemLocation(detailItem) },
        {
          label: "On Hand",
          value: `${formatCount(getItemQuantity(detailItem))} ${getItemUnit(detailItem)}`,
        },
        {
          label: "Reorder Level",
          value: `${formatCount(getItemThreshold(detailItem))} ${getItemUnit(detailItem)}`,
        },
        {
          label: "Unit Cost",
          value: getItemUnitCost(detailItem)
            ? formatCurrency(getItemUnitCost(detailItem), workspaceCurrency)
            : "—",
        },
        {
          label: "Stock Value",
          value: formatCurrency(getItemTotalValue(detailItem), workspaceCurrency),
        },
        { label: "Last Updated", value: formatDate(detailItem?.lastUpdated) },
        { label: "Note", value: detailItem?.note || "—", span: 2 },
      ]
    : [];

  function pushSignal(signal) {
    setActivitySignals((current) => [
      {
        id: `signal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: "Just now",
        ...signal,
      },
      ...current,
    ].slice(0, 6));
  }

  function openCreate() {
    if (!canCreateOrEdit) return;
    setEditing(null);
    setModalOpen(true);
  }

  useQuickCreateModal(() => {
    openCreate();
  });

  function openEdit(item) {
    if (!canCreateOrEdit) return;
    setEditing(item);
    setModalOpen(true);
  }

  function closeDetails() {
    setDetailItem(null);
  }

  function askDelete(item) {
    if (!canDeleteOrRestore) return;
    setDeleteTarget(item);
    setConfirmOpen(true);
  }

  async function refreshCurrentPage() {
    const payload = await loadInventory(meta.page ?? 0, { silent: true });
    if (
      payload &&
      Array.isArray(payload.items) &&
      payload.items.length === 0 &&
      (meta.page ?? 0) > 0
    ) {
      await loadInventory((meta.page ?? 0) - 1, { silent: true });
    }
  }

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([
        loadSummary({ silent: true }),
        loadInventory(meta.page ?? 0, { silent: true }),
      ]);
      pushSignal({
        tone: "success",
        title: "Inventory Synced",
        detail: "Inventory data refreshed from the backend.",
      });
      setToast({ message: "Inventory refreshed", type: "success" });
    } catch {
      setToast({ message: "Failed to refresh inventory", type: "error" });
    } finally {
      setRefreshing(false);
    }
  }

  const refreshPageData = React.useCallback(async () => {
    await Promise.all([
      loadSummary({ silent: true }),
      loadInventory(meta.page ?? 0, { silent: true }),
    ]);
  }, [loadInventory, loadSummary, meta.page]);

  useOfflineSyncRefresh(refreshPageData);

  function clearInventoryFilters() {
    setQuery("");
    setCategory("all");
    setStatus("all");
  }

  async function handleFormSuccess(saved) {
    const actionLabel = editing ? "updated" : "created";
    const pendingOffline = isOfflinePendingRecord(saved);
    setModalOpen(false);
    setEditing(null);
    setDetailItem(saved);

    setItems((current) => {
      if (editing) {
        return current.map((item) => (item.id === saved.id ? saved : item));
      }
      return [saved, ...current];
    });

    if (!editing) {
      setMeta((current) => ({
        ...current,
        page: 0,
        totalItems: Number(current.totalItems || 0) + 1,
      }));
    }

    if (!pendingOffline) {
      await Promise.all([
        loadSummary({ silent: true }),
        loadInventory(0, { silent: true }),
      ]);
    }

    pushSignal({
      tone: pendingOffline ? "warning" : "success",
      title: pendingOffline ? "Saved Offline" : editing ? "Item Updated" : "Item Added",
      detail: pendingOffline
        ? `${getItemName(saved)} was saved locally and will sync automatically.`
        : `${getItemName(saved)} ${actionLabel} successfully.`,
    });
    setToast({
      message: pendingOffline
        ? `${getItemName(saved)} saved offline`
        : `${getItemName(saved)} ${actionLabel} successfully`,
      type: pendingOffline ? "info" : "success",
    });
  }

  async function handleAdjust(item, delta) {
    if (!canCreateOrEdit) return;

    const itemName = getItemName(item);
    const magnitude = Math.abs(delta);

    try {
      const saved = await adjustInventoryStock(item.id, {
        quantityChange: delta,
        note:
          delta > 0
            ? `Manual stock increase (+${magnitude}) from inventory page`
            : `Manual stock reduction (-${magnitude}) from inventory page`,
      }, {
        baseRecord: item,
      });

      setDetailItem((current) => (current?.id === saved.id ? saved : current));
      const pendingOffline = isOfflinePendingRecord(saved);
      setItems((current) => current.map((entry) => (entry.id === saved.id ? saved : entry)));
      if (!pendingOffline) {
        await Promise.all([
          loadSummary({ silent: true }),
          refreshCurrentPage(),
        ]);
      }

      const nextQuantity = Number(saved?.quantity ?? 0);
      pushSignal({
        tone: pendingOffline ? "warning" : delta > 0 ? "success" : nextQuantity === 0 ? "danger" : "warning",
        title: pendingOffline ? "Adjustment Queued" : delta > 0 ? "Stock Intake Logged" : "Stock Usage Logged",
        detail: pendingOffline
          ? `${itemName} adjustment was saved locally and will sync automatically.`
          : `${itemName} ${delta > 0 ? `+${magnitude}` : `-${magnitude}`} ${saved?.unit || getItemUnit(item)}, now ${formatCount(nextQuantity)} on hand.`,
      });
      setToast({
        message: pendingOffline
          ? `${itemName} adjustment saved offline`
          : `${itemName} ${delta > 0 ? "increased" : "decreased"} by ${magnitude}`,
        type: pendingOffline ? "info" : "success",
      });
    } catch (error) {
      setToast({
        message: getErrorMessage(error, `Failed to adjust ${itemName}`),
        type: "error",
      });
    }
  }

  async function confirmDelete(item) {
    if (!item?.id) return;
    setDeleting(true);

    try {
      await deleteInventory(item.id);
      setConfirmOpen(false);
      setDeleteTarget(null);
      if (detailItem?.id === item.id) {
        closeDetails();
      }
      await Promise.all([
        loadSummary({ silent: true }),
        refreshCurrentPage(),
      ]);
      pushSignal({
        tone: "danger",
        title: "Item Deleted",
        detail: `${getItemName(item)} moved to trash.`,
      });
      setToast({
        message: `${getItemName(item)} deleted successfully`,
        type: "success",
      });
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Failed to delete inventory item"),
        type: "error",
      });
    } finally {
      setDeleting(false);
    }
  }

  async function handleExport({ type, category: exportCategory, start, end }) {
    if (exporting) return;
    setExporting(true);

    try {
      const { blob, filename } = await exportReport({
        type,
        category: exportCategory || "inventory",
        start: start || EXPORT_RANGE_START,
        end: end || todayValue(),
      });

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `inventory.${type || "csv"}`;
      link.click();
      window.URL.revokeObjectURL(url);

      setToast({ message: "Inventory export ready", type: "success" });
    } catch (error) {
      console.error("Inventory export failed", error);
      setToast({
        message: getErrorMessage(error, "Failed to export inventory"),
        type: "error",
      });
    } finally {
      setExporting(false);
      setExportOpen(false);
    }
  }

  const listEmptyTitle = hasActiveFilters
    ? "No stock items match what you selected"
    : "No stock items yet";
  const listEmptyMessage = hasActiveFilters
    ? "The top boxes above still show all active stock. Show everything to see the full list again."
    : canCreateOrEdit
      ? "Add your first stock item so you can track quantity, value, and low-stock warnings here."
      : "Stock items will appear here after the first item is recorded.";

  return (
    <DashboardLayout>
      <InventoryFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        initialData={editing}
        onSuccess={handleFormSuccess}
      />

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onSubmit={handleExport}
        exporting={exporting}
        categories={EXPORT_CATEGORIES}
        defaultCategory="inventory"
        defaultType="csv"
        defaultStart={currentYearStart()}
        defaultEnd={todayValue()}
      />

      <ItemDetailsModal
        open={Boolean(detailItem)}
        title={getItemName(detailItem)}
        subtitle={
          detailItem
            ? `${formatInventoryCategoryLabel(getItemCategory(detailItem))}${detailItem?.sku ? ` • ${detailItem.sku}` : ""}`
            : ""
        }
        status={detailItem ? resolveStockStatus(detailItem) : undefined}
        fields={detailFields}
        onClose={closeDetails}
        onEdit={
          detailItem && canCreateOrEdit
            ? () => {
                const target = detailItem;
                closeDetails();
                openEdit(target);
              }
            : undefined
        }
        onDelete={
          detailItem && canDeleteOrRestore
            ? () => {
                const target = detailItem;
                closeDetails();
                askDelete(target);
              }
            : undefined
        }
        editLabel="Edit Item"
        deleteLabel="Delete Item"
      />

      <ConfirmModal
        open={confirmOpen}
        title="Delete Inventory Item"
        message={`Are you sure you want to delete ${getItemName(deleteTarget)}?`}
        confirmText="Delete"
        loading={deleting}
        onCancel={() => {
          setConfirmOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={() => confirmDelete(deleteTarget)}
      />

      <TrashModal
        open={trashOpen}
        onClose={() => setTrashOpen(false)}
        title="Deleted Inventory"
        fetchData={({ page = 0, size = PAGE_SIZE }) =>
          getDeletedInventory({ page, size })
        }
        onRestore={async (item) => {
          await restoreInventory(item.id);
          await Promise.all([
            loadSummary({ silent: true }),
            refreshCurrentPage(),
          ]);
          pushSignal({
            tone: "success",
            title: "Item Restored",
            detail: `${getItemName(item)} restored from trash.`,
          });
          setToast({
            message: `${getItemName(item)} restored successfully`,
            type: "success",
          });
        }}
        onPermanentDelete={async (item) => {
          try {
            await permanentDeleteInventory(item.id);
            await Promise.all([
              loadSummary({ silent: true }),
              refreshCurrentPage(),
            ]);
            setToast({
              message: `${getItemName(item)} deleted permanently`,
              type: "success",
            });
          } catch (error) {
            setToast({
              message: getErrorMessage(error, "Failed to delete permanently"),
              type: "error",
            });
            throw error;
          }
        }}
        columns={[
          { key: "itemName", label: "Item" },
          { key: "category", label: "Category" },
          { key: "quantity", label: "Quantity", align: "right" },
          { key: "lastUpdated", label: "Updated" },
        ]}
        formatCell={(item, key) => {
          if (key === "itemName") return getItemName(item);
          if (key === "category") {
            return formatInventoryCategoryLabel(getItemCategory(item));
          }
          if (key === "quantity") {
            return `${formatCount(getItemQuantity(item))} ${getItemUnit(item)}`;
          }
          if (key === "lastUpdated") return formatDate(item?.lastUpdated);
          return item?.[key] ?? "—";
        }}
      />

      <GlassToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />

      <section className="space-y-5 font-body sm:space-y-6">
        <div className="relative isolate overflow-hidden rounded-2xl border border-sky-200/70 bg-slate-50/85 p-5 shadow-neo dark:border-sky-500/20 dark:bg-[#061024]/90 dark:shadow-[0_22px_40px_rgba(2,8,24,0.45)] md:p-6">
          <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(108deg,rgba(37,99,235,0.17)_0%,rgba(14,116,144,0.14)_48%,rgba(16,185,129,0.12)_100%),radial-gradient(circle_at_12%_22%,rgba(56,189,248,0.13),transparent_43%),radial-gradient(circle_at_90%_22%,rgba(16,185,129,0.14),transparent_38%)] dark:bg-[linear-gradient(108deg,rgba(6,19,43,0.96)_0%,rgba(7,32,63,0.9)_48%,rgba(6,58,55,0.84)_100%),radial-gradient(circle_at_12%_22%,rgba(56,189,248,0.16),transparent_43%),radial-gradient(circle_at_90%_22%,rgba(16,185,129,0.18),transparent_38%)]" />

          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-accent-primary/30 bg-accent-primary/10 px-3 py-1 text-xs font-semibold text-accent-primary dark:text-blue-200">
                <Archive className="h-3.5 w-3.5" />
                Store room
              </div>
              <h1 className="mt-3 text-2xl font-header font-semibold text-slate-900 dark:text-slate-100 md:text-[1.9rem]">
                Inventory
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-700/90 dark:text-slate-300/85">
                Keep a simple list of what you have on the farm, how much is left,
                and what needs to be restocked soon.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 auto-rows-fr items-center gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-start lg:justify-end">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className={`order-2 inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white/45 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 disabled:opacity-60 sm:order-none sm:h-auto sm:min-h-0 sm:w-auto sm:px-4 dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20 ${
                  refreshing ? "cursor-not-allowed opacity-70" : ""
                }`}
                title="Refresh inventory"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>

              {canCreateOrEdit && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="order-1 col-span-2 inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent-primary px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 sm:order-none sm:col-span-1 sm:h-auto sm:min-h-0 sm:w-auto sm:px-4"
                >
                  <Plus className="h-4 w-4" />
                  Add stock item
                </button>
              )}

              <button
                type="button"
                onClick={() => setExportOpen(true)}
                disabled={exporting}
                className="order-3 inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white/45 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 disabled:opacity-60 sm:order-none sm:h-auto sm:min-h-0 sm:w-auto sm:px-4 dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20"
                title="Download stock report"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Downloading..." : "Download"}
              </button>

            </div>
          </div>

          <div className="relative z-10 mt-3 text-left text-[11px] font-medium text-slate-600 dark:text-slate-200/80 sm:text-right">
            Updated {formatDate(summary.lastUpdated)}
          </div>
        </div>

        <FarmerGuideCard
          icon={Truck}
          title="How to use inventory"
          description="This page helps you know what is available on the farm and what needs to be bought again."
          storageKey="inventory-guide"
          steps={[
            "Use \"Add stock item\" when you buy or start tracking something.",
            "Use the find boxes only when you want to narrow the list.",
            "Check low-stock and out-of-stock cards before making purchases.",
          ]}
          tip="The top boxes count all active stock items. The table below may show fewer items when the find boxes are in use."
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {summaryLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`inventory-summary-skel-${index}`}
                className="min-h-[92px] rounded-2xl bg-white/10 p-5 shadow-neo dark:bg-darkCard/70 dark:shadow-dark"
                aria-hidden="true"
              >
                <div className="skeleton-glass h-14 w-14 rounded-xl" />
                <div className="mt-4 space-y-2">
                  <div className="skeleton-glass h-4 w-24 rounded" />
                  <div className="skeleton-glass h-3 w-16 rounded" />
                </div>
              </div>
            ))
          ) : hasInventoryOverview ? (
            <>
              <SummaryCard
                icon={<Package2 />}
                title="Items"
                value={formatCount(summary.totalInventoryItems)}
                subtitle="Active stock items"
              />
              <SummaryCard
                icon={<Boxes />}
                title="Stock On Hand"
                value={formatCount(summary.totalQuantity)}
                subtitle={`${formatCount(summary.healthyCount)} items in a safe range`}
              />
              <SummaryCard
                icon={<AlertTriangle />}
                title="Low Stock"
                value={formatCount(summary.lowStockCount)}
                subtitle="Needs restocking soon"
              />
              <SummaryCard
                icon={<Ban />}
                title="Out of stock"
                value={formatCount(summary.outOfStockCount)}
                subtitle={`Store value ${formatCurrency(summary.inventoryValue, workspaceCurrency)}`}
              />
            </>
          ) : (
            <div className="col-span-full">
              <InventoryEmptyState
                title="No inventory activity yet"
                message={firstInventoryMessage}
                actionLabel={firstInventoryCtaLabel}
                onAction={canCreateOrEdit ? openCreate : undefined}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-8">
            <div className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
              <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                Search only when you want to narrow the list. Leave filters clear to
                see everything in stock.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by item, SKU, or supplier"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
                  />
                </label>

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm outline-none"
                >
                  <option value="all">All Categories</option>
                  {INVENTORY_CATEGORIES.map((entry) => (
                    <option key={entry} value={entry}>
                      {formatInventoryCategoryLabel(entry)}
                    </option>
                  ))}
                </select>

                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="healthy">Healthy</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out Of Stock</option>
                </select>

                <button
                  type="button"
                  onClick={clearInventoryFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold transition hover:bg-white/20"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Show everything
                </button>
              </div>
            </div>

            {!listLoading && (hasActiveFilters || (hasInventoryOverview && items.length === 0)) && (
              <FilteredResultsHint
                summaryLabel="stock items"
                tableLabel="stock list"
                hasFilters={hasActiveFilters}
                onClear={clearInventoryFilters}
              />
            )}

            <div className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-neo dark:bg-darkCard/70 dark:shadow-dark sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-header font-semibold">Stock list</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {canDeleteOrRestore && (
                    <button
                      type="button"
                      onClick={() => setTrashOpen(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white/45 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20"
                      title="View deleted inventory"
                    >
                      <Trash2 className="h-4 w-4" />
                      Deleted items
                    </button>
                  )}
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Showing {items.length} of {formatCount(meta.totalItems)} matching item(s)
                  </div>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto hide-scrollbar">
                <table className="w-full min-w-[980px] border-separate border-spacing-y-2 text-sm [&_tbody_tr]:bg-white/5 [&_tbody_tr]:shadow-soft [&_tbody_tr]:transition [&_tbody_tr:hover]:shadow-neo dark:[&_tbody_tr]:bg-darkCard/60 [&_td:first-child]:rounded-l-xl [&_td:last-child]:rounded-r-xl [&_td]:px-3 [&_td]:py-2.5 [&_th]:px-3 [&_th]:pb-2">
                  <thead>
                    <tr className="font-header text-[11px] uppercase tracking-[0.16em] text-slate-700 dark:text-slate-200">
                      <th className="text-left">Item</th>
                      <th className="text-left">Category</th>
                      <th className="text-left">SKU</th>
                      <th className="text-right">On Hand</th>
                      <th className="text-right">Reorder</th>
                      <th className="text-right">Unit Cost</th>
                      <th className="text-right">Value</th>
                      <th className="text-center">Status</th>
                      <th className="text-left">Supplier</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listLoading ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="!rounded-xl !py-10 text-center text-slate-500 dark:text-slate-400"
                        >
                          Loading inventory items...
                        </td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="!rounded-xl !py-8">
                          <InventoryEmptyState
                            compact
                            title={listEmptyTitle}
                            message={listEmptyMessage}
                            actionLabel={firstInventoryCtaLabel}
                            onAction={canCreateOrEdit && !hasActiveFilters ? openCreate : undefined}
                          />
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => {
                        const state = resolveStockStatus(item);
                        return (
                          <tr key={item.id}>
                            <td className="font-semibold text-lightText dark:text-darkText">
                              <div className="flex flex-col">
                                <span>{getItemName(item)}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {getItemLocation(item)}
                                </span>
                              </div>
                            </td>
                            <td>{formatInventoryCategoryLabel(getItemCategory(item))}</td>
                            <td>{item?.sku || "—"}</td>
                            <td className="text-right font-semibold">
                              {formatCount(getItemQuantity(item))}
                            </td>
                            <td className="text-right">
                              {formatCount(getItemThreshold(item))}
                            </td>
                            <td className="text-right">
                              {getItemUnitCost(item)
                                ? formatCurrency(getItemUnitCost(item), workspaceCurrency)
                                : "—"}
                            </td>
                            <td className="text-right font-semibold">
                              {formatCurrency(getItemTotalValue(item), workspaceCurrency)}
                            </td>
                            <td className="text-center">
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${state.classes}`}
                              >
                                {state.label}
                              </span>
                            </td>
                            <td>{getItemSupplier(item)}</td>
                            <td>
                              <div className="flex items-center justify-center gap-1">
                                {canCreateOrEdit && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleAdjust(item, 5)}
                                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-emerald-400 hover:bg-emerald-500/10"
                                      title="Stock in (+5)"
                                    >
                                      <ArrowUp className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAdjust(item, -5)}
                                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-amber-400 hover:bg-amber-500/10"
                                      title="Stock out (-5)"
                                    >
                                      <ArrowDown className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setDetailItem(item)}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-accent-primary hover:bg-accent-primary/10"
                                  title="View item"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {canCreateOrEdit && (
                                  <button
                                    type="button"
                                    onClick={() => openEdit(item)}
                                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sky-400 hover:bg-sky-500/10"
                                    title="Edit item"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                )}
                                {canDeleteOrRestore && (
                                  <button
                                    type="button"
                                    onClick={() => askDelete(item)}
                                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-status-danger hover:bg-red-500/10"
                                    title="Delete item"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="text-slate-500 dark:text-slate-400">
                  Page {meta.page + 1} of {Math.max(meta.totalPages, 1)}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={!meta.hasPrevious || listLoading}
                    onClick={() => loadInventory((meta.page ?? 0) - 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={!meta.hasNext || listLoading}
                    onClick={() => loadInventory((meta.page ?? 0) + 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2 disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 xl:col-span-4">
            <div className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
              <div className="flex items-center justify-between">
                <h3 className="font-header font-semibold">Reorder Queue</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatCount(reorderQueue.length)} item(s)
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {summaryLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={`reorder-skel-${index}`}
                        className="skeleton-glass h-16 rounded-lg"
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                ) : reorderQueue.length === 0 ? (
                  <InventoryEmptyState
                    compact
                    title="No urgent reorder items"
                    message="Items nearing their threshold or out of stock will surface here automatically."
                  />
                ) : (
                  reorderQueue.map((item) => {
                    const state = resolveStockStatus(item);
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setDetailItem(item)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:bg-accent-primary/10"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold">
                            {getItemName(item)}
                          </span>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${state.classes}`}
                          >
                            {state.label}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {formatCount(getItemQuantity(item))} {getItemUnit(item)} on hand
                          {" • "}
                          reorder at {formatCount(getItemThreshold(item))}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
              <h3 className="font-header font-semibold">Recent Stock Signals</h3>
              <div className="mt-3 space-y-2">
                {recentSignals.length === 0 ? (
                  <InventoryEmptyState
                    compact
                    title="No stock signals yet"
                    message="Stock alerts, refresh snapshots, and manual adjustments will appear here."
                  />
                ) : (
                  recentSignals.map((signal) => {
                    const tone = signalToneClasses(signal.tone);
                    const Icon =
                      signal.tone === "success"
                        ? Truck
                        : signal.tone === "danger"
                          ? Ban
                          : AlertTriangle;

                    return (
                      <div
                        key={signal.id}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-2 text-sm font-semibold">
                            <Icon className={`h-4 w-4 ${tone.icon}`} />
                            {signal.title}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {signal.at}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {signal.detail}
                        </p>
                        <span
                          className={`mt-2 inline-block h-1.5 w-8 rounded-full ${tone.dot}`}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
