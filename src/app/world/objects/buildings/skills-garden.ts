import { AdditiveBlending, Group, OctahedronGeometry, Sprite, SpriteMaterial } from 'three';
import { SKILL_GROUPS } from '../../../data/skills.data';
import { add, box, cyl, sphere } from '../../utils/geometry';
import { PALETTE, mat } from '../../utils/materials';
import { glowTexture, techBoardTexture } from '../../utils/textures';
import { BuildContext, VillageObject } from '../../utils/types';
import { flowerPot, textSign } from '../props';

/** Magical garden — one glowing crystal per skill family around a central core crystal. */
export function createSkillsGarden(ctx: BuildContext): VillageObject {
  const root = new Group();
  const stone = mat(PALETTE.stone, { flat: true });
  const hedge = mat(PALETTE.leafDark, { flat: true });
  const wood = mat(PALETTE.wood);

  // Low hedge border with an opening at the front.
  const W = 11;
  const D = 9;
  box(root, hedge, [W, 0.8, 0.7], [0, 0, -D / 2]);
  box(root, hedge, [0.7, 0.8, D], [-W / 2, 0, 0]);
  box(root, hedge, [0.7, 0.8, D], [W / 2, 0, 0]);
  box(root, hedge, [3.8, 0.8, 0.7], [-3.6, 0, D / 2]);
  box(root, hedge, [3.8, 0.8, 0.7], [3.6, 0, D / 2]);

  // Wooden arch with vines.
  for (const x of [-1.6, 1.6]) box(root, wood, [0.3, 3.2, 0.3], [x, 0, D / 2]);
  box(root, wood, [3.8, 0.3, 0.5], [0, 3.2, D / 2]);
  box(root, wood, [4.2, 0.18, 0.7], [0, 3.5, D / 2]);
  for (let i = 0; i < 9; i++) {
    sphere(root, mat(i % 3 ? PALETTE.leaf : '#f4a6bf', { flat: true }), 0.22, [
      -1.9 + i * 0.48,
      3.45 + Math.sin(i) * 0.15,
      D / 2 + 0.3,
    ]);
  }

  // Stepping stones.
  for (let i = 0; i < 4; i++)
    cyl(root, stone, 0.45, 0.08, [Math.sin(i) * 0.3, 0, D / 2 - 0.8 - i * 1.1], 7);

  // Crystals.
  const glowTex = glowTexture();
  const crystalGeo = new OctahedronGeometry(0.5, 0);
  const crystals: { obj: Group; phase: number; baseY: number }[] = [];
  const makeCrystal = (color: string, x: number, z: number, s: number) => {
    const pedestal = new Group();
    pedestal.position.set(x, 0, z);
    cyl(pedestal, stone, 0.55 * s, 0.5, [0, 0, 0], 7);
    cyl(pedestal, stone, 0.4 * s, 0.2, [0, 0.5, 0], 7);
    root.add(pedestal);
    const c = new Group();
    c.position.set(x, 1.6 * s, z);
    const m = mat(color, { emissive: color, emissiveIntensity: 0.75, roughness: 0.25, flat: true });
    add(c, crystalGeo, m, [0, 0, 0], [0.7 * s, 1.6 * s, 0.7 * s]);
    add(c, crystalGeo, m, [0.3 * s, -0.35 * s, 0.1], [0.3 * s, 0.7 * s, 0.3 * s], {
      rot: [0, 0, -0.5],
    });
    add(c, crystalGeo, m, [-0.28 * s, -0.4 * s, -0.1], [0.28 * s, 0.6 * s, 0.28 * s], {
      rot: [0, 0, 0.6],
    });
    const halo = new Sprite(
      new SpriteMaterial({
        map: glowTex,
        color,
        blending: AdditiveBlending,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    halo.scale.setScalar(2.6 * s);
    c.add(halo);
    c.userData['dynamic'] = true;
    root.add(c);
    crystals.push({ obj: c, phase: x + z, baseY: 1.6 * s });
  };
  SKILL_GROUPS.forEach((group, i) => {
    const a = (i / SKILL_GROUPS.length) * Math.PI * 2 + Math.PI / 8;
    makeCrystal(group.color, Math.cos(a) * 3.3, Math.sin(a) * 2.6 - 0.2, 0.8);
  });
  makeCrystal('#fff1b8', 0, -0.2, 1.15);

  // Tech logo board at the back of the garden (like the concept art).
  const board = new Group();
  board.position.set(0, 0, -D / 2 - 0.2);
  for (const x of [-2.75, 2.75]) box(board, wood, [0.25, 3.8, 0.25], [x, 0, -0.1]);
  box(board, mat(PALETTE.roofTeal, { flat: true }), [6.2, 0.3, 0.9], [0, 3.8, 0]);
  const logos = textSign(
    techBoardTexture([
      'angular',
      'typescript',
      'tailwindcss',
      'rxjs',
      'firebase',
      'git',
      'docker',
      'nodejs',
    ]),
    5.2,
    2.68,
  );
  logos.position.set(0, 2.25, 0.05);
  board.add(logos);
  root.add(board);

  // Flower pots and bushes around the border.
  const colors = ['#ff8fb1', '#ffd24d', '#b58cff', '#ffffff'];
  for (let i = 0; i < 6; i++)
    flowerPot(root, [-4.6 + i * 1.84, 0, -3.6], colors[i % colors.length]);
  for (const [x, z] of [
    [-4.6, 3.4],
    [4.6, 3.4],
    [-4.7, 0],
    [4.7, 0],
  ])
    sphere(root, hedge, 0.6, [x, 0.5, z]);

  return {
    root,
    update: (dt, t) => {
      if (ctx.reducedMotion()) return;
      for (const c of crystals) {
        c.obj.rotation.y += dt * 0.5;
        c.obj.position.y = c.baseY + Math.sin(t * 1.5 + c.phase) * 0.12;
      }
    },
  };
}
