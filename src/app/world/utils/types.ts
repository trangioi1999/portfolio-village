import { MeshStandardMaterial, Object3D, Vector3 } from 'three';
import { BuildingId } from '../../models/building.model';
import { RenderQuality } from '../../services/world-state.service';
import { Rng } from './random';

export type Updater = (dt: number, elapsed: number) => void;

export interface BuildContext {
  quality: RenderQuality;
  rng: Rng;
  /** Live flag — animations read it every frame. */
  reducedMotion: () => boolean;
}

export interface Entrance {
  outside: readonly [number, number];
  inside: readonly [number, number];
}

/** Camera framing for looking into an opened building. */
export interface InteriorView {
  /** Polar angle from vertical (smaller = looking down more steeply). */
  polar: number;
  /** Multiplier on the building's regular focus distance. */
  distance: number;
  /** Height of the look-at target. */
  height: number;
}

/** Opens a building up so its interior shows (see objects/reveal.ts). */
export interface RevealHandle {
  /** Local point for the warm interior light, if the building has a room inside. */
  light?: readonly [number, number, number];
  /** Peak intensity of that light. */
  lightIntensity?: number;
  /** Doorstep → spot just inside (local x/z) the avatar walks through when entering. */
  entrance?: Entrance;
  /** Camera framing used while the building is open. */
  view?: InteriorView;
  /** Called once the building is placed; `highlight` = hover materials to keep in sync. */
  init(highlight: MeshStandardMaterial[]): void;
  /** 0 = closed, 1 = fully open. */
  set(k: number): void;
  /** Fade out walls that block the view from `eye` into the open room (call every frame). */
  face?(eye: Vector3, dt: number): void;
}

export interface VillageObject {
  root: Object3D;
  update?: Updater;
  reveal?: RevealHandle;
}

export interface BuildingObject extends VillageObject {
  id: BuildingId;
}
