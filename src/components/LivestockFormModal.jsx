import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  ClipboardList,
  Feather,
  Hash,
  House,
  RotateCcw,
  Save,
  StickyNote,
  Users,
} from "lucide-react";
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
import { createLivestock, updateLivestock } from "../services/livestockService";
import { todayDateInputValue } from "../utils/formInputs";

const LIVESTOCK_TYPES = [
  "LAYER",
  "DUCK",
  "FOWL",
  "TURKEY",
  "NOILER",
  "BROILER",
  "OTHER",
];

const SOURCE_TYPES = ["FARM_BIRTH", "SUPPLIER"];
const KEEPING_METHODS = [
  "DEEP_LITTER",
  "BATTERY_CAGE",
  "FREE_RANGE",
  "SEMI_INTENSIVE",
  "BROODER_HOUSE",
  "OTHER",
];

function defaultForm() {
  return {
    batchName: "",
    type: "LAYER",
    currentStock: "",
    arrivalDate: todayDateInputValue(),
    sourceType: "FARM_BIRTH",
    keepingMethod: "DEEP_LITTER",
    startingAgeInWeeks: "",
    mortality: "",
    note: "",
  };
}

const Required = () => <span className="ml-0.5 text-red-500">*</span>;

const LIVESTOCK_STEPS = [
  {
    title: "What group is this?",
    description: "Add the flock name, poultry type, and source.",
  },
  {
    title: "Stock and age details",
    description: "Add stock count, date, keeping method, age, and any mortality update.",
  },
];

export default function LivestockFormModal({
  open,
  onClose,
  initialData = null,
  onSuccess,
}) {
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);
<<<<<<< HEAD
  const [errorMessage, setErrorMessage] = useState("");
=======
>>>>>>> 0babf4d (Update frontend application)
  const [step, setStep] = useState(0);

  const editing = Boolean(initialData?.id);

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setForm({
        batchName: initialData.batchName ?? "",
        type: initialData.type ?? "LAYER",
        currentStock: initialData.currentStock ?? "",
        arrivalDate: initialData.arrivalDate
          ? String(initialData.arrivalDate).slice(0, 10)
          : todayDateInputValue(),
        sourceType: initialData.sourceType ?? "FARM_BIRTH",
        keepingMethod: initialData.keepingMethod ?? "DEEP_LITTER",
        startingAgeInWeeks:
          initialData.startingAgeInWeeks ?? initialData.startingAge ?? "",
        mortality: "",
        note: initialData.note ?? "",
      });
    } else {
      setForm(defaultForm());
    }

<<<<<<< HEAD
    setErrorMessage("");
=======
>>>>>>> 0babf4d (Update frontend application)
    setStep(0);
  }, [initialData, open]);

  const stepOneComplete = Boolean(String(form.batchName || "").trim() && form.type && form.sourceType);
<<<<<<< HEAD
  const stepTwoComplete = Boolean(Number(form.currentStock) > 0 && form.arrivalDate);

  async function submit(event) {
    event.preventDefault();
    if (step < LIVESTOCK_STEPS.length - 1) {
      if (!stepOneComplete) return;
      setStep((current) => Math.min(current + 1, LIVESTOCK_STEPS.length - 1));
      return;
    }
=======
  const stepTwoComplete = Boolean(form.arrivalDate);

  async function submit(event) {
    event.preventDefault();
>>>>>>> 0babf4d (Update frontend application)
    if (!stepOneComplete || !stepTwoComplete) return;

    setSaving(true);
    setErrorMessage("");

    const payload = {
      batchName: form.batchName.trim(),
      type: form.type || null,
      currentStock: Number(form.currentStock),
      arrivalDate: form.arrivalDate || null,
      sourceType: form.sourceType || null,
      keepingMethod:
        form.type === "LAYER" ? form.keepingMethod || null : null,
      startingAgeInWeeks:
        form.startingAgeInWeeks === "" ? null : Number(form.startingAgeInWeeks),
      mortality: form.mortality === "" ? null : Number(form.mortality),
      note: form.note.trim() || null,
    };

    try {
      const saved = editing
        ? await updateLivestock(initialData.id, payload, { baseRecord: initialData })
        : await createLivestock(payload);
      onSuccess?.(saved);
    } catch (error) {
      console.error("Livestock submit failed", error);
<<<<<<< HEAD
      if (error?.response?.status === 409) {
        setErrorMessage(
          "That poultry group name already exists. Rename it or restore the earlier flock before saving.",
        );
      } else {
        setErrorMessage(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            `Failed to ${editing ? "update" : "save"} poultry flock.`,
        );
      }
=======
>>>>>>> 0babf4d (Update frontend application)
    } finally {
      setSaving(false);
    }
  }

  const footer = (
    <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500 dark:text-slate-300">
        {step === 0 ? "Step 1 of 2: flock basics" : "Step 2 of 2: stock and keeping details"}
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

        {step < LIVESTOCK_STEPS.length - 1 ? (
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
            {saving ? "Saving..." : editing ? "Save changes" : "Save group"}
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
      icon={ClipboardList}
      title={editing ? "Edit poultry flock" : "Add poultry flock"}
      description="Keep poultry setup simple. Start with the flock identity, then add stock and keeping details."
      editing={editing}
      steps={LIVESTOCK_STEPS}
      currentStep={step}
      maxWidth="max-w-2xl"
<<<<<<< HEAD
      errorMessage={errorMessage}
=======
>>>>>>> 0babf4d (Update frontend application)
      footer={footer}
    >
      {step === 0 ? (
        <GuidedFormSection
          title="Group basics"
          description="Give the flock a clear name and choose its type and source."
        >
          <div className="space-y-4">
            <div>
<<<<<<< HEAD
              <label className={GUIDED_FORM_LABEL_CLASS}>
                <ClipboardList className={GUIDED_FORM_ICON_CLASS} />
=======
              <label className="mb-1 flex items-center gap-2 text-xs">
                <ClipboardList className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
                Group name <Required />
              </label>
              <input
                value={form.batchName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, batchName: event.target.value }))
                }
<<<<<<< HEAD
                className={GUIDED_FORM_FIELD_CLASS}
=======
                className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
                placeholder="e.g. Layer flock 3"
                autoFocus
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
<<<<<<< HEAD
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <Feather className={GUIDED_FORM_ICON_CLASS} />
=======
                <label className="mb-1 flex items-center gap-2 text-xs">
                  <Feather className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
                  Type <Required />
                </label>
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, type: event.target.value }))
                  }
<<<<<<< HEAD
                  className={GUIDED_FORM_FIELD_CLASS}
=======
                  className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
                  required
                >
                  {LIVESTOCK_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
<<<<<<< HEAD
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <RotateCcw className={GUIDED_FORM_ICON_CLASS} />
=======
                <label className="mb-1 flex items-center gap-2 text-xs">
                  <RotateCcw className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
                  Source <Required />
                </label>
                <select
                  value={form.sourceType}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sourceType: event.target.value }))
                  }
<<<<<<< HEAD
                  className={GUIDED_FORM_FIELD_CLASS}
=======
                  className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
                  required
                >
                  {SOURCE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </GuidedFormSection>
      ) : (
        <>
          <GuidedFormSection
            title="Stock, timing, and keeping"
            description="Add how many birds are in the flock, when they arrived, and how they are kept."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
<<<<<<< HEAD
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <Users className={GUIDED_FORM_ICON_CLASS} />
                  Current stock <Required />
                </label>
                <input
                  type="number"
                  min="1"
=======
                <label className="mb-1 flex items-center gap-2 text-xs">
                  <Users className="h-4 w-4 text-slate-500" />
                  Current stock
                </label>
                <input
                  type="number"
                  min="0"
>>>>>>> 0babf4d (Update frontend application)
                  value={form.currentStock}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, currentStock: event.target.value }))
                  }
<<<<<<< HEAD
                  className={GUIDED_FORM_FIELD_CLASS}
                  placeholder="e.g. 1200"
                  required
=======
                  className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
                  placeholder="e.g. 1200"
>>>>>>> 0babf4d (Update frontend application)
                />
              </div>

              <div>
<<<<<<< HEAD
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <Calendar className={GUIDED_FORM_ICON_CLASS} />
=======
                <label className="mb-1 flex items-center gap-2 text-xs">
                  <Calendar className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
                  Arrival date <Required />
                </label>
                <input
                  type="date"
                  value={form.arrivalDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, arrivalDate: event.target.value }))
                  }
<<<<<<< HEAD
                  className={GUIDED_FORM_FIELD_CLASS}
=======
                  className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
                  required
                />
              </div>

              {form.type === "LAYER" && (
                <div>
<<<<<<< HEAD
                  <label className={GUIDED_FORM_LABEL_CLASS}>
                    <House className={GUIDED_FORM_ICON_CLASS} />
=======
                  <label className="mb-1 flex items-center gap-2 text-xs">
                    <House className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
                    Method of keeping
                  </label>
                  <select
                    value={form.keepingMethod}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        keepingMethod: event.target.value,
                      }))
                    }
<<<<<<< HEAD
                    className={GUIDED_FORM_FIELD_CLASS}
=======
                    className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
                  >
                    {KEEPING_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
<<<<<<< HEAD
                    Choose the keeping method that matches this flock, such as deep litter,
                    battery cage, or free range, so housing and care records stay accurate.
=======
                    Helpful for layer flocks so housing style stays visible in reports.
>>>>>>> 0babf4d (Update frontend application)
                  </p>
                </div>
              )}

              <div>
<<<<<<< HEAD
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <Hash className={GUIDED_FORM_ICON_CLASS} />
=======
                <label className="mb-1 flex items-center gap-2 text-xs">
                  <Hash className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
                  Starting age (weeks)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.startingAgeInWeeks}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      startingAgeInWeeks: event.target.value,
                    }))
                  }
<<<<<<< HEAD
                  className={GUIDED_FORM_FIELD_CLASS}
=======
                  className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
                  placeholder="e.g. 10"
                />
              </div>

              <div>
<<<<<<< HEAD
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <AlertTriangle className={GUIDED_FORM_ICON_CLASS} />
=======
                <label className="mb-1 flex items-center gap-2 text-xs">
                  <AlertTriangle className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
                  Mortality to add
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.mortality}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, mortality: event.target.value }))
                  }
<<<<<<< HEAD
                  className={GUIDED_FORM_FIELD_CLASS}
=======
                  className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
                  placeholder="e.g. 5"
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
              rows={3}
              value={form.note}
              onChange={(event) =>
                setForm((current) => ({ ...current, note: event.target.value }))
              }
<<<<<<< HEAD
              className={`${GUIDED_FORM_FIELD_CLASS} resize-none`}
=======
              className="w-full resize-none rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
              placeholder="Optional note about this poultry flock"
            />
          </GuidedFormSection>
        </>
      )}
    </GuidedFormModal>
  );
}
