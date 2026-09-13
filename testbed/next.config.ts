import path from "node:path";
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    // testbed/ is a nested npm project inside the ascendra-commons-ui repo —
    // pin the root so Turbopack doesn't infer it from the outer lockfile.
    root: path.resolve(__dirname),
  },
};

export default withBundleAnalyzer(nextConfig);
