import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

/** macOS's Bonjour name ("Zakas-MacBook-Air") — what Tailscale MagicDNS and <name>.local expose; null elsewhere. */
function localHostName(): string | null {
  try {
    return execFileSync("scutil", ["--get", "LocalHostName"], { encoding: "utf8" }).trim() || null;
  } catch {
    return null;
  }
}

// This machine's names: "zakas-macbook-air" (Bonjour, Tailscale) and os.hostname() — which macOS changes with the
// network ("Zakas-Air"), so it alone let the page load as dead HTML when opened by the other name.
const machines = [...new Set([os.hostname(), localHostName()].filter((n): n is string => !!n).map((n) => n.toLowerCase().replace(/\.local$/, "")))];

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Next 16.4+ writes an AGENTS.md on `next dev` when an AI agent starts it — keep the tree clean.
  agentRules: false,
  // Dev only: let the app be opened by machine name — Tailscale (<machine>, <machine>.<tailnet>.ts.net), Bonjour
  // (<machine>.local) — not just localhost. Without it the dev server refuses its scripts to those hosts: the page loads
  // as dead HTML (menus show, nothing clicks).
  allowedDevOrigins: ["*.ts.net", "*.local", ...machines],
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
