import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Hash, Save, StickyNote, Wallet, Wheat } from "lucide-react";
import GuidedFormModal, {
  GUIDED_FORM_FIELD_CLASS,
  GUIDED_FORM_ICON_CLASS,
  GUIDED_FORM_LABEL_CLASS,
  GUIDED_FORM_PRIMARY_BUTTON_CLASS,
  GUIDED_FORM_PRIMARY_SUBMIT_BUTTON_CLASS,
  GUIDED_FORM_SECONDARY_BUTTON_CLASS,
  GuidedFormSection,
} from "./GuidedFormModal";
import { createFeed, updateFeed } from "../services/feedService";

function defaultForm() {
  return {
    batchType: "LAYER",
    quantity: "",
    unitCost: "",
    date: "",
    note: "",
  };
}

const FEED_TYPES = [
  "LAYER",
  "BROILER",
  "NOILER",
  "DUCK",
  "FISH",
  "FOWL",
  "TURKEY",
  "OTHER",
];

const FEED_STEPS = [
  {
    title: "What feed was used?",
    description: "Choose the feed type, quantity, and unit cost.",
  },
  {
    title: "When was it used?",
    description: "Add the date and any simple note.",
  },
];

const Required = () => <span className="ml-0.5 text-red-500">*</span>;

function formatCurrencyInput(value) {
  if (!value) return "";
  return new Intl.NumberFormat("en-NG").format(value);
}

function parseCurrencyInput(value) {
  return value.replace(/,/g, "");
}

export default function FeedFormModal({ open, onClose, initialData = null, onSuccess }) {
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);

  const editing = Boolean(initialData?.id);

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setForm({
        batchType: initialData.batchType ?? initialData.type ?? "LAYER",
        quantity: initialData.quantity ?? initialData.quantityUsed ?? "",
        unitCost: initialData.unitCost ?? "",
        date: initialData.date
          ? String(initialData.date).slice(0, 10)
          : initialData.feedDate
            ? String(initialData.feedDate).slice(0, 10)
            : "",
        note: initialData.note ?? "",
      });
    } else {
      setForm(defaultForm());
    }

    setStep(0);
  }, [initialData, open]);

  const total = useMemo(
    () => Number(form.quantity || 0) * Number(form.unitCost || 0),
    [form.quantity, form.unitCost],
  );

  const stepOneComplete = Boolean(
    form.batchType && Number(form.quantity) > 0 && Number(form.unitCost) >= 0,
  );
  const stepTwoComplete = Boolean(form.date);

  async function submit(event) {
    event.preventDefault();
    if (!stepOneComplete || !stepTwoComplete) return;

    setSaving(true);

    const payload = {
      batchType: form.batchType,
      quantity: Number(form.quantity),
      unitCost: Number(form.unitCost),
      date: form.date || null,
      note: form.note.trim() || null,
    };

    try {
      const saved = editing
        ? await updateFeed(initialData.id, payload, { baseRecord: initialData })
        : await createFeed(payload);
      onSuccess?.(saved);
    } catch (error) {
      console.error("Feed submit failed", error);
    } finally {
      setSaving(false);
    }
  }

  const footer = (
    <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500 dark:text-slate-300">
        {step === 0 ? "Step 1 of 2: feed quantity and cost" : "Step 2 of 2: date and note"}
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

        {step < FEED_STEPS.length - 1 ? (
          <button
            type="button"
            disabled={!stepOneComplete}
            onClick={() => setStep(1)}
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
            {saving ? "Saving..." : editing ? "Save changes" : "Save feed entry"}
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
      icon={Wheat}
      title={editing ? "Edit feed entry" : "Record feed"}
      description="Keep feed records simple. Start with the feed type and cost, then add the date."
      editing={editing}
      steps={FEED_STEPS}
      currentStep={step}
      maxWidth="max-w-2xl"
      footer={footer}
    >
      {step === 0 ? (
        <>
          <GuidedFormSection
            title="Feed details"
            description="These are the main details for the feed record."
          >
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-300">
                  Feed type <Required />
                </label>
                <div className="flex flex-wrap gap-2">
                  {FEED_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, batchType: type }))}
                      className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                        form.batchType === type
                          ? "border-accent-primary bg-accent-primary text-white"
                          : "border-white/20 bg-white/50 text-slate-700 dark:bg-white/10 dark:text-slate-200"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={GUIDED_FORM_LABEL_CLASS}>
                    <Hash className={GUIDED_FORM_ICON_CLASS} />
                    Quantity <Required />
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, quantity: event.target.value }))
                    }
                    className={GUIDED_FORM_FIELD_CLASS}
                    required
                  />
                </div>

                <div>
                  <label className={GUIDED_FORM_LABEL_CLASS}>
                    <Wallet className={GUIDED_FORM_ICON_CLASS} />
                    Unit cost (Naira) <Required />
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatCurrencyInput(form.unitCost)}
                    onChange={(event) => {
                      const raw = parseCurrencyInput(event.target.value);
                      if (!/^\d*$/.test(raw)) return;
                      setForm((current) => ({ ...current, unitCost: raw }));
                    }}
                    onBlur={() => {
                      if (form.unitCost === "") return;
                      setForm((current) => ({
                        ...current,
                        unitCost: String(Number(current.unitCost)),
                      }));
                    }}
                    className={GUIDED_FORM_FIELD_CLASS}
                    placeholder="0"
                    required
                  />
                </div>
              </div>
            </div>
          </GuidedFormSection>

          <GuidedFormSection
            title="Quick total"
            description="This updates automatically so you can confirm the amount."
          >
            <div className="flex items-center justify-between rounded-xl bg-white/50 px-4 py-3 dark:bg-white/[0.04]">
              <span className="text-sm text-slate-600 dark:text-slate-300">Estimated total</span>
              <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                ₦{total.toLocaleString()}
              </span>
            </div>
          </GuidedFormSection>
        </>
      ) : (
        <>
          <GuidedFormSection
            title="Date"
            description="Add the day this feed entry happened."
          >
            <label className={GUIDED_FORM_LABEL_CLASS}>
              <CalendarDays className={GUIDED_FORM_ICON_CLASS} />
              Date <Required />
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm((current) => ({ ...current, date: event.target.value }))
              }
              className={GUIDED_FORM_FIELD_CLASS}
              required
            />
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
              className={`${GUIDED_FORM_FIELD_CLASS} h-24 resize-none`}
              placeholder="Optional details about this feed entry"
            />
          </GuidedFormSection>
        </>
      )}
    </GuidedFormModal>
  );
}
