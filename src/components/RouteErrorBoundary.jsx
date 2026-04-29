import React from "react";

/**
 * RouteErrorBoundary
 *
 * Catches React reconciliation errors (e.g. the iOS Safari "removeChild" crash
 * that happens when the mobile browser auto-detects phone numbers / dates inside
 * text nodes and silently wraps them in <a> tags, mutating the DOM outside
 * React's knowledge).
 *
 * Without this, the crash propagates to the root, the app tree is torn down,
 * and the browser does a hard full-page reload — breaking SPA behaviour on
 * mobile while desktop (which does not do auto-detection) works fine.
 *
 * Recovery strategy:
 *   1. Catch the error before it reaches the root.
 *   2. Wait one frame so React finishes any pending work.
 *   3. Call the caller-supplied `onRecover` callback (which should trigger a
 *      soft React-Router navigation to force a clean remount of the page).
 *   4. If `onRecover` is not provided, fall back to a hard reload as a
 *      last resort (still better than a blank white screen with no recovery).
 */
export default class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this._recoveryTimer = null;
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Suppress noisy console noise on mobile for known DOM mutation errors
    const msg = error?.message ?? "";
    const isRemoveChildCrash =
      msg.includes("removeChild") ||
      msg.includes("insertBefore") ||
      msg.includes("not a child");

    if (!isRemoveChildCrash) {
      console.error("[RouteErrorBoundary] Unexpected error:", error, info?.componentStack);
    } else {
      console.warn(
        "[RouteErrorBoundary] Caught a DOM mutation crash (likely mobile browser auto-formatting). Recovering…",
        msg,
      );
    }
  }

  componentDidUpdate(prevProps) {
    // Auto-reset when the route key changes so the new page gets a clean boundary.
    if (this.state.hasError && prevProps.locationKey !== this.props.locationKey) {
      if (this._recoveryTimer) {
        clearTimeout(this._recoveryTimer);
        this._recoveryTimer = null;
      }
      this.setState({ hasError: false });
    }
  }

  componentWillUnmount() {
    if (this._recoveryTimer) {
      clearTimeout(this._recoveryTimer);
      this._recoveryTimer = null;
    }
  }

  _scheduleRecovery() {
    if (this._recoveryTimer) return;

    // One rAF to let React finish flushing, then attempt recovery.
    this._recoveryTimer = requestAnimationFrame(() => {
      this._recoveryTimer = null;
      if (typeof this.props.onRecover === "function") {
        try {
          this.props.onRecover();
        } catch {
          // onRecover itself threw — reset boundary state at minimum
          this.setState({ hasError: false });
        }
      } else {
        // No soft-recovery callback available: just clear the error so the
        // component tree can attempt to re-render without a hard reload.
        this.setState({ hasError: false });
      }
    });
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Schedule recovery and render nothing (avoids a flash of broken UI).
    this._scheduleRecovery();
    return null;
  }
}
