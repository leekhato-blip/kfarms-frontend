import { useEffect, useState } from "react";
import { Activity, Calendar, Droplets, Fish, Hash, Save, StickyNote } from "lucide-react";
<<<<<<< HEAD
import GuidedFormModal, {
  GUIDED_FORM_FIELD_CLASS,
  GUIDED_FORM_ICON_CLASS,
  GUIDED_FORM_LABEL_CLASS,
  GUIDED_FORM_PRIMARY_BUTTON_CLASS,
  GUIDED_FORM_PRIMARY_SUBMIT_BUTTON_CLASS,
  GUIDED_FORM_SECONDARY_BUTTON_CLASS,
  GuidedFormSection,
  handleGuidedFormAdvanceClick,
} from "./GuidedFormModal";
=======
import GuidedFormModal, { GuidedFormSection } from "./GuidedFormModal";
>>>>>>> 0babf4d (Update frontend application)
import { createFishPond, updateFishPond } from "../services/fishPondService";
import { todayDateInputValue } from "../utils/formInputs";

function defaultForm() {
  return {
    pondName: "",
    pondType: "HATCHING",
    status: "ACTIVE",
    capacity: "",
    currentStock: "",
    lastWaterChange: todayDateInputValue(),
    note: "",
  };
}

const Required = () => <span className="ml-0.5 text-red-500">*</span>;

const POND_STEPS = [
  {
    title: "What pond is this?",
    description: "Add the pond name, type, and current status.",
  },
  {
    title: "Stock and water details",
    description: "Add capacity, stock, and the last water change date.",
  },
];

export default function FishPondFormModal({
  open,
  onClose,
  initialData = null,
  onSuccess,
}) {
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);

  const editing = Boolean(initialData?.id);

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setForm({
        pondName: initialData.pondName ?? "",
        pondType: initialData.pondType ?? "HATCHING",
        status: initialData.status ?? "ACTIVE",
        capacity: initialData.capacity ?? "",
        currentStock: initialData.currentStock ?? "",
        lastWaterChange: initialData.lastWaterChange
          ? String(initialData.lastWaterChange).slice(0, 10)
          : todayDateInputValue(),
        note: initialData.note ?? "",
      });
    } else {
      setForm(defaultForm());
    }

    setStep(0);
  }, [initialData, open]);

  const stepOneComplete = Boolean(String(form.pondName || "").trim() && form.pondType && form.status);
  const stepTwoComplete = Boolean(
    Number(form.capacity) >= 0 && Number(form.currentStock) >= 0 && form.lastWaterChange,
  );

  async function submit(event) {
    event.preventDefault();
<<<<<<< HEAD
    if (step < POND_STEPS.length - 1) {
      if (!stepOneComplete) return;
      setStep((current) => Math.min(current + 1, POND_STEPS.length - 1));
      return;
    }
=======
>>>>>>> 0babf4d (Update frontend application)
    if (!stepOneComplete || !stepTwoComplete) return;

    setSaving(true);

    const payload = {
      pondName: form.pondName.trim(),
      pondType: form.pondType || null,
      status: form.status || null,
      capacity: form.capacity === "" ? null : Number(form.capacity),
      currentStock: form.currentStock === "" ? null : Number(form.currentStock),
      lastWaterChange: form.lastWaterChange || null,
      note: form.note.trim() || null,
    };

    try {
      const saved = editing
        ? await updateFishPond(initialData.id, payload, { baseRecord: initialData })
        : await createFishPond(payload);
      onSuccess?.(saved);
    } catch (error) {
      console.error("Fish pond submit failed", error);
    } finally {
      setSaving(false);
    }
  }

  const footer = (
    <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500 dark:text-slate-300">
        {step === 0 ? "Step 1 of 2: pond basics" : "Step 2 of 2: stock and water details"}
      </p>

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(current - 1, 0))}
<<<<<<< HEAD
            className={GUIDED_FORM_SECONDARY_BUTTON_CLASS}
=======
            className="rounded-lg border border-white/15 bg-white/40 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
>>>>>>> 0babf4d (Update frontend application)
          >
            Back
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
<<<<<<< HEAD
            className={GUIDED_FORM_SECONDARY_BUTTON_CLASS}
=======
            className="rounded-lg border border-white/15 bg-white/40 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
>>>>>>> 0babf4d (Update frontend application)
          >
            Cancel
          </button>
        )}

        {step < POND_STEPS.length - 1 ? (
          <button
            type="button"
            disabled={!stepOneComplete}
<<<<<<< HEAD
            onClick={(event) =>
              handleGuidedFormAdvanceClick(event, () => {
                setStep(1);
              })
            }
            className={GUIDED_FORM_PRIMARY_BUTTON_CLASS}
=======
            onClick={() => setStep(1)}
            className="rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
>>>>>>> 0babf4d (Update frontend application)
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={saving || !stepOneComplete || !stepTwoComplete}
<<<<<<< HEAD
            className={GUIDED_FORM_PRIMARY_SUBMIT_BUTTON_CLASS}
=======
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-primary px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
>>>>>>> 0babf4d (Update frontend application)
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : editing ? "Save changes" : "Save pond"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <GuidedFormModal
      open={open}
      onClose={onClose}
      onSubmit={submit}
      saving={saving}
      icon={Droplets}
      title={editing ? "Edit pond" : "Add pond"}
      description="Keep pond setup simple. Start with the pond identity, then add stock and water details."
      editing={editing}
      steps={POND_STEPS}
      currentStep={step}
      maxWidth="max-w-2xl"
      footer={footer}
    >
      {step === 0 ? (
        <GuidedFormSection
          title="Pond basics"
          description="Give the pond a clear name and choose its type and current status."
        >
          <div className="space-y-4">
            <div>
<<<<<<< HEAD
              <label className={GUIDED_FORM_LABEL_CLASS}>
                <Droplets className={GUIDED_FORM_ICON_CLASS} />
=======
              <label className="mb-1 flex items-center gap-2 text-xs">
                <Droplets className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
                Pond name <Required />
              </label>
              <input
                value={form.pondName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, pondName: event.target.value }))
                }
<<<<<<< HEAD
                className={GUIDED_FORM_FIELD_CLASS}
=======
                className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
                placeholder="e.g. Grow out pond 1"
                autoFocus
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
<<<<<<< HEAD
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <Fish className={GUIDED_FORM_ICON_CLASS} />
=======
                <label className="mb-1 flex items-center gap-2 text-xs">
                  <Fish className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
                  Pond type <Required />
                </label>
                <select
                  value={form.pondType}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, pondType: event.target.value }))
                  }
<<<<<<< HEAD
                  className={GUIDED_FORM_FIELD_CLASS}
=======
                  className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
                  required
                >
                  <option value="HATCHING">Hatching</option>
                  <option value="GROW_OUT">Grow out</option>
                  <option value="BROODSTOCK">Broodstock</option>
                  <option value="HOLDING">Holding</option>
                </select>
              </div>

              <div>
<<<<<<< HEAD
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <Activity className={GUIDED_FORM_ICON_CLASS} />
=======
                <label className="mb-1 flex items-center gap-2 text-xs">
                  <Activity className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
                  Status <Required />
                </label>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value }))
                  }
<<<<<<< HEAD
                  className={GUIDED_FORM_FIELD_CLASS}
=======
                  className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
                  required
                >
                  <option value="ACTIVE">Active</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="EMPTY">Empty</option>
                </select>
              </div>
            </div>
          </div>
        </GuidedFormSection>
      ) : (
        <>
          <GuidedFormSection
            title="Stock and water details"
            description="Add the capacity, current fish stock, and the last water change."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
<<<<<<< HEAD
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <Hash className={GUIDED_FORM_ICON_CLASS} />
=======
                <label className="mb-1 flex items-center gap-2 text-xs">
                  <Hash className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
                  Capacity <Required />
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.capacity}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, capacity: event.target.value }))
                  }
<<<<<<< HEAD
                  className={GUIDED_FORM_FIELD_CLASS}
=======
                  className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
                  placeholder="e.g. 2000"
                  required
                />
              </div>

              <div>
<<<<<<< HEAD
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <Hash className={GUIDED_FORM_ICON_CLASS} />
=======
                <label className="mb-1 flex items-center gap-2 text-xs">
                  <Hash className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
                  Current stock <Required />
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.currentStock}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, currentStock: event.target.value }))
                  }
<<<<<<< HEAD
                  className={GUIDED_FORM_FIELD_CLASS}
=======
                  className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
                  placeholder="e.g. 1500"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
<<<<<<< HEAD
              <label className={GUIDED_FORM_LABEL_CLASS}>
                <Calendar className={GUIDED_FORM_ICON_CLASS} />
=======
              <label className="mb-1 flex items-center gap-2 text-xs">
                <Calendar className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
                Last water change <Required />
              </label>
              <input
                type="date"
                value={form.lastWaterChange}
                onChange={(event) =>
                  setForm((current) => ({ ...current, lastWaterChange: event.target.value }))
                }
<<<<<<< HEAD
                className={GUIDED_FORM_FIELD_CLASS}
=======
                className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
                required
              />
            </div>
          </GuidedFormSection>

          <GuidedFormSection
            title="Optional note"
            description="Use this only if there is anything helpful to remember later."
          >
<<<<<<< HEAD
            <label className={GUIDED_FORM_LABEL_CLASS}>
              <StickyNote className={GUIDED_FORM_ICON_CLASS} />
=======
            <label className="mb-1 flex items-center gap-2 text-xs">
              <StickyNote className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
              Note
            </label>
            <textarea
              value={form.note}
              onChange={(event) =>
                setForm((current) => ({ ...current, note: event.target.value }))
              }
<<<<<<< HEAD
              className={`${GUIDED_FORM_FIELD_CLASS} min-h-[96px]`}
=======
              className="min-h-[96px] w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
              placeholder="Optional note about this pond"
            />
          </GuidedFormSection>
        </>
      )}
    </GuidedFormModal>
  );
}
