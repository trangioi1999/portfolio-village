import { CanvasTexture, RepeatWrapping, SRGBColorSpace, Texture } from 'three';
import { BUILDINGS } from '../../data/buildings.data';
import { FARM, GROUND_EXTENT, PATHS, PLAZA_RADIUS, POND, STREAM_END } from '../layout';
import { Rng } from './random';

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext('2d')! };
}

function finish(c: HTMLCanvasElement, anisotropy = 4): CanvasTexture {
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = anisotropy;
  return t;
}

/** Paint the island top: grass, stone paths, plaza tiles, pond shore and farm rows. */
export function paintGround(size: number, rng: Rng): Texture {
  const { c, ctx } = canvas(size, size);
  const k = size / (GROUND_EXTENT * 2);
  const X = (x: number) => (x + GROUND_EXTENT) * k;
  const Z = (z: number) => (z + GROUND_EXTENT) * k;

  // Grass base with soft variation.
  ctx.fillStyle = '#84c957';
  ctx.fillRect(0, 0, size, size);
  const greens = ['#92d462', '#74bb4c', '#9edb6c', '#6cb248', '#a8e07a', '#c4e67c'];
  for (let i = 0; i < 900; i++) {
    ctx.globalAlpha = rng.range(0.08, 0.22);
    ctx.fillStyle = rng.pick(greens);
    ctx.beginPath();
    ctx.arc(rng.next() * size, rng.next() * size, rng.range(6, 38) * k, 0, Math.PI * 2);
    ctx.fill();
  }
  // Tiny grass strokes.
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#4f8f3a';
  ctx.lineWidth = Math.max(1, size / 1400);
  for (let i = 0; i < 5000; i++) {
    const x = rng.next() * size;
    const y = rng.next() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + rng.range(-2, 2), y - rng.range(3, 7) * (size / 2048));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Pond shore.
  ctx.fillStyle = '#d9c79d';
  ctx.beginPath();
  ctx.ellipse(X(POND.x), Z(POND.z), (POND.r + 0.9) * k, (POND.r + 0.7) * k, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Stream to the waterfall.
  ctx.strokeStyle = '#d9c79d';
  ctx.lineCap = 'round';
  ctx.lineWidth = 3.2 * k;
  ctx.beginPath();
  ctx.moveTo(X(POND.x), Z(POND.z));
  ctx.lineTo(X(STREAM_END.x), Z(STREAM_END.z));
  ctx.stroke();

  // Farm rows.
  ctx.fillStyle = '#8a5f3b';
  ctx.fillRect(X(FARM.x - FARM.w / 2), Z(FARM.z - FARM.d / 2), FARM.w * k, FARM.d * k);
  ctx.fillStyle = '#734c2e';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(
      X(FARM.x - FARM.w / 2 + 0.3),
      Z(FARM.z - FARM.d / 2 + 0.45 + i * 0.95),
      (FARM.w - 0.6) * k,
      0.38 * k,
    );
  }

  // Dirt patches under buildings.
  for (const b of BUILDINGS) {
    if (b.id === 'plaza') continue;
    const g = ctx.createRadialGradient(
      X(b.position[0]),
      Z(b.position[1]),
      0,
      X(b.position[0]),
      Z(b.position[1]),
      (b.footprint + 2.2) * k,
    );
    g.addColorStop(0, 'rgba(196,170,120,0.85)');
    g.addColorStop(0.7, 'rgba(196,170,120,0.45)');
    g.addColorStop(1, 'rgba(196,170,120,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(X(b.position[0]), Z(b.position[1]), (b.footprint + 2.2) * k, 0, Math.PI * 2);
    ctx.fill();
  }

  // Paths: soft edge, sandy fill, then stepping stones.
  const strokePaths = (width: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width * k;
    ctx.lineJoin = 'round';
    for (const path of PATHS) {
      ctx.beginPath();
      path.forEach((p, i) => (i ? ctx.lineTo(X(p.x), Z(p.z)) : ctx.moveTo(X(p.x), Z(p.z))));
      ctx.stroke();
    }
  };
  strokePaths(3.2, 'rgba(120,150,80,0.45)');
  strokePaths(2.5, '#e2d0a4');
  ctx.fillStyle = '#cdb88c';
  for (const path of PATHS) {
    for (let i = 0; i < path.length - 1; i++) {
      for (let s = 0; s < 3; s++) {
        const t = rng.next();
        const x = path[i].x + (path[i + 1].x - path[i].x) * t + rng.range(-0.8, 0.8);
        const z = path[i].z + (path[i + 1].z - path[i].z) * t + rng.range(-0.8, 0.8);
        ctx.beginPath();
        ctx.ellipse(
          X(x),
          Z(z),
          rng.range(0.25, 0.45) * k,
          rng.range(0.2, 0.35) * k,
          rng.next() * 3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
  }

  // Plaza: tiled stone circle.
  const cx = X(0);
  const cz = Z(0);
  ctx.fillStyle = '#b8a784';
  ctx.beginPath();
  ctx.arc(cx, cz, (PLAZA_RADIUS + 0.35) * k, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8dab8';
  ctx.beginPath();
  ctx.arc(cx, cz, PLAZA_RADIUS * k, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(150,128,90,0.55)';
  ctx.lineWidth = Math.max(1, 0.07 * k);
  for (let ring = 1.6; ring < PLAZA_RADIUS; ring += 1.25) {
    ctx.beginPath();
    ctx.arc(cx, cz, ring * k, 0, Math.PI * 2);
    ctx.stroke();
    const count = Math.round(ring * 4);
    const off = rng.next();
    for (let i = 0; i < count; i++) {
      const a = ((i + off) / count) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * ring * k, cz + Math.sin(a) * ring * k);
      ctx.lineTo(cx + Math.cos(a) * (ring + 1.25) * k, cz + Math.sin(a) * (ring + 1.25) * k);
      ctx.stroke();
    }
  }
  // Compass star in the middle.
  ctx.fillStyle = '#d6c296';
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r = (i % 2 ? 0.55 : 1.45) * k;
    ctx.lineTo(cx + Math.cos(a) * r, cz + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();

  // Flower speckles.
  const flowers = ['#fff6d6', '#ffd24d', '#ff9fb8', '#c9a2ff', '#ffffff'];
  for (let i = 0; i < 1400; i++) {
    const x = rng.range(-GROUND_EXTENT, GROUND_EXTENT);
    const z = rng.range(-GROUND_EXTENT, GROUND_EXTENT);
    if (Math.hypot(x, z) < PLAZA_RADIUS + 1) continue;
    ctx.fillStyle = rng.pick(flowers);
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(X(x), Z(z), rng.range(0.05, 0.1) * k, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  return finish(c, 8);
}

/** Wooden signboard with hand-lettered text. */
export function signTexture(
  lines: string[],
  options: { width?: number; height?: number; bg?: string; ink?: string; font?: string } = {},
): Texture {
  const w = options.width ?? 1024;
  const h = options.height ?? 384;
  const { c, ctx } = canvas(w, h);
  if (options.bg !== 'transparent') {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, options.bg ?? '#c79460');
    g.addColorStop(1, '#a8754a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(80,50,25,0.25)';
    ctx.lineWidth = 3;
    for (let y = 18; y < h; y += 34) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.sin(y) * 3);
      ctx.bezierCurveTo(w / 3, y - 6, (2 * w) / 3, y + 6, w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = '#5f3d22';
    ctx.lineWidth = 18;
    ctx.strokeRect(9, 9, w - 18, h - 18);
  }
  ctx.fillStyle = options.ink ?? '#3a2414';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lineH = h / (lines.length + 0.6);
  const fontSize = Math.min(lineH * 0.78, 110);
  ctx.font = `${fontSize}px ${options.font ?? "'Patrick Hand', 'Comic Sans MS', cursive"}`;
  lines.forEach((line, i) => ctx.fillText(line, w / 2, lineH * (i + 0.8), w - 70));
  return finish(c);
}

/** Radial glow used for halos and sparkles (additive sprites). */
export function glowTexture(): Texture {
  const { c, ctx } = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return finish(c, 1);
}

/** Blueprint sheet for the workshop easel. */
export function blueprintTexture(): Texture {
  const { c, ctx } = canvas(512, 384);
  ctx.fillStyle = '#2d5d9f';
  ctx.fillRect(0, 0, 512, 384);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 512; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 384);
    ctx.stroke();
  }
  for (let y = 0; y < 384; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 4;
  ctx.strokeRect(60, 70, 180, 120);
  ctx.strokeRect(270, 70, 180, 60);
  ctx.strokeRect(270, 150, 85, 40);
  ctx.strokeRect(365, 150, 85, 40);
  ctx.beginPath();
  ctx.arc(150, 280, 50, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(240, 130);
  ctx.lineTo(270, 100);
  ctx.moveTo(300, 280);
  ctx.lineTo(450, 280);
  ctx.moveTo(300, 310);
  ctx.lineTo(410, 310);
  ctx.stroke();
  ctx.font = "bold 34px 'Patrick Hand', cursive";
  ctx.fillStyle = '#fff';
  ctx.fillText('</>', 125, 145);
  return finish(c);
}

/** Tileable streak texture for waterfalls. */
export function streakTexture(): Texture {
  const { c, ctx } = canvas(64, 256);
  ctx.fillStyle = '#9fdcf0';
  ctx.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.5})`;
    ctx.fillRect(
      Math.random() * 64,
      Math.random() * 256,
      2 + Math.random() * 4,
      20 + Math.random() * 60,
    );
  }
  const t = finish(c, 1);
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

/** Big anime eye: lashes, gradient iris, pupil and two sparkles. */
export function animeEyeTexture(iris = '#8a4f2a', dark = '#2a160e'): Texture {
  const { c, ctx } = canvas(128, 160);
  // Sclera.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(64, 92, 42, 58, 0, 0, Math.PI * 2);
  ctx.fill();
  // Iris with vertical gradient.
  const g = ctx.createLinearGradient(0, 40, 0, 150);
  g.addColorStop(0, dark);
  g.addColorStop(0.55, iris);
  g.addColorStop(1, '#e0a060');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(64, 98, 36, 52, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pupil.
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(64, 102, 17, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  // Sparkles.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(46, 72, 13, 15, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(82, 126, 6, 0, Math.PI * 2);
  ctx.fill();
  // Upper lash line with a little wing.
  ctx.strokeStyle = '#1c120c';
  ctx.lineCap = 'round';
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(16, 62);
  ctx.quadraticCurveTo(60, 22, 112, 48);
  ctx.stroke();
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(108, 46);
  ctx.lineTo(122, 38);
  ctx.stroke();
  // Soft clip so the eye edge is clean.
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.ellipse(64, 86, 60, 76, 0, 0, Math.PI * 2);
  ctx.fill();
  return finish(c, 1);
}

/** Small cheerful mouth. */
export function mouthTexture(): Texture {
  const { c, ctx } = canvas(96, 64);
  ctx.fillStyle = '#b6453a';
  ctx.beginPath();
  ctx.moveTo(24, 20);
  ctx.quadraticCurveTo(48, 58, 72, 20);
  ctx.quadraticCurveTo(48, 30, 24, 20);
  ctx.fill();
  ctx.fillStyle = '#ff8f8f';
  ctx.beginPath();
  ctx.ellipse(48, 38, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  return finish(c, 1);
}

/** Dark banner plaque with gold border and a name (used for company floors). */
export function plaqueTexture(text: string, sub?: string): Texture {
  const { c, ctx } = canvas(512, 192);
  const g = ctx.createLinearGradient(0, 0, 0, 192);
  g.addColorStop(0, '#2a3656');
  g.addColorStop(1, '#1c2640');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 176, 28);
  ctx.fill();
  ctx.strokeStyle = '#f2c14e';
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.fillStyle = '#fff7e6';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${sub ? 76 : 88}px 'Baloo 2', 'Nunito', sans-serif`;
  ctx.fillText(text, 256, sub ? 80 : 98, 460);
  if (sub) {
    ctx.fillStyle = '#ffd98a';
    ctx.font = "600 38px 'Nunito', sans-serif";
    ctx.fillText(sub, 256, 146, 460);
  }
  return finish(c);
}

/** Glowing monitor with syntax-highlighted "code" lines. */
export function codeScreenTexture(): Texture {
  const { c, ctx } = canvas(512, 320);
  ctx.fillStyle = '#16213a';
  ctx.fillRect(0, 0, 512, 320);
  const palette = ['#7fe0ff', '#ffd24d', '#ff8fb1', '#9be37a', '#c9a2ff', '#ffffff'];
  let y = 30;
  for (let line = 0; line < 11; line++) {
    let x = 24 + (line % 4 === 0 ? 0 : 28 * ((line % 3) + 1));
    const tokens = 2 + ((line * 7) % 4);
    for (let t = 0; t < tokens; t++) {
      const w = 30 + ((line * 13 + t * 29) % 90);
      ctx.fillStyle = palette[(line + t * 2) % palette.length];
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.roundRect(x, y, w, 12, 6);
      ctx.fill();
      x += w + 12;
    }
    y += 26;
  }
  ctx.globalAlpha = 1;
  ctx.font = "bold 44px 'Baloo 2', monospace";
  ctx.fillStyle = '#7fe0ff';
  ctx.fillText('</>', 400, 290);
  return finish(c, 1);
}

/**
 * Wooden board with technology logo tiles (Skills Garden). Logos are drawn once the
 * self-hosted SVG icons load; the texture updates in place.
 */
export function techBoardTexture(icons: string[]): Texture {
  const cols = 4;
  const rows = Math.ceil(icons.length / cols);
  const tile = 150;
  const pad = 24;
  const { c, ctx } = canvas(cols * (tile + pad) + pad, rows * (tile + pad) + pad);
  ctx.fillStyle = '#8a5a34';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = 'rgba(60,35,15,0.35)';
  ctx.lineWidth = 3;
  for (let y = 20; y < c.height; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(c.width, y);
    ctx.stroke();
  }
  const tiles: [number, number][] = icons.map((_, i) => [
    pad + (i % cols) * (tile + pad),
    pad + Math.floor(i / cols) * (tile + pad),
  ]);
  for (const [x, y] of tiles) {
    ctx.fillStyle = '#fffaf0';
    ctx.beginPath();
    ctx.roundRect(x, y, tile, tile, 26);
    ctx.fill();
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = 6;
    ctx.stroke();
  }
  const texture = finish(c, 4);
  icons.forEach((name, i) => {
    const img = new Image();
    img.onload = () => {
      const [x, y] = tiles[i];
      ctx.drawImage(img, x + 25, y + 25, tile - 50, tile - 50);
      texture.needsUpdate = true;
    };
    img.src = `icons/tech/${name}.svg`;
  });
  return texture;
}
