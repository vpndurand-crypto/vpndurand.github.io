/**
 * Formats du film Capital OS : les règles de `Fmt` de la bêta (montants compacts « €18.6m », « €558k », ratios « 3.07x »,
 * pourcentages « 10.5% », dates « 31 Dec 2029 »). Les valeurs affichées viennent déjà formatées de la bêta (snapshot.json) ;
 * ces fonctions servent aux nombres qui défilent pendant une animation, pour qu'ils aient exactement le même format.
 */
export const MINUS = '−';

const group = (integer: string) => integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Montant exact en euros (Fmt.money) : €18,586,000. */
export function money(euros: number, symbol = '€'): string {
  const s = Math.abs(euros).toFixed(0);
  return `${euros < 0 && Number(s) !== 0 ? MINUS : ''}${symbol}${group(s)}`;
}

/** Montant compact (Fmt.compact) : €18.6m · €4.69m · €558k. */
export function compact(euros: number, symbol = '€'): string {
  const v = Math.abs(euros);
  let s: string;
  if (v >= 999500) {
    const m = v / 1e6;
    s = `${(m >= 10 ? m.toFixed(1) : m.toFixed(2)).replace(/0+$/, '').replace(/\.$/, '')}m`;
  } else if (v >= 1e3) s = `${Math.round(v / 1e3)}k`;
  else s = `${Math.round(v)}`;
  return `${euros < 0 ? MINUS : ''}${symbol}${s}`;
}

/** Ratio (Fmt.ratio) : 3.07x. */
export const ratio = (v: number, dp = 2): string => `${v.toFixed(dp)}x`;

/** Pourcentage (Fmt.pct) : 10.5%. */
export const pct = (fraction: number, dp = 1): string => `${(fraction * 100).toFixed(dp)}%`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 2029-12-31 → 31 Dec 2029 (Fmt.date). */
export function date(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]} ${y}`;
}

/** Nombre qui défile d'une valeur à l'autre (même nombre de décimales tout au long). */
export function roll(from: number, to: number, t: number, dp: number): string {
  const v = from + (to - from) * Math.min(1, Math.max(0, t));
  const s = Math.abs(v).toFixed(dp);
  return `${v < 0 && Number(s) !== 0 ? MINUS : ''}${s}`;
}
