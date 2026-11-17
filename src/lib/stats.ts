// Small, dependency-free statistics for reading experiments honestly.
// Formulas are the textbook ones (Wilson interval, pooled two-proportion
// z-test, normal-approximation sample size), so they can be checked by hand.

/** Standard normal CDF, via the Abramowitz–Stegun erf approximation (|error| < 1.5e-7). */
export function normalCdf(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-x * x);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

/** Inverse standard normal CDF (Acklam's rational approximation, relative error < 1.2e-9). */
export function normalQuantile(p: number): number {
  if (p <= 0 || p >= 1) throw new RangeError("p must be in (0, 1)");
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const lo = 0.02425;
  if (p < lo) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - lo) return -normalQuantile(1 - p);
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/** Wilson score interval for k successes out of n. Well-behaved at small n and at 0% / 100%. */
export function wilson(k: number, n: number, confidence = 0.95): [number, number] {
  if (n === 0) return [0, 1];
  const z = normalQuantile(1 - (1 - confidence) / 2);
  const p = k / n;
  const denom = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

export interface TwoProportionResult {
  /** Treatment rate minus control rate (absolute). */
  diff: number;
  z: number;
  /** Two-sided p-value; null when the test is undefined (an empty arm, or no variance at all). */
  p: number | null;
}

/** Pooled two-proportion z-test: is treatment (k1/n1) different from control (k0/n0)? */
export function twoProportionTest(k1: number, n1: number, k0: number, n0: number): TwoProportionResult {
  if (n1 === 0 || n0 === 0) return { diff: 0, z: 0, p: null };
  const p1 = k1 / n1;
  const p0 = k0 / n0;
  const pooled = (k1 + k0) / (n1 + n0);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n0));
  if (se === 0) return { diff: p1 - p0, z: 0, p: null };
  const z = (p1 - p0) / se;
  return { diff: p1 - p0, z, p: 2 * (1 - normalCdf(Math.abs(z))) };
}

/**
 * Units needed in EACH arm to detect an absolute lift of `mde` over a
 * baseline rate `p0`, with a two-sided test at `alpha` and the given power.
 */
export function sampleSizePerArm(p0: number, mde: number, alpha = 0.05, power = 0.8): number {
  const p1 = Math.min(0.999, Math.max(0.001, p0 + mde));
  const base = Math.min(0.999, Math.max(0.001, p0));
  const za = normalQuantile(1 - alpha / 2);
  const zb = normalQuantile(power);
  const pbar = (base + p1) / 2;
  const num = za * Math.sqrt(2 * pbar * (1 - pbar)) + zb * Math.sqrt(base * (1 - base) + p1 * (1 - p1));
  return Math.ceil((num * num) / ((p1 - base) * (p1 - base)));
}
