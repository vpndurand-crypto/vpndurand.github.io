/**
 * JSON canonique (T-02) : clés triées, aucun espace, nombres entiers seulement (les montants sont des chaînes).
 * Deux objets égaux produisent toujours la même chaîne, donc la même empreinte.
 */
export function canonicalize(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) throw new Error('JSON canonique : nombre non entier interdit (utiliser une chaîne décimale)');
    return String(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).filter((k) => record[k] !== undefined).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(record[k])}`).join(',')}}`;
  }
  throw new Error(`JSON canonique : type non sérialisable (${typeof value})`);
}
