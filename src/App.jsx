import React from "react";
import AppRoutes from "./routes/AppRoutes";
import BuildInfoBadge from "./components/BuildInfoBadge";

export default function App() {
  return (
    <>
      <AppRoutes />
      <BuildInfoBadge />
    </>
  );
}
