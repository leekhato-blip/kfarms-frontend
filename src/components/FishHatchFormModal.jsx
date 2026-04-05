import { useEffect, useMemo, useState } from "react";
import { Calendar, Egg, Fish, Hash, Save, StickyNote } from "lucide-react";
<<<<<<< HEAD
import GuidedFormModal, {
  GUIDED_FORM_FIELD_CLASS,
  GUIDED_FORM_ICON_CLASS,
  GUIDED_FORM_LABEL_CLASS,
  GUIDED_FORM_PRIMARY_BUTTON_CLASS,
  GUIDED_FORM_PRIMARY_SUBMIT_BUTTON_CLASS,
  GUIDED_FORM_READONLY_FIELD_CLASS,
  GUIDED_FORM_SECONDARY_BUTTON_CLASS,
  GuidedFormSection,
  handleGuidedFormAdvanceClick,
} from "./GuidedFormModal";
=======
import GuidedFormModal, { GuidedFormSection } from "./GuidedFormModal";
>>>>>>> 0babf4d (Update frontend application)
import { createFishHatch, updateFishHatch } from "../services/fishHatchService";
import { todayDateInputValue, toDateInputValue } from "../utils/formInputs";

function defaultForm() {
  return {
    pondId: "",
    hatchDate: todayDateInputValue(),
    maleCount: "",
    femaleCount: "",
    quantityHatched: "",
    note: "",
  };
}

const Required = () => <span className="ml-0.5 text-red-500">*</span>;

const HATCH_STEPS = [
  {
    title: "Which pond and day?",
    description: "Choose the pond and the hatch date.",
  },
  {
    title: "Parent counts and hatch",
    description: "Enter the parent counts and the number hatched.",
  },
];

const HATCH_STEPS = [
  {
    title: "Which pond and day?",
    description: "Choose the pond and the hatch date.",
  },
  {
    title: "Parent counts and hatch",
    description: "Enter the parent counts and the number hatched.",
  },
];

export default function FishHatchFormModal({
  open,
  onClose,
  initialData = null,
  pondOptions = [],
  onSuccess,
}) {
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);

  const editing = Boolean(initialData?.id);
  const pondsEmpty = pondOptions.length === 0;

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      const fallbackPondId =
        initialData.pondId ??
        pondOptions.find((pond) => pond.pondName === initialData.pondName)?.id ??
        "";

      setForm({
        pondId: String(fallbackPondId || ""),
<<<<<<< HEAD
        hatchDate: toDateInputValue(initialData.hatchDate, todayDateInputValue()),
=======
        hatchDate: toInputDate(initialData.hatchDate),
>>>>>>> 0babf4d (Update frontend application)
        maleCount: initialData.maleCount ?? "",
        femaleCount: initialData.femaleCount ?? "",
        quantityHatched: initialData.quantityHatched ?? "",
        note: initialData.note ?? "",
      });
    } else {
      setForm(defaultForm());
    }

    setStep(0);
  }, [initialData, open, pondOptions]);

  const maleCount = Number(form.maleCount || 0);
  const femaleCount = Number(form.femaleCount || 0);
  const quantityHatched = Number(form.quantityHatched || 0);
  const totalParents = maleCount + femaleCount;
  const selectedPondName =
    pondOptions.find((pond) => String(pond.id) === String(form.pondId))?.pondName || "";
  const hatchRate = useMemo(
    () => (totalParents > 0 ? (quantityHatched / totalParents) * 100 : 0),
    [quantityHatched, totalParents],
  );

  const stepOneComplete = Boolean(!pondsEmpty && form.pondId && form.hatchDate);
  const stepTwoComplete = Boolean(
    Number(form.maleCount) >= 0 &&
      Number(form.femaleCount) >= 0 &&
      Number(form.quantityHatched) >= 0,
  );

  async function submit(event) {
    event.preventDefault();
<<<<<<< HEAD
    if (step < HATCH_STEPS.length - 1) {
      if (pondsEmpty || !stepOneComplete) return;
      setStep((current) => Math.min(current + 1, HATCH_STEPS.length - 1));
      return;
    }
=======
>>>>>>> 0babf4d (Update frontend application)
    if (pondsEmpty || !stepOneComplete || !stepTwoComplete) return;

    setSaving(true);

    const payload = {
      pondId: Number(form.pondId),
      hatchDate: form.hatchDate ? `${form.hatchDate}T00:00:00` : null,
      maleCount: Number(form.maleCount),
      femaleCount: Number(form.femaleCount),
      quantityHatched: Number(form.quantityHatched),
      hatchRate,
      note: form.note.trim() || null,
    };

    try {
      const saved = editing
        ? await updateFishHatch(initialData.id, payload, {
            baseRecord: initialData,
            context: { pondName: selectedPondName },
          })
        : await createFishHatch(payload, {
            context: { pondName: selectedPondName },
          });
      onSuccess?.(saved);
    } catch (error) {
      console.error("Fish hatch submit failed", error);
    } finally {
      setSaving(false);
    }
  }

  const footer = (
    <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500 dark:text-slate-300">
        {step === 0 ? "Step 1 of 2: pond and date" : "Step 2 of 2: hatch counts"}
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

        {step < HATCH_STEPS.length - 1 ? (
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
            disabled={saving || pondsEmpty || !stepOneComplete || !stepTwoComplete}
<<<<<<< HEAD
            className={GUIDED_FORM_PRIMARY_SUBMIT_BUTTON_CLASS}
=======
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-primary px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
>>>>>>> 0babf4d (Update frontend application)
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : editing ? "Save changes" : "Save hatch record"}
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
      title={editing ? "Edit hatch record" : "Record hatch"}
      description="Keep hatch records simple. Start with the pond and day, then add the hatch counts."
      editing={editing}
      steps={HATCH_STEPS}
      currentStep={step}
      maxWidth="max-w-2xl"
      footer={footer}
    >
      {pondsEmpty ? (
        <GuidedFormSection
          title="Pond needed first"
          description="Add at least one pond before recording hatch activity."
        >
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
            No pond is available yet, so this hatch record cannot be saved.
          </div>
        </GuidedFormSection>
      ) : step === 0 ? (
        <GuidedFormSection
          title="Pond and date"
          description="Choose the pond and the date for this hatch record."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
<<<<<<< HEAD
              <label className={GUIDED_FORM_LABEL_CLASS}>
                <Fish className={GUIDED_FORM_ICON_CLASS} />
=======
              <label className="mb-1 flex items-center gap-2 text-xs">
                <Fish className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
                Pond <Required />
              </label>
              <select
                value={form.pondId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, pondId: event.target.value }))
                }
<<<<<<< HEAD
                className={GUIDED_FORM_FIELD_CLASS}
=======
                className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
                required
              >
                <option value="">Select pond</option>
                {pondOptions.map((pond) => (
                  <option key={pond.id} value={pond.id}>
                    {pond.pondName}
                  </option>
                ))}
              </select>
            </div>

            <div>
<<<<<<< HEAD
              <label className={GUIDED_FORM_LABEL_CLASS}>
                <Calendar className={GUIDED_FORM_ICON_CLASS} />
=======
              <label className="mb-1 flex items-center gap-2 text-xs">
                <Calendar className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
                Hatch date <Required />
              </label>
              <input
                type="date"
                value={form.hatchDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, hatchDate: event.target.value }))
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
            title="Parent counts and hatch"
            description="Enter the counts and the number that hatched."
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
                  Male count <Required />
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.maleCount}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, maleCount: event.target.value }))
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
                  Female count <Required />
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.femaleCount}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, femaleCount: event.target.value }))
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
                  Hatched <Required />
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.quantityHatched}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      quantityHatched: event.target.value,
                    }))
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
                  Hatch rate
                </label>
                <input
                  type="text"
                  value={`${hatchRate.toFixed(1)}%`}
<<<<<<< HEAD
                  className={GUIDED_FORM_READONLY_FIELD_CLASS}
=======
                  className="w-full rounded-lg bg-white/70 p-3 outline-none dark:bg-black/50"
>>>>>>> 0babf4d (Update frontend application)
                  readOnly
                />
              </div>
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
              placeholder="Optional note about the hatch"
            />
          </GuidedFormSection>
        </>
      )}
    </GuidedFormModal>
  );
}
