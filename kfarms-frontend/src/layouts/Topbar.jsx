import React from "react";
import { Menu, Search, Sparkles, Command, Plus, Bell, UserCircle2, Moon, Sun, ArrowLeft } from "lucide-react";
import Button from "../components/Button";
import Card from "../components/Card";
import useSmartBackNavigation from "../hooks/useSmartBackNavigation";

export default function Topbar({
  title,
  onOpenMenu,
  onOpenCommandPalette,
  theme = "dark",
  onToggleTheme,
}) {
  const [quickOpen, setQuickOpen] = React.useState(false);
  const isDark = theme === "dark";
  const { goBack, showBackButton } = useSmartBackNavigation({
    fallbackPath: "/platform",
    hiddenPaths: ["/platform"],
  });

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--atlas-border)] bg-[color:var(--atlas-topbar)] px-4 py-3 backdrop-blur-xl md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="rounded-md border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)] p-2 text-[var(--atlas-text)] hover:bg-[color:var(--atlas-surface-hover)] xl:hidden"
            aria-label="Open sidebar"
          >
            <Menu size={17} />
          </button>

          <div className="min-w-0">
            {showBackButton && (
              <button
                type="button"
                onClick={goBack}
                className="mb-2 inline-flex min-h-10 items-center gap-2 rounded-md border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--atlas-text)] transition hover:bg-[color:var(--atlas-surface-hover)]"
                aria-label="Go back to the previous page"
              >
                <ArrowLeft size={15} />
                Back
              </button>
            )}
            <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">{title}</h2>
          </div>
          <span className="hidden rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-200 md:inline-flex">
            Production
          </span>
        </div>

        <div className="flex min-w-[280px] flex-1 items-center justify-end gap-2 md:min-w-[360px]">
          <label className="atlas-command-chrome atlas-glow-rail flex h-10 w-full max-w-xl items-center gap-2 rounded-lg px-3 text-[var(--atlas-text)]">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search tenants, users, slugs, emails..."
              className="h-full w-full bg-transparent text-sm text-[var(--atlas-text-strong)] outline-none placeholder:text-[var(--atlas-muted-soft)]"
            />
            <button
              type="button"
              onClick={() => setQuickOpen(true)}
              className="rounded-md border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)] p-1.5 text-[var(--atlas-text)] shadow-[0_0_14px_rgba(96,165,250,0.25)] hover:bg-[color:var(--atlas-surface-hover)]"
              aria-label="Open quick actions"
            >
              <Plus size={14} />
            </button>
          </label>

          <Button variant="outline" onClick={() => setQuickOpen(true)} className="hidden lg:inline-flex">
            <Sparkles size={15} />
            Quick Actions
          </Button>

          <Button variant="ghost" className="hidden md:inline-flex" onClick={onOpenCommandPalette}>
            <Command size={15} />
            Ctrl+K
          </Button>

          <div className="hidden h-5 w-px bg-[color:var(--atlas-border-strong)] md:block" />

          <button
            type="button"
            onClick={onToggleTheme}
            className="rounded-md border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)] p-2 text-[var(--atlas-text)] hover:bg-[color:var(--atlas-surface-hover)]"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button
            type="button"
            className="hidden rounded-md border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)] p-2 text-[var(--atlas-text)] hover:bg-[color:var(--atlas-surface-hover)] md:inline-flex"
            aria-label="Notifications"
          >
            <Bell size={15} />
          </button>

          <button
            type="button"
            className="hidden rounded-md border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)] p-2 text-[var(--atlas-text)] hover:bg-[color:var(--atlas-surface-hover)] md:inline-flex"
            aria-label="Account"
          >
            <UserCircle2 size={15} />
          </button>
        </div>
      </div>

      {quickOpen && (
        <div
          className="fixed inset-0 z-[82] flex items-center justify-center bg-[color:var(--atlas-overlay)] px-4"
          onClick={() => setQuickOpen(false)}
        >
          <Card
            className="w-full max-w-md"
            interactive
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-[var(--atlas-text-strong)]">Quick Actions</h3>
            <p className="mt-1 text-sm text-[var(--atlas-muted)]">Fast controls for control-plane operations.</p>
            <div className="mt-4 grid gap-2">
              <Button variant="outline" className="justify-start">Create Tenant</Button>
              <Button variant="outline" className="justify-start">Suspend Tenant</Button>
              <Button variant="outline" className="justify-start">Rotate Admin Role</Button>
              <Button variant="outline" className="justify-start">Run Health Sweep</Button>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={() => setQuickOpen(false)}>Close</Button>
            </div>
          </Card>
        </div>
      )}
    </header>
  );
}
