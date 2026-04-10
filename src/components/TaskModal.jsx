import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarClock, ClipboardList, Flag, X } from "lucide-react";
import { TASK_TYPE_OPTIONS } from "../constants/formOptions";
import {
  nowDateTimeLocalValue,
  toDateTimeLocalValue,
} from "../utils/formInputs";

const FIELD_CLASS =
  "w-full rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100";
const LABEL_CLASS =
  "mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400";

const PRIORITY_META = {
  1: { text: "High", dot: "bg-rose-500" },
  2: { text: "Normal", dot: "bg-amber-500" },
  3: { text: "Low", dot: "bg-emerald-500" },
};

export default function TaskModal({ open, onClose, onSave, initial = {} }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("OTHER");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState(3);
  const [errors, setErrors] = useState({});
  const [mounted, setMounted] = useState(false);

  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setMounted(false);
      return;
    }

    setTitle(initial.title ?? "");
    setDescription(initial.description ?? "");
    setType(initial.type ?? "OTHER");
    setDueDate(toDateTimeLocalValue(initial.dueDate, nowDateTimeLocalValue()));
    setPriority(Number(initial.priority) || 3);
    setErrors({});

    const frameId = window.requestAnimationFrame(() => setMounted(true));
    const timerId = window.setTimeout(() => firstInputRef.current?.focus(), 120);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timerId);
    };
  }, [initial, open]);

  const validate = useCallback(() => {
    const nextErrors = {};

    if (!title || title.trim().length < 3) {
      nextErrors.title = "Title is required and should be at least 3 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [title]);

  const handleSubmit = useCallback(
    (event) => {
      if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
      }

      if (!validate()) {
        return;
      }

      onSave?.({
        title: title.trim(),
        description: description?.trim() || null,
        type,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });
    },
    [description, dueDate, onSave, priority, title, type, validate],
  );

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
        return;
      }

      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        handleSubmit(event);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSubmit, onClose, open]);

  useEffect(() => {
    if (!open) return undefined;

    const node = modalRef.current;
    if (!node) return undefined;

    const selector =
      'a[href], input, textarea, select, button, [tabindex]:not([tabindex="-1"])';

    const handleTab = (event) => {
      if (event.key !== "Tab") return;
      const focusables = Array.from(node.querySelectorAll(selector)).filter(
        (element) => !element.hasAttribute("disabled"),
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    node.addEventListener("keydown", handleTab);
    return () => node.removeEventListener("keydown", handleTab);
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const priorityMeta = PRIORITY_META[priority] || PRIORITY_META[3];

  return createPortal(
    <div className="fixed inset-0 z-[12000] flex items-end justify-center px-3 py-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:px-4 sm:py-6">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <form
        ref={modalRef}
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className={`relative flex w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] shadow-[0_28px_60px_rgba(15,23,42,0.2)] transition-all duration-200 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(8,15,30,0.98),rgba(7,18,33,0.96))] dark:shadow-[0_28px_72px_rgba(2,6,23,0.46)] ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        } max-h-[min(92dvh,48rem)]`}
      >
        <div className="border-b border-slate-200/80 px-4 pb-4 pt-4 dark:border-white/10 sm:px-6 sm:pb-5 sm:pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-accent-primary/15 bg-accent-primary/10 text-accent-primary dark:border-accent-primary/25 dark:bg-accent-primary/12">
                <ClipboardList className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3
                  id="task-modal-title"
                  className="text-lg font-semibold text-slate-900 dark:text-slate-50 sm:text-xl"
                >
                  {initial.id ? "Edit task" : "Add task"}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Keep this short and clear so the next action is easy to understand.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 sm:inline-flex">
                <span className={`h-2.5 w-2.5 rounded-full ${priorityMeta.dot}`} />
                {priorityMeta.text} priority
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close task modal"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-600 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.08] dark:text-slate-100 dark:hover:bg-white/[0.12]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="space-y-4">
            <div>
              <label htmlFor="task-title" className={LABEL_CLASS}>
                Task title
              </label>
              <input
                id="task-title"
                ref={firstInputRef}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={`${FIELD_CLASS} ${
                  errors.title
                    ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200/40 dark:border-rose-400/40"
                    : ""
                }`}
                placeholder="e.g. Feed layers in the morning"
              />
              {errors.title ? (
                <p className="mt-2 text-sm text-rose-600 dark:text-rose-200">{errors.title}</p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="task-type" className={LABEL_CLASS}>
                  Task category
                </label>
                <select
                  id="task-type"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className={`${FIELD_CLASS} [color-scheme:light] dark:[color-scheme:dark]`}
                >
                  {TASK_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="task-priority" className={LABEL_CLASS}>
                  <span className="inline-flex items-center gap-2">
                    <Flag className="h-3.5 w-3.5" />
                    Priority
                  </span>
                </label>
                <select
                  id="task-priority"
                  value={priority}
                  onChange={(event) => setPriority(Number(event.target.value))}
                  className={`${FIELD_CLASS} [color-scheme:light] dark:[color-scheme:dark]`}
                >
                  <option value={1}>High</option>
                  <option value={2}>Normal</option>
                  <option value={3}>Low</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="task-due-date" className={LABEL_CLASS}>
                <span className="inline-flex items-center gap-2">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Due date and time
                </span>
              </label>
              <input
                id="task-due-date"
                type="datetime-local"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className={`${FIELD_CLASS} [color-scheme:light] dark:[color-scheme:dark]`}
              />
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Defaulted to now so you can save quickly, then adjust if this task is due later.
              </p>
            </div>

            <div>
              <label htmlFor="task-description" className={LABEL_CLASS}>
                Notes
              </label>
              <textarea
                id="task-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                className={`${FIELD_CLASS} min-h-[8.5rem] resize-y`}
                placeholder="Optional details, instructions, or reminder notes"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200/80 bg-slate-50/96 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#08111e]/94 sm:px-6 sm:pb-5 sm:pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              Tip: press <span className="font-semibold text-slate-700 dark:text-slate-200">Ctrl/Cmd + Enter</span> to save quickly.
            </p>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:bg-white/[0.1]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-accent-primary/30 bg-accent-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-105"
              >
                {initial.id ? "Save changes" : "Save task"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  );
}
