"use client";

import { useEffect } from "react";

// Registers the service worker once per session. Does not ask for
// permission — subscription is user-initiated from Settings.
export function NotificationsManager() {
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => console.error("sw registration failed", err));
  }, []);
  return null;
}
