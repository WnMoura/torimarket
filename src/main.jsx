import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
// Inter variável, self-hosted. `wght.css` traz todos os alfabetos com unicode-range:
// em pt-BR o navegador baixa só o subset latino (~48 KB).
import "@fontsource-variable/inter/wght.css";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
