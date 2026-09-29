import { Group, Object3D } from 'three';
import { box, cone, cyl, pagodaRoof, sphere } from '../../utils/geometry';
import { PALETTE, glow, mat } from '../../utils/materials';
import { BuildContext, VillageObject } from '../../utils/types';
import { bookshelf, kit, plant, trophy, wallBoard, workstation } from '../furniture';
import { door, lampPost, paperLantern, textSign, windowPane } from '../props';
import { createReveal, hingedDoor, hollowRoom, revealPart } from '../reveal';
import { plaqueTexture } from '../../utils/textures';

/** Bottom floor = first job; top floor = current company (from the CV). */
const FLOORS = [
  { name: 'NATA', years: '2021 – 2022' },
  { name: 'GSOFT', years: '2022 – 2023' },
  { name: 'FPT IS', years: '2023 – Now' },
];

/**
 * Tall wooden tower — one floor (and one office inside) per company, newest on top.
 * When entered, the storeys pull apart so every office can be seen at once.
 */
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
  const last = floors.length - 1;
  let y = 0.8;
  // Each storey is its own group so the reveal can pull the tower apart like a layer cake.
  const caps: Object3D[] = [];
  floors.forEach((f, i) => {
    const storey = revealPart(root, 'floor');
    storey.parent!.userData['lift'] = i * 2.4;
    const front = revealPart(storey, 'front', [0, y + 0.2, f.w / 2]);
    const walls = hollowRoom(
      storey,
      front,
      plaster,
      mat(PALETTE.wood),
      [f.w, f.h, f.w],
      [0, y, 0],
      i === 0 ? { x: 0, w: 1.5, h: 2.5 } : undefined,
    );
    furnishFloor(revealPart(storey, 'interior'), i, f.w, y + 0.2, f.h);
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) cyl(storey, post, 0.2, f.h, [(sx * f.w) / 2, y, (sz * f.w) / 2], 6);
    box(storey, post, [f.w + 0.2, 0.2, f.w + 0.2], [0, y, 0]);
    // Windows: two at the front, one on each side.
    const wy = y + f.h - 0.75;
    const half = f.w / 2 + 0.03;
    const count = i === 0 ? 0 : 2;
    for (let k = 0; k < count; k++) windowPane(front, 0.8, 1.1, [(k - 0.5) * 1.8, wy, half]);
    windowPane(walls.right, 0.8, 1.1, [half, wy, 0], Math.PI / 2);
    windowPane(walls.left, 0.8, 1.1, [-half, wy, 0], -Math.PI / 2);
    windowPane(walls.back, 0.8, 1.1, [0, wy, -half], Math.PI);
    // Company plaque on each floor (bottom = first job, top = current).
    const plaque = textSign(plaqueTexture(FLOORS[i].name, FLOORS[i].years), 2.3, 0.86);
    plaque.position.set(0, i === 0 ? y + f.h - 0.58 : y + f.h - 2.35, half + 0.08);
    front.add(plaque);
    // Red paper lanterns hanging from the front eaves.
    for (const sx of [-1, 1]) {
      const lantern = paperLantern(
        storey,
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
        box(storey, post, [w, 0.08, d], [x, y + 0.55, z]);
    }
    // Ceiling + roof: lower ones fade away, the top one lifts like a lid.
    const cap = revealPart(storey, 'roof');
    cap.parent!.userData['rise'] = i === last ? 2.2 : 0.8;
    if (i === last) cap.parent!.userData['keep'] = true;
    caps.push(cap);
    box(cap, beam, [f.w + 0.3, 0.35, f.w + 0.3], [0, y + f.h - 0.35, 0]);
    pagodaRoof(cap, roof, f.w, f.w, i === last ? 2.6 : 1.5, y + f.h, i === last ? 1.1 : 1.3, gold);
    if (i === 0) {
      hingedDoor(door(front, 1.5, 2.3, [0, 0.8, f.w / 2 + 0.02], '#8e3b2c'));
      // Red banners either side of the door.
      for (const x of [-1.9, 1.9])
        box(front, mat(PALETTE.shrineRed), [0.5, 1.8, 0.06], [x, 1.4, f.w / 2 + 0.06]);
    }
    y += f.h + (i === last ? 0 : 0.55);
  });

  // Spire with a glowing orb and a waving flag (rides on the top roof).
  const spire = caps[last];
  const top = y + 2.3;
  cyl(spire, post, 0.08, 2.4, [0, top - 0.6, 0], 6);
  const orb = sphere(spire, glow('#ffe39a', 1.2), 0.32, [0, top + 1.9, 0]);
  orb.userData['dynamic'] = true;
  const flag = new Group();
  flag.position.set(0.05, top + 1.2, 0);
  box(flag, mat(PALETTE.leaf), [1.1, 0.6, 0.04], [0.55, -0.3, 0]);
  flag.userData['dynamic'] = true;
  spire.add(flag);
  cone(spire, gold, 0.12, 0.4, [0, top + 2.15, 0], 6);

  lampPost(root, [-3.6, 0.8, 5.2]);
  lampPost(root, [3.6, 0.8, 5.2]);

  return {
    root,
    reveal: createReveal(root, {
      light: [0, 7, 5],
      entrance: { outside: [0, 6.8], inside: [0, 4.6] },
      view: { polar: 1.02, distance: 0.95, height: 7.5 },
    }),
    update: (_dt, t) => {
      if (ctx.reducedMotion()) return;
      flag.rotation.y = Math.sin(t * 2.2) * 0.35;
      lanterns.forEach((l, i) => (l.rotation.z = Math.sin(t * 1.5 + i) * 0.08));
      orb.position.y = top + 1.9 + Math.sin(t * 1.6) * 0.1;
    },
  };
}

/** One office per floor: company plaque on the back wall, desks, shelves and plants. */
function furnishFloor(room: Object3D, i: number, w: number, y: number, h: number): void {
  const back = -w / 2 + 0.2;
  wallBoard(
    room,
    [0, y + h - 0.45, back],
    plaqueTexture(FLOORS[i].name, FLOORS[i].years),
    1.7,
    0.64,
  );
  const shelf = (x: number, w: number, h: number) => bookshelf(room, [x, y, back + 0.25], 0, w, h);
  const pot = (x: number, z: number) =>
    kit(room, 'pottedPlant', [x, y, z], 0, (g) => plant(g, [0, 0, 0], 0.85));
  if (i === 0) {
    workstation(room, [-1.4, y, back + 0.45], 0, 1, '#d65a4a');
    shelf(1.7, 1.6, 2.2);
    kit(room, 'coatRackStanding', [2.8, y, 2.3]);
    pot(-2.8, 2.4);
  } else if (i === 1) {
    for (const x of [-1.3, 1.3]) workstation(room, [x, y, back + 0.45], 0, 1, '#4f8fd6');
    pot(2.2, 1.9);
  } else {
    workstation(room, [-0.5, y, back + 0.45], 0, 2, '#f2b23a');
    shelf(1.5, 0.9, 1.6);
    trophy(room, [1.5, y + 1.6, back + 0.25]);
    kit(room, 'loungeSofa', [0.3, y, 1.4], Math.PI, undefined, { carpet: '#f2b23a' });
    pot(-1.8, 1.5);
  }
}
