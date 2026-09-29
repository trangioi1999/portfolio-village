import { AdditiveBlending, Group, Sprite, SpriteMaterial } from 'three';
import { box, cyl, pagodaRoof, sphere } from '../../utils/geometry';
import { PALETTE, glow, mat } from '../../utils/materials';
import { glowTexture } from '../../utils/textures';
import { BuildContext, VillageObject } from '../../utils/types';
import { altar, wallFrame } from '../furniture';
import { stoneLantern } from '../props';
import { createReveal, hingedDoor, hollowRoom, revealPart } from '../reveal';

/** Small shrine with a red gate, stone lanterns, a post box, a floating letter and an altar inside. */
export function createContactShrine(ctx: BuildContext): VillageObject {
  const root = new Group();
  const red = mat(PALETTE.shrineRed);
  const dark = mat('#2f2a2a');
  const stone = mat(PALETTE.stone, { flat: true });
  const wood = mat('#8e5a36');

  box(root, stone, [6.4, 0.5, 5.2], [0, 0, -0.6]);
  for (let i = 0; i < 2; i++) box(root, stone, [2.4, 0.25 * (2 - i), 0.5], [0, 0, 2.2 + i * 0.5]);

  // Gate at the front.
  const gate = new Group();
  gate.position.set(0, 0, 4.1);
  for (const x of [-1.5, 1.5]) {
    cyl(gate, red, 0.17, 3.6, [x, 0, 0], 10);
    cyl(gate, dark, 0.22, 0.3, [x, 0, 0], 10);
  }
  box(gate, red, [3.8, 0.24, 0.3], [0, 2.8, 0]);
  box(gate, red, [4.4, 0.3, 0.42], [0, 3.35, 0]);
  box(gate, dark, [4.8, 0.16, 0.5], [0, 3.62, 0]);
  box(gate, mat(PALETTE.gold), [0.5, 0.5, 0.08], [0, 2.95, 0.2]);
  root.add(gate);

  // Shrine hall with glowing shoji doors that swing open.
  box(root, red, [3.4, 0.2, 2.8], [0, 0.5, -1.4]);
  hollowRoom(root, root, wood, mat('#d8b27a'), [3.2, 2.2, 2.6], [0, 0.5, -1.4], {
    x: 0,
    w: 2,
    h: 2.1,
  });
  for (const x of [-1.6, 1.6])
    for (const z of [-2.7, -0.1]) cyl(root, red, 0.12, 2.2, [x, 0.5, z], 8);
  const roof = revealPart(root, 'roof');
  pagodaRoof(roof, mat('#3f5a4f', { flat: true }), 3.2, 2.6, 1.6, 2.7, 0.9, mat(PALETTE.gold));
  const shoji = glow('#ffcf7a', 0.5);
  for (const side of [-1, 1] as const) {
    const leaf = new Group();
    leaf.position.set(side, 0.7, -0.14);
    box(leaf, shoji, [0.98, 1.88, 0.05], [-side * 0.49, 0, 0]);
    box(leaf, mat(PALETTE.woodDeep), [0.06, 1.88, 0.08], [-side * 0.02, 0, 0]);
    box(leaf, mat(PALETTE.woodDeep), [0.98, 0.06, 0.08], [-side * 0.49, 0.94, 0]);
    root.add(hingedDoor(leaf, side === -1 ? 1 : -1));
  }

  // Inside: the altar where messages arrive.
  const room = revealPart(root, 'interior');
  altar(room, [0, 0.74, -2.2]);
  wallFrame(room, [-1.05, 1.5, -2.5], 0.5, 0.7, '#f4f1e8');
  wallFrame(room, [1.05, 1.5, -2.5], 0.5, 0.7, '#f4f1e8');
  // Rope with a bell.
  box(root, mat('#e9d7a6'), [2.4, 0.1, 0.1], [0, 2.5, 0.1]);
  sphere(root, mat(PALETTE.gold, { metalness: 0.6, roughness: 0.3 }), 0.2, [0, 2.25, 0.15]);
  // Hanging wooden wish plaques.
  for (let i = 0; i < 5; i++)
    box(
      root,
      mat('#d8b27a'),
      [0.3, 0.22, 0.04],
      [1.9 + (i % 3) * 0.35, 1.4 + Math.floor(i / 3) * 0.35, 0.8],
    );
  box(root, wood, [1.4, 0.08, 0.08], [2.25, 1.9, 0.8]);
  for (const x of [1.6, 2.9]) cyl(root, wood, 0.05, 1.9, [x, 0, 0.8], 5);

  stoneLantern(root, [-2.3, 0.5, 2.2]);
  stoneLantern(root, [2.3, 0.5, 2.2]);

  // Red post box.
  const postBox = new Group();
  postBox.position.set(-2.6, 0.5, 0.4);
  cyl(postBox, red, 0.38, 1.3, [0, 0, 0], 12);
  sphere(postBox, red, 0.38, [0, 1.3, 0], [1, 0.6, 1]);
  box(postBox, dark, [0.45, 0.06, 0.05], [0, 1.02, 0.37]);
  root.add(postBox);

  // Floating letter with a soft glow.
  const letter = new Group();
  letter.position.set(-2.6, 2.7, 0.4);
  box(letter, mat(PALETTE.paper), [0.8, 0.5, 0.05], [0, -0.25, 0]);
  const flap = box(letter, mat('#f3e2bf'), [0.57, 0.57, 0.04], [0, -0.28, 0.02]);
  flap.rotation.z = Math.PI / 4;
  flap.scale.y = 0.6;
  sphere(letter, red, 0.07, [0, -0.05, 0.05]);
  const halo = new Sprite(
    new SpriteMaterial({
      map: glowTexture(),
      color: '#ffd98a',
      blending: AdditiveBlending,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    }),
  );
  halo.scale.setScalar(1.8);
  letter.add(halo);
  letter.userData['dynamic'] = true;
  root.add(letter);

  return {
    root,
    reveal: createReveal(root, {
      light: [0, 1.8, 0.4],
      lightIntensity: 3,
      entrance: { outside: [0, 5], inside: [0, 1.6] },
    }),
    update: (_dt, t) => {
      if (ctx.reducedMotion()) return;
      letter.position.y = 2.7 + Math.sin(t * 1.8) * 0.2;
      letter.rotation.y = Math.sin(t * 0.9) * 0.5;
    },
  };
}
