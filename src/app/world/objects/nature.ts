import {
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Material,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  Vector3,
  BufferGeometry,
} from 'three';
import { BUILDING_MAP } from '../../data/buildings.data';
import { isFreeGround, rimRadius } from '../layout';
import { PALETTE, mat } from '../utils/materials';
import { BuildContext, VillageObject } from '../utils/types';

interface Instance {
  position: Vector3;
  scale: Vector3;
  rotationY: number;
  color?: Color;
}

function instanced(
  geometry: BufferGeometry,
  material: Material,
  items: Instance[],
  cast = true,
): InstancedMesh {
  const mesh = new InstancedMesh(geometry, material, Math.max(items.length, 1));
  const m = new Matrix4();
  const q = new Quaternion();
  const up = new Vector3(0, 1, 0);
  items.forEach((it, i) => {
    q.setFromAxisAngle(up, it.rotationY);
    m.compose(it.position, q, it.scale);
    mesh.setMatrixAt(i, m);
    if (it.color) mesh.setColorAt(i, it.color);
  });
  mesh.count = items.length;
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  mesh.computeBoundingSphere();
  return mesh;
}

/** Make a material sway in the wind (per-instance phase, stronger towards the top). */
function windy(
  material: MeshStandardMaterial,
  time: { value: number },
  strength: number,
): MeshStandardMaterial {
  material.onBeforeCompile = (shader) => {
    shader.uniforms['uWind'] = time;
    shader.vertexShader =
      'uniform float uWind;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 ip = instanceMatrix[3].xyz;
        #else
          vec3 ip = vec3(0.0);
        #endif
        float sway = sin(uWind * 1.6 + ip.x * 0.35 + ip.z * 0.27) + 0.35 * sin(uWind * 3.3 + ip.x * 0.8);
        float k = ${strength.toFixed(3)} * (position.y + 0.5);
        transformed.x += sway * k;
        transformed.z += sway * k * 0.6;`,
      );
  };
  material.customProgramCacheKey = () => `wind-${strength}`;
  return material;
}

/** Trees, pines, sakura, bushes, rocks, flowers and grass tufts — all instanced. */
export function createNature(ctx: BuildContext): VillageObject {
  const { rng, quality } = ctx;
  const root = new Group();
  root.name = 'nature';
  const low = quality === 'low';

  const trunks: Instance[] = [];
  const crowns: Instance[] = [];
  const pineLayers: Instance[] = [];
  const bushes: Instance[] = [];
  const rocks: Instance[] = [];
  const flowers: Instance[] = [];
  const tufts: Instance[] = [];

  const greens = ['#4fae3f', '#63bf45', '#3f9a38', '#7cc94f', '#92d65a', '#58b85a'].map(
    (c) => new Color(c),
  );
  const sakura = ['#f7b8cb', '#f4a6bf', '#fbc9d7'].map((c) => new Color(c));
  const autumn = ['#f2b04a', '#e98a3a', '#f7c948'].map((c) => new Color(c));
  const flowerColors = ['#ffffff', '#ffd24d', '#ff8fb1', '#b58cff', '#ff6b5b', '#8fd0ff'].map(
    (c) => new Color(c),
  );
  const tuftColors = ['#5fae3f', '#76c24a', '#4f9a38'].map((c) => new Color(c));

  const roundTree = (x: number, z: number, s: number, palette: Color[]) => {
    const h = 1.6 * s;
    trunks.push({ position: new Vector3(x, h / 2, z), scale: new Vector3(s, h, s), rotationY: 0 });
    const puffs = 3;
    for (let i = 0; i < puffs; i++) {
      const a = (i / puffs) * Math.PI * 2 + rng.next();
      const r = i === 0 ? 0 : 0.55 * s;
      const cs = s * rng.range(1.25, 1.6);
      crowns.push({
        position: new Vector3(
          x + Math.cos(a) * r,
          h + cs * 0.55 + (i === 0 ? 0.45 * s : 0),
          z + Math.sin(a) * r,
        ),
        scale: new Vector3(cs, cs * 0.92, cs),
        rotationY: rng.next() * 6,
        color: rng.pick(palette),
      });
    }
  };

  const pine = (x: number, z: number, s: number) => {
    trunks.push({
      position: new Vector3(x, 0.6 * s, z),
      scale: new Vector3(s * 0.8, 1.2 * s, s * 0.8),
      rotationY: 0,
    });
    for (let i = 0; i < 3; i++) {
      const ls = s * (1.5 - i * 0.35);
      pineLayers.push({
        position: new Vector3(x, s * (1.5 + i * 0.95), z),
        scale: new Vector3(ls, ls * 1.1, ls),
        rotationY: rng.next() * 6,
        color: new Color(PALETTE.pine).multiplyScalar(0.9 + i * 0.1),
      });
    }
  };

  /* ---- Scatter trees: dense forest ring near the rim, lighter inside ---- */
  const treeTarget = low ? 75 : 140;
  let placed = 0;
  for (let attempt = 0; attempt < 3000 && placed < treeTarget; attempt++) {
    const a = rng.next() * Math.PI * 2;
    const rim = rimRadius(a);
    const r = Math.sqrt(rng.range(0.12, 1)) * (rim - 1.8);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (!isFreeGround(x, z, 0.4)) continue;
    // Keep the front edge low so buildings stay visible from the camera.
    const front = z > 15 && Math.abs(x) < 24;
    if (front && rng.next() < 0.75) {
      bushes.push({
        position: new Vector3(x, 0.35, z),
        scale: new Vector3(1, 0.8, 1).multiplyScalar(rng.range(0.9, 1.5)),
        rotationY: rng.next() * 6,
        color: rng.pick(greens),
      });
      placed++;
      continue;
    }
    const nearAcademy =
      Math.hypot(x - BUILDING_MAP.academy.position[0], z - BUILDING_MAP.academy.position[1]) < 13;
    const nearShrine =
      Math.hypot(x - BUILDING_MAP.contact.position[0], z - BUILDING_MAP.contact.position[1]) < 11;
    const s = rng.range(0.8, 1.25);
    if (nearAcademy && rng.next() < 0.6) roundTree(x, z, s, sakura);
    else if ((nearShrine || r > rim - 7) && rng.next() < 0.45) pine(x, z, s);
    else roundTree(x, z, s, rng.next() < 0.1 ? autumn : greens);
    placed++;
  }

  /* ---- Bushes, rocks, flowers, grass ---- */
  const scatter = (n: number, margin: number, fn: (x: number, z: number) => void) => {
    let done = 0;
    for (let attempt = 0; attempt < n * 8 && done < n; attempt++) {
      const a = rng.next() * Math.PI * 2;
      const r = Math.sqrt(rng.next()) * (rimRadius(a) - 1);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (!isFreeGround(x, z, margin)) continue;
      fn(x, z);
      done++;
    }
  };
  const blossom = ['#ffffff', '#ffb3c7', '#ffd24d', '#ff8fb1'].map((c) => new Color(c));
  scatter(low ? 35 : 70, 0, (x, z) => {
    const s = rng.range(0.8, 1.4);
    bushes.push({
      position: new Vector3(x, 0.3, z),
      scale: new Vector3(1, 0.75, 1).multiplyScalar(s),
      rotationY: rng.next() * 6,
      color: rng.pick(greens),
    });
    // Flowering bushes, like the concept art.
    if (rng.next() < 0.55) {
      const color = rng.pick(blossom);
      for (let i = 0; i < 6; i++) {
        const a = rng.next() * Math.PI * 2;
        flowers.push({
          position: new Vector3(
            x + Math.cos(a) * 0.4 * s,
            0.45 * s + rng.range(0, 0.25),
            z + Math.sin(a) * 0.4 * s,
          ),
          scale: new Vector3(1.3, 1.3, 1.3),
          rotationY: 0,
          color,
        });
      }
    }
  });
  scatter(low ? 16 : 28, -0.6, (x, z) =>
    rocks.push({
      position: new Vector3(x, 0.12, z),
      scale: new Vector3(rng.range(0.4, 0.9), rng.range(0.3, 0.55), rng.range(0.4, 0.9)),
      rotationY: rng.next() * 6,
      color: new Color(PALETTE.stone).multiplyScalar(rng.range(0.85, 1.1)),
    }),
  );
  const flowerPatches = low ? 35 : 80;
  scatter(flowerPatches, -0.8, (cx, cz) => {
    const color = rng.pick(flowerColors);
    for (let i = 0; i < 7; i++) {
      const x = cx + rng.range(-0.8, 0.8);
      const z = cz + rng.range(-0.8, 0.8);
      flowers.push({
        position: new Vector3(x, 0.2, z),
        scale: new Vector3(1, 1, 1).multiplyScalar(rng.range(0.8, 1.2)),
        rotationY: rng.next() * 6,
        color,
      });
    }
  });
  scatter(low ? 260 : 700, -1, (x, z) =>
    tufts.push({
      position: new Vector3(x, 0.2, z),
      scale: new Vector3(1, rng.range(0.7, 1.3), 1),
      rotationY: rng.next() * 6,
      color: rng.pick(tuftColors),
    }),
  );

  const trunkGeo = new CylinderGeometry(0.16, 0.22, 1, 6);
  const crownGeo = new IcosahedronGeometry(0.5, 1);
  const pineGeo = new ConeGeometry(0.75, 1.4, 7);
  const bushGeo = new IcosahedronGeometry(0.55, 0);
  const rockGeo = new DodecahedronGeometry(0.6, 0);
  const flowerGeo = new IcosahedronGeometry(0.1, 0);
  const tuftGeo = new ConeGeometry(0.09, 0.45, 3);

  const white = (flat = true) => mat('#ffffff', { flat });
  const wind = { value: 0 };
  const foliage = (strength: number) =>
    windy(
      new MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 0.85 }),
      wind,
      strength,
    );
  root.add(instanced(trunkGeo, mat(PALETTE.trunk), trunks));
  root.add(instanced(crownGeo, foliage(0.09), crowns));
  root.add(instanced(pineGeo, foliage(0.06), pineLayers));
  root.add(instanced(bushGeo, foliage(0.05), bushes));
  root.add(instanced(rockGeo, white(), rocks));
  root.add(
    instanced(
      flowerGeo,
      mat('#ffffff', { flat: true, emissive: '#2a2010', emissiveIntensity: 0.35 }),
      flowers,
      false,
    ),
  );
  root.add(instanced(tuftGeo, foliage(0.22), tufts, false));

  const birds = createBirds(ctx);
  root.add(birds.root);
  return {
    root,
    update: (dt, t) => {
      if (!ctx.reducedMotion()) wind.value = t;
      birds.update?.(dt, t);
    },
  };
}

/** A few tiny birds circling above the village. */
function createBirds(ctx: BuildContext): VillageObject {
  const root = new Group();
  const birdMat = mat('#4a3a30');
  const wingGeo = new ConeGeometry(0.12, 0.7, 3);
  const flock: {
    obj: Object3D;
    wings: Object3D[];
    r: number;
    h: number;
    speed: number;
    phase: number;
  }[] = [];
  for (let i = 0; i < 5; i++) {
    const obj = new Group();
    const wings: Object3D[] = [];
    for (const side of [-1, 1]) {
      const wing = new Group();
      const mesh = new Mesh(wingGeo, birdMat);
      mesh.rotation.z = (side * Math.PI) / 2;
      mesh.position.x = side * 0.3;
      wing.add(mesh);
      obj.add(wing);
      wings.push(wing);
    }
    flock.push({
      obj,
      wings,
      r: ctx.rng.range(10, 22),
      h: ctx.rng.range(12, 18),
      speed: ctx.rng.range(0.12, 0.2),
      phase: ctx.rng.next() * 6,
    });
    root.add(obj);
  }
  return {
    root,
    update: (_dt, t) => {
      const still = ctx.reducedMotion();
      for (const b of flock) {
        const a = (still ? 0 : t) * b.speed + b.phase;
        b.obj.position.set(Math.cos(a) * b.r, b.h + Math.sin(a * 3) * 0.5, Math.sin(a) * b.r - 4);
        b.obj.rotation.y = -a;
        const flap = still ? 0 : Math.sin(t * 9 + b.phase) * 0.6;
        b.wings[0].rotation.z = flap;
        b.wings[1].rotation.z = -flap;
      }
    },
  };
}
