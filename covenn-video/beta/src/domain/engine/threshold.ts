import type { IsoDate, ThresholdStep } from '../../data/types';

/** Marche en vigueur à la date et marche suivante. */
export function selectThresholdSteps(steps: readonly ThresholdStep[], date: IsoDate): { current: ThresholdStep | null; next: ThresholdStep | null } {
  const sorted = [...steps].sort((a, b) => (a.from_date < b.from_date ? -1 : a.from_date > b.from_date ? 1 : 0));
  let current: ThresholdStep | null = null;
  let next: ThresholdStep | null = null;
  for (const step of sorted) {
    if (step.from_date <= date) current = step;
    else if (!next) next = step;
  }
  return { current, next };
}
