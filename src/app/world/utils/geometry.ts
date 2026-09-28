import {
  BoxGeometry,
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  IcosahedronGeometry,
  LatheGeometry,
  Material,
  Matrix4,
  Mesh,
  Object3D,
  Shape,
  SphereGeometry,
  Vector2,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type Vec3 = readonly [number, number, number];

/* ---------- Shared primitive geometries (scaled per mesh) ---------- */

const cache = new Map<string, BufferGeometry>();
function cached<T extends BufferGeometry>(key: string, make: () => T): T {
  let g = cache.get(key) as T | undefined;
  if (!g) {
    g = make();
    cache.set(key, g);
  }
  return g;
}

export const geo = {
  box: () => cached('box', () => new BoxGeometry(1, 1, 1)),
  cylinder: (top = 0.5, bottom = 0.5, seg = 10) =>
    cached(`cyl${top}|${bottom}|${seg}`, () => new CylinderGeometry(top, bottom, 1, seg)),
  cone: (seg = 8) => cached(`cone${seg}`, () => new ConeGeometry(0.5, 1, seg)),
  sphere: (w = 16, h = 12) => cached(`sph${w}|${h}`, () => new SphereGeometry(0.5, w, h)),
  ico: (detail = 0) => cached(`ico${detail}`, () => new IcosahedronGeometry(0.5, detail)),
};

export function disposeGeometryCache(): void {
  cache.forEach((g) => g.dispose());
  cache.clear();
}

/* ---------- Mesh helpers ---------- */

export interface Place {
  rot?: Vec3;
  cast?: boolean;
  receive?: boolean;
}

export function add(
  parent: Object3D,
  geometry: BufferGeometry,
  material: Material,
  position: Vec3,
  scale: Vec3 | number = 1,
  place: Place = {},
): Mesh {
  const mesh = new Mesh(geometry, material);
  mesh.position.set(...position);
  if (typeof scale === 'number') mesh.scale.setScalar(scale);
  else mesh.scale.set(...scale);
  if (place.rot) mesh.rotation.set(...place.rot);
  mesh.castShadow = place.cast ?? true;
  mesh.receiveShadow = place.receive ?? true;
  parent.add(mesh);
  return mesh;
}

/** Box whose position is the centre of its bottom face. */
export function box(parent: Object3D, m: Material, size: Vec3, at: Vec3, rotY = 0): Mesh {
  return add(parent, geo.box(), m, [at[0], at[1] + size[1] / 2, at[2]], size, {
    rot: [0, rotY, 0],
  });
}

/** Cylinder (radius, height) standing on `at`. */
export function cyl(
  parent: Object3D,
  m: Material,
  r: number,
  h: number,
  at: Vec3,
  seg = 10,
  taper = 1,
): Mesh {
  return add(
    parent,
    geo.cylinder(0.5 * taper, 0.5, seg),
    m,
    [at[0], at[1] + h / 2, at[2]],
    [r * 2, h, r * 2],
  );
}

export function sphere(
  parent: Object3D,
  m: Material,
  r: number,
  at: Vec3,
  squash: Vec3 = [1, 1, 1],
): Mesh {
  return add(parent, geo.sphere(), m, at, [
    r * 2 * squash[0],
    r * 2 * squash[1],
    r * 2 * squash[2],
  ]);
}

export function cone(parent: Object3D, m: Material, r: number, h: number, at: Vec3, seg = 8): Mesh {
  return add(parent, geo.cone(seg), m, [at[0], at[1] + h / 2, at[2]], [r * 2, h, r * 2]);
}

/* ---------- Roofs ---------- */

const PAGODA_PROFILE = [
  new Vector2(0, 0),
  new Vector2(1, 0),
  new Vector2(0.8, 0.16),
  new Vector2(0.58, 0.4),
  new Vector2(0.34, 0.7),
  new Vector2(0.08, 0.96),
  new Vector2(0, 1),
];

/** Square roof with a concave (East-Asian) profile, sized to cover a w×d footprint. */
export function pagodaRoof(
  parent: Object3D,
  m: Material,
  w: number,
  d: number,
  h: number,
  y: number,
  overhang = 0.9,
  horns?: Material,
): Mesh {
  const g = cached('pagoda', () => {
    const lathe = new LatheGeometry(PAGODA_PROFILE, 4);
    lathe.rotateY(Math.PI / 4);
    return lathe;
  });
  const roof = add(
    parent,
    g,
    m,
    [0, y, 0],
    [(w / 2 + overhang) * Math.SQRT2, h, (d / 2 + overhang) * Math.SQRT2],
  );
  if (horns) {
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const horn = add(
          parent,
          geo.cone(5),
          horns,
          [sx * (w / 2 + overhang), y + 0.2, sz * (d / 2 + overhang)],
          [0.22, 0.6, 0.22],
        );
        horn.rotation.set(sz * 0.7, 0, -sx * 0.7);
      }
    }
  }
  return roof;
}

/** Gable roof with its ridge along the local x axis. */
export function gableRoof(
  parent: Object3D,
  m: Material,
  w: number,
  d: number,
  h: number,
  y: number,
  overhang = 0.5,
): Mesh {
  const shape = new Shape();
  shape.moveTo(-d / 2 - overhang, 0);
  shape.lineTo(d / 2 + overhang, 0);
  shape.lineTo(0, h);
  shape.closePath();
  const g = new ExtrudeGeometry(shape, { depth: w + overhang * 2, bevelEnabled: false });
  g.translate(0, 0, -(w + overhang * 2) / 2);
  g.rotateY(Math.PI / 2);
  return add(parent, g, m, [0, y, 0]);
}

/* ---------- Static merging (draw-call reduction) ---------- */

function isDynamic(obj: Object3D, root: Object3D): boolean {
  for (let o: Object3D | null = obj; o && o !== root; o = o.parent) {
    if (o.userData['dynamic']) return true;
  }
  return false;
}

/**
 * Bake every static, non-textured mesh under `root` into one mesh per material.
 * Objects flagged with `userData.dynamic` (animated parts, textured signs) are kept as-is.
 */
export function mergeStatic(root: Object3D): void {
  root.updateMatrixWorld(true);
  const inverseRoot = new Matrix4().copy(root.matrixWorld).invert();
  const groups = new Map<
    string,
    { material: Material; cast: boolean; geometries: BufferGeometry[] }
  >();
  const toRemove: Mesh[] = [];

  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh || (mesh as unknown as { isInstancedMesh?: boolean }).isInstancedMesh) return;
    if (Array.isArray(mesh.material) || isDynamic(mesh, root)) return;
    const material = mesh.material as Material & { map?: unknown };
    if (material.map || mesh.geometry.getAttribute('color')) return;

    const g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
    }
    g.morphAttributes = {};
    g.applyMatrix4(new Matrix4().multiplyMatrices(inverseRoot, mesh.matrixWorld));

    const key = `${material.uuid}|${mesh.castShadow}`;
    let entry = groups.get(key);
    if (!entry) {
      entry = { material, cast: mesh.castShadow, geometries: [] };
      groups.set(key, entry);
    }
    entry.geometries.push(g);
    toRemove.push(mesh);
  });

  toRemove.forEach((m) => m.parent?.remove(m));
  groups.forEach(({ material, cast, geometries }) => {
    const merged = mergeGeometries(geometries, false);
    geometries.forEach((g) => g.dispose());
    if (!merged) return;
    merged.computeBoundingSphere();
    const mesh = new Mesh(merged, material);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    root.add(mesh);
  });
}

/** Dispose all geometries, materials and textures under an object. */
export function disposeObject(root: Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const materials = mesh.material
      ? Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]
      : [];
    for (const m of materials) {
      for (const value of Object.values(m)) {
        if (value && typeof value === 'object' && 'isTexture' in value)
          (value as { dispose(): void }).dispose();
      }
      m.dispose();
    }
  });
}
