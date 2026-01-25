import React, { useEffect, useRef, useState } from "react";


export default function TaskModal({ open, onClose, onSave, initial = {} }) {
  // State for form fields and UI behavior
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("OTHER");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState(3);
  const [errors, setErrors] = useState({});
  const [mounted, setMounted] = useState(false); // for entrance animation

  const modalRef = useRef(null); // ref to modal container for focus management
  const firstInputRef = useRef(null); // ref to first input for auto-focus

  // Effect: initialize form fields and animate modal on open
  useEffect(() => {
    if (open) {
      setTitle(initial.title ?? "");
      setDescription(initial.description ?? "");
      setType(initial.type ?? "OTHER");
      setDueDate(initial.dueDate ? initial.dueDate.substring(0, 16) : "");
      setPriority(initial.priority ?? 3);
      setErrors({});

      requestAnimationFrame(() => setMounted(true));
      setTimeout(() => firstInputRef.current?.focus(), 120); // focus first input
    } else {
      setMounted(false);
    }
  }, [open, initial]);

  // Effect: handle keyboard shortcuts (Escape to close, Ctrl/Cmd+Enter to save)
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        handleSubmit(new Event("submit", { cancelable: true }));
      }
    }

    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Effect: trap focus within modal for accessibility
  useEffect(() => {
    if (!open) return;
    const focusablesSelector =
      'a[href], input, textarea, select, button, [tabindex]:not([tabindex="-1"])';
    const node = modalRef.current;
    if (!node) return;
    const focusables = Array.from(node.querySelectorAll(focusablesSelector));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    function onTab(e) {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    node.addEventListener("keydown", onTab);
    return () => node.removeEventListener("keydown", onTab);
  }, [open]);

  // Validate form inputs
  const validate = () => {
    const e = {};
    if (!title || title.trim().length < 3) {
      e.title = "Title is required (min 3 chars).";
      setTimeout(() => setErrors({}), 3000); // error disappears after 3.5s
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Handle form submission
  const handleSubmit = (ev) => {
    if (ev && typeof ev.preventDefault === "function") ev.preventDefault();
    if (!validate()) return;
    const payload = {
      title: title.trim(),
      description: description?.trim() || null,
      type,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    };
    onSave(payload);
  };

  if (!open) return null;

  // Mapping task types to color styles
  const typeColors = {
    FEED: "bg-amber-100 text-amber-800",
    COLLECT: "bg-emerald-100 text-emerald-800",
    HEALTH: "bg-rose-100 text-rose-800",
    MAINTENANCE: "bg-sky-100 text-sky-800",
    VACCINATION: "bg-violet-100 text-violet-800",
    OTHER: "bg-slate-100 text-slate-800",
  };

  // Mapping priority levels to label and color dot
  const priorityLabel = {
    1: { text: "High", dot: "bg-status-danger" },
    2: { text: "Normal", dot: "bg-status-warning" },
    3: { text: "Low", dot: "bg-status-success" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop with blur effect */}
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />

      {/* Decorative blurred gradient orbs */}
      <div className="pointer-events-none absolute -bottom-16 -right-8 w-56 h-56 rounded-full bg-gradient-to-br from-purple-400/20 to-indigo-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -top-20 -left-12 w-44 h-44 rounded-full bg-gradient-to-tr from-emerald-300/10 to-cyan-400/10 blur-2xl" />

      {/* Modal container with entrance animation */}
      <form
        ref={modalRef}
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className={`relative z-10 w-full max-w-xl rounded-2xl p-1 transition-all duration-300 ease-out transform ${
          mounted
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2"
        }`}
      >
        <div className="rounded-2xl p-px bg-darkCard/50 shadow-lg">
          <div className="bg-white/55 dark:bg-black/55 backdrop-blur-md rounded-2xl p-6 shadow-inner border border-white/20">
            {/* Header: icon, title, description, priority and close button */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/30 dark:bg-black/30 border border-white/10">
                  {/* Decorative SVG icon */}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path
                      d="M4 20c6-6 8-10 16-12"
                      stroke="#6D28D9"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 7c3 0 5 2 6 5"
                      stroke="#06B6D4"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <h3
                    id="task-modal-title"
                    className="text-lg font-semibold leading-tight"
                  >
                    {initial.id ? "Edit Task" : "Add Task"}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Add a task to stay on track.
                  </p>
                </div>
              </div>

              {/* Priority display and close button */}
              <div className="flex items-center gap-2">
                <div className="text-xs flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${priorityLabel[priority].dot}`}
                  />
                  <span>{priorityLabel[priority].text}</span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="p-2 rounded-md hover:bg-white/30 dark:hover:bg-black/30"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Form fields: title, description, type, priority, due date */}
            <div className="mt-4 grid gap-3">
              {/* Title input */}
              <div>
                <label className="text-xs block mb-1">Title</label>
                <input
                  ref={firstInputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full p-3 rounded-lg bg-white/80 focus:border-accent-primary dark:bg-black/60 border transition-shadow outline-none ${
                    errors.title
                      ? "border-rose-400 shadow-[0_0_0_3px_rgba(255,200,210,0.06)]"
                      : "border-transparent"
                  } focus:shadow-[0_8px_30px_rgba(99,102,241,0.08)']`}
                  placeholder="e.g. Feed Layers - Morning"
                />
                {errors.title && (
                  <div className="text-status-danger text-xs mt-1">
                    {errors.title}
                  </div>
                )}
              </div>

              {/* Description textarea */}
              <div>
                <label className="text-xs block mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/80 focus:border-accent-primary dark:bg-black/60 border border-transparent h-24 resize-none outline-none focus:shadow-[0_8px_30px_rgba(6,182,212,0.06)]"
                  placeholder="Optional notes..."
                />
              </div>

              {/* Type and Priority */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs block mb-1">Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      "FEED",
                      "COLLECT",
                      "HEALTH",
                      "MAINTENANCE",
                      "VACCINATION",
                      "OTHER",
                    ].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`text-xs px-3 py-2 rounded-full border ${
                          type === t
                            ? "ring-2 ring-offset-4 ring-offset-purple-50"
                            : "border-transparent"
                        } ${typeColors[t]} bg-opacity-70`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-2 md:mt-0">
                  <label className="text-xs block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full p-3 rounded-lg focus:border-accent-primary bg-white/80 dark:bg-black/60"
                  >
                    <option value={1}>1 — High</option>
                    <option value={2}>2 — Normal</option>
                    <option value={3}>3 — Low</option>
                  </select>
                </div>
              </div>

              {/* Due date input with calendar pseudo-icon */}
              <div>
                <label className="text-xs block mb-1">Due (optional)</label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white/80 dark:bg-black/60 outline-none appearance-none"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400 dark:text-slate-300">
                    📅
                  </div>
                </div>
              </div>
            </div>

            {/* Footer: tip and action buttons */}
            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-300">
                Tip: press <span className="font-medium">Ctrl/Cmd + Enter</span>{" "}
                to save quickly
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-md bg-transparent border border-white/20 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-md text-sm font-medium bg-accent-primary text-white shadow-md hover:scale-[1.02] transition-transform"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
