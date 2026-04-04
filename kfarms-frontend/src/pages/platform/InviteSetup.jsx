import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  LogIn,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { PLATFORM_ENDPOINTS } from "../../api/endpoints";
import {
  getApiErrorMessage,
  platformAxios,
  unwrapApiResponse,
} from "../../api/platformClient";
import { usePlatformAuth } from "../../auth/AuthProvider";
import { ToastProvider, useToast } from "../../components/ToastProvider";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { useTheme } from "../../hooks/useTheme";
import { formatThemePreferenceLabel, THEME_SCOPES } from "../../constants/settings";
import { readTokenFromPayload } from "../../utils/formatters";
import rootsLogo from "../../assets/roots-logo-trimmed.png";

function readInviteError(error) {
  const fallback = "We could not open that setup link right now.";
  return getApiErrorMessage(error, fallback) || fallback;
}

function InviteSetupContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = usePlatformAuth();
  const { notify } = useToast();
  const { theme, isDark, toggleTheme } = useTheme(THEME_SCOPES.PLATFORM);
  const themeLabel = formatThemePreferenceLabel(theme);

  const inviteToken = React.useMemo(() => String(searchParams.get("token") || "").trim(), [searchParams]);
  const [loadingInvite, setLoadingInvite] = React.useState(true);
  const [invite, setInvite] = React.useState(null);
  const [error, setError] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    async function loadInvite() {
      if (!inviteToken) {
        setInvite(null);
        setError("This setup link is missing its invite token.");
        setLoadingInvite(false);
        return;
      }

      setLoadingInvite(true);
      setError("");

      try {
        const response = await platformAxios.get(PLATFORM_ENDPOINTS.platformInviteResolve, {
          params: { token: inviteToken },
          skipPlatformAuthHandling: true,
        });
        const payload = unwrapApiResponse(response.data, "We could not read that platform invite.");

        if (!active) return;
        setInvite(payload);
      } catch (inviteError) {
        if (!active) return;
        setInvite(null);
        setError(readInviteError(inviteError));
      } finally {
        if (active) {
          setLoadingInvite(false);
        }
      }
    }

    loadInvite();

    return () => {
      active = false;
    };
  }, [inviteToken]);

  const handleSubmit = React.useCallback(
    async (event) => {
      event.preventDefault();

      if (!inviteToken) {
        setError("This setup link is missing its invite token.");
        return;
      }

      if (password.trim().length < 8) {
        const message = "Use at least 8 characters for the password.";
        setError(message);
        notify(message, "error");
        return;
      }

      if (password !== confirmPassword) {
        const message = "Passwords do not match yet.";
        setError(message);
        notify(message, "error");
        return;
      }

      setSubmitting(true);
      setError("");

      try {
        const response = await platformAxios.post(
          PLATFORM_ENDPOINTS.platformInviteAccept,
          {
            token: inviteToken,
            password,
          },
          {
            skipPlatformAuthHandling: true,
          },
        );
        const payload = unwrapApiResponse(response.data, "We could not finish the platform setup.");
        const nextToken = readTokenFromPayload(payload) || readTokenFromPayload(response.data);

        if (!nextToken) {
          throw new Error("Platform setup succeeded but the access token is missing.");
        }

        login(nextToken);
        notify("Platform access is ready.", "success");
        navigate("/platform", { replace: true });
      } catch (acceptError) {
        const message = readInviteError(acceptError);
        setError(message);
        notify(message, "error");
      } finally {
        setSubmitting(false);
      }
    },
    [confirmPassword, inviteToken, login, navigate, notify, password],
  );

  return (
    <div className="atlas-theme atlas-root-network flex min-h-[100dvh] items-center justify-center px-4 py-4 sm:px-5 sm:py-6">
      <div className="w-full max-w-[29rem]">
        <Card className="atlas-stage-card rounded-[1.75rem] border-[color:var(--atlas-border-strong)] px-5 py-5 sm:px-6 sm:py-6">
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate("/platform/login")}
                className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)]/88 px-3 py-2 text-sm font-medium text-[var(--atlas-text)] transition hover:bg-[color:var(--atlas-surface-hover)]"
              >
                <ArrowLeft size={15} />
                Back
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="shrink-0 rounded-xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)]/88 p-2 text-[var(--atlas-text)] transition hover:bg-[color:var(--atlas-surface-hover)]"
                aria-label={`Theme: ${themeLabel}. Click to cycle theme.`}
                title={`Theme: ${themeLabel}`}
              >
                {theme === "system" ? <Monitor size={16} /> : isDark ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </div>

            <div className="mt-5 text-center">
              <img
                src={rootsLogo}
                alt="ROOTS"
                className="mx-auto w-[10.5rem] max-w-full object-contain sm:w-[11.5rem]"
              />
              <h1 className="mt-3 font-header text-[1.4rem] font-semibold leading-tight tracking-tight text-[var(--atlas-text-strong)] sm:text-[1.55rem]">
                Set your platform password
              </h1>
              <p className="mt-3 text-sm leading-6 text-[var(--atlas-muted)]">
                Finish your ROOTS access with one secure password setup.
              </p>
            </div>

            <div className="mt-5 rounded-[1.2rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/78 px-4 py-3">
              {loadingInvite ? (
                <div className="space-y-2" aria-hidden="true">
                  <div className="h-4 w-32 rounded-full bg-[color:var(--atlas-surface-strong)]" />
                  <div className="h-3 w-48 rounded-full bg-[color:var(--atlas-surface-strong)]" />
                </div>
              ) : invite ? (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/35 bg-emerald-500/12 text-emerald-200">
                    <ShieldCheck size={16} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                      Invite for {invite?.username || invite?.email || "ROOTS operator"}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">
                      {invite?.email || "No email on record"}
                    </div>
                    {invite?.expiresAt ? (
                      <div className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">
                        Link expires {invite.expiresAt}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-violet-300/35 bg-violet-500/12 text-violet-200">
                    <Link2 size={16} />
                  </span>
                  <div className="text-sm leading-6 text-[var(--atlas-muted)]">
                    Open the full invite link from your admin to continue.
                  </div>
                </div>
              )}
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-violet-300/60 bg-violet-50 px-3 py-2.5 text-sm text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/20 dark:text-violet-100">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--atlas-text)]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 w-full rounded-2xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] px-4 pr-20 text-sm text-[var(--atlas-text-strong)] outline-none transition placeholder:text-[var(--atlas-muted-soft)] focus:border-violet-400/50"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                    disabled={loadingInvite || !invite || submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-3 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--atlas-muted)] transition hover:text-[var(--atlas-text-strong)]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={loadingInvite || !invite || submitting}
                  >
                    {showPassword ? (
                      <>
                        <EyeOff size={16} />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye size={16} />
                        <span>Show</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--atlas-text)]">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="h-11 w-full rounded-2xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] px-4 pr-20 text-sm text-[var(--atlas-text-strong)] outline-none transition placeholder:text-[var(--atlas-muted-soft)] focus:border-violet-400/50"
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    minLength={8}
                    required
                    disabled={loadingInvite || !invite || submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute inset-y-0 right-3 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--atlas-muted)] transition hover:text-[var(--atlas-text-strong)]"
                    aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
                    disabled={loadingInvite || !invite || submitting}
                  >
                    {showConfirmPassword ? (
                      <>
                        <EyeOff size={16} />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye size={16} />
                        <span>Show</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/72 px-4 py-3 text-xs leading-6 text-[var(--atlas-muted)]">
                <div className="flex items-start gap-2">
                  <KeyRound size={15} className="mt-0.5 shrink-0 text-[var(--atlas-text-strong)]" />
                  <span>
                    This password becomes your platform sign-in key. Keep it private and strong.
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full !rounded-2xl"
                disabled={loadingInvite || !invite || submitting}
              >
                <LogIn size={15} />
                {submitting ? "Setting up access..." : "Finish setup"}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function PlatformInviteSetupPage() {
  return (
    <ToastProvider>
      <InviteSetupContent />
    </ToastProvider>
  );
}
