import { Companion, LearningItem, Profile } from '../models/portfolio.model';

export const PROFILE: Profile = {
  name: 'Trần Văn Giỏi',
  role: 'Frontend Developer',
  experienceLabel: '4+ Years of Experience',
  headline: 'Build beautiful UI. Create better experiences.',
  tagline: 'Explore my world. Discover my work. Build better experiences.',
  motto: 'Not just a developer, but a problem solver.',
  intro:
    'Middle Frontend Engineer with 4+ years of experience building scalable, user-focused web applications — specialised in Angular and enterprise MES platforms.',
  summary: [
    'Middle Frontend Engineer with 4+ years of experience building scalable, user-focused web applications.',
    'Specialized in Angular with a strong foundation in JavaScript, TypeScript, HTML, and SCSS.',
    'Experienced in cross-platform development with Flutter and backend integration via Firebase and RESTful APIs.',
    'Experienced in Micro Frontend and enterprise MES platforms.',
  ],
  email: 'trangioi205@gmail.com',
  phone: '0368.869.479',
  phoneHref: '+84368869479',
  location: 'Ho Chi Minh City (HCMC), Vietnam',
  // Profiles are not published yet — set a URL to turn the placeholder into a real link.
  socials: [
    { label: 'GitHub', url: null, icon: 'github' },
    { label: 'LinkedIn', url: null, icon: 'linkedin' },
  ],
  philosophy: [
    {
      title: 'Users first',
      text: 'Interfaces should feel clear and friendly, even when the system behind them is complex.',
    },
    {
      title: 'Scalable by design',
      text: 'Well-structured components and modules keep large Angular applications easy to grow.',
    },
    {
      title: 'Keep improving',
      text: 'Every project is a chance to learn something new and do it a little better next time.',
    },
  ],
  careerDirection:
    'Growing toward a Frontend Leader role — deepening frontend architecture skills, improving English, and using AI to work more productively.',
};

export const LEARNING: readonly LearningItem[] = [
  {
    id: 'fe-architecture',
    title: 'Frontend architecture',
    status: 'practicing',
    description: 'Applying Micro Frontend architecture on enterprise MES platforms at work.',
  },
  {
    id: 'angular-ecosystem',
    title: 'Angular ecosystem',
    status: 'practicing',
    description: 'Keeping up with modern Angular — standalone components, signals and new APIs.',
  },
  {
    id: 'english',
    title: 'English learning',
    status: 'practicing',
    description: 'Practising English regularly for work and international collaboration.',
  },
  {
    id: 'threejs',
    title: 'Three.js exploration',
    status: 'exploring',
    description: 'Exploring 3D on the web — this village is my playground.',
  },
  {
    id: 'ai-dev',
    title: 'AI-assisted development',
    status: 'exploring',
    description: 'Using AI tools to be more productive in everyday development.',
  },
  {
    id: 'toeic',
    title: 'TOEIC 700',
    status: 'goal',
    description: 'Target score for my English learning journey.',
  },
  {
    id: 'fe-leader',
    title: 'Frontend Leader',
    status: 'goal',
    description: 'Growing into a role where I can guide frontend architecture and help a team.',
  },
  {
    id: 'continuous',
    title: 'Continuous improvement',
    status: 'goal',
    description: 'Keep learning, keep growing — a little better every project.',
  },
];

/** Original spirit companions — each represents a developer trait. */
export const COMPANIONS: readonly Companion[] = [
  {
    id: 'bit',
    name: 'Bit',
    trait: 'Logic',
    description: 'A calm little fox who breaks big problems into clear steps.',
    greeting: 'One step at a time!',
    color: '#bfe4ff',
    accent: '#4f8fd6',
    species: 'fox',
    home: 'avatar',
  },
  {
    id: 'pixel',
    name: 'Pixel',
    trait: 'Creativity',
    description: 'Paints every interface with a little bit of joy.',
    greeting: 'What if we tried a new colour?',
    color: '#ffd1e8',
    accent: '#e0569b',
    species: 'cat',
    home: 'workshop',
  },
  {
    id: 'patch',
    name: 'Patch',
    trait: 'Problem Solving',
    description: 'Never gives up until the bug is squashed.',
    greeting: 'Found it! Fixing now.',
    color: '#ffe0b3',
    accent: '#e08a3c',
    species: 'bear',
    home: 'career',
  },
  {
    id: 'sprout',
    name: 'Sprout',
    trait: 'Learning',
    description: 'Grows a little every single day.',
    greeting: 'Learned something new today!',
    color: '#d4f5c4',
    accent: '#5fae4f',
    species: 'bunny',
    home: 'academy',
  },
  {
    id: 'echo',
    name: 'Echo',
    trait: 'Collaboration',
    description: 'Listens carefully and helps the whole team move together.',
    greeting: "Let's build it together.",
    color: '#e3d6ff',
    accent: '#7a5cc2',
    species: 'owl',
    home: 'about',
  },
];

/**
 * Optional GLB for the avatar (e.g. 'models/avatar.glb' in /public). When set, it replaces the
 * built-in procedural chibi. Animation clips whose names contain "idle" and "walk" are used.
 * Tip: generate one from the concept art with an image-to-3D tool, then export as GLB.
 */
export const AVATAR_MODEL: string | null = null;
