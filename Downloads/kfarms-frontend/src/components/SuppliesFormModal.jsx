import { useEffect, useState } from "react";
import { Package, Hash, Wallet, StickyNote, X, Save, User } from "lucide-react";
import { createSupply, updateSupply } from "../services/suppliesService";

/* -------------------- Helpers -------------------- */
function defaultForm() {
  return {
    itemName: "",
    category: "FEED",
    quantity: "",
    unitPrice: "",
    supplierName: "",
    note: "",
    supplyDate: "",
  };
}

const Required = () => <span className="text-red-500 ml-0.5">*</span>;

export default function SuppliesFormModal({
  open,
  onClose,
  initialData = null,
  onSuccess,
}) {
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);

  const editing = Boolean(initialData?.id);

  useEffect(() => {
    if (initialData) {
      setForm({
        itemName: initialData.itemName ?? "",
        category: initialData.category ?? "FEED",
        quantity: initialData.quantity ?? "",
        unitPrice: initialData.unitPrice ?? "",
        supplierName: initialData.supplierName ?? "",
        note: initialData.note ?? "",
        supplyDate: initialData.supplyDate
          ? String(initialData.supplyDate).slice(0, 10)
          : "",
      });
    } else {
      setForm(defaultForm());
    }
  }, [initialData, open]);

  if (!open) return null;

  const total = Number(form.quantity || 0) * Number(form.unitPrice || 0);

  function formatCurrency(value) {
    if (!value) return "";
    return new Intl.NumberFormat("en-NG").format(value);
  }

  function parseCurrency(value) {
    return value.replace(/,/g, "");
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      quantity: Number(form.quantity),
      unitPrice: Number(form.unitPrice),
      // Backend expects LocalDate -> send YYYY-MM-DD
      supplyDate: form.supplyDate ? form.supplyDate : null,
    };

    try {
      const saved = editing
        ? await updateSupply(initialData.id, payload)
        : await createSupply(payload);

      onSuccess?.(saved);
    } catch (err) {
      console.error("Supply submit failed");
      if (err?.response) {
        console.error(err.response.status);
        console.error(err.response.data);
      } else {
        console.error(err?.message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <form
        onSubmit={submit}
        className="relative w-full max-w-xl rounded-2xl p-1 animate-fadeIn"
        aria-modal="true"
        role="dialog"
      >
        <div className="rounded-2xl bg-darkCard/60 shadow-neo p-px">
          <div className="rounded-2xl bg-white/70 dark:bg-black/60 backdrop-blur-xl border border-white/20 p-6 space-y-5">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-accent-primary/10 p-2 flex items-center justify-center">
                  <Package className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    {editing ? "Edit Supply" : "New Supply"}
                    <span className="text-xs bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">
                      {editing ? "Editing" : "Create"}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Record purchases and farm inputs (money out)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="p-2 rounded-md hover:bg-white/10"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Item */}
            <div>
              <label className="text-xs mb-1 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5">
                  <Package className="w-4 h-4 text-slate-500" />
                </span>
                Item <Required />
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Package className="w-4 h-4" />
                </span>
                <input
                  value={form.itemName}
                  onChange={(e) =>
                    setForm({ ...form, itemName: e.target.value })
                  }
                  className="w-full pl-11 p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none"
                  placeholder="e.g. Layer Feed (Grower)"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs mb-1 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {[
                  "FEED",
                  "LIVESTOCK",
                  "FISH",
                  "MEDICINE",
                  "EQUIPMENT",
                  "OTHER",
                ].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, category: c })}
                    className={`px-3 py-1.5 rounded-full text-xs border transition
                        ${
                          form.category === c
                            ? "bg-accent-primary text-white border-accent-primary"
                            : "bg-white/40 dark:bg-black/40 border-white/20"
                        }`}
                    aria-pressed={form.category === c}
                    title={c}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity & Unit Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <Hash className="w-4 h-4 text-slate-500" />
                  </span>
                  Quantity <Required />
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Hash className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                    className="w-full pl-11 p-3 rounded-lg bg-white/80 dark:bg-black/60"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <Wallet className="w-4 h-4 text-slate-500" />
                  </span>
                  Unit Price (₦) <Required />
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Wallet className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={formatCurrency(form.unitPrice)}
                    onChange={(e) => {
                      const raw = parseCurrency(e.target.value);
                      if (!/^\d*$/.test(raw)) return;
                      setForm({ ...form, unitPrice: raw });
                    }}
                    onBlur={() => {
                      if (form.unitPrice === "") return;
                      setForm({
                        ...form,
                        unitPrice: String(Number(form.unitPrice)),
                      });
                    }}
                    className="w-full pl-11 p-3 rounded-lg bg-white/80 dark:bg-black/60"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center bg-white/40 dark:bg-black/40 rounded-lg p-3 text-sm">
              <span className="text-slate-500 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-400" />
                Total Spent
              </span>
              <span className="font-semibold">₦{total.toLocaleString()}</span>
            </div>

            {/* Supplier & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  Supplier (optional)
                </label>
                <input
                  placeholder="e.g. Olam Feeds Depot"
                  value={form.supplierName}
                  onChange={(e) =>
                    setForm({ ...form, supplierName: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60"
                />
              </div>
              <div>
                <label className="text-xs mb-1 block">
                  Supply Date <Required />
                </label>
                <input
                  type="date"
                  value={form.supplyDate}
                  onChange={(e) =>
                    setForm({ ...form, supplyDate: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60"
                  required
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-xs mb-1 flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-slate-500" />
                Note
              </label>
              <textarea
                placeholder="Additional details about this supply..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 h-20 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md bg-white/30"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-md bg-accent-primary text-white disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Supply"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
