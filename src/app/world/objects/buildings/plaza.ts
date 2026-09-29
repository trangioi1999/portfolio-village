import {
  CircleGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  QuadraticBezierCurve3,
  Shape,
  ShapeGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';
import { VIEW_AZIMUTH } from '../../../data/buildings.data';
import { PLAZA_RADIUS } from '../../layout';
import { box, cyl, sphere } from '../../utils/geometry';
import { PALETTE, glow, mat } from '../../utils/materials';
import { signTexture } from '../../utils/textures';
import { BuildContext, VillageObject } from '../../utils/types';
import { gust } from '../../utils/wind';
import { bench, lampPost, paperLantern, textSign } from '../props';
import { waterMaterial } from '../water';

/** Central plaza: fountain, lamps, benches, notice board and the floating motto sign. */
export function createPlaza(ctx: BuildContext): VillageObject {
  const root = new Group();
  const stone = mat(PALETTE.stone, { flat: true });
  const stoneDark = mat(PALETTE.stoneDark, { flat: true });

  // Fountain behind the avatar.
  const fountain = new Group();
  fountain.position.set(0, 0, -3.4);
  cyl(fountain, stoneDark, 2.3, 0.55, [0, 0, 0], 16);
  cyl(fountain, stone, 2.1, 0.08, [0, 0.55, 0], 16);
  const water = waterMaterial();
  const pool = new Mesh(new CircleGeometry(1.95, 24), water);
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.5;
  pool.userData['dynamic'] = true;
  fountain.add(pool);
  cyl(fountain, stone, 0.3, 1.5, [0, 0.5, 0], 8);
  cyl(fountain, stone, 0.9, 0.25, [0, 1.9, 0], 12, 1.4);
  cyl(fountain, stone, 0.14, 0.6, [0, 2.1, 0], 8);
  const top = sphere(fountain, glow('#9be7ff', 0.6), 0.28, [0, 2.85, 0]);
  top.userData['dynamic'] = true;
  root.add(fountain);

  // Water droplets arcing from the top bowl.
  const drops: Mesh[] = [];
  const dropMat = new MeshStandardMaterial({
    color: '#bdefff',
    emissive: '#7fd6ea',
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.85,
  });
  for (let i = 0; i < (ctx.quality === 'high' ? 16 : 8); i++) {
    const d = sphere(fountain, dropMat, 0.07, [0, 2.2, 0]);
    d.castShadow = false;
    d.userData['dynamic'] = true;
    d.userData['a'] = (i / 16) * Math.PI * 2;
    d.userData['phase'] = (i * 0.37) % 1;
    drops.push(d);
  }

  // Lamps around the plaza edge, placed between the paths.
  for (const a of [0.35, 1.25, 2.3, 3.55, 4.4, 5.3]) {
    lampPost(root, [Math.cos(a) * (PLAZA_RADIUS - 0.4), 0, Math.sin(a) * (PLAZA_RADIUS - 0.4)]);
  }
  // Festival pole rising from the fountain with bunting to every lamp post.
  const poleTop = new Vector3(0, 7.2, -3.4);
  cyl(root, mat(PALETTE.shrineRed), 0.12, 4.4, [0, 2.9, -3.4], 8);
  sphere(root, glow(PALETTE.gold, 0.8), 0.28, [0, 7.35, -3.4]);
  const flagColors = ['#e8483a', '#f7bf4f', '#4f8fd6', '#5fa447', '#ffffff', '#e0569b'];
  const flagMats = flagColors.map((c) => mat(c, { side: DoubleSide }));
  const rope = mat('#8a6440');
  const flagGeo = new ShapeGeometry(
    new Shape([new Vector2(-0.2, 0), new Vector2(0.2, 0), new Vector2(0, -0.42)]),
  );
  const hanging: Object3D[] = [];
  for (const a of [0.35, 1.25, 2.3, 3.55, 4.4, 5.3]) {
    const r = PLAZA_RADIUS - 0.4;
    const end = new Vector3(
      Math.cos(a) * r + 0.5 * Math.cos(a),
      2.1,
      Math.sin(a) * r + 0.5 * Math.sin(a),
    );
    const mid = poleTop.clone().lerp(end, 0.5);
    mid.y -= 0.9;
    const curve = new QuadraticBezierCurve3(poleTop, mid, end);
    const line = new Mesh(new TubeGeometry(curve, 16, 0.025, 4), rope);
    root.add(line);
    const n = 9;
    for (let k = 1; k < n; k++) {
      const p = curve.getPoint(k / n);
      const flag = new Mesh(flagGeo, flagMats[(k + Math.round(a * 3)) % flagMats.length]);
      flag.position.copy(p);
      flag.lookAt(p.x + Math.cos(a + Math.PI / 2), p.y, p.z + Math.sin(a + Math.PI / 2));
      flag.castShadow = true;
      root.add(flag);
    }
    const lantern = paperLantern(root, [mid.x, mid.y + 0.25 - 0.55, mid.z], 0.8);
    lantern.userData['dynamic'] = true;
    hanging.push(lantern);
  }

  bench(root, [-3.6, 0, -3.2], 0.7);
  bench(root, [3.6, 0, -3.2], -0.7);

  // Notice board "Explore · Build · Improve".
  const notice = new Group();
  notice.position.set(4.6, 0, 3.2);
  notice.rotation.y = -0.5;
  for (const x of [-0.9, 0.9]) cyl(notice, mat(PALETTE.woodDark), 0.08, 2.4, [x, 0, 0], 6);
  const board = textSign(
    signTexture(['Explore', 'Build', 'Improve'], {
      width: 512,
      height: 512,
      bg: '#fbf1dc',
      ink: '#26324f',
    }),
    1.5,
    1.5,
  );
  board.position.set(0, 1.55, 0.06);
  notice.add(board);
  root.add(notice);

  // Floating motto sign.
  const floating = new Group();
  floating.position.set(-4.4, 3.1, 3.4);
  floating.rotation.y = VIEW_AZIMUTH * 0.6;
  const sign = textSign(
    signTexture(['Build beautiful UI.', 'Create better experiences.']),
    3.8,
    1.42,
  );
  floating.add(sign);
  // Little leaf ornaments on the sign corners.
  for (const x of [-2, 2]) sphere(floating, mat(PALETTE.leaf, { flat: true }), 0.18, [x, 0.75, 0]);
  floating.userData['dynamic'] = true;
  root.add(floating);
  // Small glowing crystal holding the sign aloft.
  const pedestal = new Group();
  pedestal.position.set(-4.4, 0, 3.4);
  cyl(pedestal, stone, 0.45, 0.35, [0, 0, 0], 8);
  box(pedestal, glow('#8fe3d0', 0.7), [0.25, 0.8, 0.25], [0, 0.35, 0], Math.PI / 4);
  root.add(pedestal);

  return {
    root,
    update: (dt, t) => {
      const still = ctx.reducedMotion();
      water.uniforms['uTime'].value += dt * (still ? 0.15 : 1);
      floating.position.y = 3.1 + (still ? 0 : Math.sin(t * 1.2) * 0.18);
      const g = still ? 0 : gust(t);
      hanging.forEach(
        (l, i) =>
          (l.rotation.z = still ? 0 : g * 0.1 + Math.sin(t * 1.7 + i * 1.1) * (0.03 + g * 0.08)),
      );
      floating.rotation.z = still ? 0 : Math.sin(t * 0.8) * 0.03;
      for (const d of drops) {
        const k = still ? 0.35 : (t * 0.9 + d.userData['phase']) % 1;
        const r = 0.35 + k * 1.3;
        d.position.set(
          Math.cos(d.userData['a']) * r,
          2.2 + Math.sin(k * Math.PI) * 0.9 - k * 1.4,
          Math.sin(d.userData['a']) * r,
        );
      }
    },
  };
}
