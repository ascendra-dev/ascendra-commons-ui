import { addDays, addMonths, addWeeks, addYears, startOfDay } from 'date-fns';

/**
 * A day written so a QueryDef stays serializable and never goes stale: `'today'`, a signed offset
 * from today (`'-90d'`, `'+1d'`, `'-2w'`, `'-6m'`, `'-1y'`), or a fixed `'YYYY-MM-DD'`. Resolved
 * against the current day whenever a form opens or validates, not when the QueryDef is defined.
 */
export type DateExpr = string;

const OFFSET = /^([+-])(\d+)([dwmy])$/;
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const ADD = { d: addDays, w: addWeeks, m: addMonths, y: addYears } as const;

/** Start (local midnight) of the day `expr` names. Throws on a malformed expression — a QueryDef bug. */
export function resolveDateExpr(expr: DateExpr, now: Date = new Date()): Date {
  const today = startOfDay(now);
  if (expr === 'today') return today;

  const offset = OFFSET.exec(expr);
  if (offset) {
    const [, sign, amount, unit] = offset;
    return ADD[unit as keyof typeof ADD](today, Number(amount) * (sign === '-' ? -1 : 1));
  }

  const iso = ISO_DAY.exec(expr);
  if (iso) {
    const day = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    if (day.getMonth() === Number(iso[2]) - 1) return day;
  }

  throw new Error(`Invalid date expression "${expr}" — use 'today', ±N followed by d/w/m/y, or YYYY-MM-DD`);
}

/** A field's minDate/maxDate resolved to days; either side is undefined when not set. */
export function resolveDateBounds(bounds: { minDate?: DateExpr; maxDate?: DateExpr }): { min?: Date; max?: Date } {
  return {
    min: bounds.minDate ? resolveDateExpr(bounds.minDate) : undefined,
    max: bounds.maxDate ? resolveDateExpr(bounds.maxDate) : undefined,
  };
}
