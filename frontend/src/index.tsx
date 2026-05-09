// Must be imported before React so the DOM-prototype patch is installed
// before React's commit phase runs. Prevents browser page translators
// (Edge / Google Translate / extensions) from crashing the app via
// parent-mismatch DOMExceptions. See the module for details.
import "@app/utils/patchDomForTranslators";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "../vite-env.d.ts"; // eslint-disable-line no-restricted-imports -- Outside app paths
import "@app/styles/index.css"; // Import global styles
import React from "react";
import ReactDOM from "react-dom/client";
import { ColorSchemeScript } from "@mantine/core";
import { BrowserRouter } from "react-router-dom";
import App from "@app/App";
import "@app/i18n"; // Initialize i18next
import { PostHogProvider } from "@posthog/react";
import { BASE_PATH } from "@app/constants/app";

// PostHog is initialized lazily after first render — it must never block the
// critical paint path. The client object is created empty here so the provider
// can wrap the tree synchronously; the actual init (network + JS eval) fires
// in an idle callback once the page is already interactive.
import posthog from "posthog-js";

function initPostHog() {
  posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    defaults: "2025-05-24",
    capture_exceptions: true,
    debug: false,
    opt_out_capturing_by_default: true,
    persistence: "memory",
    cross_subdomain_cookie: false,
  });
}

function updatePosthogConsent() {
  if (!posthog.__loaded) return;
  const optIn =
    (window.CookieConsent as any)?.acceptedService?.("posthog", "analytics") ||
    false;
  if (optIn) {
    posthog.set_config({ persistence: "localStorage+cookie" });
    posthog.opt_in_capturing();
  } else {
    posthog.opt_out_capturing();
    posthog.set_config({ persistence: "memory" });
  }
}

window.addEventListener("cc:onConsent", updatePosthogConsent);
window.addEventListener("cc:onChange", updatePosthogConsent);

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container missing in index.html");
}

const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <ColorSchemeScript />
    <PostHogProvider client={posthog}>
      <BrowserRouter basename={BASE_PATH}>
        <App />
      </BrowserRouter>
    </PostHogProvider>
  </React.StrictMode>,
);

// Fire PostHog init after the browser has painted and is idle — completely
// off the critical path. Falls back to a short timeout in browsers that
// don't support requestIdleCallback (e.g. Safari < 16).
if ("requestIdleCallback" in window) {
  requestIdleCallback(initPostHog, { timeout: 3000 });
} else {
  setTimeout(initPostHog, 500);
}
