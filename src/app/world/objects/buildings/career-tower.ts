import { Group, Object3D } from 'three';
import { box, cone, cyl, pagodaRoof, sphere } from '../../utils/geometry';
import { PALETTE, glow, mat } from '../../utils/materials';
import { BuildContext, VillageObject } from '../../utils/types';
import { door, lampPost, paperLantern, textSign, windowPane } from '../props';
import { plaqueTexture } from '../../utils/textures';

/** Bottom floor = first job; top floor = current company (from the CV). */
const FLOORS = [
  { name: 'NATA', years: '2021 – 2022' },
  { name: 'GSOFT', years: '2022 – 2023' },
  { name: 'FPT IS', years: '2023 – Now' },
];

/** Tall wooden tower — one floor per company, newest on top. */
export function createCareerTower(ctx: BuildContext): VillageObject {
  const root = new Group();
  const plaster = mat(PALETTE.plaster);
  const post = mat(PALETTE.woodDark);
  const beam = mat('#8e3b2c');
  const roof = mat(PALETTE.roofRed, { flat: true });
  const gold = mat(PALETTE.gold, { metalness: 0.5, roughness: 0.35 });
  const stone = mat(PALETTE.stone, { flat: true });
  const lanterns: Object3D[] = [];

  // Stone base with front steps.
  box(root, stone, [9.2, 0.8, 9.2], [0, 0, 0]);
  for (let i = 0; i < 3; i++) box(root, stone, [3.2, 0.27 * (3 - i), 0.6], [0, 0, 4.9 + i * 0.6]);

  const floors = [
    { w: 7, h: 3.4 },
    { w: 5.8, h: 3.0 },
    { w: 4.7, h: 2.8 },
  ];
  let y = 0.8;
  floors.forEach((f, i) => {
    box(root, plaster, [f.w, f.h, f.w], [0, y, 0]);
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) cyl(root, post, 0.2, f.h, [(sx * f.w) / 2, y, (sz * f.w) / 2], 6);
    box(root, beam, [f.w + 0.3, 0.35, f.w + 0.3], [0, y + f.h - 0.35, 0]);
    box(root, post, [f.w + 0.2, 0.2, f.w + 0.2], [0, y, 0]);
    // Windows: two at the front, one on each side.
    const wy = y + f.h - 0.75;
    const half = f.w / 2 + 0.03;
    const count = i === 0 ? 0 : 2;
    for (let k = 0; k < count; k++) windowPane(root, 0.8, 1.1, [(k - 0.5) * 1.8, wy, half]);
    windowPane(root, 0.8, 1.1, [half, wy, 0], Math.PI / 2);
    windowPane(root, 0.8, 1.1, [-half, wy, 0], -Math.PI / 2);
    windowPane(root, 0.8, 1.1, [0, wy, -half], Math.PI);
    // Company plaque on each floor (bottom = first job, top = current).
    const plaque = textSign(plaqueTexture(FLOORS[i].name, FLOORS[i].years), 2.3, 0.86);
    plaque.position.set(0, i === 0 ? y + f.h - 0.58 : y + f.h - 2.35, half + 0.08);
    root.add(plaque);
    // Red paper lanterns hanging from the front eaves.
    for (const sx of [-1, 1]) {
      const lantern = paperLantern(
        root,
        [sx * (f.w / 2 + 0.75), y + f.h - 0.25, half + 0.75],
        0.85,
      );
      lantern.userData['dynamic'] = true;
      lanterns.push(lantern);
    }
    // Balcony railing on upper floors.
    if (i > 0) {
      const rw = f.w + 1.3;
      for (const [x, z, w, d] of [
        [0, rw / 2, rw, 0.1],
        [0, -rw / 2, rw, 0.1],
        [rw / 2, 0, 0.1, rw],
        [-rw / 2, 0, 0.1, rw],
      ])
        box(root, post, [w, 0.08, d], [x, y + 0.55, z]);
    }
    const roofH = i === floors.length - 1 ? 2.6 : 1.5;
    pagodaRoof(root, roof, f.w, f.w, roofH, y + f.h, i === floors.length - 1 ? 1.1 : 1.3, gold);
    y += f.h + (i === floors.length - 1 ? 0 : 0.55);
  });

  door(root, 1.5, 2.3, [0, 0.8, floors[0].w / 2 + 0.02], '#8e3b2c');
  // Red banners either side of the door.
  for (const x of [-1.9, 1.9])
    box(root, mat(PALETTE.shrineRed), [0.5, 1.8, 0.06], [x, 1.4, floors[0].w / 2 + 0.06]);

  // Spire with a glowing orb and a waving flag.
  const top = y + 2.3;
  cyl(root, post, 0.08, 2.4, [0, top - 0.6, 0], 6);
  const orb = sphere(root, glow('#ffe39a', 1.2), 0.32, [0, top + 1.9, 0]);
  orb.userData['dynamic'] = true;
  const flag = new Group();
  flag.position.set(0.05, top + 1.2, 0);
  box(flag, mat(PALETTE.leaf), [1.1, 0.6, 0.04], [0.55, -0.3, 0]);
  flag.userData['dynamic'] = true;
  root.add(flag);
  cone(root, gold, 0.12, 0.4, [0, top + 2.15, 0], 6);

  lampPost(root, [-3.6, 0.8, 5.2]);
  lampPost(root, [3.6, 0.8, 5.2]);

  return {
    root,
    update: (_dt, t) => {
      if (ctx.reducedMotion()) return;
      flag.rotation.y = Math.sin(t * 2.2) * 0.35;
      lanterns.forEach((l, i) => (l.rotation.z = Math.sin(t * 1.5 + i) * 0.08));
      orb.position.y = top + 1.9 + Math.sin(t * 1.6) * 0.1;
    },
  };
}
