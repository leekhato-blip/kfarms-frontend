import React from "react";

export default function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-[color:var(--atlas-border)] pb-2">
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-gradient-to-r from-violet-500/30 via-blue-500/30 to-emerald-500/25 text-[var(--atlas-text-strong)]"
                : "text-[var(--atlas-text)] hover:bg-[color:var(--atlas-surface-soft)]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
