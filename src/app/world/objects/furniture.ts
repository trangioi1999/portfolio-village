import { Box3, Group, Mesh, MeshStandardMaterial, Object3D, PlaneGeometry, Texture } from 'three';
import { Vec3, box, cone, cyl, sphere } from '../utils/geometry';
import { PALETTE, glow, mat } from '../utils/materials';
import { codeScreenTexture } from '../utils/textures';

/**
 * Low-poly interior furniture. Every piece is its own group standing on `at`, so the reveal
 * can pop items in one after another.
 */
function piece(parent: Object3D, at: Vec3, rotY = 0): Group {
  const g = new Group();
  g.position.set(...at);
  g.rotation.y = rotY;
  parent.add(g);
  return g;
}

const BOOK_COLORS = ['#d65a4a', '#4f8fd6', '#5fa447', '#f2b23a', '#7a5cc2', '#e98bb0'];

/* ---------- Kenney Furniture Kit (CC0) ---------- */

/** Models copied into public/models/furniture (Kenney Furniture Kit, CC0). */
export type KitModel =
  | 'bedDouble'
  | 'desk'
  | 'chairDesk'
  | 'chair'
  | 'bookcaseOpen'
  | 'bookcaseClosedWide'
  | 'pottedPlant'
  | 'plantSmall1'
  | 'lampRoundFloor'
  | 'lampSquareTable'
  | 'rugRectangle'
  | 'rugRound'
  | 'loungeSofa'
  | 'loungeChair'
  | 'sideTable'
  | 'cardboardBoxClosed'
  | 'cardboardBoxOpen'
  | 'computerKeyboard'
  | 'books'
  | 'radio'
  | 'speaker'
  | 'coatRackStanding'
  | 'tableCoffee'
  | 'pillow';

export interface KitSlot {
  url: string;
  /** Kit material name → replacement colour (e.g. `carpet` → blue blanket). */
  tint?: Record<string, string>;
}

export const kitUrl = (name: KitModel) => `models/furniture/${name}.glb`;

/**
 * Placeholder for a kit model, filled in by the world once the GLB loads. The model is
 * centred on `at`, faces +z at `rotY = 0`, and is scaled to village size. `fallback`
 * builds a primitive stand-in that stays if the model can't be loaded.
 */
export function kit(
  parent: Object3D,
  name: KitModel,
  at: Vec3,
  rotY = 0,
  fallback?: (g: Group) => void,
  tint?: Record<string, string>,
): Group {
  const g = piece(parent, at, rotY);
  g.userData['kit'] = { url: kitUrl(name), tint } satisfies KitSlot;
  fallback?.(g);
  return g;
}

/**
 * Kit desk against a wall (its back towards local -z) with glowing monitors, a keyboard and a
 * desk chair pulled up in front.
 */
export function workstation(
  parent: Object3D,
  at: Vec3,
  rotY = 0,
  screens = 1,
  chairColor?: string,
): void {
  const [x, y, z] = at;
  const cos = Math.cos(rotY);
  const sin = Math.sin(rotY);
  const local = (dx: number, dz: number, dy = 0): Vec3 => [
    x + dx * cos + dz * sin,
    y + dy,
    z - dx * sin + dz * cos,
  ];
  kit(parent, 'desk', at, rotY, (g) => desk(g, [0, 0, 0], 0, 1.5, 0));
  for (let i = 0; i < screens; i++)
    monitor(parent, local((i - (screens - 1) / 2) * 0.76, -0.2, 0.84), rotY);
  kit(parent, 'computerKeyboard', local(0, 0.16, 0.84), rotY);
  kit(
    parent,
    'chairDesk',
    local(0, 0.9),
    rotY + Math.PI,
    (g) => chair(g, [0, 0, 0], Math.PI, chairColor),
    chairColor ? { carpet: chairColor } : undefined,
  );
}

/** Kit models are ~2 m per unit; the village is ~0.9 m per unit. */
const KIT_SCALE = 2.2;

/**
 * Scale a loaded kit model to village size, centre its footprint on the origin, apply tints
 * and let lamp shades glow.
 */
export function prepareKitModel(model: Object3D, tint?: Record<string, string>): void {
  model.scale.setScalar(KIT_SCALE);
  const bounds = new Box3().setFromObject(model);
  model.position.set(
    -(bounds.min.x + bounds.max.x) / 2,
    -bounds.min.y,
    -(bounds.min.z + bounds.max.z) / 2,
  );
  model.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    const m = mesh.material as MeshStandardMaterial;
    if (!m.isMeshStandardMaterial) return;
    const color = tint?.[m.name];
    if (color) {
      const tinted = m.clone();
      tinted.color.set(color);
      mesh.material = tinted;
    } else if (m.name === 'lamp') {
      m.emissive.copy(m.color);
      m.emissiveIntensity = 1.6;
    }
  });
}

/** Glowing monitor (kit screens have no separate glass to light up). */
export function monitor(parent: Object3D, at: Vec3, rotY = 0): Group {
  const g = piece(parent, at, rotY);
  box(g, mat('#2b3245'), [0.08, 0.2, 0.08], [0, 0, 0]);
  box(g, mat('#2b3245'), [0.3, 0.03, 0.2], [0, 0, 0]);
  box(g, mat('#2b3245'), [0.72, 0.46, 0.06], [0, 0.18, 0]);
  box(g, glow(PALETTE.screen, 0.8), [0.62, 0.36, 0.02], [0, 0.23, 0.035]);
  return g;
}

export function rug(parent: Object3D, at: Vec3, w: number, d: number, color: string): Group {
  const g = piece(parent, at);
  box(g, mat(color), [w, 0.03, d], [0, 0, 0]);
  box(g, mat(PALETTE.cream), [w * 0.7, 0.035, d * 0.7], [0, 0, 0]);
  box(g, mat(color), [w * 0.5, 0.04, d * 0.5], [0, 0, 0]);
  return g;
}

export function bookshelf(parent: Object3D, at: Vec3, rotY = 0, w = 1.5, h = 2.1): Group {
  const g = piece(parent, at, rotY);
  const wood = mat(PALETTE.woodDark);
  box(g, wood, [w, h, 0.08], [0, 0, -0.2]);
  for (const x of [-w / 2, w / 2]) box(g, wood, [0.08, h, 0.45], [x, 0, 0]);
  const shelves = Math.round(h / 0.55);
  for (let s = 0; s <= shelves; s++) {
    const y = (s * (h - 0.08)) / shelves;
    box(g, wood, [w, 0.08, 0.45], [0, y, 0]);
    if (s === shelves) break;
    let x = -w / 2 + 0.1;
    for (let i = 0; x < w / 2 - 0.2; i++) {
      const bw = 0.1 + ((s * 5 + i * 3) % 3) * 0.03;
      const bh = 0.3 + ((s + i * 7) % 4) * 0.04;
      box(
        g,
        mat(BOOK_COLORS[(s * 2 + i) % BOOK_COLORS.length]),
        [bw, bh, 0.32],
        [x + bw / 2, y + 0.08, 0],
      );
      x += bw + 0.02;
    }
  }
  return g;
}

export function bed(parent: Object3D, at: Vec3, rotY = 0, blanket = '#4f8fd6'): Group {
  const g = piece(parent, at, rotY);
  const wood = mat(PALETTE.wood);
  box(g, wood, [1.5, 0.35, 2.3], [0, 0, 0]);
  box(g, wood, [1.5, 1.1, 0.14], [0, 0, -1.15]);
  box(g, mat(PALETTE.white), [1.36, 0.2, 2.1], [0, 0.35, 0]);
  box(g, mat(blanket), [1.4, 0.16, 1.3], [0, 0.43, 0.42]);
  sphere(g, mat(PALETTE.paper), 0.3, [0, 0.66, -0.72], [1.5, 0.45, 0.8]);
  return g;
}

export function desk(parent: Object3D, at: Vec3, rotY = 0, w = 1.6, monitors = 1): Group {
  const g = piece(parent, at, rotY);
  const top = mat(PALETTE.wood);
  const dark = mat(PALETTE.woodDark);
  box(g, top, [w, 0.1, 0.8], [0, 0.8, 0]);
  for (const x of [-w / 2 + 0.08, w / 2 - 0.08]) box(g, dark, [0.1, 0.8, 0.7], [x, 0, 0]);
  const screen = glow(PALETTE.screen, 0.8);
  for (let i = 0; i < monitors; i++) {
    const x = monitors === 1 ? 0 : (i - (monitors - 1) / 2) * 0.72;
    box(g, mat('#2b3245'), [0.66, 0.44, 0.06], [x, 1.05, -0.22]);
    box(g, screen, [0.56, 0.34, 0.02], [x, 1.1, -0.18]);
    box(g, mat('#2b3245'), [0.06, 0.16, 0.06], [x, 0.9, -0.24]);
  }
  box(g, mat('#3d4660'), [0.7, 0.03, 0.22], [0, 0.9, 0.15]);
  // Coffee mug.
  cyl(g, mat(PALETTE.cream), 0.07, 0.14, [w / 2 - 0.25, 0.9, 0.1], 8);
  return g;
}

export function chair(parent: Object3D, at: Vec3, rotY = 0, color = '#d65a4a'): Group {
  const g = piece(parent, at, rotY);
  const dark = mat(PALETTE.woodDark);
  for (const x of [-0.22, 0.22])
    for (const z of [-0.22, 0.22]) box(g, dark, [0.07, 0.48, 0.07], [x, 0, z]);
  box(g, mat(color), [0.56, 0.1, 0.56], [0, 0.48, 0]);
  box(g, mat(color), [0.56, 0.6, 0.08], [0, 0.55, 0.26]);
  return g;
}

export function floorLamp(parent: Object3D, at: Vec3): Group {
  const g = piece(parent, at);
  cyl(g, mat(PALETTE.woodDeep), 0.2, 0.06, [0, 0, 0], 10);
  cyl(g, mat(PALETTE.woodDeep), 0.04, 1.6, [0, 0, 0], 6);
  cyl(g, glow('#ffd98a', 0.9), 0.3, 0.4, [0, 1.55, 0], 10, 0.6);
  return g;
}

export function plant(parent: Object3D, at: Vec3, s = 1): Group {
  const g = piece(parent, at);
  g.scale.setScalar(s);
  cyl(g, mat('#c2653f'), 0.25, 0.45, [0, 0, 0], 8, 1.25);
  const leaf = mat(PALETTE.leaf, { flat: true });
  sphere(g, leaf, 0.35, [0, 0.75, 0]);
  sphere(g, leaf, 0.24, [0.2, 1.05, 0.05]);
  sphere(g, mat(PALETTE.leafDark, { flat: true }), 0.22, [-0.18, 0.95, -0.05]);
  return g;
}

export function fireplace(parent: Object3D, at: Vec3, rotY = 0): Group {
  const g = piece(parent, at, rotY);
  const stone = mat(PALETTE.stoneDark, { flat: true });
  box(g, stone, [1.5, 1.2, 0.5], [0, 0, 0]);
  box(g, mat('#2f2a2a'), [0.9, 0.7, 0.1], [0, 0.1, 0.22]);
  box(g, mat(PALETTE.woodDark), [1.7, 0.12, 0.6], [0, 1.2, 0]);
  const fire = glow('#ff9a3c', 1.2);
  cone(g, fire, 0.22, 0.5, [-0.12, 0.12, 0.2], 5);
  cone(g, glow('#ffd24d', 1.3), 0.16, 0.38, [0.14, 0.12, 0.22], 5);
  // Picture frame on the mantel.
  box(g, mat(PALETTE.gold), [0.5, 0.4, 0.06], [0.3, 1.32, 0]);
  box(g, mat('#9fd3e6'), [0.4, 0.3, 0.02], [0.3, 1.37, 0.03]);
  cyl(g, mat(PALETTE.cream), 0.06, 0.25, [-0.45, 1.32, 0], 8);
  return g;
}

export function wallFrame(parent: Object3D, at: Vec3, w: number, h: number, color: string): Group {
  const g = piece(parent, at);
  box(g, mat(PALETTE.woodDark), [w + 0.12, h + 0.12, 0.05], [0, -0.06, 0]);
  box(g, mat(color), [w, h, 0.02], [0, 0, 0.03]);
  return g;
}

/** Canvas-textured board hung on a wall (blackboard, company plaque …). */
export function wallBoard(
  parent: Object3D,
  at: Vec3,
  texture: Texture,
  w: number,
  h: number,
): Group {
  const g = piece(parent, at);
  box(g, mat(PALETTE.woodDark), [w + 0.16, h + 0.16, 0.06], [0, -h / 2 - 0.08, 0]);
  const face = new Mesh(
    new PlaneGeometry(w, h),
    new MeshStandardMaterial({ map: texture, roughness: 0.9 }),
  );
  face.position.set(0, -h / 2, 0.035);
  g.add(face);
  return g;
}

export function workbench(parent: Object3D, at: Vec3, rotY = 0): Group {
  const g = piece(parent, at, rotY);
  const top = mat('#a0703f');
  const dark = mat(PALETTE.woodDark);
  box(g, top, [2.6, 0.14, 1], [0, 0.86, 0]);
  for (const x of [-1.2, 1.2])
    for (const z of [-0.4, 0.4]) box(g, dark, [0.12, 0.86, 0.12], [x, 0, z]);
  box(g, dark, [2.4, 0.06, 0.8], [0, 0.3, 0]);
  // Vice, a half-built robot and some tools.
  box(g, mat('#6c7a8c', { metalness: 0.5, roughness: 0.4 }), [0.3, 0.25, 0.3], [-1, 1, 0.2]);
  const robot = new Group();
  robot.position.set(0.2, 1, 0);
  box(robot, mat('#e8eef5'), [0.45, 0.45, 0.4], [0, 0, 0]);
  box(robot, glow(PALETTE.screen, 1), [0.3, 0.12, 0.02], [0, 0.26, 0.2]);
  sphere(robot, mat('#e8eef5'), 0.2, [0, 0.6, 0]);
  sphere(robot, glow('#ff6b5b', 1), 0.05, [0, 0.83, 0]);
  g.add(robot);
  box(g, mat(PALETTE.gold), [0.5, 0.05, 0.08], [0.9, 1, 0.1], 0.4);
  box(g, mat('#d65a4a'), [0.12, 0.08, 0.3], [0.8, 1, -0.2], -0.3);
  return g;
}

export function pegboard(parent: Object3D, at: Vec3, w = 2.4): Group {
  const g = piece(parent, at);
  box(g, mat('#d9b98a'), [w, 1.3, 0.06], [0, 0, 0]);
  const metal = mat('#8a96a8', { metalness: 0.5, roughness: 0.4 });
  const handle = mat('#d65a4a');
  for (let i = 0; i < 5; i++) {
    const x = -w / 2 + 0.35 + i * ((w - 0.7) / 4);
    const hang = 0.25 + (i % 2) * 0.3;
    box(g, metal, [0.06, 0.55, 0.04], [x, hang, 0.06]);
    box(g, i % 2 ? handle : mat(PALETTE.woodDark), [0.1, 0.25, 0.06], [x, hang - 0.2, 0.06]);
  }
  return g;
}

/** Holographic code panel hovering above a desk. */
export function holoScreen(parent: Object3D, at: Vec3, w = 1.4, h = 0.9): Group {
  const g = piece(parent, at);
  cyl(g, mat('#2b3245'), 0.18, 0.12, [0, 0, 0], 10);
  cyl(g, glow(PALETTE.screen, 0.9), 0.1, 0.04, [0, 0.12, 0], 10);
  const holder = new Group();
  holder.position.y = 0.3 + h / 2;
  holder.add(
    new Mesh(
      new PlaneGeometry(w, h),
      new MeshStandardMaterial({
        color: '#000000',
        emissive: '#ffffff',
        emissiveMap: codeScreenTexture(),
        emissiveIntensity: 1.4,
        transparent: true,
        opacity: 0.9,
      }),
    ),
  );
  holder.userData['dynamic'] = true;
  g.add(holder);
  return g;
}

export function crateStack(parent: Object3D, at: Vec3, rotY = 0): Group {
  const g = piece(parent, at, rotY);
  const wood = mat('#c29462');
  const band = mat(PALETTE.woodDark);
  box(g, wood, [0.7, 0.7, 0.7], [0, 0, 0]);
  box(g, band, [0.74, 0.08, 0.74], [0, 0.31, 0]);
  box(g, wood, [0.55, 0.55, 0.55], [0.05, 0.7, 0.02], 0.3);
  return g;
}

export function schoolDesk(parent: Object3D, at: Vec3, rotY = 0): Group {
  const g = piece(parent, at, rotY);
  const wood = mat(PALETTE.wood);
  const dark = mat(PALETTE.woodDark);
  box(g, wood, [1, 0.08, 0.6], [0, 0.7, 0]);
  for (const x of [-0.42, 0.42]) box(g, dark, [0.07, 0.7, 0.5], [x, 0, 0]);
  box(
    g,
    mat(BOOK_COLORS[Math.abs(Math.round(at[0] * 3)) % BOOK_COLORS.length]),
    [0.35, 0.06, 0.45],
    [-0.15, 0.78, 0],
  );
  box(g, mat(PALETTE.paper), [0.3, 0.02, 0.4], [0.25, 0.78, 0.02], 0.2);
  box(g, wood, [0.8, 0.07, 0.4], [0, 0.4, 0.65]);
  for (const x of [-0.32, 0.32]) box(g, dark, [0.06, 0.4, 0.35], [x, 0, 0.65]);
  return g;
}

export function telescope(parent: Object3D, at: Vec3, rotY = 0): Group {
  const g = piece(parent, at, rotY);
  const dark = mat(PALETTE.woodDark);
  for (let i = 0; i < 3; i++) {
    const leg = box(g, dark, [0.05, 1.1, 0.05], [0, 0, 0]);
    leg.rotation.set(0.25, (i / 3) * Math.PI * 2, 0.25);
  }
  const tube = cyl(
    g,
    mat(PALETTE.gold, { metalness: 0.5, roughness: 0.35 }),
    0.1,
    1.1,
    [0, 1.05, 0],
    10,
    0.7,
  );
  tube.rotation.x = -1;
  return g;
}

export function trophy(parent: Object3D, at: Vec3): Group {
  const g = piece(parent, at);
  const gold = mat(PALETTE.gold, { metalness: 0.6, roughness: 0.3 });
  box(g, mat(PALETTE.woodDeep), [0.3, 0.12, 0.3], [0, 0, 0]);
  cyl(g, gold, 0.04, 0.2, [0, 0.12, 0], 6);
  cyl(g, gold, 0.16, 0.26, [0, 0.3, 0], 10, 1.4);
  return g;
}

/** Low altar with candles and a glowing letter (Contact Shrine). */
export function altar(parent: Object3D, at: Vec3): Group {
  const g = piece(parent, at);
  const red = mat(PALETTE.shrineRed);
  box(g, red, [1.6, 0.55, 0.7], [0, 0, 0]);
  box(g, mat(PALETTE.gold), [1.7, 0.06, 0.8], [0, 0.55, 0]);
  for (const x of [-0.6, 0.6]) {
    cyl(g, mat(PALETTE.cream), 0.06, 0.3, [x, 0.61, 0], 8);
    sphere(g, glow('#ffcf7a', 1.4), 0.06, [x, 0.98, 0]);
  }
  // Stack of letters and the glowing envelope.
  for (let i = 0; i < 3; i++)
    box(g, mat(PALETTE.paper), [0.4, 0.04, 0.28], [-0.25, 0.61 + i * 0.045, 0.05], i * 0.3);
  box(g, glow('#fff1b8', 0.9), [0.5, 0.32, 0.04], [0.2, 0.75, -0.1]);
  return g;
}
