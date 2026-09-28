export interface ExperienceProject {
  /** Links to a featured project in projects.data.ts when one exists. */
  projectId?: string;
  name: string;
  description?: string;
  responsibilities: string[];
  technologies: string[];
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  /** ISO month strings, e.g. "2023-06". `null` end means present. */
  start: string;
  end: string | null;
  projects: ExperienceProject[];
}
