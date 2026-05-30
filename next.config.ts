import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const isDev = process.env.NODE_ENV === "development";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: isDev,
});

const nextConfig: NextConfig = {
  // Static export is only needed for the production build (Firebase Hosting).
  // Enabling it in `next dev` would force every dynamic route id to be known
  // ahead of time via generateStaticParams — but our ids only exist at runtime
  // (read client-side via useParams), so dev would error on real ids. In dev we
  // therefore run a normal server where dynamic routes resolve on demand.
  ...(isDev ? {} : { output: "export" as const }),
};

export default withSerwist(nextConfig);
