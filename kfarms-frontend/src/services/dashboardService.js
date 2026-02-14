import api from "./axios";

/**
 * Fetches all summary data for the dashboard.
 * Backend route: GET /dashboard/summary
 * Returns: { success, message, data }
 */
export async function getDashboardSummary() {
    const res = await api.get("/dashboard/summary");
    return res.data;
}

/**
 * Fetches finance summary for the Revenue & Expenses chart.
 * Backend: GET /dashboard/finance-summary
 * Expected: { monthlyFinance: [ {month, revenue, expense}, ... ] }
 */
export async function getFinanceSummary() {
    const res = await api.get("/dashboard/finance-summary");
    return res.data.data;
}

/**
 * 
 */
export async function getFeedWatchlist() {
    const res = await api.get("inventory/watchlist");
    return res.data.data;
}

export async function getRecentActivities() {
    const res = await api.get("/dashboard/recent-activities");
    return res.data;
}