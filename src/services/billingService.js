import apiClient from "../api/apiClient";
import { normalizePlanId } from "../constants/plans";

const BILLING_STATE_STORAGE_KEY = "kf-billing-state-cache";
const BILLING_INVOICES_STORAGE_KEY = "kf-billing-invoices-cache";
const BILLING_CHECKOUT_STORAGE_KEY = "kf-billing-checkouts-cache";
const TENANT_PLAN_OVERRIDE_STORAGE_KEY = "kf-placeholder-tenant-plan-overrides";

const BILLING_ENDPOINTS = {
  overview: "/billing/overview",
  invoices: "/billing/invoices",
  checkoutSession: "/billing/checkout/session",
  verifyCheckout: "/billing/checkout/verify",
  cancelSubscription: "/billing/subscription/cancel",
  downgradeToFree: "/billing/subscription/downgrade",
  customerPortal: "/billing/portal/session",
};

export const PLAN_BILLING_CATALOG = {
  FREE: {
    amount: 0,
    currency: "NGN",
    interval: "MONTHLY",
    paymentRequired: false,
    label: "Free",
  },
  PRO: {
    amount: 10000,
    currency: "NGN",
    interval: "MONTHLY",
    paymentRequired: true,
    label: "NGN 10,000 / month",
  },
  ENTERPRISE: {
    amount: 0,
    currency: "NGN",
    interval: "CONTRACT",
    paymentRequired: false,
    custom: true,
    label: "Custom contract",
  },
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function wait(ms = 150) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function extractErrorMessage(error, fallback) {
  const payload = error?.response?.data;
  if (typeof payload === "string" && payload.trim()) return payload;
  if (typeof payload?.message === "string" && payload.message.trim()) return payload.message;
  if (typeof payload?.error === "string" && payload.error.trim()) return payload.error;
  return fallback;
}

function readStorageMap(key) {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorageMap(key, value) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function syncTenantPlanOverride(tenantId, planId) {
  if (!tenantId || !canUseStorage()) return;

  const key = getTenantKey(tenantId);
  const map = readStorageMap(TENANT_PLAN_OVERRIDE_STORAGE_KEY);
  map[key] = normalizePlanId(planId, "FREE");
  writeStorageMap(TENANT_PLAN_OVERRIDE_STORAGE_KEY, map);
  window.dispatchEvent(new Event("kf-tenant-plan-overrides-changed"));
}

function getTenantKey(tenantId) {
  const parsed = Number(tenantId);
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : "default";
}

function isOfflineSnapshotError(error) {
  const status = error?.response?.status;
  if (!error?.response) return true;
  return status === 502 || status === 503;
}

function shouldUsePlaceholder(error) {
  const status = error?.response?.status;
  return status === 404 || status === 405 || status === 501;
}

function getHeaderValue(headers, key) {
  if (!headers) return "";
  if (typeof headers.get === "function") {
    return headers.get(key) || "";
  }
  return headers[key] || headers[String(key).toLowerCase()] || headers[String(key).toUpperCase()] || "";
}

function getResponseSource(response) {
  return getHeaderValue(response?.headers, "x-offline-cache") === "1" ? "offline" : "api";
}

function getFilenameFromHeaders(headers, fallback = "invoice-receipt.txt") {
  const disposition = getHeaderValue(headers, "content-disposition");
  if (!disposition) return fallback;
  const match = /filename="?([^"]+)"?/.exec(disposition);
  return match?.[1] || fallback;
}

function normalizeStatus(value, fallback = "ACTIVE") {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return fallback;
  if (normalized === "CANCELLED") return "CANCELED";
  return normalized;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nowIso() {
  return new Date().toISOString();
}

function addMonthsIso(baseDate = new Date(), months = 1) {
  const next = new Date(baseDate);
  next.setMonth(next.getMonth() + months);
  return next.toISOString();
}

function buildPlaceholderReceiptUrl(invoiceId) {
  return `placeholder://billing/invoices/${encodeURIComponent(invoiceId || "receipt")}`;
}

function buildCheckoutRedirectUrl(targetUrl, params = {}) {
  if (!targetUrl) return "";

  try {
    const baseOrigin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "http://localhost";
    const url = new URL(targetUrl, baseOrigin);
    Object.entries(params).forEach(([key, value]) => {
      if (value == null || value === "") return;
      url.searchParams.set(key, value);
    });

    if (/^https?:\/\//i.test(targetUrl)) {
      return url.toString();
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return targetUrl;
  }
}

function normalizeBillingState(raw = {}, fallbackPlan = "FREE") {
  const planId = normalizePlanId(raw.planId || raw.plan, normalizePlanId(fallbackPlan, "FREE"));
  const catalog = PLAN_BILLING_CATALOG[planId] || PLAN_BILLING_CATALOG.FREE;
  return {
    planId,
    status: normalizeStatus(raw.status, "ACTIVE"),
    amount: toNumber(raw.amount, catalog.amount),
    currency: String(raw.currency || catalog.currency || "NGN").toUpperCase(),
    interval: String(raw.interval || catalog.interval || "MONTHLY").toUpperCase(),
    provider: String(raw.provider || "NONE"),
    nextBillingDate: raw.nextBillingDate || raw.nextInvoiceAt || null,
    cancelAtPeriodEnd: Boolean(raw.cancelAtPeriodEnd),
    subscriptionReference: raw.subscriptionReference || raw.reference || "",
    paymentMethodBrand: raw.paymentMethodBrand || raw.cardBrand || "",
    paymentMethodLast4: raw.paymentMethodLast4 || raw.last4 || "",
    updatedAt: raw.updatedAt || raw.createdAt || null,
  };
}

function normalizeInvoice(raw = {}) {
  const invoiceId = String(raw.id || raw.invoiceId || "");
  const downloadUrl =
    raw.downloadUrl || raw.receiptUrl || (invoiceId ? buildPlaceholderReceiptUrl(invoiceId) : "");

  return {
    id: invoiceId,
    createdAt: raw.createdAt || raw.paidAt || raw.date || null,
    description: String(raw.description || raw.title || "Subscription charge"),
    amount: toNumber(raw.amount, 0),
    currency: String(raw.currency || "NGN").toUpperCase(),
    status: normalizeStatus(raw.status, "PAID"),
    reference: String(raw.reference || raw.transactionReference || ""),
    downloadUrl,
    mode:
      String(raw.mode || "").trim().toLowerCase() === "placeholder" ||
      downloadUrl.startsWith("placeholder://")
        ? "placeholder"
        : "api",
  };
}

function sortInvoices(list = []) {
  return [...list].sort((left, right) => {
    const leftTime = new Date(left?.createdAt || 0).getTime();
    const rightTime = new Date(right?.createdAt || 0).getTime();
    return rightTime - leftTime;
  });
}

function getStoredBillingState(tenantId, tenantPlan = "FREE") {
  const map = readStorageMap(BILLING_STATE_STORAGE_KEY);
  const stored = map[getTenantKey(tenantId)];
  if (stored) {
    return normalizeBillingState(stored, tenantPlan);
  }

  const normalizedPlan = normalizePlanId(tenantPlan, "FREE");
  const planMeta = getPlanBillingInfo(normalizedPlan);
  return normalizeBillingState(
    {
      planId: normalizedPlan,
      status: "ACTIVE",
      amount: planMeta.amount,
      currency: planMeta.currency,
      interval: planMeta.interval,
      provider: normalizedPlan === "FREE" ? "NONE" : "TEST MODE",
      nextBillingDate: planMeta.paymentRequired ? addMonthsIso(new Date(), 1) : null,
      cancelAtPeriodEnd: false,
      updatedAt: nowIso(),
    },
    normalizedPlan,
  );
}

function cacheBillingStateForTenant({ tenantId, billing, tenantPlan = "FREE" } = {}) {
  if (!tenantId) return normalizeBillingState(billing, tenantPlan);
  const normalized = normalizeBillingState(billing, tenantPlan);
  const map = readStorageMap(BILLING_STATE_STORAGE_KEY);
  map[getTenantKey(tenantId)] = normalized;
  writeStorageMap(BILLING_STATE_STORAGE_KEY, map);
  syncTenantPlanOverride(tenantId, normalized.planId);
  return normalized;
}

function getStoredInvoicesForTenant(tenantId) {
  const map = readStorageMap(BILLING_INVOICES_STORAGE_KEY);
  const list = Array.isArray(map[getTenantKey(tenantId)]) ? map[getTenantKey(tenantId)] : [];
  return sortInvoices(list.map((invoice) => normalizeInvoice(invoice)));
}

function cacheInvoicesForTenant({ tenantId, invoices = [] } = {}) {
  const normalizedList = sortInvoices(invoices.map((invoice) => normalizeInvoice(invoice)));
  if (!tenantId) return normalizedList;
  const map = readStorageMap(BILLING_INVOICES_STORAGE_KEY);
  map[getTenantKey(tenantId)] = normalizedList;
  writeStorageMap(BILLING_INVOICES_STORAGE_KEY, map);
  return normalizedList;
}

function addInvoiceForTenant({ tenantId, invoice } = {}) {
  const normalizedInvoice = normalizeInvoice({
    ...invoice,
    mode: invoice?.mode || "placeholder",
  });
  const existing = getStoredInvoicesForTenant(tenantId).filter(
    (item) => item.id !== normalizedInvoice.id,
  );
  return cacheInvoicesForTenant({
    tenantId,
    invoices: [normalizedInvoice, ...existing],
  });
}

function paginateInvoices(items = [], page = 0, size = 10) {
  const safePage = Math.max(toNumber(page, 0), 0);
  const safeSize = Math.max(toNumber(size, 10), 1);
  const totalItems = items.length;
  const totalPages = Math.max(Math.ceil(totalItems / safeSize), 1);
  const boundedPage = Math.min(safePage, totalPages - 1);
  const start = boundedPage * safeSize;
  const pagedItems = items.slice(start, start + safeSize);

  return {
    invoices: pagedItems,
    page: boundedPage,
    size: safeSize,
    totalItems,
    totalPages,
    hasNext: boundedPage + 1 < totalPages,
    hasPrevious: boundedPage > 0,
  };
}

function getStoredPendingCheckouts(tenantId) {
  const map = readStorageMap(BILLING_CHECKOUT_STORAGE_KEY);
  const list = Array.isArray(map[getTenantKey(tenantId)]) ? map[getTenantKey(tenantId)] : [];
  return list.filter((entry) => entry && typeof entry === "object");
}

function savePendingCheckout(tenantId, checkout) {
  if (!tenantId) return checkout;
  const map = readStorageMap(BILLING_CHECKOUT_STORAGE_KEY);
  const key = getTenantKey(tenantId);
  const list = getStoredPendingCheckouts(tenantId).filter(
    (entry) => entry.reference !== checkout.reference,
  );
  map[key] = [...list, checkout];
  writeStorageMap(BILLING_CHECKOUT_STORAGE_KEY, map);
  return checkout;
}

function consumePendingCheckout(tenantId, reference) {
  if (!tenantId || !reference) return null;

  const map = readStorageMap(BILLING_CHECKOUT_STORAGE_KEY);
  const key = getTenantKey(tenantId);
  let matched = null;
  const nextList = getStoredPendingCheckouts(tenantId).filter((entry) => {
    if (!matched && entry.reference === reference) {
      matched = entry;
      return false;
    }
    return true;
  });

  map[key] = nextList;
  writeStorageMap(BILLING_CHECKOUT_STORAGE_KEY, map);
  return matched;
}

function buildPlaceholderInvoice({ reference, planId, amount, currency, createdAt = nowIso() }) {
  const normalizedPlan = normalizePlanId(planId, "PRO");
  return normalizeInvoice({
    id: `INV-${reference}`,
    createdAt,
    description: `${normalizedPlan} subscription payment`,
    amount,
    currency,
    status: "PAID",
    reference,
    downloadUrl: buildPlaceholderReceiptUrl(reference),
    mode: "placeholder",
  });
}

function buildReceiptText(invoice = {}) {
  const amount = toNumber(invoice.amount, 0);
  const currency = String(invoice.currency || "NGN").toUpperCase();
  const issuedAt = invoice.createdAt || nowIso();

  return [
    "KFarms Billing Receipt",
    "",
    `Receipt ID: ${invoice.id || "N/A"}`,
    `Reference: ${invoice.reference || "N/A"}`,
    `Status: ${normalizeStatus(invoice.status, "PAID")}`,
    `Amount: ${currency} ${amount.toLocaleString("en-NG")}`,
    `Description: ${invoice.description || "Subscription charge"}`,
    `Issued At: ${issuedAt}`,
  ].join("\n");
}

function createTextReceipt(invoice = {}) {
  return {
    blob: new Blob([buildReceiptText(invoice)], {
      type: "text/plain;charset=utf-8",
    }),
    filename: `invoice-${invoice?.id || invoice?.reference || "receipt"}.txt`,
  };
}

function throwOfflineActionError(fallback) {
  throw new Error(fallback);
}

export function getPlanBillingInfo(planId) {
  const normalized = normalizePlanId(planId, "FREE");
  return PLAN_BILLING_CATALOG[normalized] || PLAN_BILLING_CATALOG.FREE;
}

export async function getBillingOverview({ tenantId, tenantPlan = "FREE" } = {}) {
  try {
    const response = await apiClient.get(BILLING_ENDPOINTS.overview);
    const payload = response.data?.data ?? response.data;
    const billing = cacheBillingStateForTenant({
      tenantId,
      billing: normalizeBillingState(payload, tenantPlan),
      tenantPlan,
    });

    return {
      billing,
      source: getResponseSource(response),
    };
  } catch (error) {
    if (isOfflineSnapshotError(error)) {
      await wait(80);
      return {
        billing: getStoredBillingState(tenantId, tenantPlan),
        source: "offline",
      };
    }

    if (shouldUsePlaceholder(error)) {
      await wait(120);
      return {
        billing: getStoredBillingState(tenantId, tenantPlan),
        source: "placeholder",
      };
    }

    throw new Error(extractErrorMessage(error, "Could not load billing overview."));
  }
}

export async function getBillingInvoices({ tenantId, page = 0, size = 10 } = {}) {
  try {
    const response = await apiClient.get(BILLING_ENDPOINTS.invoices, {
      params: { page, size },
    });
    const payload = response.data?.data ?? response.data;
    const items = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
        ? payload
        : [];
    const normalizedPageInvoices = items.map((invoice) => normalizeInvoice(invoice));
    const existingInvoices = getStoredInvoicesForTenant(tenantId).filter(
      (storedInvoice) =>
        !normalizedPageInvoices.some((invoice) => invoice.id === storedInvoice.id),
    );
    cacheInvoicesForTenant({
      tenantId,
      invoices: [...normalizedPageInvoices, ...existingInvoices],
    });

    const totalItems = toNumber(payload?.totalItems, normalizedPageInvoices.length);
    const totalPages = Math.max(
      toNumber(payload?.totalPages, Math.ceil(Math.max(totalItems, 1) / Math.max(size, 1))),
      1,
    );
    const currentPage = Math.min(Math.max(toNumber(payload?.page, page), 0), totalPages - 1);

    return {
      invoices: normalizedPageInvoices,
      page: currentPage,
      size: toNumber(payload?.size, size),
      totalItems,
      totalPages,
      hasNext:
        payload?.hasNext != null ? Boolean(payload.hasNext) : currentPage + 1 < totalPages,
      hasPrevious:
        payload?.hasPrevious != null ? Boolean(payload.hasPrevious) : currentPage > 0,
      source: getResponseSource(response),
    };
  } catch (error) {
    if (isOfflineSnapshotError(error)) {
      await wait(80);
      return {
        ...paginateInvoices(getStoredInvoicesForTenant(tenantId), page, size),
        source: "offline",
      };
    }

    if (shouldUsePlaceholder(error)) {
      await wait(120);
      return {
        ...paginateInvoices(getStoredInvoicesForTenant(tenantId), page, size),
        source: "placeholder",
      };
    }

    throw new Error(extractErrorMessage(error, "Could not load billing invoices."));
  }
}

export async function createCheckoutSession({
  tenantId,
  planId,
  successUrl,
  cancelUrl,
  customerEmail,
} = {}) {
  const normalizedPlan = normalizePlanId(planId, "PRO");
  const planMeta = getPlanBillingInfo(normalizedPlan);

  try {
    const response = await apiClient.post(BILLING_ENDPOINTS.checkoutSession, {
      planId: normalizedPlan,
      successUrl,
      cancelUrl,
      customerEmail,
    });
    const payload = response.data?.data ?? response.data ?? {};
    return {
      checkoutUrl: payload.checkoutUrl || payload.url || "",
      reference: payload.reference || payload.transactionReference || "",
      provider: payload.provider || "PAYSTACK",
      amount: toNumber(payload.amount, planMeta.amount),
      currency: String(payload.currency || planMeta.currency || "NGN").toUpperCase(),
      mode: "api",
    };
  } catch (error) {
    if (isOfflineSnapshotError(error)) {
      throwOfflineActionError("Reconnect to start checkout or change plans.");
    }

    if (shouldUsePlaceholder(error)) {
      const reference = `TEST-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      savePendingCheckout(tenantId, {
        reference,
        planId: normalizedPlan,
        amount: planMeta.amount,
        currency: planMeta.currency,
        customerEmail: customerEmail || "",
        createdAt: nowIso(),
      });
      await wait(180);
      return {
        checkoutUrl: buildCheckoutRedirectUrl(successUrl, {
          paymentStatus: "success",
          reference,
          plan: normalizedPlan,
          provider: "TEST_MODE",
        }),
        reference,
        provider: "TEST MODE",
        amount: planMeta.amount,
        currency: planMeta.currency,
        mode: "placeholder",
      };
    }

    throw new Error(extractErrorMessage(error, "Could not start checkout."));
  }
}

export async function verifyCheckoutSession({
  tenantId,
  reference,
  planId = "PRO",
} = {}) {
  const normalizedPlan = normalizePlanId(planId, "PRO");

  try {
    const response = await apiClient.post(BILLING_ENDPOINTS.verifyCheckout, {
      reference,
      planId: normalizedPlan,
    });
    const payload = response.data?.data ?? response.data ?? {};
    const billing = cacheBillingStateForTenant({
      tenantId,
      billing: normalizeBillingState(payload?.billing || payload, normalizedPlan),
      tenantPlan: normalizedPlan,
    });
    const invoice = payload?.invoice ? normalizeInvoice(payload.invoice) : null;

    if (invoice) {
      addInvoiceForTenant({ tenantId, invoice: { ...invoice, mode: invoice.mode || "api" } });
    }

    return {
      billing,
      invoice,
      mode: "api",
    };
  } catch (error) {
    if (isOfflineSnapshotError(error)) {
      throwOfflineActionError("Reconnect to confirm this payment.");
    }

    if (shouldUsePlaceholder(error)) {
      const checkout = consumePendingCheckout(tenantId, reference);
      if (!checkout) {
        throw new Error("Could not confirm this payment.");
      }

      const planMeta = getPlanBillingInfo(checkout.planId || normalizedPlan);
      const updatedAt = nowIso();
      const billing = cacheBillingStateForTenant({
        tenantId,
        tenantPlan: checkout.planId || normalizedPlan,
        billing: {
          ...getStoredBillingState(tenantId, checkout.planId || normalizedPlan),
          planId: checkout.planId || normalizedPlan,
          status: "ACTIVE",
          amount: planMeta.amount,
          currency: planMeta.currency,
          interval: planMeta.interval,
          provider: "TEST MODE",
          nextBillingDate: planMeta.paymentRequired ? addMonthsIso(new Date(updatedAt), 1) : null,
          cancelAtPeriodEnd: false,
          paymentMethodBrand: planMeta.paymentRequired ? "visa" : "",
          paymentMethodLast4: planMeta.paymentRequired ? "4242" : "",
          subscriptionReference: checkout.reference,
          updatedAt,
        },
      });
      const invoice = planMeta.paymentRequired
        ? buildPlaceholderInvoice({
            reference: checkout.reference,
            planId: checkout.planId || normalizedPlan,
            amount: planMeta.amount,
            currency: planMeta.currency,
            createdAt: updatedAt,
          })
        : null;

      if (invoice) {
        addInvoiceForTenant({ tenantId, invoice });
      }

      await wait(180);
      return {
        billing,
        invoice,
        mode: "placeholder",
      };
    }

    throw new Error(extractErrorMessage(error, "Could not verify payment."));
  }
}

export async function cancelSubscription({ tenantId } = {}) {
  try {
    const response = await apiClient.post(BILLING_ENDPOINTS.cancelSubscription);
    const payload = response.data?.data ?? response.data ?? {};
    return {
      billing: cacheBillingStateForTenant({
        tenantId,
        billing: normalizeBillingState(payload.billing || payload, payload.planId || "PRO"),
        tenantPlan: payload.planId || "PRO",
      }),
      mode: "api",
    };
  } catch (error) {
    if (isOfflineSnapshotError(error)) {
      throwOfflineActionError("Reconnect to change plan settings.");
    }

    if (shouldUsePlaceholder(error)) {
      const current = getStoredBillingState(tenantId, "PRO");
      const billing = cacheBillingStateForTenant({
        tenantId,
        tenantPlan: current.planId || "PRO",
        billing: {
          ...current,
          cancelAtPeriodEnd: true,
          updatedAt: nowIso(),
        },
      });
      await wait(120);
      return {
        billing,
        mode: "placeholder",
      };
    }

    throw new Error(extractErrorMessage(error, "Could not cancel subscription."));
  }
}

export async function downgradeToFreePlan({ tenantId } = {}) {
  try {
    const response = await apiClient.post(BILLING_ENDPOINTS.downgradeToFree, {
      planId: "FREE",
    });
    const payload = response.data?.data ?? response.data ?? {};
    return {
      billing: cacheBillingStateForTenant({
        tenantId,
        billing: normalizeBillingState(payload.billing || payload, "FREE"),
        tenantPlan: "FREE",
      }),
      mode: "api",
    };
  } catch (error) {
    if (isOfflineSnapshotError(error)) {
      throwOfflineActionError("Reconnect to change plans.");
    }

    if (shouldUsePlaceholder(error)) {
      const billing = cacheBillingStateForTenant({
        tenantId,
        tenantPlan: "FREE",
        billing: {
          ...getStoredBillingState(tenantId, "FREE"),
          planId: "FREE",
          status: "ACTIVE",
          amount: 0,
          currency: "NGN",
          interval: "MONTHLY",
          provider: "NONE",
          nextBillingDate: null,
          cancelAtPeriodEnd: false,
          subscriptionReference: "",
          paymentMethodBrand: "",
          paymentMethodLast4: "",
          updatedAt: nowIso(),
        },
      });
      await wait(120);
      return {
        billing,
        mode: "placeholder",
      };
    }

    throw new Error(extractErrorMessage(error, "Could not downgrade to Free plan."));
  }
}

export async function createCustomerPortalSession({ returnUrl } = {}) {
  try {
    const response = await apiClient.post(BILLING_ENDPOINTS.customerPortal, {
      returnUrl,
    });
    const payload = response.data?.data ?? response.data ?? {};
    return {
      portalUrl: payload.portalUrl || payload.url || "",
      mode: "api",
    };
  } catch (error) {
    if (isOfflineSnapshotError(error)) {
      throwOfflineActionError("Reconnect to open payment settings.");
    }

    if (shouldUsePlaceholder(error)) {
      await wait(100);
      return {
        portalUrl: "",
        mode: "placeholder",
      };
    }

    throw new Error(extractErrorMessage(error, "Could not open billing portal."));
  }
}

export async function downloadBillingInvoice(invoice) {
  const invoiceId = invoice?.id;
  const shouldUseLocalReceipt =
    invoice?.mode === "placeholder" ||
    String(invoice?.downloadUrl || "").startsWith("placeholder://");

  if (shouldUseLocalReceipt) {
    const { blob, filename } = createTextReceipt(invoice);
    return {
      blob,
      filename,
      mode: "placeholder",
    };
  }

  try {
    const response = await apiClient.get(`/billing/invoices/${invoiceId}/receipt`, {
      responseType: "blob",
    });
    return {
      blob: response.data,
      filename: getFilenameFromHeaders(
        response.headers,
        `invoice-${invoiceId || "receipt"}.txt`,
      ),
      mode: "api",
    };
  } catch (error) {
    if (isOfflineSnapshotError(error) || shouldUsePlaceholder(error)) {
      const { blob, filename } = createTextReceipt(invoice);
      return {
        blob,
        filename,
        mode: "offline",
      };
    }

    throw new Error(extractErrorMessage(error, "Could not download invoice receipt."));
  }
}
