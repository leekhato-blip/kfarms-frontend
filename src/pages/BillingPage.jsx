import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Banknote,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  ExternalLink,
  Receipt,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import FarmerGuideCard from "../components/FarmerGuideCard";
import GlassToast from "../components/GlassToast";
import { useTenant } from "../tenant/TenantContext";
import { useAuth } from "../hooks/useAuth";
import { usePlanCatalog } from "../hooks/usePlanCatalog";
import { getPlanById, normalizePlanId } from "../constants/plans";
import {
  normalizeOrganizationSettings,
} from "../constants/settings";
import {
  cancelSubscription,
  createCheckoutSession,
  createCustomerPortalSession,
  downloadBillingInvoice,
  downgradeToFreePlan,
  getBillingInvoices,
  getBillingOverview,
  getPlanBillingInfo,
  verifyCheckoutSession,
} from "../services/billingService";
import {
  getCachedOrganizationSettings,
  getOrganizationSettings,
} from "../services/settingsService";
import {
  BILLING_PLAN_FOCUS_PARAM,
  getBillingPlanCardAnchor,
} from "../utils/billingNavigation";
import {
  WORKSPACE_PERMISSIONS,
  hasWorkspacePermission,
} from "../utils/workspacePermissions";

function formatMoney(amount = 0, currency = "NGN") {
  const numeric = Number(amount || 0);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: String(currency || "NGN").toUpperCase(),
    maximumFractionDigits: 0,
  }).format(numeric);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatBillingStatus(status) {
  const normalized = String(status || "").trim().toUpperCase();
  if (normalized === "ACTIVE") return "Active";
  if (normalized === "PAID") return "Paid";
  if (normalized === "PENDING") return "Waiting";
  if (normalized === "CANCELED" || normalized === "CANCELLED") return "Stopped";
  if (normalized === "FAILED") return "Failed";
  if (normalized === "PAST_DUE") return "Late";
  return String(status || "Active")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatIntervalLabel(value) {
  const normalized = String(value || "MONTHLY").trim().toUpperCase();
  if (normalized === "MONTHLY") return "every month";
  if (normalized === "YEARLY" || normalized === "ANNUAL") return "every year";
  return String(value || "")
    .toLowerCase()
    .replace(/_/g, " ");
}

function statusTone(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "PAID" || normalized === "ACTIVE") {
    return "border-emerald-300/50 bg-emerald-500/10 text-emerald-600 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-100";
  }
  if (normalized === "CANCELED" || normalized === "FAILED") {
    return "border-red-300/50 bg-red-500/10 text-status-danger dark:border-red-400/40 dark:bg-red-500/20 dark:text-red-100";
  }
  return "border-amber-300/50 bg-amber-500/10 text-amber-600 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-100";
}

function normalizeLimitLabel(label) {
  const raw = String(label || "").trim();
  const normalized = raw.toLowerCase().replace(/\s+/g, " ");

  if (
    normalized === "orgainzaiton" ||
    normalized === "orgainzation" ||
    normalized === "orgainzations" ||
    normalized === "organisation" ||
    normalized === "organisations"
  ) {
    return "Farms";
  }

  return raw;
}

const LIVE_BILLING_CHECKLIST = Object.freeze([
  "Create and verify a Paystack business account for live billing.",
  "Set backend env vars: KFARMS_PAYSTACK_ENABLED=true, KFARMS_PAYSTACK_SECRET_KEY, and KFARMS_PAYSTACK_PRO_MONTHLY_PLAN_CODE.",
  "Point the Paystack webhook to /api/billing/paystack/webhook on your deployed backend.",
  "Set KFARMS_FRONTEND_BASE_URL and your production CORS/cookie values so checkout returns to the app correctly.",
  "Add a billing email in Workspace Settings before starting checkout.",
]);

export default function BillingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { activeTenant, activeTenantId, refreshTenants } = useTenant();
  const displayPlans = usePlanCatalog();

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [billing, setBilling] = React.useState(null);
  const [organizationProfile, setOrganizationProfile] = React.useState(null);
  const [invoices, setInvoices] = React.useState([]);
  const [invoicePage, setInvoicePage] = React.useState(0);
  const [invoiceMeta, setInvoiceMeta] = React.useState({
    page: 0,
    size: 10,
    totalItems: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  });
  const [dataSource, setDataSource] = React.useState("api");
  const [isBrowserOffline, setIsBrowserOffline] = React.useState(
    () => typeof window !== "undefined" && !window.navigator.onLine,
  );
  const [processingPlanId, setProcessingPlanId] = React.useState("");
  const [verifyingPayment, setVerifyingPayment] = React.useState(false);
  const [openingPortal, setOpeningPortal] = React.useState(false);
  const [updatingSubscription, setUpdatingSubscription] = React.useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = React.useState("");
  const [toast, setToast] = React.useState({ message: "", type: "info" });
  const processedReferencesRef = React.useRef(new Set());
  const processedIntentRef = React.useRef(new Set());
  const planCardRefs = React.useRef({});

  const canManageBilling = hasWorkspacePermission(
    activeTenant,
    WORKSPACE_PERMISSIONS.BILLING_MANAGE,
  );
  const tenantPlan = normalizePlanId(activeTenant?.plan, "FREE");
  const effectivePlanId = normalizePlanId(billing?.planId || tenantPlan, "FREE");
  const currentPlan = getPlanById(effectivePlanId, "FREE");
  const organizationName = organizationProfile?.organizationName || activeTenant?.name || "Current farm";
  const organizationSlug = organizationProfile?.organizationSlug || activeTenant?.slug || "";
  const contactEmail = organizationProfile?.contactEmail || "";
  const contactPhone = organizationProfile?.contactPhone || "";
  const contactAddress = organizationProfile?.address || "";
  const focusPlanId = React.useMemo(
    () =>
      normalizePlanId(
        new URLSearchParams(location.search).get(BILLING_PLAN_FOCUS_PARAM),
        "",
      ),
    [location.search],
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleOnline = () => setIsBrowserOffline(false);
    const handleOffline = () => setIsBrowserOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const loadBillingData = React.useCallback(async (options = {}) => {
    const targetPage = Number.isFinite(options.page) ? options.page : invoicePage;
    if (!activeTenantId) {
      setBilling(null);
      setOrganizationProfile(null);
      setInvoices([]);
      setInvoiceMeta({
        page: 0,
        size: 10,
        totalItems: 0,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });
      setLoading(false);
      return;
    }

    if (options.silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [overviewResult, invoiceResult, organizationResult] = await Promise.all([
        getBillingOverview({
          tenantId: activeTenantId,
          tenantPlan,
        }),
        getBillingInvoices({
          tenantId: activeTenantId,
          page: targetPage,
        }),
        getOrganizationSettings({
          tenantId: activeTenantId,
          tenantName: activeTenant?.name || "",
          tenantSlug: activeTenant?.slug || "",
        }).catch(
          () =>
            getCachedOrganizationSettings({ tenantId: activeTenantId }) ||
            normalizeOrganizationSettings({
              organizationName: activeTenant?.name || "",
              organizationSlug: activeTenant?.slug || "",
            }),
        ),
      ]);

      setBilling(overviewResult.billing);
      setOrganizationProfile(organizationResult);
      setInvoices(invoiceResult.invoices);
      setInvoiceMeta({
        page: invoiceResult.page ?? targetPage,
        size: invoiceResult.size ?? 10,
        totalItems: invoiceResult.totalItems ?? invoiceResult.invoices.length,
        totalPages: Math.max(invoiceResult.totalPages ?? 1, 1),
        hasNext: Boolean(invoiceResult.hasNext),
        hasPrevious: Boolean(invoiceResult.hasPrevious),
      });
      const nextSources = [overviewResult.source, invoiceResult.source];
      setDataSource(
        nextSources.includes("placeholder")
          ? "placeholder"
          : nextSources.includes("offline")
            ? "offline"
            : "api",
      );
    } catch (error) {
      setToast({
        message: error?.message || "Could not load billing details right now.",
        type: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTenant?.name, activeTenant?.slug, activeTenantId, invoicePage, tenantPlan]);

  React.useEffect(() => {
    setInvoicePage(0);
  }, [activeTenantId]);

  React.useEffect(() => {
    loadBillingData({ page: invoicePage });
  }, [invoicePage, loadBillingData]);

  React.useEffect(() => {
    if (!focusPlanId || loading || typeof window === "undefined") return undefined;

    const targetCard = planCardRefs.current[focusPlanId];
    if (!targetCard) return undefined;

    const timerId = window.setTimeout(() => {
      targetCard.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      targetCard.focus({ preventScroll: true });
    }, 80);

    return () => window.clearTimeout(timerId);
  }, [focusPlanId, loading]);

  const clearPaymentQuery = React.useCallback(() => {
    const nextParams = new URLSearchParams(location.search);
    [
      "paymentStatus",
      "status",
      "reference",
      "trxref",
      "transaction_id",
      "session_id",
      "plan",
      "provider",
    ].forEach((key) => nextParams.delete(key));

    const nextSearch = nextParams.toString();
    navigate(
      {
        pathname: "/billing",
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }, [location.search, navigate]);

  const clearPlanIntentQuery = React.useCallback(() => {
    const nextParams = new URLSearchParams(location.search);
    nextParams.delete("plan");
    const nextSearch = nextParams.toString();
    navigate(
      {
        pathname: "/billing",
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }, [location.search, navigate]);

  React.useEffect(() => {
    if (!activeTenantId) return;

    const params = new URLSearchParams(location.search);
    const status = String(
      params.get("paymentStatus") || params.get("status") || "",
    ).toLowerCase();
    const reference =
      params.get("reference") ||
      params.get("trxref") ||
      params.get("transaction_id") ||
      params.get("session_id");
    const plan = normalizePlanId(params.get("plan"), "PRO");

    if (status === "cancelled" || status === "canceled") {
      setToast({
        message: "Checkout was cancelled. No payment was charged.",
        type: "info",
      });
      clearPaymentQuery();
      return;
    }

    const canVerify =
      Boolean(reference) &&
      (status === "" ||
        status === "success" ||
        status === "paid" ||
        status === "completed");

    if (!canVerify) return;
    if (processedReferencesRef.current.has(reference)) return;

    processedReferencesRef.current.add(reference);
    setVerifyingPayment(true);

    (async () => {
      try {
        await verifyCheckoutSession({
          tenantId: activeTenantId,
          reference,
          planId: plan,
        });
        await refreshTenants({ force: true }).catch(() => null);
        await loadBillingData({ silent: true });
        setToast({
          message: "Payment confirmed. Your plan is now active.",
          type: "success",
        });
      } catch (error) {
        setToast({
          message: error?.message || "Could not confirm this payment.",
          type: "error",
        });
      } finally {
        setVerifyingPayment(false);
        clearPaymentQuery();
      }
    })();
  }, [activeTenantId, clearPaymentQuery, loadBillingData, location.search, refreshTenants]);

  const handleCheckout = React.useCallback(async (planId) => {
    if (!activeTenantId || processingPlanId) return false;
    if (!canManageBilling) {
      setToast({
        message: "Only the farm owner or farm admin can change plans.",
        type: "info",
      });
      return false;
    }
    if (isBrowserOffline) {
      setToast({
        message: "Reconnect to start checkout or change plans.",
        type: "info",
      });
      return false;
    }
    const normalizedPlan = normalizePlanId(planId, "PRO");
    if (normalizedPlan === effectivePlanId) {
      setToast({
        message: `${currentPlan.name} is already your active plan.`,
        type: "info",
      });
      return false;
    }
    if (normalizedPlan === "ENTERPRISE") {
      navigate("/product-profile#contact");
      return false;
    }

    setProcessingPlanId(normalizedPlan);
    try {
      const successUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/billing`
          : "/billing";
      const cancelUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/billing?paymentStatus=cancelled`
          : "/billing?paymentStatus=cancelled";

      const result = await createCheckoutSession({
        tenantId: activeTenantId,
        planId: normalizedPlan,
        successUrl,
        cancelUrl,
        customerEmail: user?.email || "",
      });

      if (!result.checkoutUrl) {
        throw new Error("Checkout URL was not provided.");
      }

      window.location.assign(result.checkoutUrl);
      return true;
    } catch (error) {
      setToast({
        message: error?.message || "Could not open the payment page.",
        type: "error",
      });
      setProcessingPlanId("");
      return false;
    }
  }, [
    activeTenantId,
    canManageBilling,
    currentPlan.name,
    effectivePlanId,
    isBrowserOffline,
    navigate,
    processingPlanId,
    user?.email,
  ]);

  const handleDowngradeToFree = React.useCallback(async () => {
    if (!activeTenantId || updatingSubscription) return;
    if (!canManageBilling) {
      setToast({
        message: "Only the farm owner or farm admin can change plans.",
        type: "info",
      });
      return;
    }
    if (isBrowserOffline) {
      setToast({
        message: "Reconnect to change plans.",
        type: "info",
      });
      return;
    }
    setUpdatingSubscription(true);
    try {
      await downgradeToFreePlan({ tenantId: activeTenantId });
      await refreshTenants({ force: true }).catch(() => null);
      await loadBillingData({ silent: true, page: invoicePage });
      setToast({
        message: "Your farm is now on the Free plan.",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: error?.message || "Could not switch to Free plan.",
        type: "error",
      });
    } finally {
      setUpdatingSubscription(false);
    }
  }, [
    activeTenantId,
    canManageBilling,
    invoicePage,
    isBrowserOffline,
    loadBillingData,
    refreshTenants,
    updatingSubscription,
  ]);

  React.useEffect(() => {
    if (!activeTenantId || loading || verifyingPayment || processingPlanId || updatingSubscription) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const hasPaymentResult =
      params.has("paymentStatus") ||
      params.has("status") ||
      params.has("reference") ||
      params.has("trxref") ||
      params.has("transaction_id") ||
      params.has("session_id");
    if (hasPaymentResult) return;

    const planIntentRaw = params.get("plan");
    if (!planIntentRaw) return;
    const requestedPlan = normalizePlanId(planIntentRaw, "");
    if (!requestedPlan) return;

    const intentKey = `${activeTenantId}:${requestedPlan}:${location.search}`;
    if (processedIntentRef.current.has(intentKey)) return;
    processedIntentRef.current.add(intentKey);

    if (requestedPlan === effectivePlanId) {
      setToast({
        message: `${currentPlan.name} is already active for this farm.`,
        type: "info",
      });
      clearPlanIntentQuery();
      return;
    }

    if (!canManageBilling) {
      setToast({
        message: "Only the farm owner or farm admin can change plans.",
        type: "info",
      });
      clearPlanIntentQuery();
      return;
    }

    if (requestedPlan === "FREE") {
      handleDowngradeToFree().finally(() => {
        clearPlanIntentQuery();
      });
      return;
    }

    if (requestedPlan === "ENTERPRISE") {
      navigate("/product-profile#contact");
      clearPlanIntentQuery();
      return;
    }

    (async () => {
      const redirectStarted = await handleCheckout(requestedPlan);
      if (!redirectStarted) {
        clearPlanIntentQuery();
      }
    })();
  }, [
    activeTenantId,
    canManageBilling,
    clearPlanIntentQuery,
    currentPlan.name,
    effectivePlanId,
    handleCheckout,
    handleDowngradeToFree,
    loading,
    location.search,
    navigate,
    processingPlanId,
    updatingSubscription,
    verifyingPayment,
  ]);

  async function handleCancelSubscription() {
    if (!activeTenantId || updatingSubscription) return;
    if (!canManageBilling) {
      setToast({
        message: "Only the farm owner or farm admin can manage the plan.",
        type: "info",
      });
      return;
    }
    if (isBrowserOffline) {
      setToast({
        message: "Reconnect to change plan settings.",
        type: "info",
      });
      return;
    }
    setUpdatingSubscription(true);
    try {
      await cancelSubscription({ tenantId: activeTenantId });
      await loadBillingData({ silent: true, page: invoicePage });
      setToast({
        message: "Plan cancellation has been scheduled.",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: error?.message || "Could not cancel the plan.",
        type: "error",
      });
    } finally {
      setUpdatingSubscription(false);
    }
  }

  async function handleOpenPortal() {
    if (openingPortal) return;
    if (!canManageBilling) {
      setToast({
        message: "Only the farm owner or farm admin can change payment settings.",
        type: "info",
      });
      return;
    }
    if (isBrowserOffline) {
      setToast({
        message: "Reconnect to open payment settings.",
        type: "info",
      });
      return;
    }
    setOpeningPortal(true);
    try {
      const returnUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/billing`
          : "/billing";
      const result = await createCustomerPortalSession({ returnUrl });
      if (result.portalUrl) {
        window.location.assign(result.portalUrl);
        return;
      }
      setToast({
        message: "Payment settings are not available for this subscription yet.",
        type: "info",
      });
    } catch (error) {
      setToast({
        message: error?.message || "Could not open payment settings.",
        type: "error",
      });
    } finally {
      setOpeningPortal(false);
    }
  }

  async function handleDownloadInvoice(invoice) {
    if (downloadingInvoiceId) return;
    setDownloadingInvoiceId(String(invoice?.id || ""));
    try {
      const { blob, filename } = await downloadBillingInvoice(invoice);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `invoice-${invoice?.id || "receipt"}.txt`;
      link.click();
      window.URL.revokeObjectURL(url);
      setToast({
        message: "Receipt downloaded",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: error?.message || "Could not download this receipt.",
        type: "error",
      });
    } finally {
      setDownloadingInvoiceId("");
    }
  }

  const nextBillingDateLabel =
    billing?.nextBillingDate && effectivePlanId !== "FREE"
      ? formatDate(billing.nextBillingDate)
      : "No payment due now";
  const billingStatusLabel = billing?.status || "ACTIVE";
  const billingStatusText = formatBillingStatus(billingStatusLabel);
  const billingIntervalLabel = formatIntervalLabel(billing?.interval);
  const farmName = activeTenant?.name || "your farm";
  const headerPanelClass =
    "rounded-2xl border border-sky-200/70 bg-slate-50/85 shadow-neo dark:border-sky-500/20 dark:bg-[#061024]/90 dark:shadow-[0_22px_40px_rgba(2,8,24,0.45)]";
  const glassPanelClass =
    "rounded-xl border border-white/10 bg-white/10 p-4 shadow-neo dark:bg-darkCard/70 dark:shadow-dark";
  const insetPanelClass =
    "rounded-lg border border-white/10 bg-white/5 dark:bg-darkCard/60";
  return (
    <DashboardLayout>
      <div className="space-y-4 font-body">
        <section className={`relative isolate overflow-hidden ${headerPanelClass} p-5 md:p-6`}>
          <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(108deg,rgba(37,99,235,0.17)_0%,rgba(14,116,144,0.14)_48%,rgba(16,185,129,0.12)_100%),radial-gradient(circle_at_12%_22%,rgba(56,189,248,0.13),transparent_43%),radial-gradient(circle_at_90%_22%,rgba(16,185,129,0.14),transparent_38%)] dark:bg-[linear-gradient(108deg,rgba(6,19,43,0.96)_0%,rgba(7,32,63,0.9)_48%,rgba(6,58,55,0.84)_100%),radial-gradient(circle_at_12%_22%,rgba(56,189,248,0.16),transparent_43%),radial-gradient(circle_at_90%_22%,rgba(16,185,129,0.18),transparent_38%)]" />
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-accent-primary/30 bg-accent-primary/10 px-3 py-1 text-xs font-semibold text-accent-primary dark:text-blue-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Farm billing
              </div>
              <h1 className="mt-3 text-2xl font-header font-semibold text-slate-900 dark:text-slate-100 md:text-[1.9rem]">
                Billing
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-700/90 dark:text-slate-300/85">
                See your current plan, next payment date, and receipts for{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{farmName}</span>.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 auto-rows-fr items-center gap-2 md:flex md:w-auto md:flex-wrap md:justify-start">
              <button
                type="button"
                onClick={handleOpenPortal}
                disabled={openingPortal || !canManageBilling || isBrowserOffline}
                className="order-1 inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 md:h-auto md:min-h-0 md:w-auto"
              >
                <ExternalLink className="h-4 w-4" />
                {isBrowserOffline
                  ? "Connection required"
                  : openingPortal
                    ? "Opening..."
                    : "Payment settings"}
              </button>
              <button
                type="button"
                onClick={() => loadBillingData({ silent: true, page: invoicePage })}
                disabled={refreshing || loading}
                className="order-2 inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white/45 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 disabled:opacity-60 md:h-auto md:min-h-0 md:w-auto dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="relative z-10 mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className={`${insetPanelClass} px-3 py-2.5`}>
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-600/80 dark:text-slate-300/70">
                Farm plan
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {currentPlan.name}
              </p>
            </div>
            <div className={`${insetPanelClass} px-3 py-2.5`}>
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-600/80 dark:text-slate-300/70">
                Payment Provider
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {billing?.provider || "Not connected"}
              </p>
            </div>
            <div className={`${insetPanelClass} px-3 py-2.5`}>
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-600/80 dark:text-slate-300/70">
                Receipts
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {invoices.length} {invoices.length === 1 ? "receipt" : "receipts"}
              </p>
            </div>
          </div>
        </section>

        <FarmerGuideCard
          icon={ShieldCheck}
          title="How to use billing"
          description="This page is for plan changes, receipts, and payment checks."
          storageKey="billing-guide"
          steps={[
            "Check the top boxes first to see your current plan and next payment date.",
            "Open payment settings only when you need to change payment or plan details.",
            "Use the receipt list below when you want to download proof of payment.",
          ]}
          tip="Only members with billing-management access can change billing here."
        />

        {dataSource === "offline" && (
          <div className="rounded-xl border border-sky-300/60 bg-sky-500/10 px-4 py-3 text-sm text-sky-900 dark:border-sky-400/40 dark:bg-sky-500/15 dark:text-sky-100">
            You are viewing the last saved billing snapshot. Reconnect to change plans or update
            payment settings.
          </div>
        )}

        {dataSource === "placeholder" && (
          <div className="space-y-3">
            <div className="rounded-xl border border-amber-300/60 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/15 dark:text-amber-200">
              Test payment mode is on. Live billing in this app uses Paystack, so checkout will switch
              from placeholder mode as soon as the provider keys and webhook are connected.
            </div>

            <div className={`${glassPanelClass} p-4`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Live Billing Checklist
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    What still needs to happen
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                    The tenant billing flow is already built. To charge real cards, you still need a
                    Paystack account and a few backend deployment values.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/settings"
                    className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white/20 dark:text-slate-100"
                  >
                    Add billing email
                  </Link>
                  <Link
                    to="/support?tab=tickets&compose=1&category=Billing%20%26%20plan&priority=HIGH&subject=Need%20help%20going%20live%20with%20billing&description=Please%20help%20me%20finish%20Paystack%20billing%20setup%20for%20this%20workspace."
                    className="inline-flex items-center gap-1 rounded-lg border border-accent-primary/30 bg-accent-primary/10 px-3 py-2 text-xs font-semibold text-accent-primary transition hover:bg-accent-primary/15 dark:text-blue-200"
                  >
                    Ask for setup help
                  </Link>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {LIVE_BILLING_CHECKLIST.map((item, index) => (
                  <div
                    key={item}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-700 dark:text-slate-200"
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-semibold text-amber-700 dark:text-amber-200">
                        {index + 1}
                      </span>
                      <span>{item}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(verifyingPayment || loading) && (
          <div className="rounded-xl border border-accent-primary/30 bg-accent-primary/10 px-4 py-3 text-sm text-accent-primary dark:text-blue-200">
            {verifyingPayment ? "Checking payment..." : "Loading billing details..."}
          </div>
        )}

        {!loading && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <article className={`${glassPanelClass} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Current Plan
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {currentPlan.name}
                    </p>
                  </div>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-accent-primary/20 bg-accent-primary/12 text-accent-primary shadow-[0_10px_18px_rgba(37,99,235,0.08)] dark:border-accent-primary/20 dark:bg-accent-primary/18 dark:text-blue-200 dark:shadow-none">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                </div>
              </article>

              <article className={`${glassPanelClass} p-4`}>
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Plan status
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusTone(billingStatusLabel)}`}
                >
                  {billingStatusText}
                </span>
              </article>

              <article className={`${glassPanelClass} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Next payment
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {nextBillingDateLabel}
                    </p>
                  </div>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cyan-200/70 bg-cyan-500/12 text-cyan-600 shadow-[0_10px_18px_rgba(8,145,178,0.08)] dark:border-cyan-400/20 dark:bg-cyan-500/18 dark:text-cyan-200 dark:shadow-none">
                    <Receipt className="h-4 w-4" />
                  </span>
                </div>
              </article>

              <article className={`${glassPanelClass} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Plan amount
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatMoney(billing?.amount, billing?.currency)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{billingIntervalLabel}</p>
                  </div>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200/70 bg-emerald-500/12 text-emerald-600 shadow-[0_10px_18px_rgba(16,185,129,0.08)] dark:border-emerald-400/20 dark:bg-emerald-500/18 dark:text-emerald-300 dark:shadow-none">
                    <CircleDollarSign className="h-4 w-4" />
                  </span>
                </div>
              </article>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <section className={`${glassPanelClass} p-5 xl:col-span-8`}>
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4 text-accent-primary" />
                  <h2 className="font-header font-semibold text-slate-900 dark:text-slate-100">
                    Choose your plan
                  </h2>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  {displayPlans.map((plan) => {
                    const isCurrent = plan.id === effectivePlanId;
                    const isFocused = focusPlanId === plan.id;
                    const billingInfo = getPlanBillingInfo(plan.id);
                    const isEnterprise = plan.id === "ENTERPRISE";
                    const isFreeDowngrade = plan.id === "FREE" && effectivePlanId !== "FREE";
                    const busy = processingPlanId === plan.id;

                    return (
                      <article
                        key={plan.id}
                        id={getBillingPlanCardAnchor(plan.id)}
                        ref={(node) => {
                          if (node) {
                            planCardRefs.current[plan.id] = node;
                            return;
                          }
                          delete planCardRefs.current[plan.id];
                        }}
                        tabIndex={-1}
                        className={`relative overflow-hidden rounded-2xl border p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition focus:outline-none dark:shadow-[0_14px_34px_rgba(2,6,23,0.42)] ${
                          isCurrent
                            ? "border-accent-primary/45 bg-gradient-to-br from-accent-primary/15 via-cyan-500/10 to-emerald-500/10 dark:from-accent-primary/24 dark:via-cyan-500/12 dark:to-emerald-500/12"
                            : "border-slate-200/80 bg-white/72 dark:border-slate-800/80 dark:bg-slate-900/64"
                        } ${
                          isFocused
                            ? "ring-2 ring-cyan-400/70 ring-offset-2 ring-offset-slate-50 dark:ring-cyan-300/60 dark:ring-offset-slate-950"
                            : ""
                        }`}
                      >
                        {plan.recommended && !isCurrent && (
                          <span className="absolute right-3 top-3 inline-flex rounded-full border border-violet-300/60 bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-violet-700 dark:border-violet-400/45 dark:bg-violet-500/20 dark:text-violet-200">
                            Most Popular
                          </span>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {plan.name}
                          </span>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-400/50 dark:bg-emerald-500/20 dark:text-emerald-100">
                              <BadgeCheck className="h-3 w-3" />
                              Active
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex items-end gap-2">
                          {plan.compareAtPriceLabel && (
                            <span className="text-xs font-medium text-slate-400 line-through dark:text-slate-500">
                              {plan.compareAtPriceLabel}
                            </span>
                          )}
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {plan.priceLabel}
                          </p>
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                          {plan.cycleLabel}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          {plan.promoNote || billingInfo.label}
                        </p>
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{plan.tagline}</p>

                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {plan.limits.map((limit) => (
                            <div
                              key={`${plan.id}-${limit.label}`}
                              className="min-w-0 rounded-lg border border-slate-200/70 bg-white/65 px-2 py-2 dark:border-slate-700/75 dark:bg-slate-900/70"
                            >
                              <p className="break-words text-[10px] font-medium leading-tight text-slate-500 dark:text-slate-400">
                                {normalizeLimitLabel(limit.label)}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-100">
                                {limit.value}
                              </p>
                            </div>
                          ))}
                        </div>

                        <ul className="mt-4 space-y-2">
                          {plan.highlights.slice(0, 3).map((item) => (
                            <li
                              key={`${plan.id}-${item}`}
                              className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                            >
                              <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                                <BadgeCheck className="h-2.5 w-2.5" />
                              </span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-5">
                          {isEnterprise ? (
                            <Link
                              to="/product-profile#contact"
                              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
                            >
                              Talk to Sales
                            </Link>
                          ) : isCurrent ? (
                            <button
                              type="button"
                              disabled
                              className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-300/60 bg-emerald-500/12 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-400/50 dark:bg-emerald-500/16 dark:text-emerald-200"
                            >
                              Current Plan
                            </button>
                          ) : isFreeDowngrade ? (
                            <button
                              type="button"
                              onClick={handleDowngradeToFree}
                              disabled={updatingSubscription || !canManageBilling || isBrowserOffline}
                              className="inline-flex w-full items-center justify-center rounded-xl border border-amber-300/60 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-65 dark:border-amber-400/45 dark:bg-amber-500/15 dark:text-amber-200"
                            >
                              {!canManageBilling
                                ? "Manage access required"
                                : isBrowserOffline
                                  ? "Connection required"
                                : updatingSubscription
                                  ? "Switching..."
                                  : "Switch to Free"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCheckout(plan.id)}
                              disabled={
                                busy ||
                                verifyingPayment ||
                                !canManageBilling ||
                                isBrowserOffline
                              }
                              className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-accent-primary via-blue-500 to-cyan-500 px-3 py-2 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(37,99,235,0.26)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-65"
                            >
                              {!canManageBilling
                                ? "Manage access required"
                                : isBrowserOffline
                                  ? "Connection required"
                                : busy
                                  ? "Redirecting..."
                                  : `Upgrade to ${plan.name}`}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section id="billing-controls" className="space-y-4 xl:col-span-4">
                <div className={`${glassPanelClass} p-4`}>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-accent-primary" />
                    <h3 className="font-header font-semibold text-slate-900 dark:text-slate-100">
                      Billing profile
                    </h3>
                  </div>
                  <div className={`${insetPanelClass} mt-3 space-y-3 px-3 py-3`}>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Workspace</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {organizationName}
                      </p>
                      {organizationSlug ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {organizationSlug}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Billing contact</p>
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                        {contactEmail || "Not set yet"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {contactPhone || "Add a phone number in Settings for billing follow-up."}
                      </p>
                    </div>

                    {contactAddress ? (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Address</p>
                        <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                          {contactAddress}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <Link
                    to="/settings"
                    className="mt-3 inline-flex text-xs font-semibold text-accent-primary transition hover:text-blue-500 dark:text-blue-300"
                  >
                    Update billing profile in Settings
                  </Link>
                </div>

                <div className={`${glassPanelClass} p-4`}>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-accent-primary" />
                    <h3 className="font-header font-semibold text-slate-900 dark:text-slate-100">
                      Payment method
                    </h3>
                  </div>
                  <div className={`${insetPanelClass} mt-3 px-3 py-3`}>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Provider</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {billing?.provider || "Not connected"}
                    </p>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                      {billing?.paymentMethodBrand
                        ? `${billing.paymentMethodBrand.toUpperCase()} •••• ${billing.paymentMethodLast4 || "----"}`
                        : "Card details will appear after the first successful payment."}
                    </p>
                  </div>
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Change your payment card in payment settings.
                  </p>
                </div>

                <div className={`${glassPanelClass} p-4`}>
                  <div className="flex items-center gap-2">
                    <TriangleAlert className="h-4 w-4 text-amber-500" />
                    <h3 className="font-header font-semibold text-slate-900 dark:text-slate-100">
                      Plan controls
                    </h3>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                    If you cancel, the current plan stays on until the end of this billing period.
                  </p>
                  <button
                    type="button"
                    onClick={handleCancelSubscription}
                    disabled={
                      effectivePlanId === "FREE" ||
                      updatingSubscription ||
                      !canManageBilling ||
                      isBrowserOffline
                    }
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-300/60 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-500/18 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-400/45 dark:bg-red-500/15 dark:text-red-200"
                  >
                    <XCircle className="h-4 w-4" />
                    {!canManageBilling
                      ? "Manage access required"
                      : isBrowserOffline
                        ? "Connection required"
                      : updatingSubscription
                        ? "Updating..."
                        : "Cancel plan"}
                  </button>
                  <Link
                    to="/support"
                    className="mt-3 inline-flex text-xs font-semibold text-accent-primary transition hover:text-blue-500 dark:text-blue-300"
                  >
                    Need billing help? Ask for help.
                  </Link>
                </div>

                {!canManageBilling && (
                  <div className={`${glassPanelClass} p-4 text-xs text-slate-600 dark:text-slate-300`}>
                    Your access profile does not include billing management. You can still review
                    plan details and receipts.
                  </div>
                )}
              </section>
            </div>

            <section className={`${glassPanelClass} p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-accent-primary" />
                  <h2 className="font-header font-semibold text-slate-900 dark:text-slate-100">Receipts</h2>
                </div>
                <span className="inline-flex rounded-full border border-slate-300/70 bg-white/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600 dark:border-slate-700/80 dark:bg-slate-900/65 dark:text-slate-300">
                  {invoices.length} {invoices.length === 1 ? "receipt" : "receipts"}
                </span>
              </div>

              {invoices.length === 0 ? (
                <div className={`${insetPanelClass} mt-4 px-4 py-3 text-sm text-slate-600 dark:text-slate-300`}>
                  No receipts yet. They will appear here after a successful plan payment.
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/65 dark:border-slate-800/80 dark:bg-slate-900/65">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-slate-100/70 dark:bg-slate-900/80">
                      <tr className="font-header text-[11px] uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Description</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2 text-left">Reference</th>
                        <th className="px-3 py-2 text-center">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/85">
                      {invoices.map((invoice) => (
                        <tr
                          key={invoice.id}
                          className="transition hover:bg-accent-primary/5 dark:hover:bg-accent-primary/10"
                        >
                          <td className="px-3 py-3 text-slate-700 dark:text-slate-300">
                            {formatDate(invoice.createdAt)}
                          </td>
                          <td className="px-3 py-3 text-slate-800 dark:text-slate-100">
                            {invoice.description}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-slate-800 dark:text-slate-100">
                            {formatMoney(invoice.amount, invoice.currency)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusTone(invoice.status)}`}
                            >
                              {formatBillingStatus(invoice.status)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                            {invoice.reference || "—"}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {invoice.id ? (
                              <button
                                type="button"
                                onClick={() => handleDownloadInvoice(invoice)}
                                disabled={downloadingInvoiceId === String(invoice.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-300/80 bg-white/80 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-white disabled:opacity-60 dark:border-slate-700/80 dark:bg-slate-900/75 dark:text-slate-200 dark:hover:bg-slate-900"
                              >
                                <Banknote className="h-3.5 w-3.5" />
                                {downloadingInvoiceId === String(invoice.id) ? "Downloading..." : "Download"}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500 dark:text-slate-400">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {invoiceMeta.totalPages > 1 && (
                <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-slate-500 dark:text-slate-400">
                    Page {invoiceMeta.page + 1} of {Math.max(invoiceMeta.totalPages, 1)}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={!invoiceMeta.hasPrevious || loading}
                      onClick={() => setInvoicePage((current) => Math.max(current - 1, 0))}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={!invoiceMeta.hasNext || loading}
                      onClick={() => setInvoicePage((current) => current + 1)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2 disabled:opacity-40"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
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
