import type { IsoDate } from '../data/types';

/** Dates calendaires en chaînes ISO, sans objet Date ni fuseau horaire (T-06). */
interface Ymd { y: number; m: number; d: number }

function parse(iso: IsoDate): Ymd {
  const [y = 0, m = 1, d = 1] = iso.split('-').map(Number);
  return { y, m, d };
}
function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}
function toIso({ y, m, d }: Ymd): IsoDate {
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}
export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}
export function daysInMonth(y: number, m: number): number {
  if (m === 2) return isLeapYear(y) ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}
export function isEndOfMonth(iso: IsoDate): boolean {
  const { y, m, d } = parse(iso);
  return d === daysInMonth(y, m);
}
/** Ajoute n mois ; une fin de mois reste une fin de mois (31/03 + 3 mois = 30/06). */
export function addMonths(iso: IsoDate, months: number): IsoDate {
  const { y, m, d } = parse(iso);
  const index = y * 12 + (m - 1) + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  const last = daysInMonth(year, month);
  return toIso({ y: year, m: month, d: isEndOfMonth(iso) ? last : Math.min(d, last) });
}
export function yearOf(iso: IsoDate): number {
  return parse(iso).y;
}
export function fiscalYearEnd(year: number, month: number, day: number): IsoDate {
  return toIso({ y: year, m: month, d: Math.min(day, daysInMonth(year, month)) });
}
export function isFiscalYearEnd(iso: IsoDate, month: number, day: number): boolean {
  return iso === fiscalYearEnd(yearOf(iso), month, day);
}
/** Dernière clôture strictement antérieure à la date. */
export function previousFiscalYearEnd(iso: IsoDate, month: number, day: number): IsoDate {
  const sameYear = fiscalYearEnd(yearOf(iso), month, day);
  return sameYear < iso ? sameYear : fiscalYearEnd(yearOf(iso) - 1, month, day);
}
