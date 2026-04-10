import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Boxes,
  CalendarDays,
  MapPin,
  Save,
  StickyNote,
  Truck,
  Wallet,
} from "lucide-react";
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
import {
  INVENTORY_CATEGORIES,
  INVENTORY_UNITS,
  formatInventoryCategoryLabel,
} from "../constants/inventory";
import { createInventory, updateInventory } from "../services/inventoryService";
import {
  formatCurrencyInput,
  normalizeCurrencyOnBlur,
  sanitizeCurrencyInput,
  todayDateInputValue,
} from "../utils/formInputs";

function todayValue() {
  return todayDateInputValue();
}

function defaultForm() {
  return {
    itemName: "",
    category: "FEED",
    sku: "",
    quantity: "",
    minThreshold: "",
    unit: "units",
    unitCost: "",
    supplierName: "",
    storageLocation: "",
    note: "",
    lastUpdated: todayValue(),
  };
}

function blankToNull(value) {
  const normalized = String(value || "").trim();
  return normalized ? normalized : null;
}

function parseNumber(value, fallback = 0) {
  if (value === "" || value === null || value === undefined) {
    return fallback;
  }
  const numeric = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : fallback;
}

const Required = () => <span className="ml-0.5 text-red-500">*</span>;

const INVENTORY_STEPS = [
  {
    title: "What item is this?",
    description: "Add the item name, category, and unit.",
  },
  {
    title: "How much is in stock?",
    description: "Add quantity, cost, and update date.",
  },
  {
    title: "Where is it kept?",
    description: "Add supplier, location, and any note.",
  },
];

export default function InventoryFormModal({
  open,
  onClose,
  initialData = null,
  onSuccess,
}) {
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [step, setStep] = useState(0);

  const editing = Boolean(initialData?.id);

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setForm({
        itemName: initialData.itemName ?? initialData.name ?? "",
        category: initialData.category ?? "FEED",
        sku: initialData.sku ?? "",
        quantity: initialData.quantity ?? initialData.onHand ?? "",
        minThreshold:
          initialData.minThreshold ?? initialData.threshold ?? initialData.reorderLevel ?? "",
        unit: initialData.unit ?? "units",
        unitCost: initialData.unitCost ?? "",
        supplierName: initialData.supplierName ?? initialData.supplier ?? "",
        storageLocation: initialData.storageLocation ?? initialData.location ?? "",
        note: initialData.note ?? "",
        lastUpdated: initialData.lastUpdated
          ? String(initialData.lastUpdated).slice(0, 10)
          : todayValue(),
      });
    } else {
      setForm(defaultForm());
    }

    setErrorMessage("");
    setStep(0);
  }, [initialData, open]);

  const totalValue = useMemo(
    () => parseNumber(form.quantity, 0) * parseNumber(form.unitCost, 0),
    [form.quantity, form.unitCost],
  );
  const unitOptions = useMemo(() => {
    const normalizedCurrentUnit = String(form.unit || "")
      .trim()
      .toLowerCase();
    if (!normalizedCurrentUnit) {
      return INVENTORY_UNITS;
    }
    const hasCurrentUnit = INVENTORY_UNITS.some(
      (option) => option.value === normalizedCurrentUnit,
    );
    if (hasCurrentUnit) {
      return INVENTORY_UNITS;
    }
    return [
      ...INVENTORY_UNITS,
      {
        value: normalizedCurrentUnit,
        label: `${String(form.unit).trim()} (Current)`,
      },
    ];
  }, [form.unit]);

  const stepOneComplete = Boolean(
    String(form.itemName || "").trim() && form.category && String(form.unit || "").trim(),
  );
  const stepTwoComplete = Boolean(form.lastUpdated);

  async function handleSubmit(event) {
    event.preventDefault();
    if (step < INVENTORY_STEPS.length - 1) {
      const canAdvance =
        (step === 0 && stepOneComplete) ||
        (step === 1 && stepTwoComplete);
      if (!canAdvance) return;
      setStep((current) => Math.min(current + 1, INVENTORY_STEPS.length - 1));
      return;
    }
    if (!stepOneComplete || !stepTwoComplete) return;

    setSaving(true);
    setErrorMessage("");

    const payload = {
      itemName: String(form.itemName || "").trim(),
      category: form.category,
      sku: blankToNull(form.sku),
      quantity: parseNumber(form.quantity, 0),
      minThreshold: parseNumber(form.minThreshold, 0),
      unit: String(form.unit || "").trim() || "units",
      unitCost:
        form.unitCost === "" || form.unitCost === null
          ? null
          : parseNumber(form.unitCost, 0),
      supplierName: blankToNull(form.supplierName),
      storageLocation: blankToNull(form.storageLocation),
      note: blankToNull(form.note),
      lastUpdated: form.lastUpdated || null,
    };

    try {
      const saved = editing
        ? await updateInventory(initialData.id, payload, { baseRecord: initialData })
        : await createInventory(payload);
      onSuccess?.(saved);
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          `Failed to ${editing ? "update" : "save"} inventory item.`,
      );
    } finally {
      setSaving(false);
    }
  }

  const footer = (
    <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500 dark:text-slate-300">
        {step === 0
          ? "Step 1 of 3: item basics"
          : step === 1
            ? "Step 2 of 3: stock and value"
            : "Step 3 of 3: supplier and location"}
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

        {step < INVENTORY_STEPS.length - 1 ? (
          <button
            type="button"
            disabled={
              (step === 0 && !stepOneComplete) ||
              (step === 1 && !stepTwoComplete)
            }
            onClick={(event) =>
              handleGuidedFormAdvanceClick(event, () => {
                setStep((current) => Math.min(current + 1, INVENTORY_STEPS.length - 1));
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
            {saving ? "Saving..." : editing ? "Save changes" : "Save stock item"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <GuidedFormModal
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      saving={saving}
      icon={Archive}
      title={editing ? "Edit stock item" : "Add stock item"}
      description="Keep stock records simple. Start with the item, then add quantity, value, and where it is kept."
      editing={editing}
      steps={INVENTORY_STEPS}
      currentStep={step}
      maxWidth="max-w-3xl"
      errorMessage={errorMessage}
      footer={footer}
    >
      {step === 0 ? (
        <GuidedFormSection
          title="Item basics"
          description="Add the item name, category, and unit."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={GUIDED_FORM_LABEL_CLASS}>
                <Archive className={GUIDED_FORM_ICON_CLASS} />
                Item name <Required />
              </label>
              <input
                value={form.itemName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, itemName: event.target.value }))
                }
                className={GUIDED_FORM_FIELD_CLASS}
                placeholder="e.g. Starter feed 2mm"
                autoFocus
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className={GUIDED_FORM_LABEL_CLASS}>
                <Archive className={GUIDED_FORM_ICON_CLASS} />
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
                {INVENTORY_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {formatInventoryCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={GUIDED_FORM_LABEL_CLASS}>
                <Boxes className={GUIDED_FORM_ICON_CLASS} />
                Unit <Required />
              </label>
              <select
                value={form.unit}
                onChange={(event) =>
                  setForm((current) => ({ ...current, unit: event.target.value }))
                }
                className={GUIDED_FORM_FIELD_CLASS}
                required
              >
                {unitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Pick the closest stock unit so reports stay consistent.
              </p>
            </div>
          </div>
        </GuidedFormSection>
      ) : step === 1 ? (
        <>
          <GuidedFormSection
            title="Stock and value"
            description="Add how much is available, the item cost, and the latest update date."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <Boxes className={GUIDED_FORM_ICON_CLASS} />
                  Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, quantity: event.target.value }))
                  }
                  className={GUIDED_FORM_FIELD_CLASS}
                />
              </div>

              <div>
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <Wallet className={GUIDED_FORM_ICON_CLASS} />
                  Unit cost (Naira)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formatCurrencyInput(form.unitCost, {
                    maximumFractionDigits: 2,
                  })}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      unitCost: sanitizeCurrencyInput(event.target.value, {
                        allowDecimal: true,
                        maxFractionDigits: 2,
                      }),
                    }))
                  }
                  onBlur={() => {
                    if (form.unitCost === "") return;
                    setForm((current) => ({
                      ...current,
                      unitCost: normalizeCurrencyOnBlur(current.unitCost, {
                        allowDecimal: true,
                        maxFractionDigits: 2,
                      }),
                    }));
                  }}
                  className={GUIDED_FORM_FIELD_CLASS}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <CalendarDays className={GUIDED_FORM_ICON_CLASS} />
                  Last updated <Required />
                </label>
                <input
                  type="date"
                  value={form.lastUpdated}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, lastUpdated: event.target.value }))
                  }
                  className={GUIDED_FORM_FIELD_CLASS}
                  required
                />
              </div>
            </div>
          </GuidedFormSection>

          <GuidedFormSection
            title="Quick total"
            description="This updates automatically from quantity and unit cost."
          >
            <div className="flex items-center justify-between rounded-xl bg-white/50 px-4 py-3 dark:bg-white/[0.04]">
              <span className="text-sm text-slate-600 dark:text-slate-300">Estimated stock value</span>
              <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                ₦{totalValue.toLocaleString()}
              </span>
            </div>
          </GuidedFormSection>
        </>
      ) : (
        <>
          <GuidedFormSection
            title="Supplier and storage"
            description="Add where the item came from and where it is kept."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <Truck className={GUIDED_FORM_ICON_CLASS} />
                  Supplier
                </label>
                <input
                  value={form.supplierName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, supplierName: event.target.value }))
                  }
                  className={GUIDED_FORM_FIELD_CLASS}
                  placeholder="Supplier or shop name"
                />
              </div>

              <div>
                <label className={GUIDED_FORM_LABEL_CLASS}>
                  <MapPin className={GUIDED_FORM_ICON_CLASS} />
                  Storage location
                </label>
                <input
                  value={form.storageLocation}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      storageLocation: event.target.value,
                    }))
                  }
                  className={GUIDED_FORM_FIELD_CLASS}
                  placeholder="Store room, shed, or section"
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
              className={`${GUIDED_FORM_FIELD_CLASS} min-h-[96px]`}
              placeholder="Optional note about this stock item"
            />
          </GuidedFormSection>
        </>
      )}
    </GuidedFormModal>
  );
}
