import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import apiClient from "../api/apiClient";
import { useTenant } from "../tenant/TenantContext";
import { useAuth } from "../hooks/useAuth";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function readErrorMessage(error) {
  const data = error?.response?.data;
  if (typeof data === "string") return data;
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  return "We couldn't create your organization right now. Please check your connection and try again.";
}

export default function CreateTenant() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const {
    tenants,
    activeTenantId,
    loadingTenants,
    tenantSwitchMessage,
    refreshTenants,
    setActiveTenant,
    ensureActiveTenant,
    clearTenantSwitchMessage,
  } = useTenant();

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugEdited, setSlugEdited] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (slugEdited) return;
    setSlug(slugify(name));
  }, [name, slugEdited]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }

    if (activeTenantId) {
      navigate("/dashboard", { replace: true });
      return;
    }

    navigate("/", { replace: true });
  };

  const switchTenant = (tenantId) => {
    setActiveTenant(tenantId);
    clearTenantSwitchMessage();
    navigate("/dashboard", { replace: true });
  };

  const handleLogoutTo = async (path) => {
    try {
      await logout();
    } finally {
      navigate(path, { replace: true });
    }
  };

  const handleCreateTenant = async (event) => {
    event.preventDefault();
    setError("");

    const normalizedName = name.trim();
    const normalizedSlug = slugify(slug || name);

    if (!normalizedName) {
      setError("Please enter your organization name.");
      return;
    }

    if (!normalizedSlug) {
      setError("Please enter a short link name for your organization.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post("/tenants", {
        name: normalizedName,
        slug: normalizedSlug,
      });

      const created = res.data?.data ?? res.data;
      const tenantList = await refreshTenants();
      const createdId =
        Number(created?.tenantId) ||
        Number(
          tenantList.find((tenant) => String(tenant?.slug) === normalizedSlug)?.tenantId,
        );

      if (createdId) {
        setActiveTenant(createdId);
      } else {
        ensureActiveTenant(tenantList);
      }

      clearTenantSwitchMessage();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-8 text-slate-100">
        <div className="mx-auto w-full max-w-4xl">
          <button
            type="button"
            onClick={handleBack}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="mb-5 flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleLogoutTo("/auth/login")}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-semibold hover:bg-white/20 transition"
            >
              Sign out to Login
            </button>
            <button
              type="button"
              onClick={() => handleLogoutTo("/")}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-semibold hover:bg-white/20 transition"
            >
              Sign out to Company Profile
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                <Building2 className="h-4 w-4" />
                Quick setup
              </div>
              <h1 className="text-2xl font-semibold">Create Organization</h1>
              <p className="mt-2 text-sm text-slate-300">
                Set up your organization to open your team workspace and keep your farm data in one place.
              </p>

              {tenantSwitchMessage && (
                <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-500/15 px-3 py-2 text-sm text-amber-100">
                  {tenantSwitchMessage}
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm text-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateTenant} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="tenant-name" className="mb-1 block text-sm font-medium">
                    Organization name
                  </label>
                  <input
                    id="tenant-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="K Farms Ltd"
                    required
                    className="w-full rounded-lg border border-white/20 bg-slate-900/70 px-3 py-2 text-sm outline-none transition focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label htmlFor="tenant-slug" className="mb-1 block text-sm font-medium">
                    Slug
                  </label>
                  <input
                    id="tenant-slug"
                    type="text"
                    value={slug}
                    onChange={(event) => {
                      setSlugEdited(true);
                      setSlug(slugify(event.target.value));
                    }}
                    placeholder="k-farms-ltd"
                    required
                    className="w-full rounded-lg border border-white/20 bg-slate-900/70 px-3 py-2 text-sm outline-none transition focus:border-emerald-400"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    This becomes part of your workspace link. We suggest one automatically from the name.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    submitting
                      ? "cursor-not-allowed bg-emerald-500/50"
                      : "bg-emerald-500 hover:bg-emerald-400"
                  }`}
                >
                  {submitting ? "Creating organization..." : "Create my organization"}
                </button>
              </form>

              <div className="mt-4 text-xs text-slate-400">
                Already have an invite code?{" "}
                <Link
                  to="/onboarding/accept-invite"
                  className="text-emerald-300 hover:underline"
                >
                  Join with invite
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              <h2 className="text-lg font-semibold">Your Organizations</h2>
              <p className="mt-1 text-sm text-slate-300">
                Already part of a team? Choose an organization to continue.
              </p>

              <div className="mt-4 max-h-[420px] space-y-3 overflow-auto pr-1">
                {loadingTenants && (
                  <div className="rounded-lg border border-white/10 bg-slate-900/40 px-3 py-3 text-sm text-slate-300">
                    Loading your organizations...
                  </div>
                )}

                {!loadingTenants && tenants.length === 0 && (
                  <div className="rounded-lg border border-white/10 bg-slate-900/40 px-3 py-3 text-sm text-slate-300">
                    You don&apos;t belong to any organization yet.
                  </div>
                )}

                {!loadingTenants &&
                  tenants.map((tenant) => {
                    const tenantId = Number(tenant?.tenantId);
                    const suspended = String(tenant?.status || "").toUpperCase() === "SUSPENDED";
                    return (
                      <div
                        key={tenantId || tenant?.slug || tenant?.name}
                        className="rounded-xl border border-white/10 bg-slate-900/40 px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{tenant?.name || "Untitled organization"}</div>
                            <div className="text-xs text-slate-400">
                              Role: {tenant?.myRole || "Member"}
                            </div>
                          </div>
                          <div className="text-right text-xs text-slate-300">
                            <div>{tenant?.plan || "Free"}</div>
                            <div>{tenant?.status || "Active"}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => switchTenant(tenantId)}
                          disabled={suspended}
                          className={`mt-3 w-full rounded-md px-2 py-1.5 text-sm font-medium transition ${
                            suspended
                              ? "cursor-not-allowed bg-slate-700/60 text-slate-400"
                              : "bg-slate-100 text-slate-900 hover:bg-white"
                          }`}
                        >
                          {suspended ? "Temporarily unavailable" : "Open this workspace"}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
