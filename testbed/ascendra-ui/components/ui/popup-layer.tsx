"use client";

import * as React from "react";

/** Popups opened in the page: above the sidebar (z-90), below the top nav (z-100) — the nav covers them as the page scrolls. */
const PAGE_POPUP_Z = 95;
/**
 * Popups opened from the top bars themselves (Header, Nav — an account menu, a nav dropdown): above the nav (z-100),
 * so the bar they open from never covers them; below the mobile sidebar and its overlay (z-140+).
 */
const TOP_BAR_POPUP_Z = 101;
/** Popups opened inside a sheet, dialog or drawer: above its panel (z-1000). */
const OVERLAY_POPUP_Z = 1001;
/** Space kept between the top bars and a popup opened above its trigger, so it doesn't touch them. */
const TOP_BAR_GAP = 8;

const PopupLayerContext = React.createContext(PAGE_POPUP_Z);

/**
 * The z-index for a popup (dropdown, select, tooltip, …) opened here. Set it as the popup content's
 * `style.zIndex`, and wrap that content's children in `<PopupLayer z={z}>` if popups can open inside it.
 */
function usePopupZIndex() {
  return React.useContext(PopupLayerContext);
}

/** Bottom edge of the top bars (Header, Nav) still on screen; 0 when there are none. */
function measureTopBars() {
  let bottom = 0;
  for (const bar of document.querySelectorAll('[data-slot="header"], [data-slot="nav"]')) {
    bottom = Math.max(bottom, Math.ceil(bar.getBoundingClientRect().bottom));
  }
  return bottom;
}

// One shared measurement for every popup on the page, re-taken at most once a frame while the page scrolls or resizes.
let topBarsBottom = 0;
let frame = 0;
const listeners = new Set<() => void>();

function remeasure() {
  frame = 0;
  const next = measureTopBars();
  if (next === topBarsBottom) return;
  topBarsBottom = next;
  listeners.forEach((listener) => listener());
}

function scheduleRemeasure() {
  if (!frame) frame = requestAnimationFrame(remeasure);
}

function subscribeTopBars(listener: () => void) {
  if (listeners.size === 0) {
    topBarsBottom = measureTopBars();
    window.addEventListener("scroll", scheduleRemeasure, { capture: true, passive: true });
    window.addEventListener("resize", scheduleRemeasure);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    window.removeEventListener("scroll", scheduleRemeasure, { capture: true });
    window.removeEventListener("resize", scheduleRemeasure);
    cancelAnimationFrame(frame);
    frame = 0;
  };
}

/**
 * Top collision padding for a popup: a page popup treats the area under the top bars as off-screen, so it opens
 * below its trigger (or shifts down) instead of under the bars, with a small gap. 0 for a popup opened from the top
 * bars or inside a sheet, dialog or drawer — those already sit above the bars. A popup that can't fit should cap its
 * height at Radix's `--radix-*-content-available-height` and scroll, or it will still be pushed past the bars.
 */
function usePopupTopInset() {
  const aboveTopBars = usePopupZIndex() >= TOP_BAR_POPUP_Z;
  const inset = React.useSyncExternalStore(subscribeTopBars, () => topBarsBottom, () => 0);
  return aboveTopBars || inset === 0 ? 0 : inset + TOP_BAR_GAP;
}

/** Wraps a popup's children — popups opened inside it stack one layer above `z`. */
function PopupLayer({ z, children }: { z: number; children?: React.ReactNode }) {
  return <PopupLayerContext.Provider value={z + 1}>{children}</PopupLayerContext.Provider>;
}

/** Wraps a top bar's children (Header, Nav do this) — popups opened from the bar show above the bars. */
function TopBarPopupLayer({ children }: { children?: React.ReactNode }) {
  return <PopupLayerContext.Provider value={TOP_BAR_POPUP_Z}>{children}</PopupLayerContext.Provider>;
}

/** Wraps a sheet, dialog or drawer panel's children — popups opened inside show above the panel. */
function OverlayPopupLayer({ children }: { children?: React.ReactNode }) {
  return <PopupLayerContext.Provider value={OVERLAY_POPUP_Z}>{children}</PopupLayerContext.Provider>;
}

export { OverlayPopupLayer, PopupLayer, TopBarPopupLayer, usePopupTopInset, usePopupZIndex };
