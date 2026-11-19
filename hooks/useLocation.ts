"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Browser location parts. Empty strings during static prerender, real values after hydration. */
export function useLocation() {
  const host = useSyncExternalStore(subscribe, () => window.location.host, () => "");
  const path = useSyncExternalStore(subscribe, () => window.location.pathname, () => "");
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => "");
  return { host, path, search };
}
