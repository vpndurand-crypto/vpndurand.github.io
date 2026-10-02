import type { Lender } from './types';

export const lenders: Lender[] = [
  { id: 'lnd-exe', name: 'Banque Exemple', lender_type: 'BANK' },
  { id: 'lnd-aur', name: 'Banque Aurore', lender_type: 'BANK' },
  { id: 'lnd-fbe', name: 'Finance Bail Exemple', lender_type: 'LEASING' },
  { id: 'lnd-mer', name: 'Banque Méridienne', lender_type: 'BANK' },
];
