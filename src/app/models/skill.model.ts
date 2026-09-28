export interface Skill {
  name: string;
  /** File name (without extension) inside /public/icons/tech. */
  icon?: string;
}

export interface SkillGroup {
  id: string;
  label: string;
  description: string;
  /** Crystal colour used in the 3D Skills Garden and on the badge accents. */
  color: string;
  skills: Skill[];
}
