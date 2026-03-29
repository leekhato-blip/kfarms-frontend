import React from "react";
import { Check, Droplets, Feather } from "lucide-react";
import {
  FARM_MODULE_OPTIONS,
  FARM_MODULES,
  normalizeFarmModuleId,
  normalizeEnabledModules,
} from "../tenant/tenantModules";

const MODULE_ICONS = {
  [FARM_MODULES.POULTRY]: Feather,
  [FARM_MODULES.FISH_FARMING]: Droplets,
};

export default function FarmModuleSelector({
  value = [],
  onChange,
  disabled = false,
  helperText = "Choose one or both. You can start focused and still grow later.",
  compact = false,
}) {
  const selectedModules = Array.isArray(value)
    ? value.map(normalizeFarmModuleId).filter(Boolean)
    : normalizeEnabledModules(value);

  function toggleModule(moduleId) {
    if (disabled) return;

    const nextSelection = selectedModules.includes(moduleId)
      ? selectedModules.filter((item) => item !== moduleId)
      : [...selectedModules, moduleId];

    onChange?.(nextSelection);
  }

  return (
    <div className={compact ? "space-y-2.5" : "space-y-3"}>
      <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
        {FARM_MODULE_OPTIONS.map((module) => {
          const Icon = MODULE_ICONS[module.id] || Feather;
          const selected = selectedModules.includes(module.id);

          return (
            <button
              key={module.id}
              type="button"
              disabled={disabled}
              onClick={() => toggleModule(module.id)}
              className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition sm:p-4 ${
                selected
                  ? "border-accent-primary/40 bg-accent-primary/10 shadow-soft"
                  : "border-slate-200/80 bg-white/70 hover:border-accent-primary/25 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
              aria-pressed={selected}
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80 ${
                  module.accentClassName || ""
                }`}
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/30 bg-white/70 text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-100 sm:h-11 sm:w-11">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 sm:text-base">
                      {module.label}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                      {module.description}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border shadow-sm sm:h-8 sm:w-8 ${
                    selected
                      ? "border-accent-primary bg-accent-primary text-white"
                      : "border-slate-300/80 bg-white/80 text-transparent dark:border-white/15 dark:bg-white/5"
                  }`}
                >
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={3} />
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
    </div>
  );
}
