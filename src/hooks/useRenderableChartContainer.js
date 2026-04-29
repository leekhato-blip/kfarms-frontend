import React from "react";

export default function useRenderableChartContainer() {
  const containerRef = React.useRef(null);
  const [canRenderChart, setCanRenderChart] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const element = containerRef.current;
    if (!element) {
      return undefined;
    }

    const sync = () => {
      const node = containerRef.current;
      if (!node) {
        setCanRenderChart(false);
        return;
      }

      const rect = node.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(node);
      const isHidden =
        computedStyle.display === "none" ||
        computedStyle.visibility === "hidden";

      setCanRenderChart(!isHidden && rect.width > 0 && rect.height > 0);
    };

    sync();

    const resizeObserver =
      typeof ResizeObserver === "function" ? new ResizeObserver(sync) : null;
    resizeObserver?.observe(element);
    window.addEventListener("resize", sync);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);

  return { containerRef, canRenderChart };
}
