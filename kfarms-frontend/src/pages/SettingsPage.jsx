import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  Crown,
  Globe,
  Mail,
  MessageSquare,
  Palette,
  RefreshCw,
  Save,
  Shield,
  Smartphone,
  Trash2,
  UserCircle2,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import ConfirmModal from "../components/ConfirmModal";
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
import { buildBillingPlanFocusPath } from "../utils/billingNavigation";
import {
  getAccountContactStatus,
  getOrganizationSettings,
  sendAccountContactCodes,
  getUserPreferences,
  saveOrganizationSettings,
  saveUserPreferences,
  deleteTenantOwnerAccount,
  updateAccountContact,
  updatePassword,
  verifyAccountContact,
} from "../services/settingsService";
import {
  createTenantUserProfileDraft,
  saveTenantUserProfile,
} from "../services/userProfileService";
import {
  ACCOUNT_PASSWORD_MIN_LENGTH,
  looksLikePhoneNumber,
  validateAccountPassword,
} from "../utils/accountValidation";
import { normalizeWorkspaceRole } from "../utils/workspaceRoles";

const DELETE_ACCOUNT_CONFIRMATION_TEXT = "DELETE MY ACCOUNT";

const inputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 dark:border-white/10 dark:bg-darkCard/70 dark:text-darkText";
const selectClassName = `${inputClassName} [color-scheme:light] dark:[color-scheme:dark]`;

const TENANT_SETTINGS_SECTIONS = Object.freeze([
  {
    id: "profile",
    label: "Profile",
    description: "Profile completion, title, and bio",
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

function createAccountContactState(user, payload = {}) {
  const source = payload && typeof payload === "object" ? payload : {};
  const phoneNumber = String(source.phoneNumber || user?.phoneNumber || "").trim();
  const email = String(source.email || user?.email || "").trim();
  const hasPhoneNumber = source.hasPhoneNumber ?? Boolean(phoneNumber);
  const emailVerified = Boolean(
    source.emailVerified ?? user?.emailVerified,
  );
  const phoneVerified = hasPhoneNumber
    ? Boolean(source.phoneVerified ?? user?.phoneVerified)
    : false;
  const verificationRequired =
    source.verificationRequired ??
    (!emailVerified || (hasPhoneNumber && !phoneVerified));

  return {
    email,
    phoneNumber,
    hasPhoneNumber,
    maskedEmail: String(source.maskedEmail || email).trim(),
    maskedPhoneNumber: String(source.maskedPhoneNumber || phoneNumber).trim(),
    emailVerified,
    phoneVerified,
    verificationRequired,
    preview:
      source.preview && typeof source.preview === "object" ? source.preview : null,
  };
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, updateProfile, refreshMe, logout } = useAuth();
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
  const [accountContact, setAccountContact] = React.useState(() =>
    createAccountContactState(user),
  );
  const [accountContactDraft, setAccountContactDraft] = React.useState(() =>
    createAccountContactState(user).phoneNumber,
  );
  const [verificationForm, setVerificationForm] = React.useState({
    emailCode: "",
    phoneCode: "",
  });
  const [securityForm, setSecurityForm] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [savingAccountContact, setSavingAccountContact] = React.useState(false);
  const [savingOrganization, setSavingOrganization] = React.useState(false);
  const [savingPreferences, setSavingPreferences] = React.useState(false);
  const [sendingAccountCodes, setSendingAccountCodes] = React.useState(false);
  const [updatingPassword, setUpdatingPassword] = React.useState(false);
  const [verifyingAccountContactState, setVerifyingAccountContactState] = React.useState(false);
  const [deletingOwnerAccount, setDeletingOwnerAccount] = React.useState(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = React.useState(false);
  const [deleteAccountForm, setDeleteAccountForm] = React.useState({
    currentPassword: "",
    confirmEmail: "",
    confirmWorkspaceName: "",
    confirmationText: "",
    understandsAccessLoss: false,
    ownershipHandled: false,
  });
  const [toast, setToast] = React.useState({ message: "", type: "info" });

  const userId = user?.id || user?.username || user?.email || "me";
  const currentPlanId = normalizePlanId(activeTenant?.plan, "FREE");
  const currentPlan = getPlanById(currentPlanId, "FREE");
  const isEnterprisePlan = currentPlanId === "ENTERPRISE";
  const isWorkspaceOwner =
    normalizeWorkspaceRole(activeTenant?.myRole || activeTenant?.role) === "OWNER";
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
  const accountContactDirty = React.useMemo(
    () => accountContactDraft.trim() !== String(accountContact.phoneNumber || "").trim(),
    [accountContact.phoneNumber, accountContactDraft],
  );
  const requiresEmailVerification = !accountContact.emailVerified;
  const requiresPhoneVerification =
    accountContact.hasPhoneNumber && !accountContact.phoneVerified;
  const profileCompletion = React.useMemo(() => {
    let completion = 70;
    if (accountContact.emailVerified) completion += 10;
    if (accountContact.hasPhoneNumber) completion += 10;
    if (accountContact.phoneVerified) completion += 10;
    return Math.min(completion, 100);
  }, [
    accountContact.emailVerified,
    accountContact.hasPhoneNumber,
    accountContact.phoneVerified,
  ]);
  const requiresAnyVerification =
    requiresEmailVerification || requiresPhoneVerification;
  const deleteAccountChecks = React.useMemo(
    () => ({
      emailMatches:
        deleteAccountForm.confirmEmail.trim().toLowerCase() ===
        String(user?.email || "")
          .trim()
          .toLowerCase(),
      workspaceMatches:
        deleteAccountForm.confirmWorkspaceName.trim().toLowerCase() ===
        String(activeTenant?.name || "")
          .trim()
          .toLowerCase(),
      confirmationMatches:
        deleteAccountForm.confirmationText.trim().toUpperCase() ===
        DELETE_ACCOUNT_CONFIRMATION_TEXT,
      hasPassword: Boolean(deleteAccountForm.currentPassword.trim()),
    }),
    [activeTenant?.name, deleteAccountForm, user?.email],
  );
  const deleteAccountReady =
    isWorkspaceOwner &&
    deleteAccountChecks.emailMatches &&
    deleteAccountChecks.workspaceMatches &&
    deleteAccountChecks.confirmationMatches &&
    deleteAccountChecks.hasPassword &&
    deleteAccountForm.understandsAccessLoss &&
    deleteAccountForm.ownershipHandled;
  const verificationSendLabel = React.useMemo(() => {
    if (requiresEmailVerification && requiresPhoneVerification) {
      return "Send codes";
    }
    if (requiresPhoneVerification) return "Send SMS code";
    return "Send email code";
  }, [requiresEmailVerification, requiresPhoneVerification]);
  const verificationSubmitLabel = React.useMemo(() => {
    if (requiresEmailVerification && requiresPhoneVerification) {
      return "Verify codes";
    }
    if (requiresPhoneVerification) return "Verify SMS";
    return "Verify email";
  }, [requiresEmailVerification, requiresPhoneVerification]);
  const verificationStatusSummary = React.useMemo(() => {
    if (!requiresAnyVerification) {
      return "Your contact details are ready for alerts and account recovery.";
    }
    if (requiresEmailVerification && requiresPhoneVerification) {
      return "Send fresh codes, then enter both to finish setup.";
    }
    if (requiresPhoneVerification) {
      return "Verify the SMS code to enable urgent farm alerts.";
    }
    return "Verify the email code to finish your account setup.";
  }, [
    requiresAnyVerification,
    requiresEmailVerification,
    requiresPhoneVerification,
  ]);
  const canSubmitVerification =
    (!requiresEmailVerification || verificationForm.emailCode.trim()) &&
    (!requiresPhoneVerification || verificationForm.phoneCode.trim());
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
    setAccountContact((current) =>
      createAccountContactState(user, {
        ...current,
        preview: current.preview,
      }),
    );
    setAccountContactDraft((current) =>
      current.trim() ? current : String(user?.phoneNumber || "").trim(),
    );
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
        const [organization, preferences, contactStatus] = await Promise.all([
          getOrganizationSettings({
            tenantId: activeTenantId,
            tenantName: activeTenant?.name,
            tenantSlug: activeTenant?.slug,
          }),
          getUserPreferences({
            tenantId: activeTenantId,
            userId,
          }),
          getAccountContactStatus().catch(() => createAccountContactState(user)),
        ]);

        if (!active) return;
        setOrganizationSettings(organization);
        setOrganizationSnapshot(organization);
        setUserPreferences(preferences);
        setPreferencesSnapshot(preferences);
        setAccountContact(createAccountContactState(user, contactStatus));
        setAccountContactDraft(
          String(contactStatus?.phoneNumber || user?.phoneNumber || "").trim(),
        );
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
  }, [activeTenant?.name, activeTenant?.slug, activeTenantId, user, userId]);

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

  async function handleSaveAccountContact() {
    if (savingAccountContact) return;

    const nextPhoneNumber = accountContactDraft.trim();
    if (nextPhoneNumber && !looksLikePhoneNumber(nextPhoneNumber)) {
      setToast({
        message: "Add a valid phone number so SMS alerts can reach you.",
        type: "error",
      });
      return;
    }

    setSavingAccountContact(true);
    try {
      const updatedContact = await updateAccountContact({
        phoneNumber: nextPhoneNumber,
      });
      setAccountContact(updatedContact);
      setAccountContactDraft(updatedContact.phoneNumber || "");
      setVerificationForm({ emailCode: "", phoneCode: "" });
      await refreshMe().catch(() => null);
      setToast({
        message: updatedContact.hasPhoneNumber
          ? "Phone saved. Verify it when you are ready."
          : "Phone number removed. You can add one later from this page.",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: error?.message || "Could not update your phone number.",
        type: "error",
      });
    } finally {
      setSavingAccountContact(false);
    }
  }

  async function handleSendAccountCodes() {
    if (sendingAccountCodes) return;

    setSendingAccountCodes(true);
    try {
      const updatedContact = await sendAccountContactCodes();
      setAccountContact(updatedContact);
      setToast({
        message:
          updatedContact.hasPhoneNumber &&
          !updatedContact.phoneVerified &&
          !updatedContact.emailVerified
            ? "Fresh email and SMS codes sent."
            : updatedContact.hasPhoneNumber && !updatedContact.phoneVerified
              ? "A fresh SMS code has been sent."
              : "A fresh email code has been sent.",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: error?.message || "Could not send verification codes right now.",
        type: "error",
      });
    } finally {
      setSendingAccountCodes(false);
    }
  }

  async function handleVerifyAccountContact() {
    if (verifyingAccountContactState) return;

    if (requiresEmailVerification && !verificationForm.emailCode.trim()) {
      setToast({
        message: "Enter the email code first.",
        type: "error",
      });
      return;
    }

    if (requiresPhoneVerification && !verificationForm.phoneCode.trim()) {
      setToast({
        message: "Enter the SMS code first.",
        type: "error",
      });
      return;
    }

    setVerifyingAccountContactState(true);
    try {
      const updatedContact = await verifyAccountContact({
        emailCode: verificationForm.emailCode,
        phoneCode: verificationForm.phoneCode,
      });
      setAccountContact(updatedContact);
      setAccountContactDraft(updatedContact.phoneNumber || "");
      setVerificationForm({ emailCode: "", phoneCode: "" });
      await refreshMe().catch(() => null);
      setToast({
        message: updatedContact.verificationRequired
          ? "Verification updated. Finish the remaining step to complete setup."
          : "Contact details verified. Alerts and recovery updates are now ready.",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: error?.message || "Could not verify those codes.",
        type: "error",
      });
    } finally {
      setVerifyingAccountContactState(false);
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

  function handleDeleteAccountFieldChange(field, value) {
    setDeleteAccountForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleDeleteOwnerAccount() {
    if (!deleteAccountReady || deletingOwnerAccount) {
      return;
    }

    setDeletingOwnerAccount(true);
    try {
      const result = await deleteTenantOwnerAccount({
        tenantId: activeTenantId,
        currentPassword: deleteAccountForm.currentPassword,
        confirmEmail: deleteAccountForm.confirmEmail,
        confirmWorkspaceName: deleteAccountForm.confirmWorkspaceName,
        confirmationText: deleteAccountForm.confirmationText,
      });

      setDeleteAccountModalOpen(false);
      setDeleteAccountForm({
        currentPassword: "",
        confirmEmail: "",
        confirmWorkspaceName: "",
        confirmationText: "",
        understandsAccessLoss: false,
        ownershipHandled: false,
      });
      setToast({
        message:
          result?.message ||
          "Your owner account has been deleted. Signing you out now.",
        type: "success",
      });
      await refreshTenants({ force: true }).catch(() => null);
      await logout();
      navigate("/auth/login", { replace: true });
    } catch (error) {
      setDeleteAccountModalOpen(false);
      setToast({
        message:
          error?.message ||
          "Could not delete this owner account right now.",
        type: "error",
      });
    } finally {
      setDeletingOwnerAccount(false);
    }
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
              Workspace ready
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
            ? "Update your workspace details here. Personal preferences stay with your account, and verified contact details help you receive important updates."
            : "Update your profile, contact details, preferences, and password here. Workspace details are view-only for your role."}
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
                      Finish your contact setup for important alerts, then edit how your profile
                      appears on this device.
                    </p>
                  </div>
                </div>

                <div className="mb-5 rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-accent-primary" />
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          Contact verification
                        </h3>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        Keep one email and one alerts number ready. We only ask for the codes you
                        still need.
                      </p>
                    </div>
                    <div className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-200">
                      {requiresAnyVerification ? "Action needed" : "All set"}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/85 px-4 py-3.5 dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                            Email
                          </div>
                          <div className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                            {accountContact.email || user?.email || "Not available"}
                          </div>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium",
                            accountContact.emailVerified
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-200",
                          )}
                        >
                          {accountContact.emailVerified ? "Verified" : "Pending"}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/85 px-4 py-3.5 dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                            SMS alerts
                          </div>
                          <div className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                            {accountContact.phoneNumber || "Not added yet"}
                          </div>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium",
                            !accountContact.hasPhoneNumber
                              ? "bg-slate-500/10 text-slate-600 dark:text-slate-300"
                              : accountContact.phoneVerified
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-200",
                          )}
                        >
                          {!accountContact.hasPhoneNumber
                            ? "Optional"
                            : accountContact.phoneVerified
                              ? "Verified"
                              : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/5">
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                      Phone number for urgent alerts
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={accountContactDraft}
                        onChange={(event) => setAccountContactDraft(event.target.value)}
                        className={inputClassName}
                        placeholder="+234..."
                      />
                      <button
                        type="button"
                        onClick={handleSaveAccountContact}
                        disabled={!accountContactDirty || savingAccountContact}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[9rem]"
                      >
                        {savingAccountContact ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Smartphone className="h-4 w-4" />
                        )}
                        Save number
                      </button>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      Add the number that should receive urgent farm alerts and account recovery
                      notices.
                    </p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Verification
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {verificationStatusSummary}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={handleSendAccountCodes}
                          disabled={sendingAccountCodes || !requiresAnyVerification}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                        >
                          {sendingAccountCodes ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                          {verificationSendLabel}
                        </button>
                        <button
                          type="button"
                          onClick={handleVerifyAccountContact}
                          disabled={
                            verifyingAccountContactState ||
                            !requiresAnyVerification ||
                            !canSubmitVerification
                          }
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {verifyingAccountContactState ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          {verificationSubmitLabel}
                        </button>
                      </div>
                    </div>

                    {requiresAnyVerification ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {requiresEmailVerification ? (
                          <div>
                            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                              Email code
                            </label>
                            <input
                              type="text"
                              value={verificationForm.emailCode}
                              onChange={(event) =>
                                setVerificationForm((prev) => ({
                                  ...prev,
                                  emailCode: event.target.value,
                                }))
                              }
                              className={inputClassName}
                              placeholder="Enter email code"
                              inputMode="numeric"
                            />
                          </div>
                        ) : null}

                        {requiresPhoneVerification ? (
                          <div>
                            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                              SMS code
                            </label>
                            <input
                              type="text"
                              value={verificationForm.phoneCode}
                              onChange={(event) =>
                                setVerificationForm((prev) => ({
                                  ...prev,
                                  phoneCode: event.target.value,
                                }))
                              }
                              className={inputClassName}
                              placeholder="Enter SMS code"
                              inputMode="numeric"
                            />
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {accountContact.preview ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-emerald-300/40 bg-emerald-500/8 px-3.5 py-3 text-xs text-emerald-900 dark:border-emerald-400/30 dark:text-emerald-100">
                        <div className="font-semibold uppercase tracking-[0.16em]">
                          Preview codes
                        </div>
                        <div className="mt-2 space-y-1">
                          {accountContact.preview.emailCode ? (
                            <div>Email code: {accountContact.preview.emailCode}</div>
                          ) : null}
                          {accountContact.preview.phoneCode ? (
                            <div>SMS code: {accountContact.preview.phoneCode}</div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
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

                <div className="mt-6 rounded-2xl border border-rose-400/25 bg-rose-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-rose-500/10 p-2 text-rose-500">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-header text-base font-semibold text-slate-900 dark:text-slate-100">
                          Delete owner account
                        </h3>
                        <span className="rounded-full border border-rose-400/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-rose-700 dark:text-rose-200">
                          Danger zone
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        This is only for tenant owners. If this farm should keep running, transfer
                        ownership first from the Users page before deleting this account.
                      </p>
                    </div>
                  </div>

                  {!isWorkspaceOwner ? (
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      Only workspace owners can request account deletion from here.
                    </div>
                  ) : (
                    <>
                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                            Current password
                          </label>
                          <input
                            type="password"
                            autoComplete="current-password"
                            value={deleteAccountForm.currentPassword}
                            onChange={(event) =>
                              handleDeleteAccountFieldChange(
                                "currentPassword",
                                event.target.value,
                              )
                            }
                            className={inputClassName}
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                            Confirm your email
                          </label>
                          <input
                            type="email"
                            value={deleteAccountForm.confirmEmail}
                            onChange={(event) =>
                              handleDeleteAccountFieldChange(
                                "confirmEmail",
                                event.target.value,
                              )
                            }
                            className={inputClassName}
                            placeholder={user?.email || "you@example.com"}
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                            Type workspace name
                          </label>
                          <input
                            type="text"
                            value={deleteAccountForm.confirmWorkspaceName}
                            onChange={(event) =>
                              handleDeleteAccountFieldChange(
                                "confirmWorkspaceName",
                                event.target.value,
                              )
                            }
                            className={inputClassName}
                            placeholder={activeTenant?.name || "Workspace name"}
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                            Final confirmation text
                          </label>
                          <input
                            type="text"
                            value={deleteAccountForm.confirmationText}
                            onChange={(event) =>
                              handleDeleteAccountFieldChange(
                                "confirmationText",
                                event.target.value,
                              )
                            }
                            className={inputClassName}
                            placeholder={DELETE_ACCOUNT_CONFIRMATION_TEXT}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2">
                        <label className="inline-flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-700 dark:text-slate-200">
                          <input
                            type="checkbox"
                            checked={deleteAccountForm.understandsAccessLoss}
                            onChange={(event) =>
                              handleDeleteAccountFieldChange(
                                "understandsAccessLoss",
                                event.target.checked,
                              )
                            }
                            className="mt-0.5 h-4 w-4 rounded border-slate-300"
                          />
                          I understand that deleting this owner account removes my login and farm
                          access immediately.
                        </label>
                        <label className="inline-flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-700 dark:text-slate-200">
                          <input
                            type="checkbox"
                            checked={deleteAccountForm.ownershipHandled}
                            onChange={(event) =>
                              handleDeleteAccountFieldChange(
                                "ownershipHandled",
                                event.target.checked,
                              )
                            }
                            className="mt-0.5 h-4 w-4 rounded border-slate-300"
                          />
                          I have transferred ownership already, or I understand this can leave the
                          farm without an owner.
                        </label>
                      </div>

                      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                          Safety checklist
                        </div>
                        <div className="mt-2 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                          <div>{deleteAccountChecks.hasPassword ? "OK" : "Missing"} current password</div>
                          <div>{deleteAccountChecks.emailMatches ? "OK" : "Check"} exact account email</div>
                          <div>{deleteAccountChecks.workspaceMatches ? "OK" : "Check"} exact workspace name</div>
                          <div>{deleteAccountChecks.confirmationMatches ? "OK" : "Type"} {DELETE_ACCOUNT_CONFIRMATION_TEXT}</div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          disabled={!deleteAccountReady || deletingOwnerAccount}
                          onClick={() => setDeleteAccountModalOpen(true)}
                          className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete owner account
                        </button>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          We only enable the final step after every confirmation check is complete.
                        </p>
                      </div>
                    </>
                  )}
                </div>
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
                        {accountContact.phoneNumber || "Not added"}
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
                        Email {accountContact.emailVerified ? "verified" : "pending"} · Phone{" "}
                        {accountContact.hasPhoneNumber
                          ? accountContact.phoneVerified
                            ? "verified"
                            : "pending"
                          : "not added"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Profile completion
                      </p>
                      <p className="text-slate-700 dark:text-slate-200">
                        {profileCompletion}% complete
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
                      to={currentPlanId === "FREE" ? buildBillingPlanFocusPath("PRO") : "/billing"}
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

      <ConfirmModal
        open={deleteAccountModalOpen}
        title="Delete owner account"
        message={`Delete the owner account for ${activeTenant?.name || "this workspace"}? This removes your login and workspace access immediately. If the farm should keep running, transfer ownership first.`}
        confirmText="Delete account"
        cancelText="Keep account"
        loading={deletingOwnerAccount}
        onCancel={() => {
          if (deletingOwnerAccount) return;
          setDeleteAccountModalOpen(false);
        }}
        onConfirm={handleDeleteOwnerAccount}
      />

      <GlassToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />
    </DashboardLayout>
  );
}
