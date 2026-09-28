export interface SocialLink {
  label: string;
  /** `null` when the profile is not available yet — rendered as a placeholder. */
  url: string | null;
  icon: 'github' | 'linkedin';
}

export interface Profile {
  name: string;
  role: string;
  experienceLabel: string;
  headline: string;
  tagline: string;
  motto: string;
  intro: string;
  summary: string[];
  email: string;
  phone: string;
  /** Phone number in E.164 form for tel: links. */
  phoneHref: string;
  location: string;
  socials: SocialLink[];
  philosophy: { title: string; text: string }[];
  careerDirection: string;
}

export type LearningStatus = 'practicing' | 'exploring' | 'goal';

export interface LearningItem {
  id: string;
  title: string;
  status: LearningStatus;
  description: string;
}

export interface Companion {
  id: string;
  name: string;
  trait: string;
  description: string;
  greeting: string;
  color: string;
  accent: string;
  species: 'fox' | 'cat' | 'bunny' | 'owl' | 'bear';
  /** Building the companion hangs around. `avatar` = follows Giỏi. */
  home: 'avatar' | 'workshop' | 'career' | 'academy' | 'about';
}
