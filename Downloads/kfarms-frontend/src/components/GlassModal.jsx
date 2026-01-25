import React, { useState, useEffect } from "react";

export default function GlassModal({ isOpen, onClose, onSave, sale }) {
  const [form, setForm] = useState({
    itemName: "",
    category: "LAYER",
    quantity: "",
    unitPrice: "",
    buyer: "",
    salesDate: "",
  });

  useEffect(() => {
    if (sale) {
      setForm({
        itemName: sale.itemName,
        category: sale.category,
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        buyer: sale.buyer,
        salesDate: sale.salesDate,
      });
    }
  }, [sale]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      quantity: Number(form.quantity),
      unitPrice: Number(form.unitPrice),
      totalPrice: Number(form.quantity) * Number(form.unitPrice),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-darkCard backdrop-blur-sm">
      <div className="bg-white/10 dark:bg-black/40 backdrop-blur-md rounded-xl p-6 w-full max-w-md shadow-neo">
        <h2 className="text-xl font-semibold mb-4">
          {sale ? "Edit Sale" : "New Sale"}
        </h2>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <input
            name="itemName"
            placeholder="Item Name"
            value={form.itemName}
            onChange={handleChange}
            className="px-3 py-2 rounded-md bg-lightCard dark:bg-darkCard text-lightText dark:text-darkText border border-gray-300 dark:border-gray-600"
            required
          />
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="px-3 py-2 rounded-md bg-lightCard dark:bg-darkCard text-lightText dark:text-darkText border border-gray-300 dark:border-gray-600"
          >
            <option value="LAYER">LAYER</option>
            <option value="FISH">FISH</option>
            <option value="LIVESTOCK">LIVESTOCK</option>
            <option value="OTHER">OTHER</option>
          </select>
          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            value={form.quantity}
            onChange={handleChange}
            className="px-3 py-2 rounded-md bg-lightCard dark:bg-darkCard text-lightText dark:text-darkText border border-gray-300 dark:border-gray-600"
            required
          />
          <input
            type="number"
            name="unitPrice"
            placeholder="Unit Price"
            value={form.unitPrice}
            onChange={handleChange}
            className="px-3 py-2 rounded-md bg-lightCard dark:bg-darkCard text-lightText dark:text-darkText border border-gray-300 dark:border-gray-600"
            required
          />
          <input
            name="buyer"
            placeholder="Buyer"
            value={form.buyer}
            onChange={handleChange}
            className="px-3 py-2 rounded-md bg-lightCard dark:bg-darkCard text-lightText dark:text-darkText border border-gray-300 dark:border-gray-600"
            required
          />
          <input
            type="date"
            name="salesDate"
            value={form.salesDate}
            onChange={handleChange}
            className="px-3 py-2 rounded-md bg-lightCard dark:bg-darkCard text-lightText dark:text-darkText border border-gray-300 dark:border-gray-600"
            required
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-accent-primary text-white hover:bg-accent-dark transition"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
