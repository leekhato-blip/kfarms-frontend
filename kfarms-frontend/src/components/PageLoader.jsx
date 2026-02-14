import React from "react";

export default function PageLoader({ label = "Loading your workspace…" }) {
  const fallback = {
    position: "fixed",
    inset: 0,
    zIndex: 9990,
    display: "grid",
    placeItems: "center",
    background: "rgba(2, 6, 23, 0.92)",
  };
  const ring = {
    width: 24,
    height: 24,
    borderRadius: "50%",
    border: "3px solid rgba(255, 255, 255, 0.45)",
    borderTopColor: "#ffffff",
    animation: "kf-spin 0.9s linear infinite",
  };

  return (
    <div className="page-loader" style={fallback} role="status" aria-live="polite">
      <style>{`
        @keyframes kf-spin { to { transform: rotate(360deg); } }
      `}</style>
      <div className="page-loader-card">
        <div className="page-loader-mark">
          <span className="page-loader-ring" style={ring} />
          <span className="page-loader-core" />
        </div>
        <div className="page-loader-text">
          <div className="page-loader-title">KFarms</div>
          <div className="page-loader-subtitle">{label}</div>
        </div>
      </div>
    </div>
  );
}
