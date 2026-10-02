import type { Entity } from './types';

/** Aucun SIREN : un numéro valide pris au hasard pourrait appartenir à une vraie société. */
export const entities: Entity[] = [
  { id: 'ent-di', name: 'Démo Industrie SAS', short_name: 'Démo Industrie', currency: 'EUR', fiscal_year_end_month: 12, fiscal_year_end_day: 31, is_active: true },
  { id: 'ent-dl', name: 'Démo Logistique SAS', short_name: 'Démo Logistique', currency: 'EUR', fiscal_year_end_month: 12, fiscal_year_end_day: 31, is_active: true },
  { id: 'ent-ds', name: 'Démo Services SAS', short_name: 'Démo Services', currency: 'EUR', fiscal_year_end_month: 12, fiscal_year_end_day: 31, is_active: true },
];
