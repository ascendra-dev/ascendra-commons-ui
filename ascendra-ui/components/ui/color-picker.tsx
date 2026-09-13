"use client";

import * as React from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { cn } from "@/ascendra-ui/shadcn";

// ─── Preset palette ───────────────────────────────────────────────────────────

const DEFAULT_PRESETS = [
  // Neutrals
  "#111827", "#374151", "#6b7280", "#d1d5db", "#f9fafb",
  // Brand / primary family
  "#1d4ed8", "#2563eb", "#3b82f6", "#93c5fd", "#dbeafe",
  // Greens
  "#15803d", "#16a34a", "#4ade80", "#bbf7d0",
  // Reds / Destructive
  "#b91c1c", "#dc2626", "#f87171", "#fecaca",
  // Ambers / Warning
  "#b45309", "#d97706", "#fbbf24", "#fde68a",
  // Purples
  "#7c3aed", "#8b5cf6", "#c4b5fd", "#ede9fe",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function isValidHex(v: string) {
  return /^#[0-9a-fA-F]{6}$/.test(v);
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ColorPickerProps {
  value?: string;
  onChange?: (hex: string) => void;
  presets?: string[];
  presetsOnly?: boolean;
  disabled?: boolean;
  className?: string;
}

// ─── Slider ───────────────────────────────────────────────────────────────────

function HslSlider({
  label,
  min,
  max,
  value,
  gradient,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  gradient: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[0.6875rem] text-muted-foreground">{label}</span>
        <span className="text-[0.6875rem] tabular-nums text-muted-foreground">{value}</span>
      </div>
      <div
        className="relative h-3 rounded-full overflow-hidden"
        style={{ background: gradient }}
      >
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            "absolute inset-0 w-full h-full cursor-pointer appearance-none bg-transparent outline-none",
            "[&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:size-4",
            "[&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:border-2",
            "[&::-webkit-slider-thumb]:border-white",
            "[&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(0,0,0,0.4)]",
            "[&::-webkit-slider-thumb]:bg-white",
            "[&::-moz-range-thumb]:size-4",
            "[&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:border-2",
            "[&::-moz-range-thumb]:border-white",
            "[&::-moz-range-thumb]:bg-white",
          )}
        />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ColorPicker({
  value = "#2563eb",
  onChange,
  presets = DEFAULT_PRESETS,
  presetsOnly = false,
  disabled = false,
  className,
}: ColorPickerProps) {
  const [hsl, setHsl] = React.useState(() => hexToHsl(value));
  const [hexInput, setHexInput] = React.useState(value);
  const [open, setOpen] = React.useState(false);

  // Sync from outside
  React.useEffect(() => {
    if (isValidHex(value)) {
      setHsl(hexToHsl(value));
      setHexInput(value);
    }
  }, [value]);

  function applyHsl(h: number, s: number, l: number) {
    const hex = hslToHex(h, s, l);
    setHsl({ h, s, l });
    setHexInput(hex);
    onChange?.(hex);
  }

  function handleHexInput(raw: string) {
    setHexInput(raw);
    if (isValidHex(raw)) {
      const next = hexToHsl(raw);
      setHsl(next);
      onChange?.(raw);
    }
  }

  const currentHex = isValidHex(hexInput) ? hexInput : value;

  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={disabled ? undefined : setOpen}>
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            /* Layout */
            "relative inline-flex size-8 shrink-0 items-center justify-center rounded-[.375rem] outline-none transition-all",

            /* Light shadow system */
            "shadow-[0_2px_2px_-1px_rgba(0,0,0,0.1),0_0_0_1px_rgba(25,28,33,.2),0_4px_4px_-2px_rgba(0,0,0,0.06)]",
            /* Dark shadow system */
            "dark:shadow-[0_-1px_1px_rgba(255,255,255,0.12),0_0_0_1px_#525260,0_0_0_2px_rgba(0,0,0,0.16)]",

            /* ::before — bottom-darken gradient overlay */
            "before:pointer-events-none before:absolute before:inset-0 before:size-full before:rounded-[inherit]",
            "before:bg-linear-to-b before:from-transparent before:to-black/10",

            /* ::after — top-lighten gloss */
            "after:pointer-events-none after:absolute after:inset-0 after:size-full after:rounded-[inherit]",
            "after:bg-linear-to-b after:from-white/30 after:to-transparent",
            "dark:after:from-white/10",

            /* Hover — ring tightens, gradients fade */
            "hover:shadow-[0_2px_2px_-1px_rgba(0,0,0,0.1),0_0_0_1px_rgba(25,28,33,.28),0_4px_4px_-2px_rgba(0,0,0,0.07)]",
            "dark:hover:shadow-[0_-1px_1px_rgba(255,255,255,0.2),0_0_0_1px_rgba(61,61,74,0.88),0_0_0_2px_rgba(0,0,0,0.2)]",
            "hover:before:opacity-0 hover:after:opacity-0",

            "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          style={{ backgroundColor: currentHex }}
          aria-label={`Color picker — current value: ${currentHex}`}
        />
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          sideOffset={6}
          align="start"
          className={cn(
            "z-200 w-56 rounded-lg p-3 outline-none",
            "bg-secondary text-foreground ring-1 ring-foreground/10",
            "shadow-[0_16px_36px_-6px_rgba(0,0,0,0.07),0_6px_16px_-2px_rgba(0,0,0,0.2)]",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            "duration-100",
          )}
        >
          {/* Preview swatch */}
          <div className="mb-3 flex items-center gap-2">
            <div
              className="size-8 shrink-0 rounded-md border border-foreground/10 shadow-inner"
              style={{ backgroundColor: currentHex }}
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-foreground">{currentHex.toUpperCase()}</span>
              <span className="text-[0.6875rem] text-muted-foreground">
                hsl({hsl.h}, {hsl.s}%, {hsl.l}%)
              </span>
            </div>
          </div>

          {/* Presets */}
          <div className="mb-3">
            <p className="mb-1.5 text-[0.6875rem] font-medium text-muted-foreground">Presets</p>
            <div className="flex flex-wrap gap-1">
              {presets.map((preset) => {
                const isSelected = currentHex.toLowerCase() === preset.toLowerCase();
                return (
                  <button
                    key={preset}
                    type="button"
                    title={preset}
                    onClick={() => {
                      setHsl(hexToHsl(preset));
                      setHexInput(preset);
                      onChange?.(preset);
                    }}
                    className={cn(
                      "relative size-5 rounded-full outline-none transition-all hover:scale-110",
                      "shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.15)]",
                      "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1",
                      isSelected && "ring-2 ring-foreground ring-offset-1 ring-offset-secondary scale-110",
                    )}
                    style={{
                      backgroundColor: preset,
                      backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0.25) 0%, rgba(0,0,0,0.1) 100%)",
                    }}
                  >
                    {isSelected && (
                      <svg
                        className="absolute inset-0 m-auto size-2.5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="2,6 5,9 10,3" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* HSL sliders — hidden in presetsOnly mode */}
          {!presetsOnly && (
            <div className="mb-3 flex flex-col gap-2">
              <HslSlider
                label="Hue"
                min={0}
                max={360}
                value={hsl.h}
                gradient={`linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))`}
                onChange={(h) => applyHsl(h, hsl.s, hsl.l)}
              />
              <HslSlider
                label="Saturation"
                min={0}
                max={100}
                value={hsl.s}
                gradient={`linear-gradient(to right, hsl(${hsl.h},0%,${hsl.l}%), hsl(${hsl.h},100%,${hsl.l}%))`}
                onChange={(s) => applyHsl(hsl.h, s, hsl.l)}
              />
              <HslSlider
                label="Lightness"
                min={0}
                max={100}
                value={hsl.l}
                gradient={`linear-gradient(to right, hsl(${hsl.h},${hsl.s}%,0%), hsl(${hsl.h},${hsl.s}%,50%), hsl(${hsl.h},${hsl.s}%,100%))`}
                onChange={(l) => applyHsl(hsl.h, hsl.s, l)}
              />
            </div>
          )}

          {/* Hex input */}
          {!presetsOnly && (
            <div className="flex items-center gap-1.5">
              <span className="text-[0.6875rem] text-muted-foreground shrink-0">#</span>
              <input
                type="text"
                value={hexInput.replace(/^#/, "")}
                onChange={(e) => handleHexInput("#" + e.target.value)}
                maxLength={6}
                className={cn(
                  "h-7 w-full rounded-md bg-background px-2 font-mono text-xs text-foreground outline-none",
                  "ring-1 ring-(--color-umbra)/12 dark:ring-(--color-gray-1000)/60",
                  "focus:ring-2 focus:ring-primary",
                  !isValidHex(hexInput) && "ring-destructive ring-2",
                )}
                spellCheck={false}
              />
            </div>
          )}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
