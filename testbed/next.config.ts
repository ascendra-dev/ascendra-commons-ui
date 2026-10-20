import os from "node:os";
import path from "node:path";
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

// This machine's name, as Tailscale MagicDNS / Bonjour expose it: "zakas-macbook-air" and "zakas-macbook-air.local".
const machine = os.hostname().toLowerCase().replace(/\.local$/, "");

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Next 16.4+ writes an AGENTS.md on `next dev` when an AI agent starts it — keep the tree clean.
  agentRules: false,
  // Dev only: let the app be opened by machine name — Tailscale (<machine>, <machine>.<tailnet>.ts.net), Bonjour
  // (<machine>.local) — not just localhost. Without it the dev server refuses live reload from those hosts.
  allowedDevOrigins: ["*.ts.net", "*.local", machine],
  // The browser calls the sandbox API through this app (NEXT_PUBLIC_API_URL=/sandbox-api), so it only ever talks to the
  // host it opened the page from: no CORS, and another device (a phone over Tailscale) never hits its own localhost.
  async rewrites() {
    return [
      { source: "/sandbox-api/:path*", destination: `${process.env.SANDBOX_API_URL ?? "http://localhost:3010"}/:path*` },
    ];
  },
  turbopack: {
    // testbed/ is a nested npm project inside the ascendra-commons-ui repo —
    // pin the root so Turbopack doesn't infer it from the outer lockfile.
    root: path.resolve(__dirname),
  },
};

export default withBundleAnalyzer(nextConfig);
