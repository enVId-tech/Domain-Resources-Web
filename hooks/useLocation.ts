"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Browser location parts. Empty strings during static prerender, real values after hydration. */
export function useLocation() {
  const host = useSyncExternalStore(subscribe, () => window.location.host, () => "");
  const path = useSyncExternalStore(subscribe, () => window.location.pathname, () => "");
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => "");
  // The Worker adds <meta name="error-code"> to the page it serves, carrying the status it saw from the origin.
  const metaCode = useSyncExternalStore(
    subscribe,
    () => document.querySelector('meta[name="error-code"]')?.getAttribute("content") ?? "",
    () => "",
  );
  return { host, path, search, metaCode };
}
