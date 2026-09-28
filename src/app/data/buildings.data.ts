import { Building, BuildingId } from '../models/building.model';

/** Default camera azimuth (radians) — shared with the 3D camera. */
export const VIEW_AZIMUTH = 0.32;

/**
 * Rotation that turns a building's front (+z) half toward the plaza and half toward the
 * default camera, so every façade stays readable from the overview.
 */
const faceViewer = (x: number, z: number): number => {
  const len = Math.hypot(x, z) || 1;
  const fx = (-x / len) * 0.6 + Math.sin(VIEW_AZIMUTH);
  const fz = (-z / len) * 0.6 + Math.cos(VIEW_AZIMUTH);
  return Math.atan2(fx, fz);
};

export const BUILDINGS: readonly Building[] = [
  {
    id: 'plaza',
    name: 'Central Plaza',
    subtitle: 'Welcome to the village',
    section: 'Home',
    description: 'The heart of the village, where Giỏi welcomes every visitor.',
    route: '',
    icon: 'home',
    navLabel: 'Home',
    shortLabel: 'Home',
    position: [0, 0],
    rotation: 0,
    labelHeight: 5.2,
    focusDistance: 62,
    footprint: 6.5,
  },
  {
    id: 'career',
    name: 'Career Tower',
    subtitle: '4+ years of frontend work',
    section: 'Work Experience',
    description: 'Each floor of the tower holds a chapter of my career.',
    route: 'experience',
    icon: 'tower',
    navLabel: 'Experience',
    shortLabel: 'Career',
    position: [0, -17],
    rotation: faceViewer(0, -17),
    labelHeight: 16,
    focusDistance: 44,
    footprint: 5.5,
  },
  {
    id: 'workshop',
    name: 'Project Workshop',
    subtitle: 'From ideas to products',
    section: 'Featured Projects',
    description: 'Blueprints, machines and screens of the products I help build.',
    route: 'projects',
    icon: 'hammer',
    navLabel: 'Projects',
    shortLabel: 'Projects',
    position: [-21, -4],
    rotation: faceViewer(-21, -4),
    labelHeight: 7.8,
    focusDistance: 34,
    footprint: 6.5,
  },
  {
    id: 'garden',
    name: 'Skills Garden',
    subtitle: 'Tools & technologies',
    section: 'Technical Skills',
    description: 'Glowing crystals grow here — one for every family of tools I use.',
    route: 'skills',
    icon: 'sprout',
    navLabel: 'Skills',
    shortLabel: 'Skills',
    position: [17, -3],
    rotation: faceViewer(17, -3),
    labelHeight: 5,
    focusDistance: 32,
    footprint: 7,
  },
  {
    id: 'academy',
    name: 'Learning Academy',
    subtitle: 'English · AI · New skills',
    section: 'Learning & Growth',
    description: 'A quiet academy for the things I am learning next.',
    route: 'learning',
    icon: 'book',
    navLabel: 'Learning',
    shortLabel: 'Learn',
    position: [-9, 14],
    rotation: faceViewer(-9, 14),
    labelHeight: 10.5,
    focusDistance: 34,
    footprint: 6,
  },
  {
    id: 'about',
    name: 'About Me House',
    subtitle: 'Who I am',
    section: 'About Me',
    description: 'My cozy home — the story behind the developer.',
    route: 'about',
    icon: 'house',
    navLabel: 'About',
    shortLabel: 'About',
    position: [14, 12],
    rotation: faceViewer(14, 12),
    labelHeight: 7,
    focusDistance: 32,
    footprint: 5.5,
  },
  {
    id: 'contact',
    name: 'Contact Shrine',
    subtitle: 'Send me a message',
    section: 'Contact',
    description: 'A little shrine by the waterfall where messages find their way to me.',
    route: 'contact',
    icon: 'mail',
    navLabel: 'Contact',
    shortLabel: 'Contact',
    position: [13, -20],
    rotation: faceViewer(13, -20),
    labelHeight: 6,
    focusDistance: 32,
    footprint: 5,
  },
];

export const BUILDING_MAP: Readonly<Record<BuildingId, Building>> = Object.fromEntries(
  BUILDINGS.map((b) => [b.id, b]),
) as Record<BuildingId, Building>;
