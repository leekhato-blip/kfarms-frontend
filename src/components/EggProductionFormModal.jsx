import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Egg, Hash, Save, StickyNote } from "lucide-react";
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
import { createEggRecord, updateEggRecord } from "../services/eggProductionService";
import { todayDateInputValue } from "../utils/formInputs";
=======
import GuidedFormModal, { GuidedFormSection } from "./GuidedFormModal";
import { createEggRecord, updateEggRecord } from "../services/eggProductionService";
>>>>>>> 0babf4d (Update frontend application)

function defaultForm(layerBatches = []) {
  return {
    batchId: layerBatches[0]?.id ? String(layerBatches[0].id) : "",
<<<<<<< HEAD
    collectionDate: todayDateInputValue(),
=======
    collectionDate: "",
>>>>>>> 0babf4d (Update frontend application)
    goodEggs: "",
    damagedEggs: "",
    note: "",
  };
}

const Required = () => <span className="ml-0.5 text-red-500">*</span>;

const PRODUCTION_STEPS = [
  {
    title: "Which batch and day?",
    description: "Choose the layer batch and the collection date.",
  },
  {
    title: "How many eggs?",
    description: "Enter good eggs, damaged eggs, and any note.",
  },
];

export default function EggProductionFormModal({
  open,
  onClose,
  initialData = null,
  layerBatches = [],
  onSuccess,
  onError,
}) {
  const [form, setForm] = useState(defaultForm(layerBatches));
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);

  const editing = Boolean(initialData?.id);
  const hasBatches = layerBatches.length > 0;
  const selectedBatchName =
    layerBatches.find((batch) => String(batch.id) === String(form.batchId))?.batchName || "";

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setForm({
        batchId: initialData.batchId ? String(initialData.batchId) : "",
        collectionDate: initialData.collectionDate
          ? String(initialData.collectionDate).slice(0, 10)
<<<<<<< HEAD
          : todayDateInputValue(),
=======
          : "",
>>>>>>> 0babf4d (Update frontend application)
        goodEggs: String(initialData.goodEggs ?? ""),
        damagedEggs: String(initialData.damagedEggs ?? ""),
        note: initialData.note ?? "",
      });
    } else {
      setForm(defaultForm(layerBatches));
    }

    setStep(0);
  }, [initialData, layerBatches, open]);

  const cratesProduced = useMemo(
    () => Math.floor((Number(form.goodEggs) || 0) / 30),
    [form.goodEggs],
  );

  const stepOneComplete = Boolean(hasBatches && form.batchId && form.collectionDate);
  const stepTwoComplete = Boolean(Number(form.goodEggs) >= 0 && Number(form.damagedEggs) >= 0);

  async function submit(event) {
    event.preventDefault();
<<<<<<< HEAD
    if (step < PRODUCTION_STEPS.length - 1) {
      if (!hasBatches || !stepOneComplete) return;
      setStep((current) => Math.min(current + 1, PRODUCTION_STEPS.length - 1));
      return;
    }
=======
>>>>>>> 0babf4d (Update frontend application)
    if (!hasBatches || !stepOneComplete || !stepTwoComplete) return;

    setSaving(true);

    const payload = {
      batchId: Number(form.batchId),
      collectionDate: form.collectionDate || null,
      goodEggs: Number(form.goodEggs || 0),
      damagedEggs: Number(form.damagedEggs || 0),
      note: form.note.trim() || null,
    };

    try {
      const saved = editing
        ? await updateEggRecord(initialData.id, payload, {
            baseRecord: initialData,
            context: { batchName: selectedBatchName },
          })
        : await createEggRecord(payload, {
            context: { batchName: selectedBatchName },
          });
      onSuccess?.(saved);
    } catch (error) {
      console.error("Egg production submit failed", error);
      onError?.(error);
    } finally {
      setSaving(false);
    }
  }

  const footer = (
    <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500 dark:text-slate-300">
        {step === 0 ? "Step 1 of 2: choose batch and date" : "Step 2 of 2: enter egg counts"}
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

        {step < PRODUCTION_STEPS.length - 1 ? (
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
            disabled={saving || !hasBatches || !stepOneComplete || !stepTwoComplete}
<<<<<<< HEAD
            className={GUIDED_FORM_PRIMARY_SUBMIT_BUTTON_CLASS}
=======
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-primary px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
>>>>>>> 0babf4d (Update frontend application)
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : editing ? "Save changes" : "Save record"}
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
      icon={Egg}
      title={editing ? "Edit egg record" : "Record egg production"}
      description="Keep egg records simple. Start with the batch and date, then enter the egg counts."
      editing={editing}
      steps={PRODUCTION_STEPS}
      currentStep={step}
      maxWidth="max-w-2xl"
      footer={footer}
    >
      {!hasBatches ? (
        <GuidedFormSection
          title="Layer batch needed first"
          description="Add a layer flock in Poultry before recording egg production here."
        >
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
            No layer batches are available yet, so this record cannot be saved.
          </div>
        </GuidedFormSection>
      ) : step === 0 ? (
        <GuidedFormSection
          title="Batch and date"
          description="Choose the layer batch and the day the eggs were collected."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
<<<<<<< HEAD
              <label className={GUIDED_FORM_LABEL_CLASS}>
                <Egg className={GUIDED_FORM_ICON_CLASS} />
=======
              <label className="mb-1 flex items-center gap-2 text-xs">
                <Egg className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
                Layer batch <Required />
              </label>
              <select
                value={form.batchId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, batchId: event.target.value }))
                }
<<<<<<< HEAD
                className={GUIDED_FORM_FIELD_CLASS}
=======
                className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
                required
              >
                {layerBatches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batchName}
                  </option>
                ))}
              </select>
            </div>

            <div>
<<<<<<< HEAD
              <label className={GUIDED_FORM_LABEL_CLASS}>
                <CalendarDays className={GUIDED_FORM_ICON_CLASS} />
=======
              <label className="mb-1 flex items-center gap-2 text-xs">
                <CalendarDays className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
                Collection date <Required />
              </label>
              <input
                type="date"
                value={form.collectionDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, collectionDate: event.target.value }))
                }
<<<<<<< HEAD
                className={GUIDED_FORM_FIELD_CLASS}
=======
                className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
                required
              />
            </div>
          </div>
        </GuidedFormSection>
      ) : (
        <>
          <GuidedFormSection
            title="Egg counts"
            description="Enter the number of good eggs and damaged eggs."
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
                  Good eggs <Required />
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.goodEggs}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, goodEggs: event.target.value }))
                  }
<<<<<<< HEAD
                  className={GUIDED_FORM_FIELD_CLASS}
=======
                  className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
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
                  Damaged eggs <Required />
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.damagedEggs}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, damagedEggs: event.target.value }))
                  }
<<<<<<< HEAD
                  className={GUIDED_FORM_FIELD_CLASS}
=======
                  className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
                  required
                />
              </div>
            </div>
          </GuidedFormSection>

          <GuidedFormSection
            title="Quick summary"
            description="This updates automatically from the good egg count."
          >
            <div className="flex items-center justify-between rounded-xl bg-white/50 px-4 py-3 dark:bg-white/[0.04]">
              <span className="text-sm text-slate-600 dark:text-slate-300">Estimated crates</span>
              <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {cratesProduced}
              </span>
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
              className={`${GUIDED_FORM_FIELD_CLASS} h-24 resize-none`}
=======
              className="h-24 w-full resize-none rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
              placeholder="Optional notes about the collection"
            />
          </GuidedFormSection>
        </>
      )}
    </GuidedFormModal>
  );
}
