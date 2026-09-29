import { Group } from 'three';
import { box, cone, cyl, gableRoof, sphere } from '../../utils/geometry';
import { PALETTE, glow, mat } from '../../utils/materials';
import { BuildContext, VillageObject } from '../../utils/types';
import { approach, gust } from '../../utils/wind';
import {
  bed,
  bookshelf,
  fireplace,
  floorLamp,
  kit,
  plant,
  rug,
  wallFrame,
  workstation,
} from '../furniture';
import { barrel, bench, door, flowerPot, smoke, windowPane } from '../props';
import { createReveal, hingedDoor, hollowRoom, revealPart } from '../reveal';

/** Cozy cottage with a chimney, flower boxes, a porch, a little windmill and a bedroom inside. */
export function createAboutHouse(ctx: BuildContext): VillageObject {
  const root = new Group();
  const wall = mat('#f7e3c0');
  const frame = mat(PALETTE.woodDark);
  const stone = mat(PALETTE.stoneDark, { flat: true });

  box(root, stone, [6.6, 0.6, 5.2], [0, 0, 0]);
  const front = revealPart(root, 'front', [0, 0.6, 2.3]);
  const walls = hollowRoom(root, front, wall, mat(PALETTE.wood), [6, 3, 4.6], [0, 0.6, 0], {
    x: 0.9,
    w: 1.2,
    h: 2.1,
  });
  for (const x of [-3, 3])
    for (const z of [-2.3, 2.3]) box(root, frame, [0.22, 3, 0.22], [x, 0.6, z]);
  box(front, frame, [6.2, 0.22, 0.22], [0, 3.4, 2.32]);

  const roof = revealPart(root, 'roof');
  gableRoof(roof, mat(PALETTE.roofOrange, { flat: true }), 6, 4.6, 2.4, 3.6, 0.6);
  box(roof, mat('#b85f2c'), [7.3, 0.22, 0.3], [0, 5.9, 0]);

  hingedDoor(door(front, 1.2, 2.1, [0.9, 0.6, 2.32], '#b0452f'));
  windowPane(front, 1.1, 1.0, [-1.6, 2.7, 2.32]);
  windowPane(walls.right, 1, 1, [3.02, 2.7, 0], Math.PI / 2);
  // Flower box under the window.
  box(front, mat(PALETTE.wood), [1.3, 0.3, 0.35], [-1.6, 1.3, 2.5]);
  for (let i = 0; i < 4; i++)
    sphere(front, mat(['#ff8fb1', '#ffd24d', '#ffffff', '#ff6b5b'][i], { flat: true }), 0.14, [
      -2.05 + i * 0.3,
      1.72,
      2.52,
    ]);

  // Porch roof.
  const porch = box(
    roof,
    mat(PALETTE.roofOrange, { flat: true }),
    [2, 0.12, 1.2],
    [0.9, 2.95, 2.9],
  );
  porch.rotation.x = 0.3;
  for (const x of [0.1, 1.7]) cyl(root, frame, 0.07, 2.9, [x, 0.6, 3.4], 6);

  // Chimney with smoke.
  box(roof, stone, [0.75, 2.2, 0.75], [-1.9, 4.6, -1.1]);
  const puff = smoke(roof, [-1.9, 7, -1.1], ctx);

  // Inside: a cosy bedroom-study.
  const room = revealPart(root, 'interior');
  kit(room, 'rugRectangle', [-0.5, 0.645, 0.5], 0, (g) => rug(g, [0, 0, 0], 2.4, 1.8, '#3f8f8a'), {
    carpet: '#3f8f8a',
    carpetDarker: '#2f6f6a',
  });
  fireplace(room, [-1.6, 0.6, -1.85]);
  bookshelf(room, [0.15, 0.6, -1.88], 0, 1, 2);
  kit(room, 'bedDouble', [1.7, 0.6, -0.85], 0, (g) => bed(g, [0, 0, 0], 0, '#4f8fd6'), {
    carpet: '#4f8fd6',
  });
  workstation(room, [-2.35, 0.6, 0.8], Math.PI / 2, 1, '#3f8f8a');
  kit(room, 'lampRoundFloor', [-2.5, 0.6, -1.2], 0, (g) => floorLamp(g, [0, 0, 0]));
  kit(room, 'loungeChair', [2, 0.6, 1], -Math.PI / 2 - 0.5, undefined, { carpet: '#f2b23a' });
  kit(room, 'pottedPlant', [-0.9, 0.6, 1.8], 0, (g) => plant(g, [0, 0, 0], 0.9));
  wallFrame(room, [1.9, 2.4, -2.1], 0.8, 0.6, '#9fd3e6');

  bench(root, [-1.8, 0.6, 3.4], 0);
  barrel(root, [-3.6, 0, 2]);
  flowerPot(root, [1.9, 0.6, 3.2], '#b58cff');
  flowerPot(root, [-0.2, 0.6, 3.2], '#ff8fb1');

  // Mini windmill beside the house.
  const mill = new Group();
  mill.position.set(4.6, 0, -1.4);
  cyl(mill, mat(PALETTE.cream), 0.75, 4.2, [0, 0, 0], 8, 0.7);
  cone(mill, mat(PALETTE.roofRed, { flat: true }), 0.75, 1, [0, 4.2, 0], 8);
  const blades = new Group();
  blades.position.set(0, 3.6, 0.65);
  for (let i = 0; i < 4; i++) {
    const blade = new Group();
    blade.rotation.z = (i / 4) * Math.PI * 2;
    box(blade, mat(PALETTE.wood), [0.12, 1.9, 0.06], [0, 0, 0]);
    box(blade, mat(PALETTE.paper), [0.5, 1.5, 0.04], [0.3, 0.35, 0]);
    blades.add(blade);
  }
  sphere(blades, glow(PALETTE.gold, 0.2), 0.16, [0, 0, 0.05]);
  blades.userData['dynamic'] = true;
  mill.add(blades);
  root.add(mill);

  // The windmill has inertia: it spins up in a gust and coasts down when the air calms.
  let spin = 0.9;
  return {
    root,
    reveal: createReveal(root, {
      light: [0, 2.8, 0],
      entrance: { outside: [0.9, 3.4], inside: [0.9, 1.4] },
    }),
    update: (dt, t) => {
      puff(dt, t);
      if (ctx.reducedMotion()) return;
      spin = approach(spin, 0.35 + gust(t) * 2.2, 0.6, dt);
      blades.rotation.z -= dt * spin;
    },
  };
}
