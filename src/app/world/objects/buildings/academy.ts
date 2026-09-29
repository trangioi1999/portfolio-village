import { Group } from 'three';
import { box, cyl, pagodaRoof, sphere } from '../../utils/geometry';
import { PALETTE, glow, mat } from '../../utils/materials';
import { signTexture } from '../../utils/textures';
import { BuildContext, VillageObject } from '../../utils/types';
import { bookshelf, kit, plant, rug, schoolDesk, telescope, wallBoard } from '../furniture';
import { door, stoneLantern, textSign, windowPane } from '../props';
import { createReveal, hingedDoor, hollowRoom, revealPart } from '../reveal';

/** Two-storey academy with books, a globe, a floating magic book and a classroom inside. */
export function createAcademy(ctx: BuildContext): VillageObject {
  const root = new Group();
  const plaster = mat(PALETTE.cream);
  const frame = mat(PALETTE.woodDark);
  const roof = mat(PALETTE.roofTeal, { flat: true });
  const gold = mat(PALETTE.gold, { metalness: 0.5, roughness: 0.35 });
  const stone = mat(PALETTE.stone, { flat: true });

  box(root, stone, [8, 0.5, 6], [0, 0, -0.5]);
  const front = revealPart(root, 'front', [0, 0.5, 2]);
  hollowRoom(root, front, plaster, mat(PALETTE.wood), [7, 3.2, 5], [0, 0.5, -0.5], {
    x: 0,
    w: 1.5,
    h: 2.3,
  });
  for (const x of [-3.5, 3.5]) box(root, frame, [0.22, 3.2, 0.22], [x, 0.5, 2.02]);
  for (const x of [-1.2, 1.2]) box(front, frame, [0.22, 3.2, 0.22], [x, 0.5, 2.02]);
  // Upper storey and both roofs lift off together.
  const upper = revealPart(root, 'roof');
  box(upper, frame, [7.2, 0.25, 5.2], [0, 3.5, -0.5]);
  pagodaRoof(upper, roof, 7, 5, 1.4, 3.7, 1.2, gold);
  box(upper, plaster, [4.6, 2.4, 3.2], [0, 4.4, -0.5]);
  box(upper, frame, [4.8, 0.22, 3.4], [0, 6.6, -0.5]);
  pagodaRoof(upper, roof, 4.6, 3.2, 2.2, 6.8, 1.0, gold);
  sphere(upper, gold, 0.22, [0, 9.1, -0.5]);

  hingedDoor(door(front, 1.5, 2.3, [0, 0.5, 2.04], '#3f6f8a'));
  windowPane(front, 1.1, 1.2, [-2.35, 2.9, 2.04]);
  windowPane(front, 1.1, 1.2, [2.35, 2.9, 2.04]);
  // Round-ish upper window.
  cyl(upper, frame, 0.62, 0.1, [0, 5.6, 1.12], 12).rotation.x = Math.PI / 2;
  cyl(upper, glow(PALETTE.glass, 0.6), 0.5, 0.12, [0, 5.6, 1.16], 12).rotation.x = Math.PI / 2;

  // Inside: a little classroom.
  const room = revealPart(root, 'interior');
  wallBoard(
    room,
    [0, 3.25, -2.8],
    signTexture(['Keep learning!', 'English · AI · Angular'], {
      width: 768,
      height: 352,
      bg: '#2f4a3a',
      ink: '#f4f1e8',
    }),
    2.6,
    1.2,
  );
  for (const x of [-2.45, 2.45]) bookshelf(room, [x, 0.5, -2.55], 0, 1.5, 2.3);
  for (const [x, z] of [
    [-1.2, -1],
    [1.2, -1],
    [-1.2, 0.8],
    [1.2, 0.8],
  ])
    schoolDesk(room, [x, 0.5, z]);
  kit(room, 'rugRectangle', [0, 0.545, -0.1], 0, (g) => rug(g, [0, 0, 0], 3.4, 2, '#3f8f8a'), {
    carpet: '#3f8f8a',
    carpetDarker: '#2f6f6a',
  });
  telescope(room, [2.75, 0.5, 1.1], -0.6);
  kit(room, 'pottedPlant', [-2.85, 0.5, 1.3], 0, (g) => plant(g, [0, 0, 0], 0.9));
  kit(room, 'lampRoundFloor', [-2.95, 0.5, -1.6]);

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
  upper.add(book);
  box(book, mat('#7a5cc2'), [0.9, 0.14, 1.2], [0, 0, 0]);
  box(book, glow('#fff1b8', 0.8), [0.8, 0.06, 1.1], [0, 0.12, 0]);
  book.userData['dynamic'] = true;

  stoneLantern(root, [-3.9, 0, 4.2], 0.9);
  stoneLantern(root, [3.9, 0, 4.2], 0.9);

  return {
    root,
    reveal: createReveal(root, {
      light: [0, 3, -0.5],
      entrance: { outside: [0, 3.05], inside: [0, 1.2] },
    }),
    update: (dt, t) => {
      if (ctx.reducedMotion()) return;
      book.rotation.y += dt * 0.6;
      book.position.y = 10.4 + Math.sin(t * 1.4) * 0.25;
      globe.rotation.y += dt * 0.4;
    },
  };
}
