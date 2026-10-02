import { STATUS_THRESHOLDS } from '../../config/demo';
import { D, type Decimal } from '../decimal';
import type { CalcStatus } from '../../data/types';

const COMPLIANT_MIN = D(STATUS_THRESHOLDS.compliant);
const WATCH_MIN = D(STATUS_THRESHOLDS.watch);

/** Statut d'un covenant calculable : ROUGE si non respecté ou marge < 5 %, ORANGE entre 5 et 15 %, VERT au-delà (BR-185). */
export function computeStatus(input: { compliant: boolean; headroomPct: Decimal | null }): CalcStatus {
  if (!input.compliant) return 'BREACH';
  if (input.headroomPct === null) return 'COMPLIANT';
  if (input.headroomPct.gte(COMPLIANT_MIN)) return 'COMPLIANT';
  if (input.headroomPct.gte(WATCH_MIN)) return 'WATCH';
  return 'CRITICAL';
}
