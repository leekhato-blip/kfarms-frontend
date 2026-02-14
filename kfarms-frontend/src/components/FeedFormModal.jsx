import { useEffect, useState } from "react";
import { Wheat, Hash, Wallet, StickyNote, X, Save, CalendarDays } from "lucide-react";
import { createFeed, updateFeed } from "../services/feedService";

function defaultForm() {
  return {
    batchType: "LAYER",
    quantity: "",
    unitCost: "",
    date: "",
    note: "",
  };
}

const Required = () => <span className="text-red-500 ml-0.5">*</span>;

const FEED_TYPES = ["LAYER", "BROILER", "NOILER", "DUCK", "FISH", "OTHER"];

export default function FeedFormModal({ open, onClose, initialData = null, onSuccess }) {
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);

  const editing = Boolean(initialData?.id);

  useEffect(() => {
    if (initialData) {
      setForm({
        batchType: initialData.batchType ?? initialData.type ?? "LAYER",
        quantity: initialData.quantity ?? "",
        unitCost: initialData.unitCost ?? "",
        date: initialData.date
          ? String(initialData.date).slice(0, 10)
          : initialData.feedDate
            ? String(initialData.feedDate).slice(0, 10)
            : "",
        note: initialData.note ?? "",
      });
    } else {
      setForm(defaultForm());
    }
  }, [initialData, open]);

  if (!open) return null;

  const total = Number(form.quantity || 0) * Number(form.unitCost || 0);

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
      batchType: form.batchType,
      quantity: Number(form.quantity),
      unitCost: Number(form.unitCost),
      date: form.date ? form.date : null,
      note: form.note || null,
    };

    try {
      const saved = editing
        ? await updateFeed(initialData.id, payload)
        : await createFeed(payload);

      onSuccess?.(saved);
    } catch (err) {
      console.error("Feed submit failed");
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} />

      <form
        onSubmit={submit}
        className="relative w-full max-w-xl rounded-2xl p-1 animate-fadeIn"
        aria-modal="true"
        role="dialog"
      >
        <div className="rounded-2xl bg-darkCard/60 shadow-neo p-px">
          <div className="rounded-2xl bg-white/70 dark:bg-black/60 backdrop-blur-xl border border-white/20 p-6 space-y-5">
            <div className="flex justify-between items-center">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-accent-primary/10 p-2 flex items-center justify-center">
                  <Wheat className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    {editing ? "Edit Feed" : "New Feed"}
                    <span className="text-xs bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">
                      {editing ? "Editing" : "Create"}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Log feed usage, adjustments, or consumption
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

            <div>
              <label className="text-xs mb-1 flex items-center gap-2">
                <Wheat className="w-4 h-4 text-slate-500" />
                Batch Type <Required />
              </label>
              <select
                value={form.batchType}
                onChange={(e) => setForm({ ...form, batchType: e.target.value })}
                className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none"
                required
              >
                {FEED_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-slate-500" />
                  Quantity <Required />
                </label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="text-xs mb-1 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-slate-500" />
                  Unit Cost (₦) <Required />
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatCurrency(form.unitCost)}
                  onChange={(e) => {
                    const raw = parseCurrency(e.target.value);
                    if (!/^\d*$/.test(raw)) return;
                    setForm({ ...form, unitCost: raw });
                  }}
                  onBlur={() => {
                    if (form.unitCost === "") return;
                    setForm({ ...form, unitCost: String(Number(form.unitCost)) });
                  }}
                  className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60"
                  required
                />
              </div>
            </div>

            <div className="flex justify-between items-center bg-white/40 dark:bg-black/40 rounded-lg p-3 text-sm">
              <span className="text-slate-500 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-400" />
                Total Cost
              </span>
              <span className="font-semibold">₦{total.toLocaleString()}</span>
            </div>

            <div>
              <label className="text-xs mb-1 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-slate-500" />
                Date <Required />
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60"
                required
              />
            </div>

            <div>
              <label className="text-xs mb-1 flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-slate-500" />
                Note
              </label>
              <textarea
                placeholder="Optional notes about this feed entry..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 h-20 resize-none"
              />
            </div>

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
                {saving ? "Saving..." : "Save Feed"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
