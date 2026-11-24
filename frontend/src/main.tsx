import "./styles/global.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <StrictMode><main id="main">Englishy</main></StrictMode>,
);
