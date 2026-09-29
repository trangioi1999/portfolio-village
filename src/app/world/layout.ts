import { BUILDINGS } from '../data/buildings.data';
import { BuildingId } from '../models/building.model';

/** World-space layout shared by the terrain painter, nature scatter and characters. */
export const ISLAND_RADIUS = 30;
/** Half-size of the square area painted on the ground texture. */
export const GROUND_EXTENT = 33;
export const PLAZA_RADIUS = 7.5;

export const POND = { x: 22.5, z: -12.5, r: 3.4 } as const;
export const FARM = { x: 5.5, z: 21, w: 5.5, d: 4.5 } as const;

/** Irregular island rim radius at a given angle. */
export const STREAM_DIR = { x: 0.889, z: -0.457 } as const;
export function rimRadius(angle: number): number {
  return (
    ISLAND_RADIUS +
    0.9 * Math.sin(angle * 3 + 0.4) +
    0.6 * Math.sin(angle * 7 + 1.3) +
    0.35 * Math.sin(angle * 13 + 2.1)
  );
}

export interface Point {
  x: number;
  z: number;
}

/** Point on the building's side that faces the plaza — where paths arrive. */
export function arrivalPoint(id: BuildingId, extra = 0): Point {
  const b = BUILDINGS.find((x) => x.id === id)!;
  const [x, z] = b.position;
  const len = Math.hypot(x, z) || 1;
  const r = b.footprint + extra;
  return { x: x - (x / len) * r, z: z - (z / len) * r };
}

/** Gently curved path from the plaza edge to each building (sampled polyline). */
export function pathPoints(id: BuildingId): Point[] {
  const end = arrivalPoint(id, -0.5);
  const len = Math.hypot(end.x, end.z) || 1;
  const start = {
    x: (end.x / len) * (PLAZA_RADIUS - 0.5),
    z: (end.z / len) * (PLAZA_RADIUS - 0.5),
  };
  const bend = id === 'contact' ? -2.5 : 1.6;
  const ctrl = {
    x: (start.x + end.x) / 2 + (-end.z / len) * bend,
    z: (start.z + end.z) / 2 + (end.x / len) * bend,
  };
  const pts: Point[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const c = t * t;
    pts.push({ x: a * start.x + b * ctrl.x + c * end.x, z: a * start.z + b * ctrl.z + c * end.z });
  }
  return pts;
}

export const PATHS = BUILDINGS.filter((b) => b.id !== 'plaza').map((b) => pathPoints(b.id));

export function distanceToPaths(x: number, z: number): number {
  let best = Infinity;
  for (const path of PATHS) {
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz)));
      best = Math.min(best, Math.hypot(x - (a.x + t * dx), z - (a.z + t * dz)));
    }
  }
  return best;
}

/** True when a point is free for scattering trees, rocks and flowers. */
export function isFreeGround(x: number, z: number, margin = 0): boolean {
  const r = Math.hypot(x, z);
  if (r > rimRadius(Math.atan2(z, x)) - 1.2 - margin * 0.3) return false;
  if (r < PLAZA_RADIUS + 1.2 + margin) return false;
  for (const b of BUILDINGS) {
    if (Math.hypot(x - b.position[0], z - b.position[1]) < b.footprint + 1.6 + margin) return false;
  }
  if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 1.4 + margin) return false;
  if (
    Math.abs(x - FARM.x) < FARM.w / 2 + 1 + margin &&
    Math.abs(z - FARM.z) < FARM.d / 2 + 1 + margin
  )
    return false;
  return distanceToPaths(x, z) > 1.7 + margin * 0.5;
}

/* ---------- Free walking (click-to-move) ---------- */

interface Circle {
  x: number;
  z: number;
  r: number;
}

/** Things the avatar walks around: buildings, the pond, the fountain and the farm. */
const OBSTACLES: Circle[] = [
  ...BUILDINGS.filter((b) => b.id !== 'plaza').map((b) => ({
    x: b.position[0],
    z: b.position[1],
    r: b.footprint + 0.6,
  })),
  { x: POND.x, z: POND.z, r: POND.r + 0.8 },
  { x: 0, z: -3.4, r: 2.9 },
  { x: FARM.x, z: FARM.z, r: Math.hypot(FARM.w, FARM.d) / 2 + 0.4 },
];

/** Nearest spot the avatar can stand on: outside obstacles and away from the island edge. */
export function walkablePoint(p: Point): Point {
  let { x, z } = p;
  for (let pass = 0; pass < 3; pass++) {
    for (const o of OBSTACLES) {
      const d = Math.hypot(x - o.x, z - o.z);
      if (d >= o.r) continue;
      const k = (o.r + 0.05) / (d || 1);
      x = o.x + (d ? (x - o.x) * k : o.r + 0.05);
      z = o.z + (d ? (z - o.z) * k : 0);
    }
    const r = Math.hypot(x, z);
    const max = rimRadius(Math.atan2(z, x)) - 1.8;
    if (r > max) {
      x *= max / r;
      z *= max / r;
    }
  }
  return { x, z };
}

/** Straight-line path from `from` to `to`, bent around any obstacle in the way. */
export function detourPath(from: Point, to: Point): Point[] {
  const points = [from, to];
  for (let pass = 0; pass < 6; pass++) {
    let inserted = false;
    for (let i = 0; i < points.length - 1 && !inserted; i++) {
      const a = points[i];
      const b = points[i + 1];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len2 = dx * dx + dz * dz || 1;
      for (const o of OBSTACLES) {
        const t = ((o.x - a.x) * dx + (o.z - a.z) * dz) / len2;
        if (t <= 0.02 || t >= 0.98) continue;
        const cx = a.x + t * dx;
        const cz = a.z + t * dz;
        const d = Math.hypot(cx - o.x, cz - o.z);
        if (d >= o.r) continue;
        // Step around the obstacle on the side the line already leans towards.
        let nx = cx - o.x;
        let nz = cz - o.z;
        if (d < 0.01) [nx, nz] = [-dz, dx];
        const n = Math.hypot(nx, nz) || 1;
        const via = walkablePoint({
          x: o.x + (nx / n) * (o.r + 0.8),
          z: o.z + (nz / n) * (o.r + 0.8),
        });
        points.splice(i + 1, 0, via);
        inserted = true;
        break;
      }
    }
    if (!inserted) break;
  }
  return points.slice(1);
}

/** Where the stream leaving the pond reaches the island edge (top of the waterfall). */
export const STREAM_END: Point = (() => {
  for (let d = POND.r; d < 20; d += 0.1) {
    const x = POND.x + STREAM_DIR.x * d;
    const z = POND.z + STREAM_DIR.z * d;
    if (Math.hypot(x, z) >= rimRadius(Math.atan2(z, x)) - 0.1) return { x, z };
  }
  return { x: POND.x, z: POND.z };
})();
