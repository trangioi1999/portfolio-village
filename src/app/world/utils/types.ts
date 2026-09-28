import { Object3D } from 'three';
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

export interface VillageObject {
  root: Object3D;
  update?: Updater;
}

export interface BuildingObject extends VillageObject {
  id: BuildingId;
}
