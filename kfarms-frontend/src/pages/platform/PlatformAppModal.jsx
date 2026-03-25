import React from "react";
import { Plus, Sparkles, X } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";

const INITIAL_FORM = {
  name: "",
  category: "",
  lifecycle: "PLANNED",
  headline: "",
  description: "",
  consolePath: "",
  workspacePath: "",
  capabilities: "",
};

const INPUT_CLASS =
  "mt-1 h-11 w-full rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 text-sm text-[var(--atlas-text-strong)] outline-none transition placeholder:text-[var(--atlas-muted-soft)] focus:border-[color:var(--atlas-border-strong)]";

const TEXTAREA_CLASS =
  "mt-1 min-h-[108px] w-full rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 py-3 text-sm text-[var(--atlas-text-strong)] outline-none transition placeholder:text-[var(--atlas-muted-soft)] focus:border-[color:var(--atlas-border-strong)]";

export default function PlatformAppModal({ open, onClose, onSubmit }) {
  const [form, setForm] = React.useState(INITIAL_FORM);

  React.useEffect(() => {
    if (!open) return;
    setForm(INITIAL_FORM);
  }, [open]);

  React.useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const updateField = React.useCallback((key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }, []);

  const handleSubmit = React.useCallback(
    (event) => {
      event.preventDefault();
      onSubmit?.({
        ...form,
        lifecycle: "PLANNED",
      });
    },
    [form, onSubmit],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] overflow-y-auto bg-[color:var(--atlas-overlay)] px-4 py-6 md:px-6 md:py-8"
      onClick={onClose}
      role="presentation"
    >
      <div className="flex min-h-full items-start justify-center">
        <Card
          className="atlas-stage-card my-auto w-full max-w-3xl p-5 md:p-6"
          interactive
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--atlas-muted)]">
                New App Plan
              </div>
              <h2 className="mt-1 font-header text-2xl font-semibold text-[var(--atlas-text-strong)]">
                Create a planned app
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--atlas-muted)]">
                Add the next app to ROOTS before it goes live.
              </p>
            </div>

            <Button variant="ghost" onClick={onClose}>
              <X size={15} />
              Close
            </Button>
          </div>

          <div className="relative z-10 mt-4 rounded-[1.1rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/78 px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-violet-300/40 bg-violet-50/80 text-violet-700 dark:border-violet-400/30 dark:bg-violet-500/15 dark:text-violet-200">
                <Sparkles size={16} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                  This app will be saved as planned
                </div>
                <div className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">
                  Promote it to pilot or live later when the product and backend are ready.
                </div>
              </div>
            </div>
          </div>

          <form className="relative z-10 mt-5 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-[var(--atlas-text)]">
                App name
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="e.g. HatchFlow"
                  required
                />
              </label>

              <label className="block text-sm text-[var(--atlas-text)]">
                Category
                <input
                  type="text"
                  value={form.category}
                  onChange={(event) => updateField("category", event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="e.g. Aquaculture"
                  required
                />
              </label>
            </div>

            <label className="block text-sm text-[var(--atlas-text)]">
              Headline
              <input
                type="text"
                value={form.headline}
                onChange={(event) => updateField("headline", event.target.value)}
                className={INPUT_CLASS}
                placeholder="A short line that explains the app clearly."
              />
            </label>

            <label className="block text-sm text-[var(--atlas-text)]">
              Description
              <textarea
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                className={TEXTAREA_CLASS}
                placeholder="What does this app do?"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-[var(--atlas-text)]">
                Console route
                <input
                  type="text"
                  value={form.consolePath}
                  onChange={(event) => updateField("consolePath", event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="/platform/apps"
                />
              </label>

              <label className="block text-sm text-[var(--atlas-text)]">
                Workspace route
                <input
                  type="text"
                  value={form.workspacePath}
                  onChange={(event) => updateField("workspacePath", event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="/dashboard"
                />
              </label>
            </div>

            <label className="block text-sm text-[var(--atlas-text)]">
              Capabilities
              <input
                type="text"
                value={form.capabilities}
                onChange={(event) => updateField("capabilities", event.target.value)}
                className={INPUT_CLASS}
                placeholder="Comma-separated, e.g. Forecasting, Tickets, Billing"
              />
            </label>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[color:var(--atlas-border)] pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                <Plus size={14} />
                Save planned app
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
