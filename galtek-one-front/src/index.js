import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import AppRouter from "./routes/AppRouter";
import { AuthProvider } from "./auth/AuthContext";
import { CashSessionProvider } from "./cash/CashSessionContext";
import { PrimeReactProvider } from "primereact/api";
import "antd/dist/reset.css";
import "@fontsource/kodchasan/300.css";
import "@fontsource/kodchasan/400.css";
import "@fontsource/kodchasan/500.css";
import "@fontsource/kodchasan/600.css";
import "@fontsource/kodchasan/700.css";
import "./index.css";
import "./style/components/common/OverlaySurfaces.css";

import { DeviceProvider } from "./auth/DeviceContext";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PrimeReactProvider
      value={{
        hideOverlaysOnDocumentScrolling: true,
      }}
    >
      <DeviceProvider>
        <AuthProvider>
          <CashSessionProvider>
            <HashRouter>
              <AppRouter />
            </HashRouter>
          </CashSessionProvider>
        </AuthProvider>
      </DeviceProvider>
    </PrimeReactProvider>
  </React.StrictMode>
);
