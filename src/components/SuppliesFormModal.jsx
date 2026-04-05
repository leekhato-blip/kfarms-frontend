import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Package, Save, StickyNote, Truck, User, Wallet } from "lucide-react";
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
import { createSupply, updateSupply } from "../services/suppliesService";
import { SUPPLY_CATEGORY_OPTIONS } from "../constants/formOptions";
import {
  formatCurrencyInput,
  normalizeCurrencyOnBlur,
  sanitizeCurrencyInput,
  todayDateInputValue,
} from "../utils/formInputs";

function defaultForm() {
  return {
    itemName: "",
    category: "FEED",
    quantity: "",
    unitPrice: "",
    supplierName: "",
    note: "",
    supplyDate: todayDateInputValue(),
  };
}

const SUPPLY_STEPS = [
  {
    title: "What did you buy?",
    description: "Add the item, type, quantity, and price.",
  },
  {
    title: "Who supplied it?",
    description: "Add the supplier, date, and any helpful note.",
  },
];

<<<<<<< HEAD
const Required = () => <span className="ml-0.5 text-red-500">*</span>;
=======
const SUPPLY_CATEGORIES = [
  "FEED",
  "LIVESTOCK",
  "FISH",
  "MEDICINE",
  "EQUIPMENT",
  "OTHER",
];

const Required = () => <span className="ml-0.5 text-red-500">*</span>;

function formatCurrencyInput(value) {
  if (!value) return "";
  return new Intl.NumberFormat("en-NG").format(value);
}

function parseCurrencyInput(value) {
  return value.replace(/,/g, "");
}
>>>>>>> 0babf4d (Update frontend application)

export default function SuppliesFormModal({
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
        category: initialData.category ?? "FEED",
        quantity: initialData.quantity ?? "",
        unitPrice: initialData.unitPrice ?? "",
        supplierName: initialData.supplierName ?? "",
        note: initialData.note ?? "",
<<<<<<< HEAD
        supplyDate: initialData.supplyDate
          ? String(initialData.supplyDate).slice(0, 10)
          : todayDateInputValue(),
=======
        supplyDate: initialData.supplyDate ? String(initialData.supplyDate).slice(0, 10) : "",
>>>>>>> 0babf4d (Update frontend application)
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
  const stepTwoComplete = Boolean(form.supplyDate);

  async function submit(event) {
    event.preventDefault();
<<<<<<< HEAD
    if (step < SUPPLY_STEPS.length - 1) {
      if (!stepOneComplete) return;
      setStep((current) => Math.min(current + 1, SUPPLY_STEPS.length - 1));
      return;
    }
=======
>>>>>>> 0babf4d (Update frontend application)
    if (!stepOneComplete || !stepTwoComplete) return;

    setSaving(true);

    const payload = {
      ...form,
      quantity: Number(form.quantity),
      unitPrice: Number(form.unitPrice),
      supplyDate: form.supplyDate || null,
      supplierName: form.supplierName.trim() || null,
      note: form.note.trim() || null,
    };

    try {
      const saved = editing
        ? await updateSupply(initialData.id, payload, { baseRecord: initialData })
        : await createSupply(payload);
      onSuccess?.(saved);
    } catch (error) {
      console.error("Supply submit failed", error);
    } finally {
      setSaving(false);
    }
  }

  const footer = (
    <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500 dark:text-slate-300">
        {step === 0
          ? "Step 1 of 2: purchase details"
          : "Step 2 of 2: supplier and purchase date"}
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

        {step < SUPPLY_STEPS.length - 1 ? (
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
            {saving ? "Saving..." : editing ? "Save changes" : "Save purchase"}
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
      icon={Truck}
      title={editing ? "Edit purchase" : "Record purchase"}
      description="Keep supply records simple. Start with what you bought, then add who supplied it and when."
      editing={editing}
      steps={SUPPLY_STEPS}
      currentStep={step}
      maxWidth="max-w-2xl"
      footer={footer}
    >
      {step === 0 ? (
        <>
          <GuidedFormSection
            title="Purchase details"
            description="These are the main details for the item that was bought."
          >
            <div className="space-y-4">
              <div>
<<<<<<< HEAD
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <Package className={GUIDED_FORM_ICON_CLASS} />
=======
                <label className="mb-1 flex items-center gap-2 text-xs">
                  <Package className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
                  Item <Required />
                </label>
                <input
                  value={form.itemName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, itemName: event.target.value }))
                  }
<<<<<<< HEAD
                  className={GUIDED_FORM_FIELD_CLASS}
=======
                  className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
                  placeholder="e.g. Layer feed grower"
                  autoFocus
                  required
                />
              </div>

              <div>
<<<<<<< HEAD
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
                  {SUPPLY_CATEGORY_OPTIONS.map((category) => (
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
=======
                <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-300">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {SUPPLY_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, category }))}
                      className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                        form.category === category
                          ? "border-accent-primary bg-accent-primary text-white"
                          : "border-white/20 bg-white/50 text-slate-700 dark:bg-white/10 dark:text-slate-200"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
>>>>>>> 0babf4d (Update frontend application)
                </div>

<<<<<<< HEAD
                <div>
                  <label className={GUIDED_FORM_LABEL_CLASS}>
                    <Wallet className={GUIDED_FORM_ICON_CLASS} />
=======
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 flex items-center gap-2 text-xs">
                    <Package className="h-4 w-4 text-slate-500" />
                    Quantity <Required />
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, quantity: event.target.value }))
                    }
                    className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-2 text-xs">
                    <Wallet className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
                    Unit price (Naira) <Required />
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatCurrencyInput(form.unitPrice)}
                    onChange={(event) => {
<<<<<<< HEAD
                      const raw = sanitizeCurrencyInput(event.target.value);
=======
                      const raw = parseCurrencyInput(event.target.value);
                      if (!/^\d*$/.test(raw)) return;
>>>>>>> 0babf4d (Update frontend application)
                      setForm((current) => ({ ...current, unitPrice: raw }));
                    }}
                    onBlur={() => {
                      if (form.unitPrice === "") return;
                      setForm((current) => ({
                        ...current,
<<<<<<< HEAD
                        unitPrice: normalizeCurrencyOnBlur(current.unitPrice),
                      }));
                    }}
                    className={GUIDED_FORM_FIELD_CLASS}
=======
                        unitPrice: String(Number(current.unitPrice)),
                      }));
                    }}
                    className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
                    placeholder="0"
                    required
                  />
                </div>
              </div>
            </div>
          </GuidedFormSection>

          <GuidedFormSection
            title="Quick total"
            description="This helps you confirm the spending before you save."
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
            title="Supplier and date"
            description="Add where it came from and when the purchase happened."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
<<<<<<< HEAD
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <User className={GUIDED_FORM_ICON_CLASS} />
=======
                <label className="mb-1 flex items-center gap-2 text-xs">
                  <User className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
                  Supplier
                </label>
                <input
                  value={form.supplierName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, supplierName: event.target.value }))
                  }
<<<<<<< HEAD
                  className={GUIDED_FORM_FIELD_CLASS}
=======
                  className="w-full rounded-lg bg-white/80 p-3 outline-none dark:bg-black/60"
>>>>>>> 0babf4d (Update frontend application)
                  placeholder="Supplier or shop name"
                />
              </div>

              <div>
<<<<<<< HEAD
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <CalendarDays className={GUIDED_FORM_ICON_CLASS} />
=======
                <label className="mb-1 flex items-center gap-2 text-xs">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
>>>>>>> 0babf4d (Update frontend application)
                  Purchase date <Required />
                </label>
                <input
                  type="date"
                  value={form.supplyDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, supplyDate: event.target.value }))
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
            title="Optional note"
            description="Use this only for details you may want to remember later."
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
              placeholder="Optional details about the purchase"
            />
          </GuidedFormSection>
        </>
      )}
    </GuidedFormModal>
  );
}
