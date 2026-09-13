export type AccentColor =
  | "blue"
  | "amber"
  | "purple"
  | "red"
  | "teal"
  | "orange"
  | "indigo"
  | "slate";

export type BorderSide = "t" | "l" | "r" | "b" | "all";
export type BorderStroke = 1 | 2 | 3;

export type BorderConfig = {
  side?: BorderSide;
  stroke?: BorderStroke;
  color?: AccentColor;
};

export type BgStyle = "linear" | "radial" | "conic" | "solid";
export type BgTo = "transparent" | "white" | "black" | AccentColor;

export type BgConfig = {
  style?: BgStyle;
  side?: BorderSide;
  color?: AccentColor;
  to?: BgTo;
};

// ─── Regular element lookups ────────────────────────────────────────────────

const BORDER_WIDTH: Record<BorderSide, Record<BorderStroke, string>> = {
  t: { 1: "border-t", 2: "border-t-2", 3: "border-t-[3px]" },
  l: { 1: "border-l", 2: "border-l-2", 3: "border-l-[3px]" },
  r: { 1: "border-r", 2: "border-r-2", 3: "border-r-[3px]" },
  b: { 1: "border-b", 2: "border-b-2", 3: "border-b-[3px]" },
  all: { 1: "border", 2: "border-2", 3: "border-[3px]" },
};

const BORDER_COLOR: Record<BorderSide, Record<AccentColor, string>> = {
  t: {
    blue: "border-t-blue-500/60",
    amber: "border-t-amber-500/60",
    purple: "border-t-purple-500/60",
    red: "border-t-red-500/60",
    teal: "border-t-teal-500/60",
    orange: "border-t-orange-500/60",
    indigo: "border-t-indigo-500/60",
    slate: "border-t-slate-500/60",
  },
  l: {
    blue: "border-l-blue-500/60",
    amber: "border-l-amber-500/60",
    purple: "border-l-purple-500/60",
    red: "border-l-red-500/60",
    teal: "border-l-teal-500/60",
    orange: "border-l-orange-500/60",
    indigo: "border-l-indigo-500/60",
    slate: "border-l-slate-500/60",
  },
  r: {
    blue: "border-r-blue-500/60",
    amber: "border-r-amber-500/60",
    purple: "border-r-purple-500/60",
    red: "border-r-red-500/60",
    teal: "border-r-teal-500/60",
    orange: "border-r-orange-500/60",
    indigo: "border-r-indigo-500/60",
    slate: "border-r-slate-500/60",
  },
  b: {
    blue: "border-b-blue-500/60",
    amber: "border-b-amber-500/60",
    purple: "border-b-purple-500/60",
    red: "border-b-red-500/60",
    teal: "border-b-teal-500/60",
    orange: "border-b-orange-500/60",
    indigo: "border-b-indigo-500/60",
    slate: "border-b-slate-500/60",
  },
  all: {
    blue: "border-blue-500/60",
    amber: "border-amber-500/60",
    purple: "border-purple-500/60",
    red: "border-red-500/60",
    teal: "border-teal-500/60",
    orange: "border-orange-500/60",
    indigo: "border-indigo-500/60",
    slate: "border-slate-500/60",
  },
};

const BG_GRADIENT_DIR: Record<BgStyle, Record<BorderSide, string>> = {
  linear: {
    t: "bg-linear-to-t",
    l: "bg-linear-to-l",
    r: "bg-linear-to-r",
    b: "bg-linear-to-b",
    all: "bg-linear-to-b",
  },
  radial: { t: "bg-radial", l: "bg-radial", r: "bg-radial", b: "bg-radial", all: "bg-radial" },
  conic: { t: "bg-conic", l: "bg-conic", r: "bg-conic", b: "bg-conic", all: "bg-conic" },
  solid: { t: "", l: "", r: "", b: "", all: "" },
};

const BG_FROM: Record<AccentColor, string> = {
  blue: "from-blue-500/[0.07]",
  amber: "from-amber-500/[0.07]",
  purple: "from-purple-500/[0.07]",
  red: "from-red-500/[0.07]",
  teal: "from-teal-500/[0.07]",
  orange: "from-orange-500/[0.07]",
  indigo: "from-indigo-500/[0.07]",
  slate: "from-slate-500/[0.07]",
};

const BG_TO: Record<BgTo, string> = {
  transparent: "to-transparent",
  white: "to-white",
  black: "to-black",
  blue: "to-blue-500/60",
  amber: "to-amber-500/60",
  purple: "to-purple-500/60",
  red: "to-red-500/60",
  teal: "to-teal-500/60",
  orange: "to-orange-500/60",
  indigo: "to-indigo-500/60",
  slate: "to-slate-500/60",
};

// ─── before: pseudo-element lookups ─────────────────────────────────────────

const BEFORE_BORDER_WIDTH: Record<BorderSide, Record<BorderStroke, string>> = {
  t: { 1: "before:border-t", 2: "before:border-t-2", 3: "before:border-t-[3px]" },
  l: { 1: "before:border-l", 2: "before:border-l-2", 3: "before:border-l-[3px]" },
  r: { 1: "before:border-r", 2: "before:border-r-2", 3: "before:border-r-[3px]" },
  b: { 1: "before:border-b", 2: "before:border-b-2", 3: "before:border-b-[3px]" },
  all: { 1: "before:border", 2: "before:border-2", 3: "before:border-[3px]" },
};

const BEFORE_BORDER_COLOR: Record<BorderSide, Record<AccentColor, string>> = {
  t: {
    blue: "before:border-t-blue-500/60",
    amber: "before:border-t-amber-500/60",
    purple: "before:border-t-purple-500/60",
    red: "before:border-t-red-500/60",
    teal: "before:border-t-teal-500/60",
    orange: "before:border-t-orange-500/60",
    indigo: "before:border-t-indigo-500/60",
    slate: "before:border-t-slate-500/60",
  },
  l: {
    blue: "before:border-l-blue-500/60",
    amber: "before:border-l-amber-500/60",
    purple: "before:border-l-purple-500/60",
    red: "before:border-l-red-500/60",
    teal: "before:border-l-teal-500/60",
    orange: "before:border-l-orange-500/60",
    indigo: "before:border-l-indigo-500/60",
    slate: "before:border-l-slate-500/60",
  },
  r: {
    blue: "before:border-r-blue-500/60",
    amber: "before:border-r-amber-500/60",
    purple: "before:border-r-purple-500/60",
    red: "before:border-r-red-500/60",
    teal: "before:border-r-teal-500/60",
    orange: "before:border-r-orange-500/60",
    indigo: "before:border-r-indigo-500/60",
    slate: "before:border-r-slate-500/60",
  },
  b: {
    blue: "before:border-b-blue-500/60",
    amber: "before:border-b-amber-500/60",
    purple: "before:border-b-purple-500/60",
    red: "before:border-b-red-500/60",
    teal: "before:border-b-teal-500/60",
    orange: "before:border-b-orange-500/60",
    indigo: "before:border-b-indigo-500/60",
    slate: "before:border-b-slate-500/60",
  },
  all: {
    blue: "before:border-blue-500/60",
    amber: "before:border-amber-500/60",
    purple: "before:border-purple-500/60",
    red: "before:border-red-500/60",
    teal: "before:border-teal-500/60",
    orange: "before:border-orange-500/60",
    indigo: "before:border-indigo-500/60",
    slate: "before:border-slate-500/60",
  },
};

const BG_SOLID: Record<AccentColor, string> = {
  blue: "bg-blue-500/[0.07]",
  amber: "bg-amber-500/[0.07]",
  purple: "bg-purple-500/[0.07]",
  red: "bg-red-500/[0.07]",
  teal: "bg-teal-500/[0.07]",
  orange: "bg-orange-500/[0.07]",
  indigo: "bg-indigo-500/[0.07]",
  slate: "bg-slate-500/[0.07]",
};

const BEFORE_BG_SOLID: Record<AccentColor, string> = {
  blue: "before:bg-blue-500/[0.07]",
  amber: "before:bg-amber-500/[0.07]",
  purple: "before:bg-purple-500/[0.07]",
  red: "before:bg-red-500/[0.07]",
  teal: "before:bg-teal-500/[0.07]",
  orange: "before:bg-orange-500/[0.07]",
  indigo: "before:bg-indigo-500/[0.07]",
  slate: "before:bg-slate-500/[0.07]",
};

const BEFORE_BG_GRADIENT_DIR: Record<BgStyle, Record<BorderSide, string>> = {
  linear: {
    t: "before:bg-linear-to-t",
    l: "before:bg-linear-to-l",
    r: "before:bg-linear-to-r",
    b: "before:bg-linear-to-b",
    all: "before:bg-linear-to-b",
  },
  radial: {
    t: "before:bg-radial",
    l: "before:bg-radial",
    r: "before:bg-radial",
    b: "before:bg-radial",
    all: "before:bg-radial",
  },
  conic: {
    t: "before:bg-conic",
    l: "before:bg-conic",
    r: "before:bg-conic",
    b: "before:bg-conic",
    all: "before:bg-conic",
  },
  solid: {
    t: "",
    l: "",
    r: "",
    b: "",
    all: "",
  },
};

const BEFORE_BG_FROM: Record<AccentColor, string> = {
  blue: "before:from-blue-500/[0.07]",
  amber: "before:from-amber-500/[0.07]",
  purple: "before:from-purple-500/[0.07]",
  red: "before:from-red-500/[0.07]",
  teal: "before:from-teal-500/[0.07]",
  orange: "before:from-orange-500/[0.07]",
  indigo: "before:from-indigo-500/[0.07]",
  slate: "before:from-slate-500/[0.07]",
};

const BEFORE_BG_TO: Record<BgTo, string> = {
  transparent: "before:to-transparent",
  white: "before:to-white",
  black: "before:to-black",
  blue: "before:to-blue-500/60",
  amber: "before:to-amber-500/60",
  purple: "before:to-purple-500/60",
  red: "before:to-red-500/60",
  teal: "before:to-teal-500/60",
  orange: "before:to-orange-500/60",
  indigo: "before:to-indigo-500/60",
  slate: "before:to-slate-500/60",
};

// ─── Build functions ─────────────────────────────────────────────────────────

export function buildBorderClasses(border: BorderConfig): string {
  const side = border.side ?? "t";
  const stroke = border.stroke ?? 3;
  const color = border.color ?? "orange";
  return [
    "overflow-hidden",
    BORDER_WIDTH[side][stroke],
    BORDER_COLOR[side][color],
  ].join(" ");
}

export function buildBorderBeforeClasses(border: BorderConfig): string {
  const side = border.side ?? "t";
  const stroke = border.stroke ?? 3;
  const color = border.color ?? "orange";
  return [
    BEFORE_BORDER_WIDTH[side][stroke],
    BEFORE_BORDER_COLOR[side][color],
  ].join(" ");
}

export function buildBgClasses(bg: BgConfig): string {
  const style = bg.style ?? "linear";
  const color = bg.color ?? "orange";
  if (style === "solid") return BG_SOLID[color];
  const side = bg.side ?? "b";
  const to = bg.to ?? "transparent";
  return [BG_GRADIENT_DIR[style][side], BG_FROM[color], BG_TO[to]].join(" ");
}

export function buildBgBeforeClasses(bg: BgConfig): string {
  const style = bg.style ?? "linear";
  const color = bg.color ?? "orange";
  if (style === "solid") return BEFORE_BG_SOLID[color];
  const side = bg.side ?? "b";
  const to = bg.to ?? "transparent";
  return [
    BEFORE_BG_GRADIENT_DIR[style][side],
    BEFORE_BG_FROM[color],
    BEFORE_BG_TO[to],
  ].join(" ");
}
