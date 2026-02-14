import "./index.css";
import App from "./App.jsx";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth.jsx";
import { TenantProvider } from "./tenant/TenantContext.jsx";

const root = document.getElementById("root");

createRoot(root).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <TenantProvider>
          <App />
        </TenantProvider>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
);
