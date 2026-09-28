import {
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  ShaderMaterial,
} from 'three';
import { FARM, GROUND_EXTENT, POND, STREAM_END, rimRadius } from '../layout';
import { add, box, cone, cyl, geo, sphere } from '../utils/geometry';
import { PALETTE, mat } from '../utils/materials';
import { paintGround, streakTexture } from '../utils/textures';
import { BuildContext, VillageObject } from '../utils/types';
import { waterMaterial, waterfallMaterial } from './water';

const SEGMENTS = 120;

/** Floating island: painted grass top, layered rocky cliff, pond, stream and waterfall. */
export function createTerrain(ctx: BuildContext): VillageObject {
  const root = new Group();
  root.name = 'terrain';
  const { rng } = ctx;

  /* ---- Top surface (fan with irregular rim) ---- */
  const top = new CircleGeometry(1, SEGMENTS);
  const pos = top.getAttribute('position') as BufferAttribute;
  const uv = top.getAttribute('uv') as BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const r = Math.hypot(x, y);
    const a = Math.atan2(-y, x);
    const R = r > 0 ? rimRadius(a) : 0;
    const wx = x * R;
    const wz = -y * R;
    pos.setXYZ(i, wx, y * R, 0);
    uv.setXY(
      i,
      (wx + GROUND_EXTENT) / (GROUND_EXTENT * 2),
      1 - (wz + GROUND_EXTENT) / (GROUND_EXTENT * 2),
    );
  }
  top.rotateX(-Math.PI / 2);
  top.computeVertexNormals();
  const groundTexture = paintGround(ctx.quality === 'high' ? 2048 : 1024, rng);
  const ground = new Mesh(top, new MeshStandardMaterial({ map: groundTexture, roughness: 1 }));
  ground.receiveShadow = true;
  ground.name = 'ground';
  root.add(ground);

  /* ---- Cliff + underside (vertex-coloured rings) ---- */
  const rings = [
    { f: 1.0, y: 0.02, c: '#78bf4f' },
    { f: 1.02, y: -0.8, c: '#5ea83f' },
    { f: 0.99, y: -1.8, c: '#a87848' },
    { f: 0.94, y: -3.8, c: '#b88d5f' },
    { f: 0.87, y: -6.4, c: '#a48266' },
    { f: 0.77, y: -9.8, c: '#8f7a68' },
    { f: 0.63, y: -13.8, c: '#80705f' },
    { f: 0.47, y: -18.5, c: '#736455' },
    { f: 0.31, y: -23.5, c: '#66584b' },
    { f: 0.15, y: -28.5, c: '#5a4d42' },
    { f: 0.02, y: -33, c: '#4f4339' },
  ];
  const n = SEGMENTS / 2;
  const positions: number[] = [];
  const colors: number[] = [];
  const ringVerts = rings.map((ring, ri) =>
    Array.from({ length: n + 1 }, (_, i) => {
      const a = ((i % n) / n) * Math.PI * 2;
      const jitter = ri < 2 ? 0 : (rng.next() - 0.5) * 1.6 * ring.f;
      const r = rimRadius(a) * ring.f + jitter;
      const yj = ri < 2 ? 0 : (rng.next() - 0.5) * 0.9;
      return [Math.cos(a) * r, ring.y + yj, Math.sin(a) * r] as const;
    }),
  );
  // Make the seam watertight.
  ringVerts.forEach((ring) => (ring[n] = ring[0]));
  const color = new Color();
  for (let ri = 0; ri < rings.length - 1; ri++) {
    for (let i = 0; i < n; i++) {
      const a0 = ringVerts[ri][i];
      const a1 = ringVerts[ri][i + 1];
      const b0 = ringVerts[ri + 1][i];
      const b1 = ringVerts[ri + 1][i + 1];
      const tint = 0.9 + rng.next() * 0.2;
      for (const [v, c] of [
        [a0, rings[ri].c],
        [b0, rings[ri + 1].c],
        [a1, rings[ri].c],
        [a1, rings[ri].c],
        [b0, rings[ri + 1].c],
        [b1, rings[ri + 1].c],
      ] as const) {
        positions.push(...v);
        color.set(c).multiplyScalar(tint);
        colors.push(color.r, color.g, color.b);
      }
    }
  }
  const cliffGeo = new BufferGeometry();
  cliffGeo.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  cliffGeo.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
  cliffGeo.computeVertexNormals();
  const cliff = new Mesh(
    cliffGeo,
    mat('#ffffff', { vertexColors: true, flat: true, roughness: 0.95 }),
  );
  cliff.receiveShadow = true;
  cliff.name = 'cliff';
  root.add(cliff);

  // Hanging vines along the rim.
  const vineMat = mat(PALETTE.leafDark, { flat: true });
  for (let i = 0; i < 60; i++) {
    const a = rng.next() * Math.PI * 2;
    const r = rimRadius(a) * 1.01;
    const len = rng.range(1.2, 4.4);
    const vine = add(
      root,
      geo.cone(4),
      vineMat,
      [Math.cos(a) * r, -len / 2 - 0.3, Math.sin(a) * r],
      [0.35, len, 0.35],
      {
        rot: [Math.PI, 0, 0],
        cast: false,
      },
    );
    vine.name = 'vine';
  }

  /* ---- Pond + stream + waterfall ---- */
  const water = waterMaterial();
  const pond = new Mesh(new CircleGeometry(POND.r, 40), water);
  pond.rotation.x = -Math.PI / 2;
  pond.scale.set(1.15, 0.95, 1);
  pond.rotation.z = 0.3;
  pond.position.set(POND.x, 0.06, POND.z);
  root.add(pond);

  const streamLen = Math.hypot(STREAM_END.x - POND.x, STREAM_END.z - POND.z) + 0.4;
  const stream = new Mesh(new PlaneGeometry(streamLen, 2.1), water);
  stream.rotation.x = -Math.PI / 2;
  const angle = Math.atan2(STREAM_END.z - POND.z, STREAM_END.x - POND.x);
  stream.rotation.z = -angle;
  stream.position.set(
    POND.x + Math.cos(angle) * (streamLen / 2),
    0.07,
    POND.z + Math.sin(angle) * (streamLen / 2),
  );
  root.add(stream);

  const fallAngle = Math.atan2(STREAM_END.z, STREAM_END.x);
  const fallR = rimRadius(fallAngle) + 0.15;
  const fall = new Mesh(new PlaneGeometry(2.3, 34, 1, 1), waterfallMaterial(streakTexture()));
  fall.position.set(Math.cos(fallAngle) * fallR, -16.9, Math.sin(fallAngle) * fallR);
  fall.rotation.y = -fallAngle + Math.PI / 2;
  root.add(fall);

  // Rocks around the pond and a little wooden dock.
  const rock = mat(PALETTE.stone, { flat: true });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rng.next() * 0.3;
    if (Math.abs(a - (Math.PI * 2 + angle)) < 0.5 || Math.abs(a - angle) < 0.5) continue;
    add(
      root,
      geo.ico(0),
      rock,
      [POND.x + Math.cos(a) * (POND.r + 0.7), 0.15, POND.z + Math.sin(a) * (POND.r * 0.9 + 0.5)],
      [rng.range(0.5, 0.9), rng.range(0.35, 0.6), rng.range(0.5, 0.9)],
    );
  }
  const plank = mat(PALETTE.wood);
  const dock = new Group();
  dock.position.set(POND.x - 2.4, 0, POND.z + 2.2);
  dock.rotation.y = 0.9;
  box(dock, plank, [1.6, 0.14, 3.2], [0, 0.28, 0]);
  for (const [x, z] of [
    [-0.7, -1.4],
    [0.7, -1.4],
    [-0.7, 1.4],
    [0.7, 1.4],
  ])
    cyl(dock, mat(PALETTE.woodDark), 0.1, 0.5, [x, 0, z]);
  root.add(dock);
  // Little boat.
  const boat = new Group();
  boat.position.set(POND.x + 0.8, 0.1, POND.z + 0.6);
  boat.rotation.y = 0.5;
  box(boat, mat('#a0633a'), [0.9, 0.3, 1.8], [0, 0, 0]);
  box(boat, mat(PALETTE.cream), [0.7, 0.05, 1.5], [0, 0.26, 0]);
  boat.userData['dynamic'] = true;
  root.add(boat);

  /* ---- Farm crops (cozy farming corner) ---- */
  const crop = mat('#6cc04a', { flat: true });
  const pumpkin = mat('#f09a3e', { flat: true });
  for (let row = 0; row < 5; row++) {
    for (let i = 0; i < 6; i++) {
      const x = FARM.x - FARM.w / 2 + 0.6 + i * ((FARM.w - 1.2) / 5);
      const z = FARM.z - FARM.d / 2 + 0.64 + row * 0.95;
      if (row === 2 && i % 2 === 0) sphere(root, pumpkin, 0.22, [x, 0.18, z], [1, 0.75, 1]);
      else cone(root, crop, 0.2, rng.range(0.35, 0.6), [x, 0, z], 5);
    }
  }
  // Fence around the farm.
  const fence = mat(PALETTE.wood);
  const fx = FARM.w / 2 + 0.4;
  const fz = FARM.d / 2 + 0.4;
  for (const [x0, z0, x1, z1] of [
    [-fx, -fz, fx, -fz],
    [fx, -fz, fx, fz],
    [fx, fz, -fx + 1.6, fz],
    [-fx, fz, -fx, -fz],
  ]) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const posts = Math.ceil(len / 1.2);
    for (let p = 0; p <= posts; p++) {
      const t = p / posts;
      cyl(root, fence, 0.07, 0.8, [FARM.x + x0 + (x1 - x0) * t, 0, FARM.z + z0 + (z1 - z0) * t], 5);
    }
    const rail = box(
      root,
      fence,
      [len, 0.08, 0.08],
      [FARM.x + (x0 + x1) / 2, 0.55, FARM.z + (z0 + z1) / 2],
    );
    rail.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
  }

  // Extra cliff waterfalls (springs at the rim), like in the concept art.
  const extraFalls: ShaderMaterial[] = [];
  const mistMat = new MeshStandardMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.5,
    roughness: 1,
    depthWrite: false,
  });
  for (const [a, w, h] of [
    [2.45, 2, 28],
    [3.5, 1.6, 24],
    [0.55, 1.4, 20],
  ] as const) {
    const r = rimRadius(a) + 0.2;
    const m = waterfallMaterial(streakTexture());
    extraFalls.push(m);
    const f = new Mesh(new PlaneGeometry(w, h), m);
    f.position.set(Math.cos(a) * r, -h / 2 + 0.3, Math.sin(a) * r);
    f.rotation.y = -a + Math.PI / 2;
    root.add(f);
    // Spring rocks + a small pool at the top.
    for (let k = 0; k < 4; k++) {
      const ra = a + (k - 1.5) * 0.05;
      add(
        root,
        geo.ico(0),
        rock,
        [Math.cos(ra) * (r - 1.4), 0.2, Math.sin(ra) * (r - 1.4)],
        [rng.range(0.6, 1), rng.range(0.4, 0.7), rng.range(0.6, 1)],
      );
    }
    const pool = new Mesh(new CircleGeometry(1.1, 16), water);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(Math.cos(a) * (r - 1.2), 0.06, Math.sin(a) * (r - 1.2));
    root.add(pool);
    // Mist puffs at the lip.
    for (let k = 0; k < 3; k++) {
      const puff = new Mesh(geo.ico(1), mistMat);
      puff.position.set(Math.cos(a) * (r + 0.4), -1 - k * 1.4, Math.sin(a) * (r + 0.4));
      puff.scale.setScalar(1.2 + k * 0.5);
      puff.userData['dynamic'] = true;
      root.add(puff);
    }
  }

  const shaders = [water, fall.material as ShaderMaterial, ...extraFalls];
  return {
    root,
    update: (dt, t) => {
      const speed = ctx.reducedMotion() ? 0.15 : 1;
      for (const s of shaders) s.uniforms['uTime'].value += dt * speed;
      boat.position.y = 0.1 + Math.sin(t * 1.3) * 0.04 * speed;
      boat.rotation.z = Math.sin(t * 0.9) * 0.05 * speed;
    },
  };
}
