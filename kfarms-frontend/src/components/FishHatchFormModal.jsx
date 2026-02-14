import { useEffect, useState } from "react";
import { Egg, Hash, Calendar, StickyNote, X, Save, Fish } from "lucide-react";
import { createFishHatch, updateFishHatch } from "../services/fishHatchService";

function defaultForm() {
  return {
    pondId: "",
    hatchDate: "",
    maleCount: "",
    femaleCount: "",
    quantityHatched: "",
    note: "",
  };
}

const Required = () => <span className="text-red-500 ml-0.5">*</span>;

function toInputDate(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

export default function FishHatchFormModal({
  open,
  onClose,
  initialData = null,
  pondOptions = [],
  onSuccess,
}) {
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);
  const editing = Boolean(initialData?.id);
  const maleCount = Number(form.maleCount || 0);
  const femaleCount = Number(form.femaleCount || 0);
  const quantityHatched = Number(form.quantityHatched || 0);
  const totalParents = maleCount + femaleCount;
  const hatchRate = totalParents > 0 ? (quantityHatched / totalParents) * 100 : 0;

  useEffect(() => {
    if (initialData) {
      const fallbackPondId =
        initialData.pondId ??
        pondOptions.find((p) => p.pondName === initialData.pondName)?.id ??
        "";
      setForm({
        pondId: fallbackPondId,
        hatchDate: toInputDate(initialData.hatchDate),
        maleCount: initialData.maleCount ?? "",
        femaleCount: initialData.femaleCount ?? "",
        quantityHatched: initialData.quantityHatched ?? "",
        note: initialData.note ?? "",
      });
    } else {
      setForm(defaultForm());
    }
  }, [initialData, open, pondOptions]);

  if (!open) return null;

  const pondsEmpty = pondOptions.length === 0;

  async function submit(e) {
    e.preventDefault();
    if (!form.pondId) return;

    setSaving(true);
    const payload = {
      pondId: Number(form.pondId),
      hatchDate: form.hatchDate ? `${form.hatchDate}T00:00:00` : null,
      maleCount: Number(form.maleCount),
      femaleCount: Number(form.femaleCount),
      quantityHatched: Number(form.quantityHatched),
      hatchRate,
      note: form.note?.trim() || null,
    };

    try {
      const saved = editing
        ? await updateFishHatch(initialData.id, payload)
        : await createFishHatch(payload);
      onSuccess?.(saved);
    } catch (err) {
      console.error("Fish hatch submit failed");
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
                  <Egg className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    {editing ? "Edit Hatch Record" : "New Hatch Record"}
                    <span className="text-xs bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">
                      {editing ? "Editing" : "Create"}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Track hatch quantities and rates
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

            {pondsEmpty && (
              <div className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                Add at least one pond before creating hatch records.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <Fish className="w-4 h-4 text-slate-500" />
                  </span>
                  Pond <Required />
                </label>
                <select
                  value={form.pondId}
                  onChange={(e) =>
                    setForm({ ...form, pondId: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none"
                  required
                  disabled={pondsEmpty}
                >
                  <option value="">Select pond</option>
                  {pondOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.pondName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <Calendar className="w-4 h-4 text-slate-500" />
                  </span>
                  Hatch Date <Required />
                </label>
                <input
                  type="date"
                  value={form.hatchDate}
                  onChange={(e) =>
                    setForm({ ...form, hatchDate: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <label className="text-xs mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <Hash className="w-4 h-4 text-slate-500" />
                  </span>
                  Male Count <Required />
                </label>
                <input
                  type="number"
                  value={form.maleCount}
                  onChange={(e) =>
                    setForm({ ...form, maleCount: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none"
                  required
                />
              </div>
              <div className="min-w-0">
                <label className="text-xs mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <Hash className="w-4 h-4 text-slate-500" />
                  </span>
                  Female Count <Required />
                </label>
                <input
                  type="number"
                  value={form.femaleCount}
                  onChange={(e) =>
                    setForm({ ...form, femaleCount: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none"
                  required
                />
              </div>
              <div className="min-w-0">
                <label className="text-xs mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <Hash className="w-4 h-4 text-slate-500" />
                  </span>
                  Hatched <Required />
                </label>
                <input
                  type="number"
                  value={form.quantityHatched}
                  onChange={(e) =>
                    setForm({ ...form, quantityHatched: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none"
                  required
                />
              </div>
              <div className="min-w-0">
                <label className="text-xs mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <Hash className="w-4 h-4 text-slate-500" />
                  </span>
                  Hatch Rate
                </label>
                <input
                  type="text"
                  value={`${hatchRate.toFixed(1)}%`}
                  className="w-full p-3 rounded-lg bg-white/70 dark:bg-black/50 outline-none"
                  readOnly
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
                value={form.note}
                onChange={(e) =>
                  setForm({ ...form, note: e.target.value })
                }
                className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none min-h-[90px]"
                placeholder="Optional notes about this hatch"
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
                disabled={saving || pondsEmpty}
                className="px-4 py-2 rounded-md bg-accent-primary text-white hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Hatch"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
