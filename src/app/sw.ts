/// <reference lib="webworker" />
import { defaultCache, PAGES_CACHE_NAME } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // cacheOnNavigation stores the exported HTML in "pages". Navigation
      // requests have no Content-Type header, so match their mode explicitly.
      matcher: ({ request, url, sameOrigin }) =>
        sameOrigin && request.mode === "navigate" && url.pathname === "/theory",
      handler: new NetworkFirst({ cacheName: PAGES_CACHE_NAME.html }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
