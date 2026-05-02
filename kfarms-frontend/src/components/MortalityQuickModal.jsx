import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Skull, X } from "lucide-react";

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

export default function MortalityQuickModal({
  open,
  title = "Record mortality",
  subtitle = "Log deaths quickly and keep stock in sync.",
  itemLabel = "Record",
  items = [],
  selectedId = "",
  submitting = false,
  submitLabel = "Save mortality",
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState({
    entityId: "",
    count: "",
    mortalityDate: todayDateOnly(),
    note: "",
  });
  const [error, setError] = useState("");

  const options = useMemo(
    () =>
      (Array.isArray(items) ? items : []).map((item) => ({
        id: String(item?.id ?? ""),
        label: item?.label || item?.name || item?.title || `#${item?.id ?? ""}`,
        meta: item?.meta || "",
      })),
    [items],
  );

  useEffect(() => {
    if (!open) return;
    setForm({
      entityId: selectedId ? String(selectedId) : String(options[0]?.id || ""),
      count: "",
      mortalityDate: todayDateOnly(),
      note: "",
    });
    setError("");
  }, [open, options, selectedId]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const selectedItem = options.find((item) => item.id === String(form.entityId));

  function handleChange(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const count = Number(form.count);
    if (!form.entityId) {
      setError(`Choose a ${itemLabel.toLowerCase()} first.`);
      return;
    }
    if (!Number.isFinite(count) || count <= 0) {
      setError("Enter a mortality count greater than 0.");
      return;
    }

    try {
      await onSubmit?.({
        entityId: form.entityId,
        count,
        mortalityDate: form.mortalityDate || todayDateOnly(),
        note: form.note.trim() || "",
      });
    } catch (submitError) {
      setError(submitError?.message || "Could not save mortality right now.");
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex min-h-full items-center justify-center px-4 py-6">
        <div className="relative w-full max-w-lg">
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.24)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07111f]/95 dark:shadow-[0_28px_80px_rgba(2,8,24,0.55)]">
            <div className="relative overflow-hidden border-b border-slate-200/80 px-5 py-5 dark:border-white/10">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.12),transparent_40%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.14),transparent_40%)]" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
                    <Skull className="h-3.5 w-3.5" />
                    Quick mortality
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-50">
                    {title}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {subtitle}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close mortality form"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  {itemLabel}
                </label>
                <select
                  value={form.entityId}
                  onChange={(event) => handleChange("entityId", event.target.value)}
                  className="w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-400/40 focus:ring-2 focus:ring-rose-400/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
                >
                  {!selectedItem ? <option value="">Choose {itemLabel.toLowerCase()}</option> : null}
                  {options.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {selectedItem?.meta ? (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{selectedItem.meta}</p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    placeholder="Enter number lost"
                    value={form.count}
                    onChange={(event) => handleChange("count", event.target.value)}
                    className="w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-400/40 focus:ring-2 focus:ring-rose-400/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.mortalityDate}
                    onChange={(event) => handleChange("mortalityDate", event.target.value)}
                    className="w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-400/40 focus:ring-2 focus:ring-rose-400/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Note
                </label>
                <textarea
                  rows={3}
                  placeholder="Cause, observation, or follow-up note"
                  value={form.note}
                  onChange={(event) => handleChange("note", event.target.value)}
                  className="w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-400/40 focus:ring-2 focus:ring-rose-400/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-700 dark:text-rose-200">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Saving..." : submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
