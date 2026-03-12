import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

export default function useQuickCreateModal(onOpen, options = {}) {
  const { param = "create", match = null, enabled = true } = options;
  const [searchParams, setSearchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const handledKeyRef = useRef("");

  useEffect(() => {
    if (!enabled || typeof onOpen !== "function") {
      return;
    }

    const params = new URLSearchParams(searchKey);
    const value = params.get(param);
    if (!value) {
      return;
    }

    const matches = Array.isArray(match) ? match : match ? [match] : null;
    if (matches && !matches.includes(value)) {
      return;
    }

    const handledKey = `${param}:${value}:${searchKey}`;
    if (handledKeyRef.current === handledKey) {
      return;
    }

    handledKeyRef.current = handledKey;
    onOpen(value);
    params.delete(param);
    setSearchParams(params, { replace: true });
  }, [enabled, match, onOpen, param, searchKey, setSearchParams]);
}
