/**
 * Shared breeze for the whole village: slow, overlapping gusts between 0 (calm) and 1 (gusty).
 * Trees, clouds, smoke, flags, lanterns and the windmill all follow the same curve, so a gust
 * visibly rolls through the scene instead of every object looping on its own timer.
 */
export function gust(t: number): number {
  const g =
    0.5 +
    0.26 * Math.sin(t * 0.21) +
    0.16 * Math.sin(t * 0.57 + 1.7) +
    0.08 * Math.sin(t * 1.33 + 0.4);
  return Math.min(1, Math.max(0, g));
}

/** Frame-rate independent approach of `current` towards `target` (`rate` ≈ 1/seconds). */
export function approach(current: number, target: number, rate: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}
