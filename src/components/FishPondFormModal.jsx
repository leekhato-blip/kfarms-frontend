import { useEffect, useState } from "react";
import { Activity, Calendar, Droplets, Fish, Hash, Save, StickyNote } from "lucide-react";
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
    if (step < POND_STEPS.length - 1) {
      if (!stepOneComplete) return;
      setStep((current) => Math.min(current + 1, POND_STEPS.length - 1));
      return;
    }
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
            className={GUIDED_FORM_SECONDARY_BUTTON_CLASS}
          >
            Back
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className={GUIDED_FORM_SECONDARY_BUTTON_CLASS}
          >
            Cancel
          </button>
        )}

        {step < POND_STEPS.length - 1 ? (
          <button
            type="button"
            disabled={!stepOneComplete}
            onClick={(event) =>
              handleGuidedFormAdvanceClick(event, () => {
                setStep(1);
              })
            }
            className={GUIDED_FORM_PRIMARY_BUTTON_CLASS}
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={saving || !stepOneComplete || !stepTwoComplete}
            className={GUIDED_FORM_PRIMARY_SUBMIT_BUTTON_CLASS}
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
              <label className={GUIDED_FORM_LABEL_CLASS}>
                <Droplets className={GUIDED_FORM_ICON_CLASS} />
                Pond name <Required />
              </label>
              <input
                value={form.pondName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, pondName: event.target.value }))
                }
                className={GUIDED_FORM_FIELD_CLASS}
                placeholder="e.g. Grow out pond 1"
                autoFocus
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <Fish className={GUIDED_FORM_ICON_CLASS} />
                  Pond type <Required />
                </label>
                <select
                  value={form.pondType}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, pondType: event.target.value }))
                  }
                  className={GUIDED_FORM_FIELD_CLASS}
                  required
                >
                  <option value="HATCHING">Hatching</option>
                  <option value="GROW_OUT">Grow out</option>
                  <option value="BROODSTOCK">Broodstock</option>
                  <option value="HOLDING">Holding</option>
                </select>
              </div>

              <div>
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <Activity className={GUIDED_FORM_ICON_CLASS} />
                  Status <Required />
                </label>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value }))
                  }
                  className={GUIDED_FORM_FIELD_CLASS}
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
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <Hash className={GUIDED_FORM_ICON_CLASS} />
                  Capacity <Required />
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.capacity}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, capacity: event.target.value }))
                  }
                  className={GUIDED_FORM_FIELD_CLASS}
                  placeholder="e.g. 2000"
                  required
                />
              </div>

              <div>
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <Hash className={GUIDED_FORM_ICON_CLASS} />
                  Current stock <Required />
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.currentStock}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, currentStock: event.target.value }))
                  }
                  className={GUIDED_FORM_FIELD_CLASS}
                  placeholder="e.g. 1500"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label className={GUIDED_FORM_LABEL_CLASS}>
                <Calendar className={GUIDED_FORM_ICON_CLASS} />
                Last water change <Required />
              </label>
              <input
                type="date"
                value={form.lastWaterChange}
                onChange={(event) =>
                  setForm((current) => ({ ...current, lastWaterChange: event.target.value }))
                }
                className={GUIDED_FORM_FIELD_CLASS}
                required
              />
            </div>
          </GuidedFormSection>

          <GuidedFormSection
            title="Optional note"
            description="Use this only if there is anything helpful to remember later."
          >
            <label className={GUIDED_FORM_LABEL_CLASS}>
              <StickyNote className={GUIDED_FORM_ICON_CLASS} />
              Note
            </label>
            <textarea
              value={form.note}
              onChange={(event) =>
                setForm((current) => ({ ...current, note: event.target.value }))
              }
              className={`${GUIDED_FORM_FIELD_CLASS} min-h-[96px]`}
              placeholder="Optional note about this pond"
            />
          </GuidedFormSection>
        </>
      )}
    </GuidedFormModal>
  );
}
