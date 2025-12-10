import React from "react";
import ReactDOM from "react-dom/client";

import { AdminApp } from "./App";
import "./App.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <div className="dark">
      <AdminApp apiBaseUrl={import.meta.env.VITE_API_BASE_URL} appName="BaaS Admin" />
    </div>
  </React.StrictMode>
);
