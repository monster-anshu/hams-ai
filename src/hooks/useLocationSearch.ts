import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// The query string, read after hydration so statically rendered pages can still deep-link.
export function useLocationSearch() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
}
