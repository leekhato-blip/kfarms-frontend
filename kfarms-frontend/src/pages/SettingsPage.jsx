import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Bell,
  Building2,
  CheckCircle2,
  Crown,
  Globe,
  MessageSquare,
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
import {
  createTenantUserProfileDraft,
  saveTenantUserProfile,
} from "../services/userProfileService";
import {
  ACCOUNT_PASSWORD_MIN_LENGTH,
  validateAccountPassword,
} from "../utils/accountValidation";

const inputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 dark:border-white/10 dark:bg-darkCard/70 dark:text-darkText";
const selectClassName = `${inputClassName} [color-scheme:light] dark:[color-scheme:dark]`;

const TENANT_SETTINGS_SECTIONS = Object.freeze([
  {
    id: "profile",
    label: "Profile",
    description: "Name, phone, title, and bio",
    icon: UserCircle2,
  },
  {
    id: "workspace",
    label: "Workspace",
    description: "Brand, contact, and organization defaults",
    icon: Building2,
  },
  {
    id: "preferences",
    label: "Preferences",
    description: "Theme, landing page, and notifications",
    icon: Bell,
  },
  {
    id: "security",
    label: "Security",
    description: "Password and sign-in protection",
    icon: Shield,
  },
  {
    id: "overview",
    label: "Overview",
    description: "Account snapshot, access, and plan",
    icon: CheckCircle2,
  },
]);

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

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

function resolveTenantSettingsSection(sectionId) {
  const normalized = String(sectionId || "")
    .trim()
    .toLowerCase();
  return TENANT_SETTINGS_SECTIONS.some((section) => section.id === normalized)
    ? normalized
    : "profile";
}

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, updateProfile } = useAuth();
  const { activeTenant, activeTenantId, refreshTenants } = useTenant();

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
  const [activeSection, setActiveSection] = React.useState(() =>
    resolveTenantSettingsSection(searchParams.get("section")),
  );
  const [userProfile, setUserProfile] = React.useState(() =>
    createTenantUserProfileDraft(user),
  );
  const [userProfileSnapshot, setUserProfileSnapshot] = React.useState(() =>
    createTenantUserProfileDraft(user),
  );
  const [securityForm, setSecurityForm] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingProfile, setSavingProfile] = React.useState(false);
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
  const profileDirty = React.useMemo(
    () => !isSame(userProfile, userProfileSnapshot),
    [userProfile, userProfileSnapshot],
  );
  const brandPreviewStyle = React.useMemo(
    () => ({
      borderColor: `${organizationSettings.brandPrimaryColor}40`,
      background: `linear-gradient(135deg, ${organizationSettings.brandPrimaryColor}20, ${organizationSettings.brandAccentColor}18)`,
    }),
    [organizationSettings.brandAccentColor, organizationSettings.brandPrimaryColor],
  );
  const activeSectionMeta = React.useMemo(
    () =>
      TENANT_SETTINGS_SECTIONS.find((section) => section.id === activeSection) ||
      TENANT_SETTINGS_SECTIONS[0],
    [activeSection],
  );

  React.useEffect(() => {
    const nextSection = resolveTenantSettingsSection(searchParams.get("section"));
    if (nextSection !== activeSection) {
      setActiveSection(nextSection);
    }
  }, [activeSection, searchParams]);

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
    const nextProfile = createTenantUserProfileDraft(user);
    setUserProfile(nextProfile);
    setUserProfileSnapshot(nextProfile);
  }, [user]);

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

  function handleProfileChange(field, value) {
    setUserProfile((prev) => ({ ...prev, [field]: value }));
  }

  function handleSectionChange(sectionId) {
    const nextSection = resolveTenantSettingsSection(sectionId);
    setActiveSection(nextSection);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("section", nextSection);
    setSearchParams(nextParams, { replace: true });
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
      await refreshTenants({ force: true }).catch(() => null);
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

  async function handleSaveProfile() {
    if (!user || savingProfile) return;

    setSavingProfile(true);
    try {
      const savedProfile = saveTenantUserProfile({ user, profile: userProfile });
      const nextUser =
        updateProfile?.(savedProfile) ||
        {
          ...user,
          displayName: savedProfile.displayName || user?.displayName,
          phoneNumber: savedProfile.phoneNumber || user?.phoneNumber,
          jobTitle: savedProfile.jobTitle || user?.jobTitle,
          bio: savedProfile.bio || user?.bio,
        };
      const nextProfile = createTenantUserProfileDraft(nextUser);
      setUserProfile(nextProfile);
      setUserProfileSnapshot(nextProfile);
      setToast({
        message: "Your profile details were updated for this device.",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: error?.message || "Could not update your profile right now.",
        type: "error",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleUpdatePassword(event) {
    event.preventDefault();
    if (updatingPassword) return;

    const passwordError = validateAccountPassword(
      securityForm.newPassword,
      ACCOUNT_PASSWORD_MIN_LENGTH,
    );
    if (passwordError) {
      setToast({ message: passwordError, type: "error" });
      return;
    }

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setToast({
        message: "New password and confirmation do not match.",
        type: "error",
      });
      return;
    }

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

  function resetProfileChanges() {
    setUserProfile(userProfileSnapshot);
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
            ? "Workspace changes save directly to the backend for everyone in this organization. Personal profile details update this device instantly."
            : "You can update your profile, preferences, and password here. Workspace details are view-only for your role."}
        </div>

        {!loading ? (
          <section className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Settings Sections
                </div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Open one section at a time so the page stays calmer and easier to scan.
                </div>
              </div>
              <div className="rounded-full border border-accent-primary/20 bg-accent-primary/8 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                Viewing: {activeSectionMeta.label}
              </div>
            </div>

            <div className="hide-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
              {TENANT_SETTINGS_SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = section.id === activeSection;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => handleSectionChange(section.id)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                      isActive
                        ? "border-accent-primary/35 bg-accent-primary/12 text-slate-900 dark:text-white"
                        : "border-slate-200 bg-white/70 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10",
                    )}
                    aria-pressed={isActive}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {activeSectionMeta.description}
            </div>
          </section>
        ) : null}

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
          <div className="space-y-4">
            <div className={cn("space-y-4", activeSection === "overview" && "hidden")}>
              <section
                className={cn(
                  "rounded-2xl bg-white/10 p-5 shadow-neo dark:bg-darkCard/70 dark:shadow-dark",
                  activeSection !== "profile" && "hidden",
                )}
              >
                <div className="mb-4 flex items-center gap-2">
                  <UserCircle2 className="h-4 w-4 text-accent-primary" />
                  <div>
                    <h2 className="font-header font-semibold">Profile</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Edit how your tenant account appears across KFarms on this device.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                      Display name
                    </label>
                    <input
                      type="text"
                      value={userProfile.displayName}
                      onChange={(event) =>
                        handleProfileChange("displayName", event.target.value)
                      }
                      className={inputClassName}
                      placeholder="How teammates should see your name"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                      Phone number
                    </label>
                    <input
                      type="text"
                      value={userProfile.phoneNumber}
                      onChange={(event) =>
                        handleProfileChange("phoneNumber", event.target.value)
                      }
                      className={inputClassName}
                      placeholder="+234..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                      Job title
                    </label>
                    <input
                      type="text"
                      value={userProfile.jobTitle}
                      onChange={(event) =>
                        handleProfileChange("jobTitle", event.target.value)
                      }
                      className={inputClassName}
                      placeholder="Farm manager, operations lead, accountant..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                      Short bio
                    </label>
                    <textarea
                      rows={3}
                      value={userProfile.bio}
                      onChange={(event) =>
                        handleProfileChange("bio", event.target.value)
                      }
                      className={`${inputClassName} py-3`}
                      placeholder="Add a short note about what you handle in this workspace."
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Account email:{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {user?.email || "Not available"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={resetProfileChanges}
                      disabled={!profileDirty || savingProfile}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={!profileDirty || savingProfile}
                      className="inline-flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingProfile ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save profile
                    </button>
                  </div>
                </div>
              </section>

              <section
                className={cn(
                  "rounded-2xl bg-white/10 p-5 shadow-neo dark:bg-darkCard/70 dark:shadow-dark",
                  activeSection !== "workspace" && "hidden",
                )}
              >
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
                      <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-xl bg-amber-500/10 p-2 text-amber-500">
                            <MessageSquare className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                              <input
                                type="checkbox"
                                checked={organizationSettings.criticalSmsAlertsEnabled}
                                onChange={(event) =>
                                  handleOrganizationChange(
                                    "criticalSmsAlertsEnabled",
                                    event.target.checked,
                                  )
                                }
                                className="h-4 w-4 rounded border-slate-300"
                              />
                              Send SMS for critical farm alerts
                            </label>
                            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                              Only very important alerts like high mortality, low
                              stock, and water-change warnings will be sent by SMS.
                              Messages use the workspace contact phone above.
                            </p>
                            {!organizationSettings.contactPhone ? (
                              <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                                Add a workspace contact phone before enabling SMS
                                alerts.
                              </p>
                            ) : (
                              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                Active delivery number:{" "}
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                  {organizationSettings.contactPhone}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
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

              <section
                className={cn(
                  "rounded-2xl bg-white/10 p-5 shadow-neo dark:bg-darkCard/70 dark:shadow-dark",
                  activeSection !== "preferences" && "hidden",
                )}
              >
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

              <section
                className={cn(
                  "rounded-2xl bg-white/10 p-5 shadow-neo dark:bg-darkCard/70 dark:shadow-dark",
                  activeSection !== "security" && "hidden",
                )}
              >
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

            {activeSection === "overview" ? (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
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
                        {user?.displayName || user?.username || user?.email || "N/A"}
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
                        Phone
                      </p>
                      <p className="text-slate-700 dark:text-slate-200">
                        {user?.phoneNumber || "Not added"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Title
                      </p>
                      <p className="text-slate-700 dark:text-slate-200">
                        {user?.jobTitle || "Not added"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Verification
                      </p>
                      <p className="text-slate-700 dark:text-slate-200">
                        Email {user?.emailVerified === false ? "pending" : "verified"} · Phone{" "}
                        {user?.phoneVerified === false ? "pending" : "verified"}
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
            ) : null}
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
