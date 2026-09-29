import { DoubleSide, Group, Mesh, MeshStandardMaterial, PlaneGeometry } from 'three';
import { box, cyl, gableRoof, sphere } from '../../utils/geometry';
import { PALETTE, glow, mat } from '../../utils/materials';
import { blueprintTexture, codeScreenTexture } from '../../utils/textures';
import { BuildContext, VillageObject } from '../../utils/types';
import {
  bookshelf,
  crateStack,
  holoScreen,
  kit,
  pegboard,
  plant,
  rug,
  workbench,
  workstation,
} from '../furniture';
import { barrel, crate, door, gear, smoke, textSign, windowPane } from '../props';
import { createReveal, hingedDoor, hollowRoom, revealPart } from '../reveal';

/** Workshop with screens, blueprints, spinning gears, a smoking chimney and a maker space inside. */
export function createWorkshop(ctx: BuildContext): VillageObject {
  const root = new Group();
  const plank = mat(PALETTE.wood);
  const dark = mat(PALETTE.woodDark);
  const stone = mat(PALETTE.stone, { flat: true });

  box(root, stone, [8.6, 0.5, 6], [0, 0, -0.6]);
  const front = revealPart(root, 'front', [0, 0.5, 2.1]);
  const walls = hollowRoom(root, front, plank, mat('#c9a06a'), [8, 3.6, 5.4], [0, 0.5, -0.6], {
    x: 0,
    w: 1.6,
    h: 2.4,
  });
  // Timber frame.
  for (const x of [-4, 4]) box(root, dark, [0.22, 3.6, 0.22], [x, 0.5, 2.12]);
  for (const x of [-1.3, 1.3]) box(front, dark, [0.22, 3.6, 0.22], [x, 0.5, 2.12]);
  box(front, dark, [8.2, 0.25, 0.25], [0, 3.9, 2.12]);
  const roof = revealPart(root, 'roof');
  gableRoof(roof, mat(PALETTE.roofBlue, { flat: true }), 8, 5.4, 2.3, 4.1, 0.6);
  box(roof, mat(PALETTE.roofSlate), [9.4, 0.25, 0.3], [0, 6.35, -0.6]);

  windowPane(front, 1.2, 1.1, [-2.7, 3.3, 2.16]);
  windowPane(front, 1.2, 1.1, [2.7, 3.3, 2.16]);
  hingedDoor(door(front, 1.6, 2.4, [0, 0.5, 2.16]));
  windowPane(walls.right, 1.1, 1.0, [4.02, 3.2, -0.6], Math.PI / 2);

  // Awning over the front workbench.
  const awning = box(roof, mat('#e0564b'), [5.2, 0.12, 2.2], [0, 3.35, 3.1]);
  awning.rotation.x = 0.28;
  for (const x of [-2.5, 2.5]) cyl(root, dark, 0.09, 3.1, [x, 0, 4.1], 6);

  // Inside: the maker's workshop.
  const room = revealPart(root, 'interior');
  kit(room, 'rugRectangle', [0.3, 0.545, -0.5], 0, (g) => rug(g, [0, 0, 0], 2.8, 2, '#4d6a8f'), {
    carpet: '#4d6a8f',
    carpetDarker: '#3a5070',
  });
  pegboard(room, [-1.5, 1.7, -3.07], 2.6);
  workbench(room, [-1.5, 0.5, -2.35]);
  workstation(room, [2.2, 0.5, -2.66], 0, 2, '#3d4660');
  kit(room, 'speaker', [3.45, 0.5, -2.75]);
  holoScreen(room, [0.3, 0.5, -0.5], 1.3, 0.85);
  crateStack(room, [-3.25, 0.5, 1.2], 0.3);
  kit(room, 'cardboardBoxOpen', [3.3, 0.5, 1.3], -0.3, (g) => crateStack(g, [0, 0, 0]));
  kit(room, 'pottedPlant', [3.35, 0.5, -0.9], 0, (g) => plant(g, [0, 0, 0], 0.9));
  bookshelf(room, [-3.55, 0.5, -0.3], Math.PI / 2, 1.4, 1.9);

  // Workbench with two glowing monitors and a keyboard.
  const bench = new Group();
  bench.position.set(-1.3, 0, 3.4);
  box(bench, plank, [2.8, 0.12, 1.1], [0, 1, 0]);
  for (const x of [-1.25, 1.25]) box(bench, dark, [0.12, 1, 1], [x, 0, 0]);
  for (const x of [-0.65, 0.65]) {
    box(bench, mat('#2b3245'), [0.95, 0.62, 0.08], [x, 1.35, -0.25]);
    box(bench, glow(PALETTE.screen, 1), [0.82, 0.5, 0.02], [x, 1.41, -0.2]);
    box(bench, mat('#2b3245'), [0.08, 0.25, 0.08], [x, 1.12, -0.28]);
  }
  box(bench, mat('#3d4660'), [1, 0.04, 0.3], [0, 1.12, 0.2]);
  // Floating holographic code screen above the workbench.
  const holo = new Mesh(
    new PlaneGeometry(2.3, 1.45),
    new MeshStandardMaterial({
      color: '#000000',
      emissive: '#ffffff',
      emissiveMap: codeScreenTexture(),
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.92,
      side: DoubleSide,
    }),
  );
  holo.position.set(0, 2.55, -0.2);
  holo.userData['dynamic'] = true;
  bench.add(holo);
  root.add(bench);

  // Blueprint easel.
  const easel = new Group();
  easel.position.set(2.4, 0, 3.6);
  easel.rotation.y = -0.35;
  for (const x of [-0.7, 0.7]) {
    const leg = box(easel, dark, [0.1, 2.6, 0.1], [x, 0, 0]);
    leg.rotation.x = -0.12;
  }
  const sheet = textSign(blueprintTexture(), 1.6, 1.2);
  sheet.position.set(0, 1.75, 0.2);
  sheet.rotation.x = -0.12;
  easel.add(sheet);
  root.add(easel);

  // Machine with spinning gears on the side wall.
  const bigGear = gear(walls.left, 0.9, [-4.15, 2.3, 0.2]);
  bigGear.rotation.y = Math.PI / 2;
  const smallGear = gear(walls.left, 0.55, [-4.15, 1.2, -1.2], '#b8b8c8');
  smallGear.rotation.y = Math.PI / 2;

  // Chimney + smoke.
  box(roof, mat(PALETTE.stoneDark, { flat: true }), [0.8, 2.2, 0.8], [2.6, 5, -1.8]);
  const puff = smoke(roof, [2.6, 7.4, -1.8], ctx);

  crate(root, [-4.2, 0.5, 3], 0.7, 0.3);
  crate(root, [-4.1, 1.2, 3], 0.55, -0.2);
  barrel(root, [4.5, 0.5, 2.8]);
  sphere(root, glow('#7fe0ff', 0.9), 0.14, [4.5, 1.6, 2.8]).userData['dynamic'] = true;

  return {
    root,
    reveal: createReveal(root, {
      light: [0, 3.2, -0.6],
      entrance: { outside: [0.55, 2.9], inside: [0.2, 1] },
    }),
    update: (dt, t) => {
      puff(dt, t);
      if (ctx.reducedMotion()) return;
      bigGear.rotation.x += dt * 0.8;
      holo.position.y = 2.55 + Math.sin(t * 1.6) * 0.08;
      smallGear.rotation.x -= dt * 1.3;
    },
  };
}
