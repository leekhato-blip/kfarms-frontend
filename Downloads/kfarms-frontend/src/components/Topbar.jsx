import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Sun,
  Moon,
  Search,
  Bell,
  PlusSquare,
  ChevronDown,
  LogOut,
  TrendingUp,
  Truck,
  Egg,
  Skull,
} from "lucide-react";
import { GiChicken } from "react-icons/gi";
import { TbCurrencyNaira } from "react-icons/tb";
import SalesFormModal from "./SalesFormModal";
import SuppliesFormModal from "./SuppliesFormModal";
import GlassToast from "./GlassToast";

async function trySearchApi(query) {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function clientFallbackSearch(query) {
  try {
    const idx = JSON.parse(localStorage.getItem("kf_search_index") || "[]");
    const q = query.trim().toLowerCase();
    return idx
      .filter(
        (it) =>
          (it.title || "").toLowerCase().includes(q) ||
          (it.subtitle || "").toLowerCase().includes(q),
      )
      .slice(0, 20);
  } catch {
    return [];
  }
}

async function searchDashboard(query) {
  if (!query || query.trim().length === 0) return { success: true, data: [] };
  const api = await trySearchApi(query);
  if (api.success) return api;
  const fallback = clientFallbackSearch(query);
  return { success: true, data: fallback };
}

async function fetchNotifications() {
  try {
    const res = await fetch(`/api/notifications/unread`);
    const data = await res.json();
    return { success: res.ok, data };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

async function markNotificationRead(id) {
  try {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: "POST",
    });
    return { success: res.ok };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function getInitialTheme() {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("kf_theme");
  if (saved) return saved;
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const hr = new Date().getHours();
  const greet =
    hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  const name = user?.username || "Farmer";

  const rootRef = React.useRef(null);
  const searchInputRef = React.useRef(null);

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState([]);
  const [showSearch, setShowSearch] = React.useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [notifications, setNotifications] = React.useState([]);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [salesModalOpen, setSalesModalOpen] = React.useState(false);
  const [suppliesModalOpen, setSuppliesModalOpen] = React.useState(false);
  const [toast, setToast] = React.useState({
    message: "",
    type: "info",
  });

  React.useEffect(() => {
    if (!query || query.trim().length === 0) {
      setResults([]);
      setShowSearch(false);
      return;
    }
    setSearchLoading(true);
    const t = setTimeout(async () => {
      const res = await searchDashboard(query);
      setSearchLoading(false);
      if (res.success) setResults(res.data || []);
      else setResults([]);
    }, 320);
    return () => clearTimeout(t);
  }, [query]);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await fetchNotifications();
      if (!mounted) return;
      if (res.success) setNotifications(res.data || []);
    }
    load();
    const id = setInterval(load, 15000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined" || !user?.id) return undefined;
    let isActive = true;
    const source = new EventSource(`/api/notifications/stream/${user.id}`);
    const handleNotification = (event) => {
      if (!isActive) return;
      try {
        const payload = JSON.parse(event.data);
        setNotifications((prev) => {
          if (prev.some((n) => n.id === payload.id)) return prev;
          return [payload, ...prev];
        });
      } catch (err) {
        console.error("Failed to parse notification stream:", err);
      }
    };
    source.addEventListener("notification", handleNotification);
    source.addEventListener("error", () => {
      if (source.readyState === EventSource.CLOSED) source.close();
    });

    return () => {
      isActive = false;
      source.removeEventListener("notification", handleNotification);
      source.close();
    };
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  async function handleMarkRead(id) {
    const res = await markNotificationRead(id);
    if (res.success)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
  }

  const [quickOpen, setQuickOpen] = React.useState(false);
  function quickAdd(action) {
    setQuickOpen(false);
    if (action === "sales") {
      setSalesModalOpen(true);
      return;
    }
    if (action == "supplies") {
      setSuppliesModalOpen(true);
      return;
    }
    const map = {
      livestock: "/livestocks/new",
      supplies: "/supplies/new",
      eggs: "/records/eggs/new",
      mortality: "/records/mortality/new",
    };
    navigate(map[action] || "/");
  }

  const [userOpen, setUserOpen] = React.useState(false);
  const [confirmingLogout, setConfirmingLogout] = React.useState(false);

  const [theme, setTheme] = React.useState(getInitialTheme);
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("kf_theme", theme);
    document.documentElement.style.transition =
      "background-color 200ms, color 200ms";
  }, [theme]);

  React.useEffect(() => {
    function onDocClick(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        setShowSearch(false);
        setMobileSearchOpen(false);
        setNotifOpen(false);
        setQuickOpen(false);
        setUserOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") {
        setShowSearch(false);
        setMobileSearchOpen(false);
        setNotifOpen(false);
        setQuickOpen(false);
        setUserOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function clearSearch() {
    setQuery("");
    setResults([]);
    setShowSearch(false);
  }

  function toggleMobileSearch() {
    setMobileSearchOpen((open) => {
      const next = !open;
      if (!next) setShowSearch(false);
      if (next) {
        requestAnimationFrame(() => searchInputRef.current?.focus());
      }
      return next;
    });
  }

  return (
    <div
      ref={rootRef}
      className="w-full sticky top-0 z-50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-bold font-header">
          {greet}, <span className="text-status-success">{name}</span>!
        </h1>
        <p className="text-sm font-body text-slate-400">
          Overview of your farm activities
        </p>
      </div>

      <div className="w-full sm:w-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        {/* Mobile search bar (icon-triggered) */}
        <div className="relative sm:hidden" aria-live="polite">
          <div
            className={`overflow-hidden transition-all duration-200 ease-out ${
              mobileSearchOpen
                ? "max-h-16 opacity-100 translate-y-0"
                : "max-h-0 opacity-0 -translate-y-1 pointer-events-none"
            }`}
          >
            <div className="flex items-center min-w-0 rounded-full px-3 py-2 w-full transition-colors dark:bg-darkCard border border-slate-800">
              <div className="text-lightText dark:text-darkText">
                <Search className="w-5 h-5" />
              </div>
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => {
                  const value = e.target.value;
                  setQuery(value);
                  setShowSearch(value.trim().length > 0);
                }}
                placeholder="Search..."
                className="ml-2 bg-transparent outline-none w-full min-w-0 text-sm placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />
              {query ? (
                <button
                  onClick={clearSearch}
                  aria-label="clear"
                  className="ml-2 text-xs opacity-80 hover:opacity-100"
                >
                  ✕
                </button>
              ) : searchLoading ? (
                <div className="ml-2 text-xs opacity-70">…</div>
              ) : null}
            </div>
          </div>

          {/* Search dropdown (mobile) */}
          <div
            className={`absolute left-0 right-0 mt-2 w-full max-w-[calc(100vw-2rem)] transform origin-top-right z-50
              ${
                showSearch && mobileSearchOpen
                  ? "scale-100 opacity-100"
                  : "scale-95 opacity-0 pointer-events-none"
              }
              transition-all duration-200`}
            style={{ willChange: "transform, opacity" }}
          >
            <div className="rounded-lg shadow-lg overflow-hidden bg-lightbg dark:bg-darkCard border border-white/10 dark:border-slate-700">
              <div className="p-2 text-xs text-slate-500 border-b dark:border-slate-700">
                Search results
              </div>
              <ul className="max-h-64 overflow-auto">
                {results.length === 0 && !searchLoading && (
                  <li className="p-3 text-sm text-slate-600">No results</li>
                )}
                {results.map((r) => (
                  <li
                    key={r.id || r.url || Math.random()}
                    className="p-3 hover:bg-lightText dark:hover:bg-slate-800 cursor-pointer"
                    onClick={() => {
                      setShowSearch(false);
                      setMobileSearchOpen(false);
                      navigate(r.url || `/items/${r.id}`);
                    }}
                  >
                    <div className="text-sm font-medium">
                      {r.title
                        .split(new RegExp(`(${query})`, "gi"))
                        .map((part, i) =>
                          part.toLowerCase() === query.toLowerCase() ? (
                            <mark
                              key={i}
                              className="bg-emerald-200 dark:bg-emerald-600/50 rounded px-1"
                            >
                              {part}
                            </mark>
                          ) : (
                            part
                          ),
                        )}
                    </div>

                    {r.subtitle && (
                      <div className="text-xs text-slate-400">{r.subtitle}</div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="p-2 border-t text-xs dark:border-slate-700">
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setMobileSearchOpen(false);
                    navigate("/search?q=" + encodeURIComponent(query));
                  }}
                  className="w-full text-left"
                >
                  Open full search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop search */}
        <div className="relative hidden sm:block" aria-live="polite">
          <div className="flex items-center rounded-full px-3 py-2 w-64 md:w-80 transition-colors dark:bg-darkCard border border-slate-800">
            <div className="text-lightText dark:text-darkText">
              <Search className="w-5 h-5" />
            </div>
            <input
              value={query}
              onChange={(e) => {
                const value = e.target.value;
                setQuery(value);
                setShowSearch(value.trim().length > 0);
              }}
              placeholder="Search ponds, feeds, supplies, invoices..."
              className="ml-2 bg-transparent outline-none w-full text-sm placeholder:text-slate-500 dark:placeholder:text-slate-400"
            />
            {query ? (
              <button
                onClick={clearSearch}
                aria-label="clear"
                className="ml-2 text-xs opacity-80 hover:opacity-100"
              >
                ✕
              </button>
            ) : searchLoading ? (
              <div className="ml-2 text-xs opacity-70">…</div>
            ) : null}
          </div>

          {/* Search dropdown (desktop) */}
          <div
            className={`absolute right-0 mt-2 w-80 transform origin-top-right z-50
              ${
                showSearch ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
              }
              transition-all duration-200`}
            style={{ willChange: "transform, opacity" }}
          >
            <div className="rounded-lg shadow-lg overflow-hidden bg-lightbg dark:bg-darkCard border border-white/10 dark:border-slate-700">
              <div className="p-2 text-xs text-slate-500 border-b dark:border-slate-700">
                Search results
              </div>
              <ul className="max-h-64 overflow-auto">
                {results.length === 0 && !searchLoading && (
                  <li className="p-3 text-sm text-slate-600">No results</li>
                )}
                {results.map((r) => (
                  <li
                    key={r.id || r.url || Math.random()}
                    className="p-3 hover:bg-lightText dark:hover:bg-slate-800 cursor-pointer"
                    onClick={() => {
                      setShowSearch(false);
                      navigate(r.url || `/items/${r.id}`);
                    }}
                  >
                    <div className="text-sm font-medium">
                      {r.title
                        .split(new RegExp(`(${query})`, "gi"))
                        .map((part, i) =>
                          part.toLowerCase() === query.toLowerCase() ? (
                            <mark
                              key={i}
                              className="bg-emerald-200 dark:bg-emerald-600/50 rounded px-1"
                            >
                              {part}
                            </mark>
                          ) : (
                            part
                          ),
                        )}
                    </div>

                    {r.subtitle && (
                      <div className="text-xs text-slate-400">{r.subtitle}</div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="p-2 border-t text-xs dark:border-slate-700">
                <button
                  onClick={() => {
                    setShowSearch(false);
                    navigate("/search?q=" + encodeURIComponent(query));
                  }}
                  className="w-full text-left"
                >
                  Open full search
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3 flex-wrap">
          {/* Search icon (mobile) */}
          <button
            type="button"
            onClick={toggleMobileSearch}
            className="sm:hidden p-2 rounded-full text-darkText dark:bg-darkCard hover:scale-105 transition-transform duration-200"
            aria-label="Search"
            aria-haspopup="true"
            aria-expanded={mobileSearchOpen}
          >
            <Search className="w-5 h-5 text-slate-700 dark:text-darkText" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen((s) => !s)}
              className="p-2 rounded-full text-darkText dark:bg-darkCard hover:scale-105 transition-transform duration-200 relative"
              aria-haspopup="true"
              aria-expanded={notifOpen}
              aria-label="Notifications"
            >
              <div className="relative text-slate-700 dark:text-darkText">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 bg-status-success text-white rounded-full text-[10px] w-5 h-5 grid place-items-center
                  ${unreadCount > 0 ? "animate-bounce" : ""}`}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>
            </button>

            <div
              className={`absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] transform origin-top-right z-50
              ${
                notifOpen
                  ? "scale-100 opacity-100"
                  : "scale-95 opacity-0 pointer-events-none"
              }
              transition-all duration-200`}
            >
              <div className="rounded-lg shadow-lg overflow-hidden bg-lightbg dark:bg-darkCard border border-white/10 dark:border-slate-700">
                <div className="p-3 border-b dark:border-slate-800 text-sm font-medium">
                  Notifications
                </div>
                <ul className="max-h-64 overflow-auto">
                  {notifications.length === 0 && (
                    <li className="p-3 text-sm text-slate-500">
                      No notifications
                    </li>
                  )}
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800 ${
                        n.read ? "opacity-80" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm">{n.title}</div>
                        {!n.read && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="text-xs text-slate-500"
                          >
                            Mark
                          </button>
                        )}
                      </div>
                      {n.body && (
                        <div className="text-xs text-slate-500 mt-1">
                          {n.body}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="p-2 border-t dark:border-slate-800">
                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      navigate("/notifications");
                    }}
                    className="w-full text-left"
                  >
                    View all
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Add */}
          <div className="relative">
            <button
              onClick={() => setQuickOpen((s) => !s)}
              className="p-2 rounded-md bg-accent-primary hover:opacity-95 text-white flex items-center gap-2 transition-shadow shadow-neo dark:shadow-dark"
              aria-haspopup="true"
              aria-expanded={quickOpen}
              aria-label="Quick add"
            >
              <PlusSquare className="w-5 h-5" />
              <span className="hidden md:inline text-sm font-body">
                Quick Add
              </span>
            </button>

            <div
              className={`absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] transform origin-top-right z-50
              ${
                quickOpen
                  ? "scale-100 opacity-100"
                  : "scale-95 opacity-0 pointer-events-none"
              }
              transition-all duration-200`}
            >
              <div className="rounded-lg shadow-lg overflow-hidden bg-lightbg dark:bg-darkCard border border-white/10 dark:border-slate-700">
                <ul>
                  {/* Add Egg Record */}
                  <li
                    className="p-3 hover:bg-accent-subtle/30 hover:shadow-soft transition dark:hover:bg-slate-800 flex items-center gap-3 cursor-pointer"
                    onClick={() => quickAdd("eggs")}
                  >
                    <div className="text-slate-700 dark:text-slate-200">
                      <Egg className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Add Egg Record</div>
                      <div className="text-xs text-slate-500">
                        Log production
                      </div>
                    </div>
                  </li>

                  {/* Add Sales */}
                  <li
                    title="Register income"
                    className="p-3 hover:bg-accent-subtle/30 hover:shadow-soft transition dark:hover:bg-slate-800 flex items-center gap-3 cursor-pointer"
                    onClick={() => quickAdd("sales")}
                  >
                    <div className="text-slate-700 dark:text-slate-200">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Add Sales</div>
                      <div className="text-xs text-slate-500">
                        Record income
                      </div>
                    </div>
                  </li>

                  {/* Add Supplies */}
                  <li
                    className="p-3 hover:bg-accent-subtle/30 hover:shadow-soft transition dark:hover:bg-slate-800 flex items-center gap-3 cursor-pointer"
                    onClick={() => quickAdd("supplies")}
                  >
                    <div className="text-slate-700 dark:text-slate-200">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Add Supplies</div>
                      <div className="text-xs text-slate-500">
                        Track feed & tools
                      </div>
                    </div>
                  </li>

                  {/* Add Livestock */}
                  <li
                    className="p-3 hover:bg-accent-subtle/30 hover:shadow-soft transition dark:hover:bg-slate-800 flex items-center gap-3 cursor-pointer"
                    onClick={() => quickAdd("livestock")}
                  >
                    <div className="text-slate-700 dark:text-slate-200">
                      <GiChicken className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Add Livestock</div>
                      <div className="text-xs text-slate-500">
                        Register animal quickly
                      </div>
                    </div>
                  </li>

                  {/* Mortality */}
                  <li
                    className="p-3 hover:bg-accent-subtle/30 hover:shadow-soft transition dark:hover:bg-slate-800 flex items-center gap-3 cursor-pointer"
                    onClick={() => quickAdd("mortality")}
                  >
                    <div className="text-slate-700 dark:text-slate-200">
                      <Skull className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Mortality</div>
                      <div className="text-xs text-slate-500">
                        Record deaths
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className="p-2 rounded-full bg-yellow-300 text-lightText dark:text-darkText hover:bg-yellow-300/45 hover:dark:bg-darkSecondary/45 dark:bg-accent-primary transition-colors duration-300"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {/* User info */}
          <div className="relative">
            <button
              onClick={() => setUserOpen((s) => !s)}
              className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-slate-700 px-2 py-1 dark:hover:shadow-dark hover:shadow-md bg-white/5"
              aria-haspopup="true"
              aria-expanded={userOpen}
            >
              <img
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    name,
                  )}&background=4ADE80&color=fff&rounded=true&size=64`
                }
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="hidden sm:block text-right leading-tight">
                <div className="text-sm font-medium">{name}</div>
                <div className="text-xs text-slate-400">
                  {user?.role || "Manager"}
                </div>
              </div>
              <div className="pl-2">
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            <div
              className={`absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] transform origin-top-right z-50
              ${
                userOpen
                  ? "scale-100 opacity-100"
                  : "scale-95 opacity-0 pointer-events-none"
              }
              transition-all duration-200`}
            >
              <div className="rounded-lg shadow-lg overflow-hidden bg-white dark:bg-darkCard border border-white/10 dark:border-slate-700">
                <div className="p-3 text-sm">
                  Signed in as{" "}
                  <div className="font-medium">
                    {user?.email || user?.username}
                  </div>
                </div>
                <div className="p-2 border-t dark:border-slate-800">
                  <button
                    onClick={() => {
                      setConfirmingLogout(true);
                      setUserOpen(false);
                    }}
                    className="w-full flex items-center gap-2 justify-center p-2 rounded-md bg-red-600 text-white hover:opacity-95"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {confirmingLogout && (
              <div className="fixed inset-0 z-60 grid dark:shadow-dark place-items-center bg-black/40 p-4">
                <div className="max-w-sm w-full bg-white dark:bg-darkCard rounded-lg shadow-lg p-4">
                  <div className="text-lg font-medium">Confirm logout</div>
                  <p className="text-sm text-slate-500 mt-2">
                    Are you sure you want to logout?
                  </p>
                  <div className="mt-4 flex gap-2 justify-end">
                    <button
                      onClick={() => setConfirmingLogout(false)}
                      className="px-3 py-1 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setConfirmingLogout(false);
                        logout();
                      }}
                      className="px-3 py-1 rounded-md bg-red-600 text-white"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <SalesFormModal
        open={salesModalOpen}
        onClose={() => setSalesModalOpen(false)}
        onSuccess={() => {
          setSalesModalOpen(false);
          setToast({
            message: "Sales record added successfully",
            type: "success",
          });
        }}
      />
      <SalesFormModal
        open={salesModalOpen}
        onClose={() => setSalesModalOpen(false)}
        onSuccess={() => {
          setSalesModalOpen(false);
          setToast({
            message: "Sales record added successfully",
            type: "success",
          });
        }}
      />

      <SuppliesFormModal
        open={suppliesModalOpen}
        onClose={() => setSuppliesModalOpen(false)}
        onSuccess={() => {
          setSuppliesModalOpen(false);
          setToast({
            message: "Supplies record added successfully",
            type: "success",
          });
        }}
      />

      <GlassToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />
    </div>
  );
}
