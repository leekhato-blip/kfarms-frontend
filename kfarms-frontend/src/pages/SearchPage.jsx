import React from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import GlassToast from "../components/GlassToast";
import DashboardLayout from "../layouts/DashboardLayout";
import { search as searchApi } from "../services/searchService";

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";
  const [query, setQuery] = React.useState(queryFromUrl);
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [toast, setToast] = React.useState({ message: "", type: "info" });

  React.useEffect(() => {
    setQuery(queryFromUrl);
  }, [queryFromUrl]);

  React.useEffect(() => {
    const trimmed = queryFromUrl.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    searchApi(trimmed, 50)
      .then((data) => {
        if (!cancelled) {
          setResults(Array.isArray(data) ? data : []);
        }
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        console.error("Search request failed", error);
        setResults([]);
        setToast({ message: "Search is unavailable right now.", type: "error" });
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [queryFromUrl]);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = query.trim();
    const nextParams = new URLSearchParams(searchParams);
    if (trimmed) {
      nextParams.set("q", trimmed);
    } else {
      nextParams.delete("q");
    }
    setSearchParams(nextParams, { replace: true });
  }

  function handleResultSelect(result) {
    if (result?.target) {
      navigate(result.target);
    }
  }

  const trimmedQuery = queryFromUrl.trim();
  const showStarter = trimmedQuery.length < 2;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-neo backdrop-blur-xl dark:border-white/10 dark:bg-darkCard/80 dark:shadow-dark sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Global Search
          </p>
          <h2 className="mt-2 text-3xl font-semibold font-header text-slate-900 dark:text-slate-50">
            Find records fast
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Search across sales, supplies, feeds, poultry, fish, inventory, and dashboard pages from one place.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search farm records..."
                className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-accent-primary/50 focus:bg-white dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-950"
              />
            </label>
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-accent-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Search
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-neo backdrop-blur-xl dark:border-white/10 dark:bg-darkCard/80 dark:shadow-dark sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Results
          </p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-50">
            {showStarter
              ? "Start with at least 2 characters"
              : loading
                ? `Searching for “${trimmedQuery}”`
                : `${results.length} match${results.length === 1 ? "" : "es"} for “${trimmedQuery}”`}
          </h3>

          {showStarter ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/80 px-5 py-8 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300">
              Type a crop, batch, pond, product, or page name to see matching records.
            </div>
          ) : loading ? (
            <div className="mt-5 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-5 py-8 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300">
              Searching across your farm data...
            </div>
          ) : results.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/80 px-5 py-8 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300">
              Nothing matches that search yet. Try a broader word or a different record name.
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {results.map((result) => (
                <button
                  key={`${result.url || result.target || "target"}:${result.id || result.title}`}
                  type="button"
                  onClick={() => handleResultSelect(result)}
                  className="group flex w-full items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-accent-primary/35 hover:bg-white dark:border-white/10 dark:bg-slate-950/30 dark:hover:bg-slate-950/60"
                >
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-slate-900 dark:text-slate-50">
                      {result.title || "Untitled result"}
                    </div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {result.subtitle || "Farm record"}
                    </div>
                    <div className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      {result.target}
                    </div>
                  </div>
                  <ArrowUpRight className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400 transition group-hover:text-accent-primary" />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <GlassToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />
    </DashboardLayout>
  );
}
