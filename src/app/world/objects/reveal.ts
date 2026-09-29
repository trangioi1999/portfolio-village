import { Box3, Group, Material, Mesh, MeshStandardMaterial, Object3D, Vector3 } from 'three';
import { Vec3, box, mergeStatic } from '../utils/geometry';
import { Entrance, InteriorView, RevealHandle } from '../utils/types';

/**
 * "Dollhouse" reveal: when a building is entered its door swings open, the front wall folds
 * down, the roof lifts away and the furniture pops in. Buildings tag their parts with
 * `revealPart` / `hingedDoor` and hand the root to `createReveal`. While open, walls between the
 * camera and the room fade out so visitors can orbit all the way around.
 */
export type RevealRole = 'roof' | 'front' | 'door' | 'interior' | 'floor' | 'wall';

/**
 * Group for one revealable part. The returned (inner) group keeps the building's coordinate
 * system, while the tagged outer group sits at `pivot` so it can rotate around that point.
 */
export function revealPart(parent: Object3D, role: RevealRole, pivot: Vec3 = [0, 0, 0]): Group {
  const outer = new Group();
  outer.position.set(...pivot);
  outer.userData['reveal'] = role;
  outer.userData['dynamic'] = true;
  const inner = new Group();
  inner.position.set(-pivot[0], -pivot[1], -pivot[2]);
  outer.add(inner);
  parent.add(outer);
  return inner;
}

/** Mark a door leaf (pivoted on its hinge) so it swings inward; `hinge` flips the direction. */
export function hingedDoor(leaf: Object3D, hinge: 1 | -1 = 1): Object3D {
  leaf.userData['reveal'] = 'door';
  leaf.userData['hinge'] = hinge;
  leaf.userData['dynamic'] = true;
  return leaf;
}

export interface RoomOpening {
  /** Centre x of the doorway. */
  x: number;
  w: number;
  h: number;
}

/** Back and side walls of a hollow room; windows and wall decorations go in here too. */
export interface RoomWalls {
  back: Group;
  left: Group;
  right: Group;
}

/**
 * Hollow room (floor + four walls) standing on `at`. The front wall goes into `front` so it can
 * fold away, with an optional doorway cut out of it; the other walls fade when they block the
 * view into the open room.
 */
export function hollowRoom(
  parent: Object3D,
  front: Object3D,
  wall: Material,
  floor: Material,
  size: Vec3,
  at: Vec3,
  opening?: RoomOpening,
  t = 0.18,
): RoomWalls {
  const [w, h, d] = size;
  const [x, y, z] = at;
  const side = () => {
    const g = new Group();
    g.userData['reveal'] = 'wall';
    g.userData['dynamic'] = true;
    parent.add(g);
    return g;
  };
  const walls = { back: side(), left: side(), right: side() };
  box(walls.back, wall, [w, h, t], [x, y, z - d / 2 + t / 2]);
  box(walls.left, wall, [t, h, d - t * 2], [x - w / 2 + t / 2, y, z]);
  box(walls.right, wall, [t, h, d - t * 2], [x + w / 2 - t / 2, y, z]);
  box(parent, floor, [w - t * 2, 0.04, d - t * 2], [x, y, z]);
  const fz = z + d / 2 - t / 2;
  if (!opening) {
    box(front, wall, [w, h, t], [x, y, fz]);
    return walls;
  }
  const left = opening.x - opening.w / 2 - (x - w / 2);
  const right = x + w / 2 - (opening.x + opening.w / 2);
  box(front, wall, [left, h, t], [x - w / 2 + left / 2, y, fz]);
  box(front, wall, [right, h, t], [x + w / 2 - right / 2, y, fz]);
  box(front, wall, [opening.w, h - opening.h, t], [opening.x, y + opening.h, fz]);
  return walls;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => v * v * (3 - 2 * v);
const easeOutBack = (v: number) => {
  const c = 1.7;
  const p = v - 1;
  return 1 + (c + 1) * p * p * p + c * p * p;
};

interface FadePart {
  outer: Object3D;
  base: Vector3;
  materials: Material[];
}

interface WallPart extends FadePart {
  alpha: number;
  /** World-space centre and outward direction (x/z), measured on first use. */
  center?: Vector3;
  outward?: Vector3;
}

export interface RevealOptions {
  /** Local point for the warm interior light. */
  light?: Vec3;
  /** Peak light intensity (small rooms need less). */
  lightIntensity?: number;
  /** Where the avatar steps in (local x/z points). */
  entrance?: Entrance;
  /** Camera framing while open (default: close and steep, looking down into the room). */
  view?: InteriorView;
}

const TO_EYE = new Vector3();

const ROOM_VIEW: InteriorView = { polar: 0.86, distance: 0.72, height: 2.2 };

/**
 * Collect the tagged parts under `root`, merge each part's static meshes on its own (so the
 * building-wide merge leaves them movable) and return the reveal handle.
 */
export function createReveal(root: Object3D, options: RevealOptions = {}): RevealHandle {
  const tagged: Object3D[] = [];
  root.traverse((o) => {
    if (o.userData['reveal']) tagged.push(o);
  });
  const doors = tagged.filter((o) => o.userData['reveal'] === 'door');
  const parts = (role: RevealRole) => tagged.filter((o) => o.userData['reveal'] === role);
  const fronts: FadePart[] = parts('front').map((outer) => fadePart(outer));
  const roofs: FadePart[] = parts('roof').map((outer) => fadePart(outer));
  // Storeys of tall buildings rise apart by `userData.lift`.
  const storeys = parts('floor').map((outer) => ({ outer, base: outer.position.y }));
  // Merge each piece of furniture separately so it can pop in on its own.
  const items: Object3D[] = [];
  for (const interior of parts('interior')) {
    const inner = interior.children[0] ?? interior;
    for (const item of [...inner.children]) {
      mergeStatic(item);
      items.push(item);
    }
    interior.visible = false;
  }
  const walls: WallPart[] = parts('wall').map((outer) => ({ ...fadePart(outer), alpha: 1 }));
  for (const p of [...fronts, ...roofs, ...walls]) mergeStatic(p.outer);
  for (const s of storeys) mergeStatic(s.outer);
  const interiors = parts('interior');

  let current = -1;
  return {
    light: options.light,
    lightIntensity: options.lightIntensity,
    view: options.view ?? (options.light ? ROOM_VIEW : undefined),
    entrance: options.entrance,
    init(highlight: MeshStandardMaterial[]) {
      // Shell parts fade on their own, so they get private material copies.
      for (const part of [...fronts, ...roofs, ...walls]) {
        const copies = new Map<string, Material>();
        part.outer.traverse((o) => {
          const mesh = o as Mesh;
          if (!mesh.isMesh || Array.isArray(mesh.material)) return;
          const source = mesh.material;
          // Already-transparent effects (smoke puffs) animate their own opacity.
          if (source.transparent) return;
          let copy = copies.get(source.uuid);
          if (!copy) {
            copy = source.clone();
            copies.set(source.uuid, copy);
            part.materials.push(copy);
            if (highlight.includes(source as MeshStandardMaterial))
              highlight.push(copy as MeshStandardMaterial);
          }
          mesh.material = copy;
        });
      }
    },
    set(k: number) {
      if (k === current) return;
      current = k;
      const doorK = smooth(clamp01(k / 0.35));
      for (const d of doors) d.rotation.y = (d.userData['hinge'] as number) * doorK * 1.65;

      const shell = smooth(clamp01((k - 0.2) / 0.8));
      for (const f of fronts) {
        f.outer.rotation.x = shell * 1.3;
        fade(f, 1 - clamp01((shell - 0.2) / 0.6));
      }
      for (const s of storeys)
        s.outer.position.y = s.base + shell * ((s.outer.userData['lift'] as number) ?? 0);
      for (const r of roofs) {
        const rise = (r.outer.userData['rise'] as number | undefined) ?? 4.5;
        r.outer.position.set(r.base.x, r.base.y + shell * rise, r.base.z);
        r.outer.rotation.z = shell * 0.1;
        if (!r.outer.userData['keep']) fade(r, 1 - clamp01(shell / 0.75));
      }

      const pop = clamp01((k - 0.4) / 0.6);
      for (const interior of interiors) interior.visible = pop > 0;
      items.forEach((item, i) => {
        const s = easeOutBack(clamp01(pop * 1.8 - i * 0.07));
        item.visible = s > 0.001;
        item.scale.setScalar(Math.max(0.001, s));
      });
    },
    face(eye: Vector3, dt: number) {
      const open = current > 0.6;
      const toEye = TO_EYE;
      for (const wall of walls) {
        let goal = 1;
        if (open) {
          if (!wall.center) {
            const center = new Box3().setFromObject(wall.outer).getCenter(new Vector3());
            const origin = root.getWorldPosition(new Vector3());
            wall.center = center;
            wall.outward = center.clone().sub(origin).setY(0).normalize();
          }
          toEye.copy(eye).sub(wall.center).setY(0).normalize();
          // Hide walls standing between the camera and the room.
          if (toEye.dot(wall.outward!) > 0.2) goal = 0;
        }
        if (wall.alpha === goal) continue;
        wall.alpha += (goal - wall.alpha) * Math.min(1, dt * 7);
        if (Math.abs(goal - wall.alpha) < 0.02) wall.alpha = goal;
        fade(wall, wall.alpha);
      }
    },
  };
}

function fadePart(outer: Object3D): FadePart {
  return { outer, base: outer.position.clone(), materials: [] };
}

function fade(part: FadePart, opacity: number): void {
  part.outer.visible = opacity > 0.01;
  const transparent = opacity < 0.999;
  for (const m of part.materials) {
    m.opacity = opacity;
    if (m.transparent !== transparent) {
      m.transparent = transparent;
      m.needsUpdate = true;
    }
  }
}

/** Is `obj` inside a building's interior group (excluded from hover highlights)? */
export function inInterior(obj: Object3D): boolean {
  for (let o: Object3D | null = obj; o; o = o.parent) {
    if (o.userData['reveal'] === 'interior') return true;
  }
  return false;
}
