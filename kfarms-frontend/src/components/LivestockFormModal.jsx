import { useEffect, useState } from "react";
import {
  ClipboardList,
  Calendar,
  Hash,
  X,
  Users,
  Feather,
  StickyNote,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { createLivestock, updateLivestock } from "../services/livestockService";

const livestockTypes = [
  "LAYER",
  "DUCK",
  "FOWL",
  "TURKEY",
  "NOILER",
  "BROILER",
  "OTHER",
];

const sourceTypes = ["FARM_BIRTH", "SUPPLIER"];

function defaultForm() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    batchName: "",
    type: "LAYER",
    currentStock: "",
    arrivalDate: today,
    sourceType: "FARM_BIRTH",
    startingAgeInWeeks: "",
    mortality: "",
    note: "",
  };
}

const Required = () => <span className="text-red-500 ml-0.5">*</span>;

export default function LivestockFormModal({
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
        batchName: initialData.batchName ?? "",
        type: initialData.type ?? "LAYER",
        currentStock: initialData.currentStock ?? "",
        arrivalDate: initialData.arrivalDate
          ? String(initialData.arrivalDate).slice(0, 10)
          : "",
        sourceType: initialData.sourceType ?? "FARM_BIRTH",
        startingAgeInWeeks:
          initialData.startingAgeInWeeks ?? initialData.startingAge ?? "",
        mortality: "",
        note: initialData.note ?? "",
      });
    } else {
      setForm(defaultForm());
    }
  }, [initialData, open]);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      batchName: form.batchName.trim(),
      type: form.type || null,
      currentStock: form.currentStock === "" ? null : Number(form.currentStock),
      arrivalDate: form.arrivalDate || null,
      sourceType: form.sourceType || null,
      startingAgeInWeeks:
        form.startingAgeInWeeks === ""
          ? null
          : Number(form.startingAgeInWeeks),
      mortality: form.mortality === "" ? null : Number(form.mortality),
      note: form.note?.trim() || null,
    };

    try {
      const saved = editing
        ? await updateLivestock(initialData.id, payload)
        : await createLivestock(payload);
      onSuccess?.(saved);
    } catch (err) {
      console.error("Livestock submit failed", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />

      <form
        onSubmit={submit}
        className="relative w-full max-w-lg rounded-2xl p-1 animate-fadeIn"
        aria-modal="true"
        role="dialog"
      >
        <div className="rounded-2xl bg-darkCard/60 shadow-neo p-px">
          <div className="rounded-2xl bg-white/70 dark:bg-black/60 backdrop-blur-xl border border-white/20 p-6 space-y-5">
            <div className="flex justify-between items-center">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-accent-primary/10 p-2 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    {editing ? "Edit Livestock" : "New Livestock Batch"}
                    <span className="text-xs bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">
                      {editing ? "Editing" : "Create"}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Track batches, stock, and mortality.
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
                <span className="inline-flex items-center justify-center w-5 h-5">
                  <ClipboardList className="w-4 h-4 text-slate-500" />
                </span>
                Batch Name <Required />
              </label>
              <input
                value={form.batchName}
                onChange={(e) =>
                  setForm({ ...form, batchName: e.target.value })
                }
                className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none"
                placeholder="e.g. Layer Batch 3"
                autoFocus
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <Feather className="w-4 h-4 text-slate-500" />
                  </span>
                  Type <Required />
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none"
                  required
                >
                  {livestockTypes.map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <RotateCcw className="w-4 h-4 text-slate-500" />
                  </span>
                  Source <Required />
                </label>
                <select
                  value={form.sourceType}
                  onChange={(e) =>
                    setForm({ ...form, sourceType: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none"
                  required
                >
                  {sourceTypes.map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <Users className="w-4 h-4 text-slate-500" />
                  </span>
                  Current Stock
                </label>
                <input
                  type="number"
                  value={form.currentStock}
                  onChange={(e) =>
                    setForm({ ...form, currentStock: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none"
                  placeholder="e.g. 1200"
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <Calendar className="w-4 h-4 text-slate-500" />
                  </span>
                  Arrival Date
                </label>
                <input
                  type="date"
                  value={form.arrivalDate}
                  onChange={(e) =>
                    setForm({ ...form, arrivalDate: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <Hash className="w-4 h-4 text-slate-500" />
                  </span>
                  Starting Age (weeks)
                </label>
                <input
                  type="number"
                  value={form.startingAgeInWeeks}
                  onChange={(e) =>
                    setForm({ ...form, startingAgeInWeeks: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none"
                  placeholder="e.g. 10"
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <AlertTriangle className="w-4 h-4 text-slate-500" />
                  </span>
                  Mortality (add)
                </label>
                <input
                  type="number"
                  value={form.mortality}
                  onChange={(e) =>
                    setForm({ ...form, mortality: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none"
                  placeholder="e.g. 5"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="text-xs mb-1 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5">
                  <StickyNote className="w-4 h-4 text-slate-500" />
                </span>
                Note
              </label>
              <textarea
                rows={3}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none resize-none"
                placeholder="Optional notes about this batch"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white/10 text-slate-500 hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-accent-primary text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Batch"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
