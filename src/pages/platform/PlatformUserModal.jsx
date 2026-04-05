import React from "react";
import { createPortal } from "react-dom";
import { MailPlus, ShieldCheck, X } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";

const INITIAL_FORM = {
  username: "",
  email: "",
};

const INPUT_CLASS =
  "mt-1 h-11 w-full rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 text-sm text-[var(--atlas-text-strong)] outline-none transition placeholder:text-[var(--atlas-muted-soft)] focus:border-[color:var(--atlas-border-strong)]";

export default function PlatformUserModal({ open, loading = false, onClose, onSubmit }) {
  const [form, setForm] = React.useState(INITIAL_FORM);

  React.useEffect(() => {
    if (!open) return;
    setForm(INITIAL_FORM);
  }, [open]);

  React.useEffect(() => {
    if (!open || loading) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [loading, onClose, open]);

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
        username: form.username.trim(),
        email: form.email.trim(),
      });
    },
    [form, onSubmit],
  );

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="atlas-theme fixed inset-0 z-[140] overflow-y-auto"
      role="presentation"
    >
      <div
        className="atlas-modal-backdrop absolute inset-0"
        onClick={loading ? undefined : onClose}
      />
      <div className="relative flex min-h-full items-start justify-center px-4 py-6 md:items-center md:px-6 md:py-8">
        <Card
          className="atlas-modal-card my-auto w-full max-w-2xl rounded-[1.6rem] p-5 md:p-6"
          interactive
          glowRail={false}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="platform-user-modal-title"
          aria-describedby="platform-user-modal-description"
        >
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="max-w-xl">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--atlas-muted)]">
                Internal Access
              </div>
              <h2
                id="platform-user-modal-title"
                className="mt-1 font-header text-2xl font-semibold text-[var(--atlas-text-strong)]"
              >
                Invite platform user
              </h2>
              <p
                id="platform-user-modal-description"
                className="mt-2 text-sm leading-6 text-[var(--atlas-muted)]"
              >
                Send a controlled setup link for the ROOTS team.
              </p>
            </div>

            <Button variant="ghost" onClick={onClose} disabled={loading}>
              <X size={15} />
              Close
            </Button>
          </div>

          <div className="relative z-10 mt-4 rounded-[1.1rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/78 px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/40 bg-emerald-50/80 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200">
                <ShieldCheck size={16} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                  Public signup does not unlock platform access
                </div>
                <div className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">
                  Invite the operator here, then let them set their own password from the setup
                  link.
                </div>
              </div>
            </div>
          </div>

          <form className="relative z-10 mt-5 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-[var(--atlas-text)]">
                Username
                <input
                  type="text"
                  value={form.username}
                  onChange={(event) => updateField("username", event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="e.g. roots.ops"
                  autoComplete="username"
                  required
                />
              </label>

              <label className="block text-sm text-[var(--atlas-text)]">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="team@roots.africa"
                  autoComplete="email"
                  required
                />
              </label>
            </div>

            <div className="rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/78 px-4 py-3">
              <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                Password stays with the teammate
              </div>
              <div className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">
                The invite does not create a live account yet. It only opens a secure setup page
                where the teammate chooses their own password.
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[color:var(--atlas-border)] pt-4">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                <MailPlus size={14} />
                {loading ? "Sending..." : "Send invite"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>,
    document.body,
  );
}
