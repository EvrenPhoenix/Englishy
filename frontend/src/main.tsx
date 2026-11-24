import "./styles/global.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import { PreferencesProvider } from "./components/PreferencesProvider";
import { LanguageProvider } from "./i18n/provider";
import { router } from "./router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PreferencesProvider>
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>
    </PreferencesProvider>
  </StrictMode>,
);
