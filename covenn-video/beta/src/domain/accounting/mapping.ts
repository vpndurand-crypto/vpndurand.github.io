import type { AccountingMapping, AccountingMappingRule } from '../../data/types';

/** Règle applicable à un compte : correspondance exacte ou par préfixe, le préfixe le plus long l'emporte. */
export function findRule(accountNumber: string, mapping: AccountingMapping): AccountingMappingRule | null {
  let best: AccountingMappingRule | null = null;
  for (const rule of mapping.rules) {
    if (rule.status !== 'VALIDATED') continue;
    const matches = rule.match_type === 'EXACT' ? accountNumber === rule.account_pattern : accountNumber.startsWith(rule.account_pattern);
    if (matches && (!best || rule.account_pattern.length > best.account_pattern.length)) best = rule;
  }
  return best;
}
