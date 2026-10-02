/** Paramètres de la démonstration (plan technique, section 7.1). */
export const DEMO_TODAY = '2026-10-20';
export const DATE_ARRETE = '2026-09-30';
/** Seuils de statut sur la marge relative : VERT ≥ 15 %, ORANGE ≥ 5 %, ROUGE < 5 %. */
export const STATUS_THRESHOLDS = { compliant: '0.15', watch: '0.05' } as const;
export const STORAGE_KEY = 'covenn-beta-v1';
export const SCHEMA_VERSION = 1 as const;
export const ORGANIZATION_ID = 'org-demo';
export const CURRENT_USER_ID = 'usr-cl';
