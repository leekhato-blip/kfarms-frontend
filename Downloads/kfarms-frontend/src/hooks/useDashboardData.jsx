import React from "react";
import { getDashboardSummary } from "../services/dashboardService";

export default function useDashboardData(autoRefreshInterval = 3000) {
    const [data, setData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    async function fetchData() {
        setLoading(true);
        setError("");

        try {
            const res = await getDashboardSummary();

            if (res?.success) {
                setData(res.data)
            } else {
                setError(res?.message || "Failed to load dashboard data");
            }
        } catch (err) {
            setError(err?.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        fetchData();

        // auto-refresh setup
        const intervalId = setInterval(() => {
            fetchData(false); // silent update
        }, autoRefreshInterval);
        
        return () => clearInterval(intervalId);
    }, [autoRefreshInterval]);

    return { data, loading, error, refetch: fetchData };
}