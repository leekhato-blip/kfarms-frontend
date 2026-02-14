import { useEffect, useState } from "react";
import {
  Droplets,
  Hash,
  Calendar,
  StickyNote,
  X,
  Save,
  Activity,
  Fish,
} from "lucide-react";
import { createFishPond, updateFishPond } from "../services/fishPondService";

function defaultForm() {
  return {
    pondName: "",
    pondType: "HATCHING",
    status: "ACTIVE",
    capacity: "",
    currentStock: "",
    lastWaterChange: "",
    note: "",
  };
}

const Required = () => <span className="text-red-500 ml-0.5">*</span>;

export default function FishPondFormModal({
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
        pondName: initialData.pondName ?? "",
        pondType: initialData.pondType ?? "HATCHING",
        status: initialData.status ?? "ACTIVE",
        capacity: initialData.capacity ?? "",
        currentStock: initialData.currentStock ?? "",
        lastWaterChange: initialData.lastWaterChange
          ? String(initialData.lastWaterChange).slice(0, 10)
          : "",
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
      pondName: form.pondName.trim(),
      pondType: form.pondType || null,
      status: form.status || null,
      capacity: form.capacity === "" ? null : Number(form.capacity),
      currentStock: form.currentStock === "" ? null : Number(form.currentStock),
      lastWaterChange: form.lastWaterChange || null,
      note: form.note?.trim() || null,
    };

    try {
      const saved = editing
        ? await updateFishPond(initialData.id, payload)
        : await createFishPond(payload);
      onSuccess?.(saved);
    } catch (err) {
      console.error("Fish pond submit failed");
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
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />

      <form
        onSubmit={submit}
        className="relative w-full max-w-[96vw] sm:max-w-lg rounded-2xl p-1 animate-fadeIn"
        aria-modal="true"
        role="dialog"
      >
        <div className="rounded-2xl bg-darkCard/60 shadow-neo p-px">
          <div className="rounded-2xl bg-white/70 dark:bg-black/60 backdrop-blur-xl border border-white/20 p-4 sm:p-6 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-accent-primary/10 p-2 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    {editing ? "Edit Pond" : "New Pond"}
                    <span className="text-xs bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">
                      {editing ? "Editing" : "Create"}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Track pond capacity, stock, and status
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
                  <Droplets className="w-4 h-4 text-slate-500" />
                </span>
                Pond Name <Required />
              </label>
              <input
                value={form.pondName}
                onChange={(e) => setForm({ ...form, pondName: e.target.value })}
                className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none"
                placeholder="e.g. Grow Out Pond 1"
                autoFocus
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <Fish className="w-4 h-4 text-slate-500" />
                  </span>
                  Pond Type <Required />
                </label>
                <select
                  value={form.pondType}
                  onChange={(e) =>
                    setForm({ ...form, pondType: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none"
                  required
                >
                  <option value="HATCHING">Hatching</option>
                  <option value="GROW_OUT">Grow Out</option>
                  <option value="BROODSTOCK">Broodstock</option>
                  <option value="HOLDING">Holding</option>
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <Activity className="w-4 h-4 text-slate-500" />
                  </span>
                  Status <Required />
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none"
                  required
                >
                  <option value="ACTIVE">Active</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="EMPTY">Empty</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <Hash className="w-4 h-4 text-slate-500" />
                  </span>
                  Capacity <Required />
                </label>
                <input
                  type="number"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm({ ...form, capacity: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none"
                  placeholder="e.g. 2000"
                  required
                />
              </div>
              <div>
                <label className="text-xs mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <Hash className="w-4 h-4 text-slate-500" />
                  </span>
                  Current Stock <Required />
                </label>
                <input
                  type="number"
                  value={form.currentStock}
                  onChange={(e) =>
                    setForm({ ...form, currentStock: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none"
                  placeholder="e.g. 1500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs mb-1 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                </span>
                Last Water Change <Required />
              </label>
              <input
                type="date"
                value={form.lastWaterChange}
                onChange={(e) =>
                  setForm({ ...form, lastWaterChange: e.target.value })
                }
                className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs mb-1 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5">
                  <StickyNote className="w-4 h-4 text-slate-500" />
                </span>
                Note
              </label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none min-h-[90px]"
                placeholder="Optional notes about this pond"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md bg-transparent border border-white/10 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-md bg-accent-primary text-white hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Pond"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
