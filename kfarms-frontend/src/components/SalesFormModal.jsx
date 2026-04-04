import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Package, Save, StickyNote, User, Wallet } from "lucide-react";
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
import { createSale, updateSale } from "../services/salesService";
import { SALES_CATEGORY_OPTIONS } from "../constants/formOptions";
import {
  formatCurrencyInput,
  normalizeCurrencyOnBlur,
  sanitizeCurrencyInput,
  todayDateInputValue,
} from "../utils/formInputs";

function defaultForm() {
  return {
    itemName: "",
    category: "LAYER",
    quantity: "",
    unitPrice: "",
    buyer: "",
    note: "",
    salesDate: todayDateInputValue(),
  };
}

const SALE_STEPS = [
  {
    title: "What was sold?",
    description: "Enter the item, type, quantity, and price.",
  },
  {
    title: "Who bought it?",
    description: "Add the customer, date, and any extra note.",
  },
];

const Required = () => <span className="ml-0.5 text-red-500">*</span>;

export default function SalesFormModal({
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
        itemName: initialData.itemName ?? "",
        category: initialData.category ?? "LAYER",
        quantity: initialData.quantity ?? "",
        unitPrice: initialData.unitPrice ?? "",
        buyer: initialData.buyer ?? "",
        note: initialData.note ?? "",
        salesDate: initialData.salesDate
          ? initialData.salesDate.slice(0, 10)
          : todayDateInputValue(),
      });
    } else {
      setForm(defaultForm());
    }

    setStep(0);
  }, [initialData, open]);

  const total = useMemo(
    () => Number(form.quantity || 0) * Number(form.unitPrice || 0),
    [form.quantity, form.unitPrice],
  );

  const stepOneComplete = Boolean(
    String(form.itemName || "").trim() &&
      form.category &&
      Number(form.quantity) > 0 &&
      Number(form.unitPrice) > 0,
  );
  const stepTwoComplete = Boolean(form.salesDate);

  async function submit(event) {
    event.preventDefault();
    if (step < SALE_STEPS.length - 1) {
      if (!stepOneComplete) return;
      setStep((current) => Math.min(current + 1, SALE_STEPS.length - 1));
      return;
    }
    if (!stepOneComplete || !stepTwoComplete) return;

    setSaving(true);

    const payload = {
      ...form,
      quantity: Number(form.quantity),
      unitPrice: Number(form.unitPrice),
      salesDate: form.salesDate ? `${form.salesDate}T00:00:00` : null,
      buyer: form.buyer.trim() || null,
      note: form.note.trim() || null,
    };

    try {
      const sale = editing
        ? await updateSale(initialData.id, payload, { baseRecord: initialData })
        : await createSale(payload);
      onSuccess?.(sale);
    } catch (error) {
      console.error("Sale submit failed", error);
    } finally {
      setSaving(false);
    }
  }

  const footer = (
    <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500 dark:text-slate-300">
        {step === 0
          ? "Step 1 of 2: basic sale details"
          : "Step 2 of 2: buyer and sale date"}
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

        {step < SALE_STEPS.length - 1 ? (
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
            {saving ? "Saving..." : editing ? "Save changes" : "Save sale"}
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
      icon={Package}
      title={editing ? "Edit sale" : "Record sale"}
      description="Keep sales records simple. Start with what was sold, then add who bought it and when."
      editing={editing}
      steps={SALE_STEPS}
      currentStep={step}
      maxWidth="max-w-2xl"
      footer={footer}
    >
      {step === 0 ? (
        <>
          <GuidedFormSection
            title="Sale details"
            description="These are the main details needed to record the sale."
          >
            <div className="space-y-4">
              <div>
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <Package className={GUIDED_FORM_ICON_CLASS} />
                  Item <Required />
                </label>
                <input
                  value={form.itemName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, itemName: event.target.value }))
                  }
                  className={GUIDED_FORM_FIELD_CLASS}
                  placeholder="e.g. Layer eggs"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <Package className={GUIDED_FORM_ICON_CLASS} />
                  Category <Required />
                </label>
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, category: event.target.value }))
                  }
                  className={GUIDED_FORM_FIELD_CLASS}
                  required
                >
                  {SALES_CATEGORY_OPTIONS.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={GUIDED_FORM_LABEL_CLASS}>
                    <Package className={GUIDED_FORM_ICON_CLASS} />
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
                    Unit price (Naira) <Required />
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatCurrencyInput(form.unitPrice)}
                    onChange={(event) => {
                      const raw = sanitizeCurrencyInput(event.target.value);
                      setForm((current) => ({ ...current, unitPrice: raw }));
                    }}
                    onBlur={() => {
                      if (form.unitPrice === "") return;
                      setForm((current) => ({
                        ...current,
                        unitPrice: normalizeCurrencyOnBlur(current.unitPrice),
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
            description="This updates automatically as you type."
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
            title="Customer and date"
            description="Add who bought it and when the sale happened."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <User className={GUIDED_FORM_ICON_CLASS} />
                  Buyer
                </label>
                <input
                  value={form.buyer}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, buyer: event.target.value }))
                  }
                  className={GUIDED_FORM_FIELD_CLASS}
                  placeholder="Customer name"
                />
              </div>

              <div>
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <CalendarDays className={GUIDED_FORM_ICON_CLASS} />
                  Sale date <Required />
                </label>
                <input
                  type="date"
                  value={form.salesDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, salesDate: event.target.value }))
                  }
                  className={GUIDED_FORM_FIELD_CLASS}
                  required
                />
              </div>
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
              className={`${GUIDED_FORM_FIELD_CLASS} h-24 resize-none`}
              placeholder="Optional details about the sale"
            />
          </GuidedFormSection>
        </>
      )}
    </GuidedFormModal>
  );
}
