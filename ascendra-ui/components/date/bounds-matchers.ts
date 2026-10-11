import { type Matcher } from 'react-day-picker';

/** Calendar matchers that disable days outside [minDate, maxDate]. */
export function boundsMatchers(minDate?: Date, maxDate?: Date): Matcher[] {
  const matchers: Matcher[] = [];
  if (minDate) matchers.push({ before: minDate });
  if (maxDate) matchers.push({ after: maxDate });
  return matchers;
}
