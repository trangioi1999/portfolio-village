import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { add, cone, cyl, geo, sphere } from '../utils/geometry';
import { PALETTE, mat } from '../utils/materials';
import { Rng } from '../utils/random';
import { streakTexture } from '../utils/textures';
import { BuildContext, VillageObject } from '../utils/types';
import { gust } from '../utils/wind';
import { waterfallMaterial } from './water';

export const FOG_COLOR = '#c8e6f5';

function skyDome(): Mesh {
  const material = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: new Color('#3b9be0') },
      uMid: { value: new Color('#8fd0f2') },
      uHorizon: { value: new Color('#fdecc9') },
      uBottom: { value: new Color('#b5dcf0') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop;
      uniform vec3 uMid;
      uniform vec3 uHorizon;
      uniform vec3 uBottom;
      varying vec3 vDir;
      void main() {
        float h = vDir.y;
        vec3 c = mix(uHorizon, uMid, smoothstep(0.0, 0.25, h));
        c = mix(c, uTop, smoothstep(0.25, 0.85, h));
        c = mix(c, uBottom, smoothstep(0.0, -0.35, h));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
  const dome = new Mesh(new SphereGeometry(600, 32, 16), material);
  dome.name = 'sky';
  dome.renderOrder = -1;
  return dome;
}

/** Merged cluster of flattened icospheres. */
function cloudGeometry(rng: Rng, puffs: number, spread: number): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < puffs; i++) {
    const g = new IcosahedronGeometry(rng.range(2.2, 4.2), 1);
    g.scale(1, 0.62, 1);
    g.translate(
      rng.range(-spread, spread),
      rng.range(-0.4, 1.2),
      rng.range(-spread * 0.4, spread * 0.4),
    );
    parts.push(g.index ? g.toNonIndexed() : g);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** Tall karst pillar with a green cap (vertex coloured, low poly). */
function pillarGeometry(rng: Rng, h: number, r: number): BufferGeometry {
  const g = new CylinderGeometry(r * rng.range(0.55, 0.8), r, h, 7, 6).toNonIndexed();
  const pos = g.getAttribute('position') as BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const rock = new Color('#9ab5a2');
  const moss = new Color('#5fae4f');
  const c = new Color();
  const offsets = new Map<string, [number, number]>();
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(2)}|${pos.getY(i).toFixed(2)}|${pos.getZ(i).toFixed(2)}`;
    if (!offsets.has(key)) offsets.set(key, [rng.range(-0.18, 0.18), rng.range(-0.18, 0.18)]);
    const [ox, oz] = offsets.get(key)!;
    const y = pos.getY(i) / h + 0.5;
    pos.setX(i, pos.getX(i) * (1 + ox));
    pos.setZ(i, pos.getZ(i) * (1 + oz));
    c.copy(rock).lerp(
      moss,
      Math.min(
        1,
        Math.max(0, (y - 0.62) * 3.2) +
          (Math.sin(pos.getX(i) * 0.8 + pos.getZ(i)) > 0.6 ? 0.35 : 0),
      ),
    );
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new BufferAttribute(colors, 3));
  g.deleteAttribute('uv');
  g.computeVertexNormals();
  return g;
}

export function createSky(ctx: BuildContext): VillageObject {
  const { rng } = ctx;
  const root = new Group();
  root.name = 'sky';
  root.add(skyDome());

  /* ---- Karst mountains with tree caps and waterfalls ---- */
  const pillars: BufferGeometry[] = [];
  const caps: BufferGeometry[] = [];
  const falls: { x: number; y: number; z: number; h: number; a: number }[] = [];
  const count = ctx.quality === 'high' ? 26 : 14;
  for (let i = 0; i < count; i++) {
    // Around the back and both sides of the island (the camera looks toward -z).
    const a = rng.range(Math.PI * 0.95, Math.PI * 2.05);
    const dist = rng.range(100, 220);
    const h = rng.range(50, 125) * (dist < 110 ? 0.8 : 1);
    const r = rng.range(7, 15);
    const x = Math.cos(a) * dist;
    const z = Math.sin(a) * dist;
    const g = pillarGeometry(rng, h, r);
    g.translate(x, -58 + h / 2, z);
    pillars.push(g);
    const top = -58 + h;
    for (let k = 0; k < rng.int(3, 7); k++) {
      const t = new IcosahedronGeometry(rng.range(1.8, 3.6), 0);
      const ta = rng.next() * Math.PI * 2;
      const tr = rng.range(0, r * 0.45);
      t.translate(x + Math.cos(ta) * tr, top + rng.range(0.5, 2.5), z + Math.sin(ta) * tr);
      caps.push(t.index ? t.toNonIndexed() : t);
    }
    if (i % 4 === 0 && dist < 170) falls.push({ x, y: top - 2, z, h: h * 0.7, a });
  }
  const mountains = new Mesh(
    mergeGeometries(pillars)!,
    mat('#ffffff', { vertexColors: true, flat: true }),
  );
  pillars.forEach((p) => p.dispose());
  mountains.name = 'mountains';
  root.add(mountains);
  const capMesh = new Mesh(mergeGeometries(caps)!, mat('#4f9f44', { flat: true }));
  caps.forEach((p) => p.dispose());
  root.add(capMesh);
  for (const f of falls) {
    const fall = new Mesh(new PlaneGeometry(2.4, f.h), waterfallMaterial(streakTexture()));
    // Face the island, hanging on the near side of the pillar.
    const inward = Math.atan2(-f.x, -f.z);
    fall.position.set(f.x - Math.cos(f.a) * 7, f.y - f.h / 2, f.z - Math.sin(f.a) * 7);
    fall.rotation.y = inward;
    root.add(fall);
  }

  /* ---- Low clouds drifting between the mountains ---- */
  const lowParts: BufferGeometry[] = [];
  for (let i = 0; i < (ctx.quality === 'high' ? 16 : 8); i++) {
    const a = rng.range(Math.PI * 0.85, Math.PI * 2.15);
    const d = rng.range(48, 110);
    const g = cloudGeometry(rng, 5, 7);
    g.scale(1.5, 1.1, 1.5);
    g.translate(Math.cos(a) * d, rng.range(-14, 4), Math.sin(a) * d);
    lowParts.push(g);
  }

  /* ---- Sea of clouds below ---- */
  const seaParts: BufferGeometry[] = [];
  for (let i = 0; i < (ctx.quality === 'high' ? 38 : 20); i++) {
    const a = rng.next() * Math.PI * 2;
    const dist = rng.range(30, 200);
    const g = cloudGeometry(rng, 5, 9);
    g.scale(2.2, 1.4, 2.2);
    g.translate(Math.cos(a) * dist, rng.range(-52, -40), Math.sin(a) * dist);
    seaParts.push(g);
  }
  const cloudMat = mat('#ffffff', {
    flat: true,
    roughness: 1,
    emissive: '#eef6fa',
    emissiveIntensity: 0.4,
  });
  const sea = new Mesh(mergeGeometries([...seaParts, ...lowParts])!, cloudMat);
  lowParts.forEach((p) => p.dispose());
  seaParts.forEach((p) => p.dispose());
  root.add(sea);

  /* ---- Drifting clouds ---- */
  const clouds: Mesh[] = [];
  for (let i = 0; i < (ctx.quality === 'high' ? 12 : 7); i++) {
    const cloud = new Mesh(cloudGeometry(rng, rng.int(4, 7), 5), cloudMat);
    const a = rng.range(Math.PI * 0.9, Math.PI * 2.1);
    const dist = rng.range(55, 150);
    cloud.position.set(Math.cos(a) * dist, rng.range(18, 45), Math.sin(a) * dist);
    cloud.userData['speed'] = rng.range(0.6, 1.4);
    cloud.userData['baseY'] = cloud.position.y;
    cloud.userData['phase'] = rng.next() * Math.PI * 2;
    clouds.push(cloud);
    root.add(cloud);
  }

  /* ---- Small floating islands ---- */
  const islands: Group[] = [];
  const grass = mat(PALETTE.grass, { flat: true });
  const rock = mat('#8a735e', { flat: true });
  const leaf = mat(PALETTE.leaf, { flat: true });
  const trunk = mat(PALETTE.trunk);
  const spots = [
    { a: 3.55, d: 78, y: 14, s: 1.3, house: true },
    { a: 4.35, d: 92, y: 26, s: 1.0, house: false },
    { a: 5.45, d: 84, y: 18, s: 1.2, house: true },
    { a: 6.05, d: 70, y: 6, s: 0.8, house: false },
    { a: 2.7, d: 88, y: 10, s: 0.9, house: false },
  ];
  for (const spot of spots.slice(0, ctx.quality === 'high' ? 5 : 3)) {
    const island = new Group();
    island.position.set(Math.cos(spot.a) * spot.d, spot.y, Math.sin(spot.a) * spot.d);
    island.scale.setScalar(spot.s);
    cyl(island, grass, 3.2, 0.7, [0, -0.7, 0], 9);
    add(island, geo.cone(8), rock, [0, -3, 0], [6.2, 4.6, 6.2], { rot: [Math.PI, 0, 0] });
    cyl(island, trunk, 0.18, 1.2, [1.2, 0, 0.6], 6);
    sphere(island, leaf, 1.1, [1.2, 1.7, 0.6]);
    if (spot.house) {
      add(island, geo.box(), mat(PALETTE.cream), [-0.8, 0.7, -0.3], [1.6, 1.4, 1.4]);
      cone(
        island,
        mat(PALETTE.roofRed, { flat: true }),
        1.35,
        1.1,
        [-0.8, 1.4, -0.3],
        4,
      ).rotation.y = Math.PI / 4;
    }
    // Tiny waterfall from some islands.
    if (spot.s >= 1.2) {
      const fall = new Mesh(new PlaneGeometry(0.7, 9), waterfallMaterial(streakTexture()));
      fall.position.set(0, -5, 3.15);
      island.add(fall);
    }
    island.userData['baseY'] = island.position.y;
    island.userData['phase'] = rng.next() * Math.PI * 2;
    islands.push(island);
    root.add(island);
  }

  const fallShaders: ShaderMaterial[] = [];
  root.traverse((o) => {
    const m = (o as Mesh).material as ShaderMaterial | undefined;
    if (m?.uniforms?.['uMap']) fallShaders.push(m);
  });

  return {
    root,
    update: (dt, t) => {
      if (ctx.reducedMotion()) return;
      const breeze = 0.45 + gust(t) * 0.9;
      for (const c of clouds) {
        const speed = c.userData['speed'] as number;
        const phase = c.userData['phase'] as number;
        c.position.x += dt * speed * breeze;
        if (c.position.x > 170) c.position.x = -170;
        // Bob and slowly "breathe"; shrink away near the edges so the wrap-around is invisible.
        c.position.y = (c.userData['baseY'] as number) + Math.sin(t * 0.13 + phase) * 1.6;
        const edge = Math.min(1, (170 - Math.abs(c.position.x)) / 30);
        const breath = 1 + Math.sin(t * 0.21 + phase * 1.7) * 0.06;
        c.scale.set(breath * edge, (2 - breath) * edge, breath * edge);
      }
      for (const island of islands) {
        const phase = island.userData['phase'] as number;
        island.position.y = island.userData['baseY'] + Math.sin(t * 0.5 + phase) * 0.8;
        // A gentle rock, slightly out of step with the bob.
        island.rotation.z = Math.sin(t * 0.37 + phase) * 0.03;
        island.rotation.x = Math.sin(t * 0.29 + phase * 1.3) * 0.025;
      }
      for (const s of fallShaders) s.uniforms['uTime'].value += dt;
    },
  };
}
