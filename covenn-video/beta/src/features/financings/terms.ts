import type { Financing } from '../../data/types';
import { fmt } from '../../ui/values';

/** Taux affiché : « Euribor 3 mois + 2,50 % » ou « Fixe 3,20 % ». */
export function rateParts(financing: Financing): [string, string] {
  if (financing.rate_type === 'FIXED') return [fmt.pct(financing.fixed_rate ?? '0', 2), 'taux fixe'];
  return [financing.floating_index ?? 'Variable', `+ ${fmt.pct(financing.margin ?? '0', 2)}`];
}

export function rateText(financing: Financing): string {
  if (financing.rate_type === 'FIXED') return `Fixe ${fmt.pct(financing.fixed_rate ?? '0', 2)}`;
  return `${financing.floating_index ?? 'Variable'} + ${fmt.pct(financing.margin ?? '0', 2)}`;
}
