import React from "react";

export default function FloatingInput({
  label,
  type = "text",
  value,
  onChange,
  required = false,
  autoComplete,
  className = "",
}) {
  const hasValue = value && value.length > 0;

  const isPassword = type === "password";
  const [show, setShow] = React.useState(false);

  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className="relative w-full mt-5">
      <input
        type={inputType}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        className={`peer w-full rounded-md border border-slate-300 bg-white/85 px-3 py-3 pr-10 text-slate-800 outline-none transition focus:border-accent-primary dark:border-gray-600 dark:bg-darkbg/50 dark:text-darkText ${className}`}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-accent-primary dark:text-darkText"
        >
          {show ? (
            /* Open eye */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            /* Closed eye */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 3l18 18M10.584 10.587A3 3 0 0113.415 13.42M7.11 7.108C5.067 8.508 3.62 10.39 2.458 12c1.274 4.057 5.064 7 9.542 7 1.63 0 3.183-.33 4.584-.926M17.94 17.94C19.725 16.734 21.06 14.94 21.542 12c-.853-2.715-2.721-4.92-5.038-6.23"
              />
            </svg>
          )}
        </button>
      )}
      <label
        className={`
          absolute left-3 pointer-events-none
          text-slate-500 transition-all duration-200 dark:text-slate-400
          ${hasValue ? "-top-3 bg-white px-1 text-xs dark:bg-[#111827]" : "top-3 text-sm"}
          peer-focus:-top-3 peer-focus:text-xs peer-focus:px-1
          peer-focus:bg-white dark:peer-focus:bg-[#111827]
        `}
      >
        {label}
      </label>
    </div>
  );
}
