import { addMonths } from './dates';
import type { CovenantDefinition, IsoDate } from '../data/types';

const MONTHS = { QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12 } as const;

/** Dates de test contractuelles d'une définition, entre deux dates incluses. */
export function contractualTestDates(definition: CovenantDefinition, from: IsoDate, to: IsoDate): IsoDate[] {
  const step = MONTHS[definition.frequency];
  const dates: IsoDate[] = [];
  for (let i = 0; i < 400; i += 1) {
    const date = addMonths(definition.first_test_date, step * i);
    if (date > to) break;
    if (date >= from) dates.push(date);
  }
  return dates;
}
export function isContractualTestDate(definition: CovenantDefinition, date: IsoDate): boolean {
  return contractualTestDates(definition, date, date).includes(date);
}
export function nextContractualTestDate(definition: CovenantDefinition, after: IsoDate): IsoDate {
  const step = MONTHS[definition.frequency];
  for (let i = 0; i < 400; i += 1) {
    const date = addMonths(definition.first_test_date, step * i);
    if (date > after) return date;
  }
  throw new Error('Aucune date de test future');
}
