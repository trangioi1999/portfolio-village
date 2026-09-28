import {
  BackSide,
  Color,
  ColorRepresentation,
  DataTexture,
  MeshBasicMaterial,
  MeshStandardMaterial,
  MeshToonMaterial,
  NearestFilter,
  RedFormat,
  Side,
} from 'three';

/** Village colour palette (sRGB hex). */
export const PALETTE = {
  grass: '#7cbf5d',
  grassDark: '#5a9a42',
  leaf: '#5fa447',
  leafDark: '#3f7f34',
  pine: '#2f6b3a',
  sakura: '#f4b6c8',
  trunk: '#7a5232',
  wood: '#b98552',
  woodDark: '#6b4526',
  woodDeep: '#4a2e1a',
  plaster: '#f6ead2',
  cream: '#fbf1dc',
  stone: '#b9b1a3',
  stoneDark: '#8d8577',
  roofRed: '#c8553d',
  roofBlue: '#4d6a8f',
  roofTeal: '#3f8f8a',
  roofOrange: '#d9763b',
  roofSlate: '#3d4a5c',
  shrineRed: '#d24a3a',
  gold: '#f2c14e',
  glass: '#ffd98a',
  screen: '#7fe0ff',
  water: '#5ec4e6',
  skin: '#f7d5b5',
  hair: '#3a2a22',
  hoodie: '#2f8f83',
  scarf: '#d65a4a',
  pants: '#2f3550',
  white: '#ffffff',
  paper: '#fffaf0',
} as const;

interface MatOptions {
  roughness?: number;
  metalness?: number;
  emissive?: ColorRepresentation;
  emissiveIntensity?: number;
  flat?: boolean;
  transparent?: boolean;
  opacity?: number;
  side?: Side;
  vertexColors?: boolean;
}

const cache = new Map<string, MeshStandardMaterial>();

/** Cached standard material — identical requests share one material instance. */
export function mat(color: ColorRepresentation, options: MatOptions = {}): MeshStandardMaterial {
  const key = `${new Color(color).getHexString()}|${JSON.stringify(options)}`;
  let material = cache.get(key);
  if (!material) {
    material = new MeshStandardMaterial({
      color,
      roughness: options.roughness ?? 0.88,
      metalness: options.metalness ?? 0,
      emissive: options.emissive ?? '#000000',
      emissiveIntensity: options.emissiveIntensity ?? 1,
      flatShading: options.flat ?? false,
      transparent: options.transparent ?? false,
      opacity: options.opacity ?? 1,
      ...(options.side !== undefined ? { side: options.side } : {}),
      vertexColors: options.vertexColors ?? false,
    });
    cache.set(key, material);
  }
  return material;
}

/** Warm glowing material for windows, lanterns and screens. */
export function glow(color: ColorRepresentation, intensity = 0.9): MeshStandardMaterial {
  // Boosted so the bloom pass picks lanterns, windows and crystals up.
  return mat(color, { emissive: color, emissiveIntensity: intensity * 3.2, roughness: 0.4 });
}

/* ---------- Toon look for characters ---------- */

let toonRamp: DataTexture | null = null;
function ramp(): DataTexture {
  if (!toonRamp) {
    toonRamp = new DataTexture(new Uint8Array([110, 190, 255]), 3, 1, RedFormat);
    toonRamp.minFilter = toonRamp.magFilter = NearestFilter;
    toonRamp.needsUpdate = true;
  }
  return toonRamp;
}

const toonCache = new Map<string, MeshToonMaterial>();

/** Cel-shaded material with a 3-step light ramp (anime look). */
export function toon(
  color: ColorRepresentation,
  emissive?: ColorRepresentation,
  emissiveIntensity = 0.15,
): MeshToonMaterial {
  const key = `${new Color(color).getHexString()}|${emissive ?? ''}|${emissiveIntensity}`;
  let m = toonCache.get(key);
  if (!m) {
    m = new MeshToonMaterial({ color, gradientMap: ramp() });
    if (emissive) {
      m.emissive.set(emissive);
      m.emissiveIntensity = emissiveIntensity;
    }
    toonCache.set(key, m);
  }
  return m;
}

const outlineCache = new Map<string, MeshBasicMaterial>();

/** Inverted-hull outline: back faces pushed out along their normals. */
export function outline(
  color: ColorRepresentation = '#2a1d1a',
  thickness = 0.03,
): MeshBasicMaterial {
  const key = `${new Color(color).getHexString()}|${thickness}`;
  let m = outlineCache.get(key);
  if (!m) {
    m = new MeshBasicMaterial({ color, side: BackSide });
    m.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>\n transformed += normalize(normal) * ${thickness.toFixed(4)};`,
      );
    };
    m.customProgramCacheKey = () => `outline-${thickness}`;
    outlineCache.set(key, m);
  }
  return m;
}

export function clearMaterialCache(): void {
  cache.forEach((m) => m.dispose());
  cache.clear();
  toonCache.forEach((m) => m.dispose());
  toonCache.clear();
  outlineCache.forEach((m) => m.dispose());
  outlineCache.clear();
  toonRamp?.dispose();
  toonRamp = null;
}
