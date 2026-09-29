import { Group, Mesh, MeshBasicMaterial, Object3D, PlaneGeometry, Texture } from 'three';
import { Vec3, add, box, cone, cyl, geo, sphere } from '../utils/geometry';
import { PALETTE, glow, mat } from '../utils/materials';
import { BuildContext, Updater } from '../utils/types';

/** Glowing window with a wooden frame, facing +z of the parent. */
export function windowPane(parent: Object3D, w: number, h: number, at: Vec3, rotY = 0): void {
  const g = new Group();
  g.position.set(...at);
  g.rotation.y = rotY;
  box(g, mat(PALETTE.woodDark), [w + 0.16, h + 0.16, 0.08], [0, -h / 2 - 0.08, 0]);
  box(g, glow(PALETTE.glass, 0.55), [w, h, 0.1], [0, -h / 2, 0.02]);
  box(g, mat(PALETTE.woodDark), [0.06, h, 0.12], [0, -h / 2, 0.03]);
  box(g, mat(PALETTE.woodDark), [w, 0.06, 0.12], [0, -0.03, 0.03]);
  parent.add(g);
}

/** Framed door; returns the leaf, pivoted on its left hinge so it can swing open. */
export function door(
  parent: Object3D,
  w: number,
  h: number,
  at: Vec3,
  color: string = PALETTE.woodDark,
): Group {
  const frame = mat(PALETTE.woodDeep);
  box(parent, frame, [0.1, h + 0.1, 0.1], [at[0] - w / 2 - 0.05, at[1], at[2]]);
  box(parent, frame, [0.1, h + 0.1, 0.1], [at[0] + w / 2 + 0.05, at[1], at[2]]);
  box(parent, frame, [w + 0.2, 0.1, 0.1], [at[0], at[1] + h, at[2]]);
  const leaf = new Group();
  leaf.position.set(at[0] - w / 2, at[1], at[2] + 0.02);
  box(leaf, mat(color), [w, h, 0.14], [w / 2, 0, 0]);
  sphere(leaf, mat(PALETTE.gold, { metalness: 0.4, roughness: 0.4 }), 0.06, [
    w * 0.82,
    h * 0.5,
    0.1,
  ]);
  parent.add(leaf);
  return leaf;
}

/** Wooden lamp post with a warm lantern. */
export function lampPost(parent: Object3D, at: Vec3): void {
  const g = new Group();
  g.position.set(...at);
  cyl(g, mat(PALETTE.woodDark), 0.09, 2.2, [0, 0, 0], 6);
  box(g, mat(PALETTE.woodDark), [0.7, 0.08, 0.08], [0.25, 2.1, 0]);
  box(g, glow('#ffc766', 1.1), [0.28, 0.36, 0.28], [0.52, 1.66, 0]);
  cone(g, mat(PALETTE.roofRed, { flat: true }), 0.26, 0.2, [0.52, 2.02, 0], 4);
  parent.add(g);
}

/** Stone lantern (warm light inside). */
export function stoneLantern(parent: Object3D, at: Vec3, s = 1): void {
  const g = new Group();
  g.position.set(...at);
  g.scale.setScalar(s);
  const stone = mat(PALETTE.stone, { flat: true });
  cyl(g, stone, 0.32, 0.18, [0, 0, 0], 6);
  cyl(g, stone, 0.12, 0.7, [0, 0.18, 0], 6);
  box(g, stone, [0.55, 0.12, 0.55], [0, 0.86, 0]);
  box(g, glow('#ffcf7a', 1.2), [0.34, 0.34, 0.34], [0, 0.98, 0]);
  cone(g, stone, 0.5, 0.35, [0, 1.32, 0], 4).rotation.y = Math.PI / 4;
  sphere(g, stone, 0.07, [0, 1.72, 0]);
  parent.add(g);
}

export function bench(parent: Object3D, at: Vec3, rotY = 0): void {
  const g = new Group();
  g.position.set(...at);
  g.rotation.y = rotY;
  const wood = mat(PALETTE.wood);
  box(g, wood, [1.8, 0.1, 0.5], [0, 0.45, 0]);
  box(g, wood, [1.8, 0.4, 0.08], [0, 0.55, -0.24]);
  for (const x of [-0.75, 0.75]) box(g, mat(PALETTE.woodDark), [0.1, 0.45, 0.45], [x, 0, 0]);
  parent.add(g);
}

export function crate(parent: Object3D, at: Vec3, s = 0.7, rotY = 0): void {
  box(parent, mat('#c29462'), [s, s, s], at, rotY);
  box(
    parent,
    mat(PALETTE.woodDark),
    [s + 0.04, 0.08, s + 0.04],
    [at[0], at[1] + s * 0.45, at[2]],
    rotY,
  );
}

export function barrel(parent: Object3D, at: Vec3): void {
  cyl(parent, mat('#9c6a3d'), 0.36, 0.9, at, 10, 0.9);
  for (const y of [0.18, 0.7])
    cyl(parent, mat(PALETTE.woodDeep), 0.37, 0.06, [at[0], at[1] + y, at[2]], 10);
}

export function flowerPot(parent: Object3D, at: Vec3, color: string): void {
  cyl(parent, mat('#c2653f'), 0.18, 0.28, at, 8, 1.2);
  sphere(parent, mat(PALETTE.leaf, { flat: true }), 0.22, [at[0], at[1] + 0.38, at[2]]);
  sphere(parent, mat(color, { flat: true }), 0.1, [at[0] + 0.08, at[1] + 0.52, at[2] + 0.08]);
}

/** Wooden plank with a painted text texture (kept dynamic so it is not merged). */
export function textSign(texture: Texture, w: number, h: number): Group {
  const g = new Group();
  const board = add(g, geo.box(), mat(PALETTE.woodDark), [0, 0, -0.05], [w + 0.18, h + 0.18, 0.1]);
  board.castShadow = true;
  const face = new Mesh(
    new PlaneGeometry(w, h),
    new MeshBasicMaterial({ map: texture, toneMapped: false }),
  );
  face.position.z = 0.011;
  g.add(face);
  g.userData['dynamic'] = true;
  return g;
}

/** Chimney smoke — soft puffs rising and fading. */
export function smoke(parent: Object3D, at: Vec3, ctx: BuildContext): Updater {
  const puffs: Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const m = new MeshBasicMaterial({
      color: '#f4f1ea',
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const p = new Mesh(geo.ico(1), m);
    p.position.set(...at);
    p.userData['phase'] = i / 5;
    p.userData['dynamic'] = true;
    parent.add(p);
    puffs.push(p);
  }
  return (_dt, t) => {
    const still = ctx.reducedMotion();
    for (const p of puffs) {
      const k = still ? p.userData['phase'] : (t * 0.22 + p.userData['phase']) % 1;
      p.position.set(at[0] + Math.sin(k * 5) * 0.3 + k * 0.6, at[1] + k * 3.2, at[2]);
      p.scale.setScalar(0.35 + k * 0.9);
      (p.material as MeshBasicMaterial).opacity = 0.65 * (1 - k);
    }
  };
}

/** Gear made of a disc and teeth — returned so callers can spin it. */
export function gear(parent: Object3D, radius: number, at: Vec3, color = '#c9a24a'): Group {
  const g = new Group();
  g.position.set(...at);
  const m = mat(color, { metalness: 0.5, roughness: 0.45, flat: true });
  add(g, geo.cylinder(0.5, 0.5, 14), m, [0, 0, 0], [radius * 2, 0.18, radius * 2], {
    rot: [Math.PI / 2, 0, 0],
  });
  const teeth = 10;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    add(g, geo.box(), m, [Math.cos(a) * radius, Math.sin(a) * radius, 0], [0.24, 0.24, 0.18], {
      rot: [0, 0, a],
    });
  }
  add(
    g,
    geo.cylinder(0.5, 0.5, 10),
    mat(PALETTE.woodDeep),
    [0, 0, 0.05],
    [radius * 0.6, 0.22, radius * 0.6],
    { rot: [Math.PI / 2, 0, 0] },
  );
  g.userData['dynamic'] = true;
  parent.add(g);
  return g;
}

/** Red paper lantern (Chinese-village style) that glows at dusk. */
export function paperLantern(parent: Object3D, at: Vec3, s = 1): Group {
  const g = new Group();
  g.position.set(...at);
  g.scale.setScalar(s);
  add(g, geo.sphere(), glow('#e8483a', 1.1), [0, 0, 0], [0.55, 0.62, 0.55]);
  for (const y of [-0.31, 0.31])
    add(g, geo.cylinder(0.5, 0.5, 10), mat(PALETTE.gold), [0, y, 0], [0.26, 0.06, 0.26]);
  add(g, geo.cone(6), mat(PALETTE.gold), [0, -0.5, 0], [0.12, 0.3, 0.12], { rot: [Math.PI, 0, 0] });
  add(g, geo.cylinder(0.5, 0.5, 4), mat(PALETTE.woodDeep), [0, 0.5, 0], [0.03, 0.4, 0.03]);
  parent.add(g);
  return g;
}
