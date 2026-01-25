import React, { useEffect, useState } from "react";

export function useFetch(fetcher, deps = []) {
    const [data,setData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = useState(null);

    React.useEffect(() => {
        let mounted = true;
        setLoading(true);
        fetcher()
            .then((res) => {
                if (!mounted) return;
                setData(res);
            })
            .catch((err) => {
                if (!mounted) return;
                setError(err);
            })
            .finally(() => mounted && setLoading(false));
            return () => (mounted = false); 
    }, deps);
    return { data, loading, error }
}