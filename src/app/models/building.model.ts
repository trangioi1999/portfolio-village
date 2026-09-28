/** Identifiers for every explorable location in the village. */
export type BuildingId =
  'plaza' | 'career' | 'workshop' | 'garden' | 'academy' | 'about' | 'contact';

export type IconName =
  | 'home'
  | 'tower'
  | 'hammer'
  | 'sprout'
  | 'book'
  | 'house'
  | 'mail'
  | 'phone'
  | 'pin'
  | 'close'
  | 'sound-on'
  | 'sound-off'
  | 'motion'
  | 'target'
  | 'cube'
  | 'list'
  | 'github'
  | 'linkedin'
  | 'chevron-right'
  | 'chevron-down'
  | 'arrow-right'
  | 'calendar'
  | 'briefcase'
  | 'check'
  | 'copy'
  | 'send'
  | 'layers'
  | 'sparkles'
  | 'compass'
  | 'flag'
  | 'user'
  | 'settings';

export interface Building {
  id: BuildingId;
  /** Display name shown on the 3D signboard and panel header. */
  name: string;
  /** Short tagline shown under the name. */
  subtitle: string;
  /** Portfolio section the building represents. */
  section: string;
  /** One-sentence description used for tooltips and screen readers. */
  description: string;
  /** Router path (without leading slash). */
  route: string;
  icon: IconName;
  /** Label for the main navigation menu. */
  navLabel: string;
  /** Short label for compact navigation (mobile bottom bar). */
  shortLabel: string;
  /** Ground position on the island (x, z). */
  position: readonly [number, number];
  /** Y rotation in radians so the entrance faces the plaza. */
  rotation: number;
  /** Height of the signboard anchor above the ground. */
  labelHeight: number;
  /** Camera distance used when focusing on this building. */
  focusDistance: number;
  /** Radius of the selection ring drawn under the building. */
  footprint: number;
  /** Optional GLB model that replaces the procedural building when provided. */
  modelUrl?: string;
}
