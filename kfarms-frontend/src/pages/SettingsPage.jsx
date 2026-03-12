import React from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Building2,
  CheckCircle2,
  Crown,
  Globe,
  Palette,
  RefreshCw,
  Save,
  Shield,
  UserCircle2,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import GlassToast from "../components/GlassToast";
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../tenant/TenantContext";
import { getPlanById, normalizePlanId } from "../constants/plans";
import {
  CURRENCY_OPTIONS,
  DEFAULT_ORGANIZATION_SETTINGS,
  DEFAULT_USER_PREFERENCES,
  LANDING_PAGE_OPTIONS,
  normalizeLandingPage,
  THEME_OPTIONS,
  TIMEZONE_OPTIONS,
  applyThemePreference,
} from "../constants/settings";
import {
  isTenantPathEnabled,
  resolveTenantLandingPage,
} from "../tenant/tenantModules";
import {
  WORKSPACE_PERMISSIONS,
  hasWorkspacePermission,
} from "../utils/workspacePermissions";
import {
  getOrganizationSettings,
  getUserPreferences,
  saveOrganizationSettings,
  saveUserPreferences,
  updatePassword,
} from "../services/settingsService";

const inputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 dark:border-white/10 dark:bg-darkCard/70 dark:text-darkText";
const selectClassName = `${inputClassName} [color-scheme:light] dark:[color-scheme:dark]`;

function isSame(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function formatLandingPage(value) {
  const option = LANDING_PAGE_OPTIONS.find(
    (entry) => entry.value === normalizeLandingPage(value),
  );
  return option?.label || "Dashboard";
}

function formatTheme(value) {
  const option = THEME_OPTIONS.find((entry) => entry.value === value);
  return option?.label || "System";
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { activeTenant, activeTenantId } = useTenant();

  const [loading, setLoading] = React.useState(true);
  const [organizationSettings, setOrganizationSettings] = React.useState(
    DEFAULT_ORGANIZATION_SETTINGS,
  );
  const [organizationSnapshot, setOrganizationSnapshot] = React.useState(
    DEFAULT_ORGANIZATION_SETTINGS,
  );
  const [userPreferences, setUserPreferences] = React.useState(
    DEFAULT_USER_PREFERENCES,
  );
  const [preferencesSnapshot, setPreferencesSnapshot] = React.useState(
    DEFAULT_USER_PREFERENCES,
  );
  const [securityForm, setSecurityForm] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingOrganization, setSavingOrganization] = React.useState(false);
  const [savingPreferences, setSavingPreferences] = React.useState(false);
  const [updatingPassword, setUpdatingPassword] = React.useState(false);
  const [toast, setToast] = React.useState({ message: "", type: "info" });

  const userId = user?.id || user?.username || user?.email || "me";
  const currentPlanId = normalizePlanId(activeTenant?.plan, "FREE");
  const currentPlan = getPlanById(currentPlanId, "FREE");
  const isEnterprisePlan = currentPlanId === "ENTERPRISE";
  const canManageWorkspaceSettings = hasWorkspacePermission(
    activeTenant,
    WORKSPACE_PERMISSIONS.SETTINGS_MANAGE,
  );
  const snapshotThemeRef = React.useRef(DEFAULT_USER_PREFERENCES.themePreference);
  const availableLandingPageOptions = React.useMemo(
    () => LANDING_PAGE_OPTIONS.filter((option) => isTenantPathEnabled(option.value, activeTenant)),
    [activeTenant],
  );

  const organizationDirty = React.useMemo(
    () => !isSame(organizationSettings, organizationSnapshot),
    [organizationSettings, organizationSnapshot],
  );
  const preferencesDirty = React.useMemo(
    () => !isSame(userPreferences, preferencesSnapshot),
    [userPreferences, preferencesSnapshot],
  );
  const brandPreviewStyle = React.useMemo(
    () => ({
      borderColor: `${organizationSettings.brandPrimaryColor}40`,
      background: `linear-gradient(135deg, ${organizationSettings.brandPrimaryColor}20, ${organizationSettings.brandAccentColor}18)`,
    }),
    [organizationSettings.brandAccentColor, organizationSettings.brandPrimaryColor],
  );

  React.useEffect(() => {
    snapshotThemeRef.current = preferencesSnapshot.themePreference;
  }, [preferencesSnapshot.themePreference]);

  React.useEffect(() => {
    if (loading) return;
    applyThemePreference(userPreferences.themePreference);
  }, [loading, userPreferences.themePreference]);

  React.useEffect(() => {
    return () => {
      applyThemePreference(snapshotThemeRef.current);
    };
  }, []);

  React.useEffect(() => {
    setUserPreferences((prev) => {
      const resolvedLandingPage = resolveTenantLandingPage(prev.landingPage, activeTenant);
      if (resolvedLandingPage === prev.landingPage) {
        return prev;
      }
      return {
        ...prev,
        landingPage: resolvedLandingPage,
      };
    });
  }, [activeTenant]);

  React.useEffect(() => {
    let active = true;

    async function loadSettings() {
      if (!activeTenantId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [organization, preferences] = await Promise.all([
          getOrganizationSettings({
            tenantId: activeTenantId,
            tenantName: activeTenant?.name,
            tenantSlug: activeTenant?.slug,
          }),
          getUserPreferences({
            tenantId: activeTenantId,
            userId,
          }),
        ]);

        if (!active) return;
        setOrganizationSettings(organization);
        setOrganizationSnapshot(organization);
        setUserPreferences(preferences);
        setPreferencesSnapshot(preferences);
      } catch (error) {
        if (!active) return;
        setToast({
          message: error?.message || "Could not load settings right now.",
          type: "error",
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSettings();
    return () => {
      active = false;
    };
  }, [activeTenant?.name, activeTenant?.slug, activeTenantId, userId]);

  function handleOrganizationChange(field, value) {
    setOrganizationSettings((prev) => ({ ...prev, [field]: value }));
  }

  function handlePreferenceChange(field, value) {
    setUserPreferences((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSaveOrganization() {
    if (!activeTenantId || savingOrganization || !canManageWorkspaceSettings) return;

    setSavingOrganization(true);
    try {
      const saved = await saveOrganizationSettings({
        tenantId: activeTenantId,
        settings: organizationSettings,
      });
      setOrganizationSettings(saved);
      setOrganizationSnapshot(saved);
      setToast({ message: "Workspace settings saved.", type: "success" });
    } catch (error) {
      setToast({
        message: error?.message || "Could not save workspace settings.",
        type: "error",
      });
    } finally {
      setSavingOrganization(false);
    }
  }

  async function handleSavePreferences() {
    if (!activeTenantId || savingPreferences) return;

    setSavingPreferences(true);
    try {
      const saved = await saveUserPreferences({
        tenantId: activeTenantId,
        userId,
        preferences: userPreferences,
      });
      setUserPreferences(saved);
      setPreferencesSnapshot(saved);
      setToast({ message: "Preferences saved and applied.", type: "success" });
    } catch (error) {
      setToast({
        message: error?.message || "Failed to save preferences.",
        type: "error",
      });
    } finally {
      setSavingPreferences(false);
    }
  }

  async function handleUpdatePassword(event) {
    event.preventDefault();
    if (updatingPassword) return;

    setUpdatingPassword(true);
    try {
      const result = await updatePassword(securityForm);
      setSecurityForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setToast({
        message: result?.message || "Password updated successfully.",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: error?.message || "Could not update password.",
        type: "error",
      });
    } finally {
      setUpdatingPassword(false);
    }
  }

  function resetOrganizationChanges() {
    setOrganizationSettings(organizationSnapshot);
  }

  function resetPreferenceChanges() {
    setUserPreferences(preferencesSnapshot);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 font-body animate-fadeIn">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold font-header sm:text-h2">
              Settings
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your workspace details, personal preferences, and account
              security.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-200">
              Backend sync active
            </span>
            <span className="rounded-full border border-white/10 bg-white/60 px-3 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-200">
              Role: {activeTenant?.myRole || "Member"}
            </span>
          </div>
        </div>

        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            canManageWorkspaceSettings
              ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
              : "border-slate-300/50 bg-slate-500/10 text-slate-700 dark:text-slate-200"
          }`}
        >
          {canManageWorkspaceSettings
            ? "Workspace changes save directly to the backend for everyone in this organization."
            : "You can update your own preferences and password here. Workspace details are view-only for your role."}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`settings-loading-${index}`}
                className={`rounded-2xl bg-white/10 p-5 shadow-neo dark:bg-darkCard/70 dark:shadow-dark ${
                  index === 0 ? "xl:col-span-2" : ""
                }`}
                aria-hidden="true"
              >
                <div className="h-5 w-40 rounded skeleton-glass" />
                <div className="mt-4 space-y-3">
                  <div className="h-10 w-full rounded skeleton-glass" />
                  <div className="h-10 w-full rounded skeleton-glass" />
                  <div className="h-10 w-full rounded skeleton-glass" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
              <section className="rounded-2xl bg-white/10 p-5 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
                <div className="mb-4 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-accent-primary" />
                  <div>
                    <h2 className="font-header font-semibold">
                      Workspace settings
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Update how this organization appears across KFarms.
                    </p>
                  </div>
                </div>

                <fieldset
                  disabled={!canManageWorkspaceSettings}
                  className={!canManageWorkspaceSettings ? "opacity-75" : ""}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                        Workspace name
                      </label>
                      <input
                        type="text"
                        value={organizationSettings.organizationName}
                        onChange={(event) =>
                          handleOrganizationChange(
                            "organizationName",
                            event.target.value,
                          )
                        }
                        className={inputClassName}
                        placeholder="KFarms"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                        Workspace link
                      </label>
                      <input
                        type="text"
                        value={organizationSettings.organizationSlug}
                        disabled
                        className={`${inputClassName} cursor-not-allowed opacity-70`}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                        Timezone
                      </label>
                      <select
                        value={organizationSettings.timezone}
                        onChange={(event) =>
                          handleOrganizationChange("timezone", event.target.value)
                        }
                        className={selectClassName}
                      >
                        {TIMEZONE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                        Currency
                      </label>
                      <select
                        value={organizationSettings.currency}
                        onChange={(event) =>
                          handleOrganizationChange("currency", event.target.value)
                        }
                        className={selectClassName}
                      >
                        {CURRENCY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                        Contact email
                      </label>
                      <input
                        type="email"
                        value={organizationSettings.contactEmail}
                        onChange={(event) =>
                          handleOrganizationChange("contactEmail", event.target.value)
                        }
                        className={inputClassName}
                        placeholder="hello@kfarms.com"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                        Contact phone
                      </label>
                      <input
                        type="text"
                        value={organizationSettings.contactPhone}
                        onChange={(event) =>
                          handleOrganizationChange("contactPhone", event.target.value)
                        }
                        className={inputClassName}
                        placeholder="+234..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                        Address
                      </label>
                      <textarea
                        rows={3}
                        value={organizationSettings.address}
                        onChange={(event) =>
                          handleOrganizationChange("address", event.target.value)
                        }
                        className={inputClassName}
                        placeholder="Farm address"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={organizationSettings.watermarkEnabled}
                          onChange={(event) =>
                            handleOrganizationChange(
                              "watermarkEnabled",
                              event.target.checked,
                            )
                          }
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        Show watermark logo on auth pages
                      </label>
                    </div>

                    {isEnterprisePlan ? (
                      <>
                        <div className="md:col-span-2 mt-2 flex items-center gap-2 rounded-xl border border-accent-primary/20 bg-accent-primary/8 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                          <Palette className="h-4 w-4 text-accent-primary" />
                          Enterprise branding settings are active for this workspace.
                        </div>

                        <div className="md:col-span-2 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="md:col-span-2">
                              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                                Custom logo URL
                              </label>
                              <input
                                type="url"
                                value={organizationSettings.logoUrl}
                                onChange={(event) =>
                                  handleOrganizationChange("logoUrl", event.target.value)
                                }
                                className={inputClassName}
                                placeholder="https://yourcdn.com/logo.png"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                                Primary color
                              </label>
                              <input
                                type="text"
                                value={organizationSettings.brandPrimaryColor}
                                onChange={(event) =>
                                  handleOrganizationChange(
                                    "brandPrimaryColor",
                                    event.target.value,
                                  )
                                }
                                className={inputClassName}
                                placeholder="#2563EB"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                                Accent color
                              </label>
                              <input
                                type="text"
                                value={organizationSettings.brandAccentColor}
                                onChange={(event) =>
                                  handleOrganizationChange(
                                    "brandAccentColor",
                                    event.target.value,
                                  )
                                }
                                className={inputClassName}
                                placeholder="#10B981"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                                Login headline
                              </label>
                              <input
                                type="text"
                                value={organizationSettings.loginHeadline}
                                onChange={(event) =>
                                  handleOrganizationChange(
                                    "loginHeadline",
                                    event.target.value,
                                  )
                                }
                                className={inputClassName}
                                placeholder="Welcome back to Delta Integrated Farms"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                                Login message
                              </label>
                              <textarea
                                rows={3}
                                value={organizationSettings.loginMessage}
                                onChange={(event) =>
                                  handleOrganizationChange(
                                    "loginMessage",
                                    event.target.value,
                                  )
                                }
                                className={inputClassName}
                                placeholder="Welcome to your branded farm workspace."
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                                Custom domain
                              </label>
                              <input
                                type="text"
                                value={organizationSettings.customDomain}
                                onChange={(event) =>
                                  handleOrganizationChange(
                                    "customDomain",
                                    event.target.value,
                                  )
                                }
                                className={inputClassName}
                                placeholder="farms.yourcompany.com"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                                PDF report footer
                              </label>
                              <input
                                type="text"
                                value={organizationSettings.reportFooter}
                                onChange={(event) =>
                                  handleOrganizationChange(
                                    "reportFooter",
                                    event.target.value,
                                  )
                                }
                                className={inputClassName}
                                placeholder="Prepared for leadership review"
                              />
                            </div>

                          </div>

                          <div
                            className="rounded-2xl border p-4 shadow-soft"
                            style={brandPreviewStyle}
                          >
                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                              Brand preview
                            </div>
                            <div className="mt-4 rounded-2xl border border-white/50 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-950/60">
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-soft"
                                  style={{ border: `1px solid ${organizationSettings.brandPrimaryColor}35` }}
                                >
                                  {organizationSettings.logoUrl ? (
                                    <img
                                      src={organizationSettings.logoUrl}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <Building2
                                      className="h-5 w-5"
                                      style={{ color: organizationSettings.brandPrimaryColor }}
                                    />
                                  )}
                                </div>
                                <div>
                                  <div
                                    className="text-lg font-semibold"
                                    style={{ color: organizationSettings.brandPrimaryColor }}
                                  >
                                    {organizationSettings.organizationName || "Your enterprise brand"}
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {organizationSettings.customDomain || "custom-domain.example"}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {organizationSettings.loginHeadline || "Enterprise sign-in"}
                              </div>
                              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                {organizationSettings.loginMessage ||
                                  "Your login page, reports, and colors will reflect this brand profile."}
                              </div>
                              <div className="mt-4 rounded-xl border border-dashed border-slate-300/70 px-3 py-2 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                                Report footer:
                                <span className="ml-1 font-medium text-slate-700 dark:text-slate-200">
                                  {organizationSettings.reportFooter || "Generated for your farm via KFarms"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </fieldset>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveOrganization}
                    disabled={
                      !canManageWorkspaceSettings ||
                      !organizationDirty ||
                      savingOrganization
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingOrganization ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save workspace
                  </button>
                  <button
                    type="button"
                    onClick={resetOrganizationChanges}
                    disabled={
                      !canManageWorkspaceSettings ||
                      !organizationDirty ||
                      savingOrganization
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Reset
                  </button>
                </div>
              </section>

              <section className="rounded-2xl bg-white/10 p-5 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
                <div className="mb-4 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-accent-primary" />
                  <div>
                    <h2 className="font-header font-semibold">Preferences</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Personalize this workspace for your account.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                      Theme preference
                    </label>
                    <select
                      value={userPreferences.themePreference}
                      onChange={(event) =>
                        handlePreferenceChange("themePreference", event.target.value)
                      }
                      className={selectClassName}
                    >
                      {THEME_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                      Default landing page
                    </label>
                    <select
                      value={userPreferences.landingPage}
                      onChange={(event) =>
                        handlePreferenceChange("landingPage", event.target.value)
                      }
                      className={selectClassName}
                    >
                      {availableLandingPageOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-2 md:col-span-2 sm:grid-cols-2">
                    <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={userPreferences.emailNotifications}
                        onChange={(event) =>
                          handlePreferenceChange(
                            "emailNotifications",
                            event.target.checked,
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Email notifications
                    </label>
                    <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={userPreferences.pushNotifications}
                        onChange={(event) =>
                          handlePreferenceChange(
                            "pushNotifications",
                            event.target.checked,
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Browser notifications
                    </label>
                    <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={userPreferences.weeklySummary}
                        onChange={(event) =>
                          handlePreferenceChange(
                            "weeklySummary",
                            event.target.checked,
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Weekly summary report
                    </label>
                    <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={userPreferences.compactTables}
                        onChange={(event) =>
                          handlePreferenceChange(
                            "compactTables",
                            event.target.checked,
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Compact table density
                    </label>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSavePreferences}
                    disabled={!preferencesDirty || savingPreferences}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingPreferences ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save preferences
                  </button>
                  <button
                    type="button"
                    onClick={resetPreferenceChanges}
                    disabled={!preferencesDirty || savingPreferences}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Reset
                  </button>
                </div>
              </section>

              <section className="rounded-2xl bg-white/10 p-5 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
                <div className="mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent-primary" />
                  <div>
                    <h2 className="font-header font-semibold">Security</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Change your password for this KFarms account.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleUpdatePassword}
                  className="grid grid-cols-1 gap-3 md:grid-cols-3"
                >
                  <div>
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                      Current password
                    </label>
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={securityForm.currentPassword}
                      onChange={(event) =>
                        setSecurityForm((prev) => ({
                          ...prev,
                          currentPassword: event.target.value,
                        }))
                      }
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                      New password
                    </label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={securityForm.newPassword}
                      onChange={(event) =>
                        setSecurityForm((prev) => ({
                          ...prev,
                          newPassword: event.target.value,
                        }))
                      }
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                      Confirm new password
                    </label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={securityForm.confirmPassword}
                      onChange={(event) =>
                        setSecurityForm((prev) => ({
                          ...prev,
                          confirmPassword: event.target.value,
                        }))
                      }
                      className={inputClassName}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <button
                      type="submit"
                      disabled={updatingPassword}
                      className="inline-flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updatingPassword ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Shield className="h-4 w-4" />
                      )}
                      Update password
                    </button>
                  </div>
                </form>
              </section>
            </div>

            <div className="space-y-4">
              <section className="rounded-2xl bg-white/10 p-5 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
                <div className="mb-3 flex items-center gap-2">
                  <UserCircle2 className="h-4 w-4 text-accent-primary" />
                  <h2 className="font-header font-semibold">Account snapshot</h2>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      User
                    </p>
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      {user?.username || user?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Email
                    </p>
                    <p className="text-slate-700 dark:text-slate-200">
                      {user?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Workspace
                    </p>
                    <p className="text-slate-700 dark:text-slate-200">
                      {activeTenant?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Landing page
                    </p>
                    <p className="text-slate-700 dark:text-slate-200">
                      {formatLandingPage(userPreferences.landingPage)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Theme
                    </p>
                    <p className="text-slate-700 dark:text-slate-200">
                      {formatTheme(userPreferences.themePreference)}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl bg-white/10 p-5 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent-primary" />
                  <h2 className="font-header font-semibold">Access</h2>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {canManageWorkspaceSettings
                    ? "Your role can manage workspace-level settings."
                    : "Your role can edit only personal preferences and security."}
                </p>
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                  Organization slug:{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {organizationSettings.organizationSlug || "N/A"}
                  </span>
                </div>
                {isEnterprisePlan ? (
                  <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-accent-primary" />
                      Custom domain:
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {organizationSettings.customDomain || "Not set"}
                      </span>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="rounded-2xl bg-white/10 p-5 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
                <div className="mb-3 flex items-center gap-2">
                  <Crown className="h-4 w-4 text-accent-primary" />
                  <h2 className="font-header font-semibold">Plan</h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Active plan
                </p>
                <p className="mt-1 text-xl font-semibold font-header">
                  {currentPlan.name}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {currentPlan.tagline}
                </p>
                <div className="mt-4 space-y-2">
                  {currentPlan.highlights.slice(0, 3).map((item) => (
                    <div
                      key={item}
                      className="text-xs text-slate-600 dark:text-slate-300"
                    >
                      • {item}
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Link
                    to="/billing"
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Manage billing
                  </Link>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>

      <GlassToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />
    </DashboardLayout>
  );
}
