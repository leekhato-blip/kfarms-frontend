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
import GuidedFormModal, { GuidedFormSection } from "./GuidedFormModal";
import { createLivestock, updateLivestock } from "../services/livestockService";

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
  const today = new Date().toISOString().slice(0, 10);
  return {
    batchName: "",
    type: "LAYER",
    currentStock: "",
    arrivalDate: today,
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
          : "",
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

    setStep(0);
  }, [initialData, open]);

  const stepOneComplete = Boolean(String(form.batchName || "").trim() && form.type && form.sourceType);
  const stepTwoComplete = Boolean(form.arrivalDate);

  async function submit(event) {
    event.preventDefault();
    if (step < LIVESTOCK_STEPS.length - 1) {
      if (!stepOneComplete) return;
      setStep((current) => Math.min(current + 1, LIVESTOCK_STEPS.length - 1));
      return;
    }
    if (!stepOneComplete || !stepTwoComplete) return;

    setSaving(true);

    const payload = {
      batchName: form.batchName.trim(),
      type: form.type || null,
      currentStock: form.currentStock === "" ? null : Number(form.currentStock),
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
            className="rounded-lg border border-white/15 bg-white/40 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
          >
            Back
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 bg-white/40 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
          >
            Cancel
          </button>
        )}

        {step < LIVESTOCK_STEPS.length - 1 ? (
          <button
            type="button"
            disabled={!stepOneComplete}
            onClick={() => setStep(1)}
            className="rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={saving || !stepOneComplete || !stepTwoComplete}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-primary px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
      footer={footer}
    >
      {step === 0 ? (
        <GuidedFormSection
          title="Group basics"
          description="Give the flock a clear name and choose its type and source."
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1 flex items-center gap-2 text-xs">
                <ClipboardList className="h-4 w-4 text-slate-500" />
                Group name <Required />
              </label>
              <input
                value={form.batchName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, batchName: event.target.value }))
                }
                className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
                placeholder="e.g. Layer flock 3"
                autoFocus
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 flex items-center gap-2 text-xs">
                  <Feather className="h-4 w-4 text-slate-500" />
                  Type <Required />
                </label>
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, type: event.target.value }))
                  }
                  className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
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
                <label className="mb-1 flex items-center gap-2 text-xs">
                  <RotateCcw className="h-4 w-4 text-slate-500" />
                  Source <Required />
                </label>
                <select
                  value={form.sourceType}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sourceType: event.target.value }))
                  }
                  className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
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
                <label className="mb-1 flex items-center gap-2 text-xs">
                  <Users className="h-4 w-4 text-slate-500" />
                  Current stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.currentStock}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, currentStock: event.target.value }))
                  }
                  className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
                  placeholder="e.g. 1200"
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-2 text-xs">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  Arrival date <Required />
                </label>
                <input
                  type="date"
                  value={form.arrivalDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, arrivalDate: event.target.value }))
                  }
                  className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
                  required
                />
              </div>

              {form.type === "LAYER" && (
                <div>
                  <label className="mb-1 flex items-center gap-2 text-xs">
                    <House className="h-4 w-4 text-slate-500" />
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
                    className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
                  >
                    {KEEPING_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Helpful for layer flocks so housing style stays visible in reports.
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1 flex items-center gap-2 text-xs">
                  <Hash className="h-4 w-4 text-slate-500" />
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
                  className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
                  placeholder="e.g. 10"
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-2 text-xs">
                  <AlertTriangle className="h-4 w-4 text-slate-500" />
                  Mortality to add
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.mortality}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, mortality: event.target.value }))
                  }
                  className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
                  placeholder="e.g. 5"
                />
              </div>
            </div>
          </GuidedFormSection>

          <GuidedFormSection
            title="Optional note"
            description="Use this only if there is anything helpful to remember later."
          >
            <label className="mb-1 flex items-center gap-2 text-xs">
              <StickyNote className="h-4 w-4 text-slate-500" />
              Note
            </label>
            <textarea
              rows={3}
              value={form.note}
              onChange={(event) =>
                setForm((current) => ({ ...current, note: event.target.value }))
              }
              className="w-full resize-none rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
              placeholder="Optional note about this poultry flock"
            />
          </GuidedFormSection>
        </>
      )}
    </GuidedFormModal>
  );
}
