import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarClock, ClipboardList, Flag, Save, X } from "lucide-react";
import { TASK_TYPE_OPTIONS } from "../constants/formOptions";
import {
  GUIDED_FORM_FIELD_CLASS,
  GUIDED_FORM_LABEL_CLASS,
  GUIDED_FORM_PRIMARY_SUBMIT_BUTTON_CLASS,
  GUIDED_FORM_SECONDARY_BUTTON_CLASS,
  GuidedFormSection,
} from "./GuidedFormModal";
import {
  nowDateTimeLocalValue,
  toDateTimeLocalValue,
} from "../utils/formInputs";

const FIELD_CLASS = GUIDED_FORM_FIELD_CLASS;
const LABEL_CLASS = GUIDED_FORM_LABEL_CLASS;

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
    <div className="fixed inset-0 z-[99999] overflow-y-auto px-4 py-6 sm:py-8">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      <form
        ref={modalRef}
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className={`relative mx-auto flex min-h-full w-full max-w-2xl items-center justify-center rounded-2xl p-1 transition-all duration-200 ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <div className="w-full rounded-2xl bg-darkCard/60 p-px shadow-neo">
          <div className="max-h-[92vh] overflow-y-auto rounded-2xl border border-white/20 bg-white/80 p-5 text-slate-900 backdrop-blur-xl dark:bg-black/70 dark:text-slate-100 sm:p-6">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        id="task-modal-title"
                        className="text-lg font-semibold text-slate-900 dark:text-slate-50"
                      >
                        {initial.id ? "Edit task" : "Add task"}
                      </h3>
                      <span className="rounded-full border border-white/20 bg-white/50 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {initial.id ? "Editing" : "New"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      Keep this short and clear so the next action is easy to understand.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-200 sm:inline-flex">
                    <span className={`h-2.5 w-2.5 rounded-full ${priorityMeta.dot}`} />
                    {priorityMeta.text} priority
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close task modal"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white/85 text-slate-600 shadow-[0_10px_22px_rgba(15,23,42,0.08)] transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:shadow-none dark:hover:bg-white/15"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.08fr,0.92fr]">
                <GuidedFormSection
                  title="Task details"
                  description="Capture the action clearly so anyone can pick it up quickly."
                >
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
                        <p className="mt-2 text-sm text-rose-600 dark:text-rose-200">
                          {errors.title}
                        </p>
                      ) : null}
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
                </GuidedFormSection>

                <GuidedFormSection
                  title="Schedule"
                  description="Set the task type, urgency, and due time."
                >
                  <div className="space-y-4">
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
                  </div>
                </GuidedFormSection>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Tip: press{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Ctrl/Cmd + Enter
                  </span>{" "}
                  to save quickly.
                </p>

                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={onClose}
                    className={GUIDED_FORM_SECONDARY_BUTTON_CLASS}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={GUIDED_FORM_PRIMARY_SUBMIT_BUTTON_CLASS}
                  >
                    <Save className="h-4 w-4" />
                    {initial.id ? "Save changes" : "Save task"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  );
}
