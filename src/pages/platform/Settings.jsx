import React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  BellRing,
  Blocks,
  Building2,
  Globe2,
  LockKeyhole,
  RefreshCw,
  Shield,
  SlidersHorizontal,
  Sparkles,
  UserCircle2,
  Users,
} from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import { useToast } from "../../components/ToastProvider";
import { usePlatformAuth } from "../../auth/AuthProvider";
import { PLATFORM_ENDPOINTS } from "../../api/endpoints";
import {
  getApiErrorMessage,
  platformAxios,
  unwrapApiResponse,
} from "../../api/platformClient";
import {
  PLATFORM_CONTROL_SETTINGS_KEY,
} from "../../constants/platformControlSettings";
import { TIMEZONE_OPTIONS } from "../../constants/settings";
import {
  createPlatformUserProfileDraft,
  savePlatformUserProfile,
} from "../../services/userProfileService";
import { formatNumber } from "../../utils/formatters";
import { getPlatformRoleLabel } from "../../utils/platformRoles";
import {
  resolvePlatformAccessTier,
  resolvePlatformUserEnabled,
} from "./platformInsights";
import {
  buildPlatformDemoSnapshot,
  buildPlatformLiveSnapshot,
  getPlatformCatalogApps,
} from "./platformWorkbench";
import { writePlatformControlSettings } from "../../utils/platformControlStore";
import {
  DEFAULT_PROMOTION_APP_ID,
  getAppPromotion,
  getPromotionPreview,
  normalizePlatformPromotions,
  updateAppPromotion,
} from "../../utils/platformPromotions";

const FALLBACK_OVERVIEW = {
  totalTenants: 0,
  activeTenants: 0,
  suspendedTenants: 0,
  totalUsers: 0,
  platformAdmins: 0,
};

const PLATFORM_ACCOUNT_SETTINGS_KEY = "kf_platform_account_settings";

const DEFAULT_PLATFORM_CONTROL_SETTINGS = Object.freeze({
  controlPlaneName: "ROOTS Network",
  operationsEmail: "",
  timezone: "Africa/Lagos",
  releaseChannel: "production",
  auditRetentionDays: "180",
  adminChangeAlerts: true,
  revenueVisibility: true,
  riskyActionConfirmation: true,
  maintenanceBannerEnabled: false,
  promotions: normalizePlatformPromotions({}),
});

const DEFAULT_PLATFORM_ACCOUNT_SETTINGS = Object.freeze({
  startPage: "/platform",
  timezone: "Africa/Lagos",
  emailUpdates: true,
  securityAlerts: true,
  weeklyDigest: true,
  compactNavigation: false,
  commandHints: true,
});

const RELEASE_CHANNEL_OPTIONS = Object.freeze([
  { value: "production", label: "Production" },
  { value: "staged", label: "Staged rollout" },
  { value: "internal", label: "Internal only" },
]);

const AUDIT_RETENTION_OPTIONS = Object.freeze([
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "180", label: "180 days" },
  { value: "365", label: "365 days" },
]);

const BONANZA_TYPE_OPTIONS = Object.freeze([
  { value: "discount", label: "Temporary discount" },
  { value: "trial", label: "Free trial month" },
  { value: "bonus-month", label: "Extra free month" },
]);

const BONANZA_DURATION_OPTIONS = Object.freeze([
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
]);

const BONANZA_TRIAL_OPTIONS = Object.freeze([
  { value: "1", label: "1 month" },
  { value: "2", label: "2 months" },
  { value: "3", label: "3 months" },
]);

const PLATFORM_START_PAGE_OPTIONS = Object.freeze([
  { value: "/platform", label: "Hub" },
  { value: "/platform/apps", label: "Apps" },
  { value: "/platform/tenants", label: "Tenants" },
  { value: "/platform/users", label: "Users" },
  { value: "/platform/health", label: "Health" },
  { value: "/platform/settings", label: "Settings" },
]);

const PLATFORM_SETTINGS_SECTIONS = Object.freeze([
  {
    id: "platform",
    label: "Platform",
    description: "ROOTS-wide defaults and safeguards",
    icon: SlidersHorizontal,
  },
  {
    id: "profile",
    label: "Profile",
    description: "How this admin account appears",
    icon: UserCircle2,
  },
  {
    id: "preferences",
    label: "Preferences",
    description: "Personal ROOTS navigation and alerts",
    icon: BellRing,
  },
  {
    id: "links",
    label: "Links",
    description: "Jump to related platform areas",
    icon: ArrowUpRight,
  },
  {
    id: "posture",
    label: "Posture",
    description: "Access boundary and platform posture",
    icon: Shield,
  },
]);

const inputClassName =
  "mt-1 h-11 w-full rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 text-sm text-[var(--atlas-text-strong)] outline-none placeholder:text-[var(--atlas-muted-soft)] focus:border-[color:var(--atlas-border-strong)]";

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

function readStoredState(key, fallback, normalize) {
  if (typeof window === "undefined") {
    return normalize(fallback);
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return normalize(fallback);
    return normalize(JSON.parse(raw));
  } catch {
    return normalize(fallback);
  }
}

function writeStoredState(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function findLabel(options, value, fallback = value) {
  return options.find((option) => option.value === value)?.label || fallback;
}

function isSame(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function normalizePlatformControlSettings(settings = {}) {
  return {
    controlPlaneName: String(
      settings.controlPlaneName ?? DEFAULT_PLATFORM_CONTROL_SETTINGS.controlPlaneName,
    ).trim(),
    operationsEmail: String(
      settings.operationsEmail ?? DEFAULT_PLATFORM_CONTROL_SETTINGS.operationsEmail,
    ).trim(),
    timezone: String(settings.timezone ?? DEFAULT_PLATFORM_CONTROL_SETTINGS.timezone).trim(),
    releaseChannel: String(
      settings.releaseChannel ?? DEFAULT_PLATFORM_CONTROL_SETTINGS.releaseChannel,
    ).trim(),
    auditRetentionDays: String(
      settings.auditRetentionDays ?? DEFAULT_PLATFORM_CONTROL_SETTINGS.auditRetentionDays,
    ).trim(),
    adminChangeAlerts:
      settings.adminChangeAlerts ??
      DEFAULT_PLATFORM_CONTROL_SETTINGS.adminChangeAlerts,
    revenueVisibility:
      settings.revenueVisibility ?? DEFAULT_PLATFORM_CONTROL_SETTINGS.revenueVisibility,
    riskyActionConfirmation:
      settings.riskyActionConfirmation ??
      DEFAULT_PLATFORM_CONTROL_SETTINGS.riskyActionConfirmation,
    maintenanceBannerEnabled:
      settings.maintenanceBannerEnabled ??
      DEFAULT_PLATFORM_CONTROL_SETTINGS.maintenanceBannerEnabled,
    promotions: normalizePlatformPromotions(settings),
  };
}

function normalizePlatformAccountSettings(settings = {}) {
  return {
    startPage: String(
      settings.startPage ?? DEFAULT_PLATFORM_ACCOUNT_SETTINGS.startPage,
    ).trim(),
    timezone: String(settings.timezone ?? DEFAULT_PLATFORM_ACCOUNT_SETTINGS.timezone).trim(),
    emailUpdates:
      settings.emailUpdates ?? DEFAULT_PLATFORM_ACCOUNT_SETTINGS.emailUpdates,
    securityAlerts:
      settings.securityAlerts ?? DEFAULT_PLATFORM_ACCOUNT_SETTINGS.securityAlerts,
    weeklyDigest:
      settings.weeklyDigest ?? DEFAULT_PLATFORM_ACCOUNT_SETTINGS.weeklyDigest,
    compactNavigation:
      settings.compactNavigation ??
      DEFAULT_PLATFORM_ACCOUNT_SETTINGS.compactNavigation,
    commandHints:
      settings.commandHints ?? DEFAULT_PLATFORM_ACCOUNT_SETTINGS.commandHints,
  };
}

function SettingsField({ label, hint, children }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
        {label}
      </div>
      {hint ? (
        <div className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">{hint}</div>
      ) : null}
      {children}
    </label>
  );
}

function ToggleRow({ label, hint, checked, onChange }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/78 px-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">{label}</div>
        <div className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">{hint}</div>
      </div>
      <span className="mt-0.5 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 rounded border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] text-blue-500 focus:ring-blue-400/40"
        />
      </span>
    </label>
  );
}

export default function PlatformSettingsPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const { user: currentUser, profileLoading, updateProfile } = usePlatformAuth();
  const {
    customApps = [],
    platformDataMode = "live",
    platformLimitedAccess = false,
  } = useOutletContext() || {};
  const demoSnapshot = React.useMemo(
    () => buildPlatformDemoSnapshot(customApps),
    [customApps],
  );
  const liveSnapshot = React.useMemo(() => buildPlatformLiveSnapshot(), []);

  const [overview, setOverview] = React.useState(FALLBACK_OVERVIEW);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [savingPlatform, setSavingPlatform] = React.useState(false);
  const [savingAccount, setSavingAccount] = React.useState(false);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState("platform");
  const [platformSettings, setPlatformSettings] = React.useState(() =>
    readStoredState(
      PLATFORM_CONTROL_SETTINGS_KEY,
      DEFAULT_PLATFORM_CONTROL_SETTINGS,
      normalizePlatformControlSettings,
    ),
  );
  const [selectedPromotionAppId, setSelectedPromotionAppId] = React.useState(
    DEFAULT_PROMOTION_APP_ID,
  );
  const [accountSettings, setAccountSettings] = React.useState(() =>
    readStoredState(
      PLATFORM_ACCOUNT_SETTINGS_KEY,
      DEFAULT_PLATFORM_ACCOUNT_SETTINGS,
      normalizePlatformAccountSettings,
    ),
  );
  const [userProfile, setUserProfile] = React.useState(() =>
    createPlatformUserProfileDraft(currentUser),
  );
  const [userProfileSnapshot, setUserProfileSnapshot] = React.useState(() =>
    createPlatformUserProfileDraft(currentUser),
  );
  const promotionApps = React.useMemo(
    () => getPlatformCatalogApps(customApps),
    [customApps],
  );

  React.useEffect(() => {
    if (!promotionApps.length) return;

    if (promotionApps.some((app) => app.id === selectedPromotionAppId)) {
      return;
    }

    setSelectedPromotionAppId(
      promotionApps[0]?.id || DEFAULT_PROMOTION_APP_ID,
    );
  }, [promotionApps, selectedPromotionAppId]);

  const loadOverview = React.useCallback(async () => {
    setLoading(true);
    setError("");

    if (platformDataMode === "demo") {
      setOverview(demoSnapshot.metrics);
      setLoading(false);
      return;
    }

    try {
      const response = await platformAxios.get(PLATFORM_ENDPOINTS.overview);
      const payload = unwrapApiResponse(
        response.data,
        "Failed to load platform overview",
      );
      const nextOverview = { ...FALLBACK_OVERVIEW, ...(payload || {}) };
      setOverview(nextOverview);
    } catch (loadError) {
      setOverview(liveSnapshot.metrics);
      setError(
        platformLimitedAccess
          ? ""
          : getApiErrorMessage(loadError, "Failed to load platform settings"),
      );
    } finally {
      setLoading(false);
    }
  }, [demoSnapshot.metrics, liveSnapshot.metrics, platformDataMode, platformLimitedAccess]);

  React.useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  React.useEffect(() => {
    if (platformDataMode === "live" && error && !platformLimitedAccess) {
      notify("Platform settings are showing partial live data right now.", "info");
    }
  }, [error, notify, platformDataMode, platformLimitedAccess]);

  React.useEffect(() => {
    const nextProfile = createPlatformUserProfileDraft(currentUser);
    setUserProfile(nextProfile);
    setUserProfileSnapshot(nextProfile);
  }, [currentUser]);

  const platformTimezoneLabel = findLabel(
    TIMEZONE_OPTIONS,
    platformSettings.timezone,
    platformSettings.timezone,
  );
  const accountTimezoneLabel = findLabel(
    TIMEZONE_OPTIONS,
    accountSettings.timezone,
    accountSettings.timezone,
  );
  const startPageLabel = findLabel(
    PLATFORM_START_PAGE_OPTIONS,
    accountSettings.startPage,
    accountSettings.startPage,
  );
  const currentAccessTier = React.useMemo(
    () => resolvePlatformAccessTier(currentUser),
    [currentUser],
  );
  const currentUserEnabled = React.useMemo(
    () => resolvePlatformUserEnabled(currentUser),
    [currentUser],
  );
  const releaseChannelLabel = findLabel(
    RELEASE_CHANNEL_OPTIONS,
    platformSettings.releaseChannel,
    platformSettings.releaseChannel,
  );
  const selectedPromotionApp = React.useMemo(
    () =>
      promotionApps.find((app) => app.id === selectedPromotionAppId) ||
      promotionApps[0] ||
      null,
    [promotionApps, selectedPromotionAppId],
  );
  const selectedPromotion = React.useMemo(
    () =>
      getAppPromotion(platformSettings, {
        appId: selectedPromotionApp?.id || DEFAULT_PROMOTION_APP_ID,
      }),
    [platformSettings, selectedPromotionApp],
  );
  const promoTypeLabel = findLabel(
    BONANZA_TYPE_OPTIONS,
    selectedPromotion.type,
    selectedPromotion.type,
  );
  const promoDurationLabel = findLabel(
    BONANZA_DURATION_OPTIONS,
    selectedPromotion.durationDays,
    selectedPromotion.durationDays,
  );
  const promoPreview = React.useMemo(() => {
    return getPromotionPreview(selectedPromotion, {
      appName: selectedPromotionApp?.name || "this app",
      planLabel: selectedPromotion.planId,
    });
  }, [selectedPromotion, selectedPromotionApp]);
  const profileDirty = !isSame(userProfile, userProfileSnapshot);
  const activeSectionMeta =
    PLATFORM_SETTINGS_SECTIONS.find((section) => section.id === activeSection) ||
    PLATFORM_SETTINGS_SECTIONS[0];

  const quickLinks = [
    {
      title: "Access control",
      detail: "Review roles, admin cover, and account state.",
      to: "/platform/users",
      icon: Users,
    },
    {
      title: "Tenant posture",
      detail: "Review plan, status, and suspension state.",
      to: "/platform/tenants",
      icon: Building2,
    },
    {
      title: "Platform health",
      detail: "Track risk, health, and capacity.",
      to: "/platform/health",
      icon: Activity,
    },
    {
      title: "App portfolio",
      detail: "Track apps, revenue, and status.",
      to: "/platform/apps",
      icon: Blocks,
    },
  ];

  function savePlatformSettings() {
    const nextSettings = normalizePlatformControlSettings(platformSettings);
    setSavingPlatform(true);
    writePlatformControlSettings(nextSettings);
    setPlatformSettings(nextSettings);
    window.setTimeout(() => {
      setSavingPlatform(false);
      notify(
        "Settings saved for this session.",
        "success",
      );
    }, 220);
  }

  function saveAccountSettings() {
    const nextSettings = normalizePlatformAccountSettings(accountSettings);
    setSavingAccount(true);
    writeStoredState(PLATFORM_ACCOUNT_SETTINGS_KEY, nextSettings);
    setAccountSettings(nextSettings);
    window.setTimeout(() => {
      setSavingAccount(false);
      notify("Account preferences saved for this session.", "success");
    }, 220);
  }

  function resetPlatformSettings() {
    const nextSettings = normalizePlatformControlSettings(
      DEFAULT_PLATFORM_CONTROL_SETTINGS,
    );
    setPlatformSettings(nextSettings);
    writePlatformControlSettings(nextSettings);
    notify("Platform settings reset.", "info");
  }

  function resetAccountSettings() {
    const nextSettings = normalizePlatformAccountSettings(
      DEFAULT_PLATFORM_ACCOUNT_SETTINGS,
    );
    setAccountSettings(nextSettings);
    writeStoredState(PLATFORM_ACCOUNT_SETTINGS_KEY, nextSettings);
    notify("Account preferences reset.", "info");
  }

  function saveUserProfile() {
    if (!currentUser) return;

    setSavingProfile(true);

    try {
      const savedProfile = savePlatformUserProfile({
        user: currentUser,
        profile: userProfile,
      });
      const nextUser =
        updateProfile?.(savedProfile) ||
        {
          ...currentUser,
          displayName: savedProfile.displayName || currentUser?.displayName,
          phoneNumber: savedProfile.phoneNumber || currentUser?.phoneNumber,
          jobTitle: savedProfile.jobTitle || currentUser?.jobTitle,
          bio: savedProfile.bio || currentUser?.bio,
        };
      const nextProfile = createPlatformUserProfileDraft(nextUser);
      setUserProfile(nextProfile);
      setUserProfileSnapshot(nextProfile);
      notify("Profile details updated for this admin session.", "success");
    } finally {
      setSavingProfile(false);
    }
  }

  function updatePromoSettings(updater) {
    setPlatformSettings((current) => {
      const currentPromotion = getAppPromotion(current, {
        appId: selectedPromotionApp?.id || DEFAULT_PROMOTION_APP_ID,
      });
      const patch =
        typeof updater === "function" ? updater(currentPromotion) : updater;
      const nextSettings = normalizePlatformControlSettings({
        ...current,
        promotions: updateAppPromotion(
          current.promotions,
          selectedPromotionApp?.id || DEFAULT_PROMOTION_APP_ID,
          patch,
        ),
      });
      writePlatformControlSettings(nextSettings);
      return nextSettings;
    });
  }

  function resetUserProfile() {
    setUserProfile(userProfileSnapshot);
    notify("Profile changes discarded.", "info");
  }

  return (
    <div className="space-y-4">
      <Card className="atlas-stage-card p-5">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="atlas-signal-chip w-fit">
              <SlidersHorizontal size={12} />
              Platform Settings
            </div>
            <h1 className="mt-5 font-header text-3xl font-semibold leading-tight text-[var(--atlas-text-strong)] md:text-[2.3rem]">
              ROOTS platform settings.
            </h1>
            <div className="mt-3 text-sm leading-7 text-[var(--atlas-muted)]">
              Set defaults, controls, and admin flow.
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadOverview} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </Card>

      {error ? (
        <div className="rounded-md border border-violet-300/60 bg-violet-50 px-3 py-2 text-sm text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/20 dark:text-violet-100">
          {error}
        </div>
      ) : null}

      <section className="rounded-[1.4rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/72 px-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--atlas-muted)]">
              Settings sections
            </div>
            <div className="mt-2 text-sm leading-6 text-[var(--atlas-muted)]">
              Work one settings area at a time.
            </div>
          </div>
          <div className="rounded-full border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--atlas-text-strong)]">
            Viewing: {activeSectionMeta.label}
          </div>
        </div>

        <div className="hide-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {PLATFORM_SETTINGS_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = section.id === activeSection;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                  isActive
                    ? "border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface)] text-[var(--atlas-text-strong)]"
                    : "border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/78 text-[var(--atlas-text)] hover:bg-[color:var(--atlas-surface-hover)]",
                )}
                aria-pressed={isActive}
              >
                <Icon size={15} />
                <span className="font-medium">{section.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 text-xs text-[var(--atlas-muted)]">
          {activeSectionMeta.description}
        </div>
      </section>

      {activeSection === "platform" ? (
        <Card className="atlas-stage-card p-5">
          <div className="relative z-10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-2xl">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--atlas-muted)]">
                  Platform configuration
                </div>
                <h2 className="mt-1 text-xl font-semibold text-[var(--atlas-text-strong)]">
                  Shared ROOTS settings
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--atlas-muted)]">
                  These settings apply at the platform level, not inside a single workspace.
                </p>
              </div>
              <div className="rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/78 px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                  Current setup
                </div>
                <div className="mt-2 text-lg font-semibold text-[var(--atlas-text-strong)]">
                  {releaseChannelLabel}
                </div>
                <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                  {platformTimezoneLabel} · {platformSettings.auditRetentionDays} day audit window
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <SettingsField
                label="Platform identity"
                hint="Shown as the platform name."
              >
                <input
                  type="text"
                  value={platformSettings.controlPlaneName}
                  onChange={(event) =>
                    setPlatformSettings((current) => ({
                      ...current,
                      controlPlaneName: event.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder="ROOTS Network"
                />
              </SettingsField>

              <SettingsField
                label="Operations email"
                hint="Mailbox for ops and escalations."
              >
                <input
                  type="email"
                  value={platformSettings.operationsEmail}
                  onChange={(event) =>
                    setPlatformSettings((current) => ({
                      ...current,
                      operationsEmail: event.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder="ops@roots.local"
                />
              </SettingsField>

              <SettingsField
                label="Platform timezone"
                hint="Timezone for platform time."
              >
                <select
                  value={platformSettings.timezone}
                  onChange={(event) =>
                    setPlatformSettings((current) => ({
                      ...current,
                      timezone: event.target.value,
                    }))
                  }
                  className={inputClassName}
                >
                  {TIMEZONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </SettingsField>

              <SettingsField
                label="Release channel"
                hint="Controls rollout speed."
              >
                <select
                  value={platformSettings.releaseChannel}
                  onChange={(event) =>
                    setPlatformSettings((current) => ({
                      ...current,
                      releaseChannel: event.target.value,
                    }))
                  }
                  className={inputClassName}
                >
                  {RELEASE_CHANNEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </SettingsField>

              <SettingsField
                label="Audit retention"
                hint="How long audit history stays."
              >
                <select
                  value={platformSettings.auditRetentionDays}
                  onChange={(event) =>
                    setPlatformSettings((current) => ({
                      ...current,
                      auditRetentionDays: event.target.value,
                    }))
                  }
                  className={inputClassName}
                >
                  {AUDIT_RETENTION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </SettingsField>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-[1.35rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/78 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface)] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                      <Sparkles size={12} />
                      Promo ideas
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-[var(--atlas-text-strong)]">
                      Plan temporary promos from the platform side
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--atlas-muted)]">
                      Keep promo settings per app, so KFarms can run one offer now and future apps
                      can carry their own pricing ideas later without sharing the same draft.
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface)] px-4 py-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                      Draft status
                    </div>
                    <div className="mt-2 text-sm font-semibold text-[var(--atlas-text-strong)]">
                      {selectedPromotion.enabled ? "Promo ready" : "No active draft"}
                    </div>
                    <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                      {(selectedPromotionApp?.name || "Selected app")} · {promoTypeLabel} ·{" "}
                      {promoDurationLabel}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <ToggleRow
                    label="Promo draft"
                    hint="Turn this on only for the app you are editing right now."
                    checked={selectedPromotion.enabled}
                    onChange={(checked) =>
                      updatePromoSettings({ enabled: checked })
                    }
                  />
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <SettingsField
                    label="App"
                    hint="Pick the app that should receive this promo draft."
                  >
                    <select
                      value={selectedPromotionApp?.id || DEFAULT_PROMOTION_APP_ID}
                      onChange={(event) => setSelectedPromotionAppId(event.target.value)}
                      className={inputClassName}
                    >
                      {promotionApps.map((app) => (
                        <option key={app.id} value={app.id}>
                          {app.name}
                        </option>
                      ))}
                    </select>
                  </SettingsField>

                  <SettingsField
                    label="Target plan"
                    hint="Use a plan code or price lane name for the selected app."
                  >
                    <input
                      type="text"
                      value={selectedPromotion.planId}
                      onChange={(event) =>
                        updatePromoSettings({
                          enabled: true,
                          planId: event.target.value,
                        })
                      }
                      className={inputClassName}
                      placeholder="PRO"
                    />
                  </SettingsField>

                  <SettingsField
                    label="Offer type"
                    hint="Choose the type of promo you want to run."
                  >
                    <select
                      value={selectedPromotion.type}
                      onChange={(event) =>
                        updatePromoSettings({
                          enabled: true,
                          type: event.target.value,
                        })
                      }
                      className={inputClassName}
                    >
                      {BONANZA_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </SettingsField>

                  <SettingsField
                    label="Offer window"
                    hint="How long the promo should stay available."
                  >
                    <select
                      value={selectedPromotion.durationDays}
                      onChange={(event) =>
                        updatePromoSettings({
                          enabled: true,
                          durationDays: event.target.value,
                        })
                      }
                      className={inputClassName}
                    >
                      {BONANZA_DURATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </SettingsField>

                  {selectedPromotion.type === "discount" ? (
                    <SettingsField
                      label="Promo price"
                      hint="Use this to plan a temporary drop like NGN 10,000 to NGN 7,000."
                    >
                      <input
                        type="text"
                        value={selectedPromotion.discountPrice}
                        onChange={(event) =>
                          updatePromoSettings({
                            enabled: true,
                            discountPrice: event.target.value,
                          })
                        }
                        className={inputClassName}
                        placeholder="7000"
                      />
                    </SettingsField>
                  ) : null}

                  {selectedPromotion.type === "trial" ? (
                    <SettingsField
                      label="Free trial length"
                      hint="Give farms some time before the first paid billing cycle starts."
                    >
                      <select
                        value={selectedPromotion.trialMonths}
                        onChange={(event) =>
                          updatePromoSettings({
                            enabled: true,
                            trialMonths: event.target.value,
                          })
                        }
                        className={inputClassName}
                      >
                        {BONANZA_TRIAL_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </SettingsField>
                  ) : null}
                </div>

                <div className="mt-4 rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface)] px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                    Current promo plan
                  </div>
                  <div className="mt-2 text-sm font-semibold text-[var(--atlas-text-strong)]">
                    {(selectedPromotionApp?.name || "Selected app")} · {selectedPromotion.planId}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[var(--atlas-muted)]">
                    {promoPreview}
                  </p>
                  <p className="mt-2 text-xs text-[var(--atlas-muted)]">
                    KFarms reads this promo into its live pricing cards now. Other apps can keep
                    their own drafts here until their billing pages are ready.
                  </p>
                  <div className="mt-3 grid gap-2 text-xs text-[var(--atlas-muted)] md:grid-cols-3">
                    <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/78 px-3 py-2">
                      Temporary discount: show the regular price crossed out and the offer price clearly.
                    </div>
                    <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/78 px-3 py-2">
                      Free trial: let new farms use the product for a month before billing starts.
                    </div>
                    <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/78 px-3 py-2">
                      Bonus month: reward annual or early commitment with extra time at no extra cost.
                    </div>
                  </div>
                </div>
              </div>

              <ToggleRow
                label="Admin change alerts"
                hint="Alert admins when access changes."
                checked={platformSettings.adminChangeAlerts}
                onChange={(checked) =>
                  setPlatformSettings((current) => ({
                    ...current,
                    adminChangeAlerts: checked,
                  }))
                }
              />
              <ToggleRow
                label="Revenue visibility"
                hint="Show revenue in platform analytics."
                checked={platformSettings.revenueVisibility}
                onChange={(checked) =>
                  setPlatformSettings((current) => ({
                    ...current,
                    revenueVisibility: checked,
                  }))
                }
              />
              <ToggleRow
                label="High-risk action confirmation"
                hint="Confirm high-impact actions."
                checked={platformSettings.riskyActionConfirmation}
                onChange={(checked) =>
                  setPlatformSettings((current) => ({
                    ...current,
                    riskyActionConfirmation: checked,
                  }))
                }
              />
              <ToggleRow
                label="Maintenance banner"
                hint="Show a platform-wide maintenance note."
                checked={platformSettings.maintenanceBannerEnabled}
                onChange={(checked) =>
                  setPlatformSettings((current) => ({
                    ...current,
                    maintenanceBannerEnabled: checked,
                  }))
                }
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/78 px-4 py-3">
              <div className="text-sm leading-6 text-[var(--atlas-muted)]">
                These controls are stored locally for now. We can wire them to a backend ROOTS
                settings API next so they apply across devices and admins.
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={resetPlatformSettings}>
                  Reset
                </Button>
                <Button size="sm" onClick={savePlatformSettings} disabled={savingPlatform}>
                  {savingPlatform ? "Saving..." : "Save platform config"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {activeSection === "profile" ? (
        <Card className="atlas-stage-card p-5">
          <div className="relative z-10">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--atlas-muted)]">
              Account profile
            </div>
            <h2 className="mt-1 text-xl font-semibold text-[var(--atlas-text-strong)]">
              How this admin account appears around ROOTS
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--atlas-muted)]">
              Update the visible identity for this platform account without changing workspace settings.
            </p>

            <div className="mt-5 rounded-[1.2rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/78 p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface)] text-[var(--atlas-text-strong)]">
                  <UserCircle2 size={20} />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                    {profileLoading
                      ? "Loading current profile..."
                      : currentUser?.displayName || currentUser?.username || "ROOTS admin"}
                  </div>
                  <div className="mt-1 text-sm text-[var(--atlas-muted)]">
                    {currentUser?.email || "No account email available"}
                  </div>
                  <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                    {currentUser?.jobTitle || "Platform operator"}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge kind="platform-role" value={currentAccessTier} />
                    <Badge kind="active" value={currentUserEnabled ? "ENABLED" : "DISABLED"} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <SettingsField
                label="Display name"
                hint="How this account appears in ROOTS."
              >
                <input
                  type="text"
                  value={userProfile.displayName}
                  onChange={(event) =>
                    setUserProfile((current) => ({
                      ...current,
                      displayName: event.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder="ROOTS operator name"
                />
              </SettingsField>

              <SettingsField
                label="Phone number"
                hint="Direct line for coordination."
              >
                <input
                  type="text"
                  value={userProfile.phoneNumber}
                  onChange={(event) =>
                    setUserProfile((current) => ({
                      ...current,
                      phoneNumber: event.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder="+234..."
                />
              </SettingsField>

              <SettingsField
                label="Work title"
                hint="Your role in the platform."
              >
                <input
                  type="text"
                  value={userProfile.jobTitle}
                  onChange={(event) =>
                    setUserProfile((current) => ({
                      ...current,
                      jobTitle: event.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder="Platform owner, operations lead, support..."
                />
              </SettingsField>

              <SettingsField
                label="Account email"
                hint="Managed by platform sign-in."
              >
                <input
                  type="text"
                  value={currentUser?.email || ""}
                  disabled
                  className={`${inputClassName} cursor-not-allowed opacity-75`}
                  placeholder="No account email available"
                />
              </SettingsField>

              <div className="md:col-span-2">
                <SettingsField
                  label="Short bio"
                  hint="A quick note on what you own."
                >
                  <textarea
                    rows={3}
                    value={userProfile.bio}
                    onChange={(event) =>
                      setUserProfile((current) => ({
                        ...current,
                        bio: event.target.value,
                      }))
                    }
                    className={`${inputClassName} min-h-[108px] py-3`}
                    placeholder="Briefly describe your focus across the platform."
                  />
                </SettingsField>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/78 px-4 py-3">
              <div className="text-sm leading-6 text-[var(--atlas-muted)]">
                Profile changes update this device right away.
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetUserProfile}
                  disabled={!profileDirty || savingProfile}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={saveUserProfile}
                  disabled={!profileDirty || savingProfile}
                >
                  {savingProfile ? "Saving..." : "Save profile"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {activeSection === "preferences" ? (
        <Card className="atlas-stage-card p-5">
          <div className="relative z-10">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--atlas-muted)]">
              Account preferences
            </div>
            <h2 className="mt-1 text-xl font-semibold text-[var(--atlas-text-strong)]">
              Preferences for the admin account guiding this session
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--atlas-muted)]">
              Personalize ROOTS without changing app-level settings.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <SettingsField
                label="Start page"
                hint="Your default ROOTS view."
              >
                <select
                  value={accountSettings.startPage}
                  onChange={(event) =>
                    setAccountSettings((current) => ({
                      ...current,
                      startPage: event.target.value,
                    }))
                  }
                  className={inputClassName}
                >
                  {PLATFORM_START_PAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </SettingsField>

              <SettingsField
                label="Timestamp timezone"
                hint="How you read time in ROOTS."
              >
                <select
                  value={accountSettings.timezone}
                  onChange={(event) =>
                    setAccountSettings((current) => ({
                      ...current,
                      timezone: event.target.value,
                    }))
                  }
                  className={inputClassName}
                >
                  {TIMEZONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </SettingsField>
            </div>

            <div className="mt-5 space-y-3">
              <ToggleRow
                label="Email updates"
                hint="Get email summaries."
                checked={accountSettings.emailUpdates}
                onChange={(checked) =>
                  setAccountSettings((current) => ({
                    ...current,
                    emailUpdates: checked,
                  }))
                }
              />
              <ToggleRow
                label="Security alerts"
                hint="Prioritize access and login warnings."
                checked={accountSettings.securityAlerts}
                onChange={(checked) =>
                  setAccountSettings((current) => ({
                    ...current,
                    securityAlerts: checked,
                  }))
                }
              />
              <ToggleRow
                label="Weekly digest"
                hint="Get a weekly platform summary."
                checked={accountSettings.weeklyDigest}
                onChange={(checked) =>
                  setAccountSettings((current) => ({
                    ...current,
                    weeklyDigest: checked,
                  }))
                }
              />
              <ToggleRow
                label="Compact navigation"
                hint="Use denser navigation."
                checked={accountSettings.compactNavigation}
                onChange={(checked) =>
                  setAccountSettings((current) => ({
                    ...current,
                    compactNavigation: checked,
                  }))
                }
              />
              <ToggleRow
                label="Command hints"
                hint="Keep keyboard hints visible."
                checked={accountSettings.commandHints}
                onChange={(checked) =>
                  setAccountSettings((current) => ({
                    ...current,
                    commandHints: checked,
                  }))
                }
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/78 px-4 py-3">
              <div className="text-sm leading-6 text-[var(--atlas-muted)]">
                Start page: {startPageLabel} · Timezone: {accountTimezoneLabel}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={resetAccountSettings}>
                  Reset
                </Button>
                <Button size="sm" onClick={saveAccountSettings} disabled={savingAccount}>
                  {savingAccount ? "Saving..." : "Save account settings"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {activeSection === "links" ? (
        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
              Platform links
            </h2>
            <p className="mt-1 text-sm text-[var(--atlas-muted)]">
              Open the areas these settings affect.
            </p>
          </div>

          <div className="space-y-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => navigate(item.to)}
                  className="flex w-full items-start justify-between gap-3 rounded-[1.2rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/80 px-4 py-3 text-left transition hover:border-[color:var(--atlas-border-strong)] hover:bg-[color:var(--atlas-surface-hover)]"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface)] text-[var(--atlas-text-strong)]">
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                        {item.title}
                      </div>
                      <div className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">
                        {item.detail}
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={16} className="shrink-0 text-[var(--atlas-muted)]" />
                </button>
              );
            })}
          </div>
        </Card>
      ) : null}

      {activeSection === "posture" ? (
        <Card className="space-y-4">
          <div className="flex items-center gap-2 text-[var(--atlas-text-strong)]">
            <LockKeyhole size={16} />
            <h2 className="text-lg font-semibold">Platform posture</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-4 py-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                Access boundary
              </div>
              <div className="mt-2 text-base font-semibold text-[var(--atlas-text-strong)]">
                Platform-admin only
              </div>
              <div className="mt-2 text-sm leading-6 text-[var(--atlas-muted)]">
                Platform routes are reserved for platform administrators, separate from tenant-scoped app operations.
              </div>
            </div>

            <div className="rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-4 py-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                Suspended workspaces
              </div>
              <div className="mt-2 text-base font-semibold text-[var(--atlas-text-strong)]">
                {formatNumber(overview.suspendedTenants || 0)} flagged
              </div>
              <div className="mt-2 text-sm leading-6 text-[var(--atlas-muted)]">
                Paused workspaces that may require commercial, access, or health review.
              </div>
            </div>

            <div className="rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-4 py-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                Revenue visibility
              </div>
              <div className="mt-2 text-base font-semibold text-[var(--atlas-text-strong)]">
                {platformSettings.revenueVisibility ? "Visible in platform" : "Hidden in platform"}
              </div>
              <div className="mt-2 text-sm leading-6 text-[var(--atlas-muted)]">
                Revenue visibility is controlled here at the platform level.
              </div>
            </div>

            <div className="rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-4 py-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                Current account scope
              </div>
              <div className="mt-2 text-base font-semibold text-[var(--atlas-text-strong)]">
                {getPlatformRoleLabel(currentAccessTier)}
              </div>
              <div className="mt-2 text-sm leading-6 text-[var(--atlas-muted)]">
                {(currentUser?.displayName || currentUser?.email || "Signed-in admin session")} uses a personal preference profile separate from workspace defaults.
              </div>
            </div>
          </div>

          <div className="rounded-[1.2rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-4 py-4">
            <div className="flex items-center gap-2 text-[var(--atlas-text-strong)]">
              <BellRing size={15} />
              <div className="text-sm font-semibold">Current setup</div>
            </div>
            <div className="mt-3 space-y-2 text-sm text-[var(--atlas-text)]">
              <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-strong)] px-3 py-3">
                This page is focused on platform settings instead of tenant settings.
              </div>
              <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-strong)] px-3 py-3">
                Platform settings and account preferences are separated clearly.
              </div>
              <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-strong)] px-3 py-3">
                These controls stay local until a backend settings API is added.
              </div>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
