import { addMonths, isFiscalYearEnd, previousFiscalYearEnd } from '../dates';
import type { Decimal } from '../decimal';
import type { IsoDate } from '../../data/types';

/**
 * Douze mois glissants (BR-179) : LTM(D) = cumul(D) + exercice(N−1) − cumul(D − 12 mois).
 * À une date de clôture, le cumul de l'exercice suffit.
 */
export type LtmPlan =
  | { kind: 'FISCAL_YEAR_END'; ytd: IsoDate }
  | { kind: 'ROLLING'; ytd: IsoDate; fiscalYear: IsoDate; ytdPrior: IsoDate };

export function ltmPlan(date: IsoDate, fyeMonth: number, fyeDay: number): LtmPlan {
  if (isFiscalYearEnd(date, fyeMonth, fyeDay)) return { kind: 'FISCAL_YEAR_END', ytd: date };
  return { kind: 'ROLLING', ytd: date, fiscalYear: previousFiscalYearEnd(date, fyeMonth, fyeDay), ytdPrior: addMonths(date, -12) };
}

export function combineLtm(ytd: Decimal, fiscalYear: Decimal, ytdPrior: Decimal): Decimal {
  return ytd.plus(fiscalYear).minus(ytdPrior);
}
