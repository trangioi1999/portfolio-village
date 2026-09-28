import { Group } from 'three';
import { box, cyl, pagodaRoof, sphere } from '../../utils/geometry';
import { PALETTE, glow, mat } from '../../utils/materials';
import { signTexture } from '../../utils/textures';
import { BuildContext, VillageObject } from '../../utils/types';
import { door, stoneLantern, textSign, windowPane } from '../props';

/** Two-storey academy with books, a study table, a globe and a floating magic book. */
export function createAcademy(ctx: BuildContext): VillageObject {
  const root = new Group();
  const plaster = mat(PALETTE.cream);
  const frame = mat(PALETTE.woodDark);
  const roof = mat(PALETTE.roofTeal, { flat: true });
  const gold = mat(PALETTE.gold, { metalness: 0.5, roughness: 0.35 });
  const stone = mat(PALETTE.stone, { flat: true });

  box(root, stone, [8, 0.5, 6], [0, 0, -0.5]);
  box(root, plaster, [7, 3.2, 5], [0, 0.5, -0.5]);
  for (const x of [-3.5, -1.2, 1.2, 3.5]) box(root, frame, [0.22, 3.2, 0.22], [x, 0.5, 2.02]);
  box(root, frame, [7.2, 0.25, 5.2], [0, 3.5, -0.5]);
  pagodaRoof(root, roof, 7, 5, 1.4, 3.7, 1.2, gold);
  box(root, plaster, [4.6, 2.4, 3.2], [0, 4.4, -0.5]);
  box(root, frame, [4.8, 0.22, 3.4], [0, 6.6, -0.5]);
  pagodaRoof(root, roof, 4.6, 3.2, 2.2, 6.8, 1.0, gold);
  sphere(root, gold, 0.22, [0, 9.1, -0.5]);

  door(root, 1.5, 2.3, [0, 0.5, 2.04], '#3f6f8a');
  windowPane(root, 1.1, 1.2, [-2.35, 2.9, 2.04]);
  windowPane(root, 1.1, 1.2, [2.35, 2.9, 2.04]);
  // Round-ish upper window.
  cyl(root, frame, 0.62, 0.1, [0, 5.6, 1.12], 12).rotation.x = Math.PI / 2;
  cyl(root, glow(PALETTE.glass, 0.6), 0.5, 0.12, [0, 5.6, 1.16], 12).rotation.x = Math.PI / 2;

  // Study table with open book and scroll.
  const table = new Group();
  table.position.set(-2.4, 0, 3.4);
  box(table, mat(PALETTE.wood), [2, 0.12, 1], [0, 0.85, 0]);
  for (const x of [-0.85, 0.85]) box(table, frame, [0.12, 0.85, 0.85], [x, 0, 0]);
  const pageL = box(table, mat(PALETTE.paper), [0.5, 0.04, 0.65], [-0.25, 0.98, 0]);
  pageL.rotation.z = 0.12;
  const pageR = box(table, mat(PALETTE.paper), [0.5, 0.04, 0.65], [0.25, 0.98, 0]);
  pageR.rotation.z = -0.12;
  cyl(table, mat('#f3e2bf'), 0.08, 0.8, [0.7, 1.05, 0.1], 8).rotation.z = Math.PI / 2;
  root.add(table);

  // Stacks of books.
  const bookColors = ['#d65a4a', '#4f8fd6', '#5fa447', '#f2b23a', '#7a5cc2'];
  for (let s = 0; s < 2; s++) {
    for (let i = 0; i < 5; i++) {
      box(
        root,
        mat(bookColors[(i + s) % bookColors.length]),
        [0.8, 0.18, 0.55],
        [2.4 + s * 1.1, i * 0.18, 3.1 + s * 0.2],
        i * 0.2,
      );
    }
  }
  // Globe (English & the wider world).
  const globe = new Group();
  globe.position.set(3.4, 0, 1.2);
  cyl(globe, frame, 0.25, 0.9, [0, 0, 0], 8);
  sphere(globe, mat('#5ec4e6', { flat: true }), 0.42, [0, 1.3, 0]);
  sphere(globe, mat(PALETTE.leaf, { flat: true }), 0.2, [0.22, 1.42, 0.22]);
  globe.userData['dynamic'] = true;
  root.add(globe);

  // Chalkboard sign.
  const board = textSign(
    signTexture(['English · TOEIC', 'Keep learning!'], {
      width: 768,
      height: 384,
      bg: '#2f4a3a',
      ink: '#f4f1e8',
    }),
    1.8,
    0.9,
  );
  board.position.set(1.3, 1.3, 3.6);
  board.rotation.y = -0.3;
  root.add(board);
  for (const x of [0.55, 2.05]) cyl(root, frame, 0.06, 1.3, [x, 0, 3.6 + (x - 1.3) * 0.3], 5);

  // Floating magic book.
  const book = new Group();
  book.position.set(0, 10.4, -0.5);
  box(book, mat('#7a5cc2'), [0.9, 0.14, 1.2], [0, 0, 0]);
  box(book, glow('#fff1b8', 0.8), [0.8, 0.06, 1.1], [0, 0.12, 0]);
  book.userData['dynamic'] = true;
  root.add(book);

  stoneLantern(root, [-3.9, 0, 4.2], 0.9);
  stoneLantern(root, [3.9, 0, 4.2], 0.9);

  return {
    root,
    update: (dt, t) => {
      if (ctx.reducedMotion()) return;
      book.rotation.y += dt * 0.6;
      book.position.y = 10.4 + Math.sin(t * 1.4) * 0.25;
      globe.rotation.y += dt * 0.4;
    },
  };
}
