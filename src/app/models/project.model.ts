export interface ProjectLayer {
  label: string;
  technologies: string[];
}

export interface ProjectTheme {
  /** Two gradient stops used for the generated thumbnail illustration. */
  from: string;
  to: string;
  accent: string;
}

export interface Project {
  id: string;
  /** Short name, e.g. "STMA". */
  name: string;
  fullName: string;
  company: string;
  summary: string;
  description: string;
  responsibilities: string[];
  technologies: string[];
  keyFeatures: string[];
  /** Optional technology-layer overview rendered as a simple diagram. */
  layers?: ProjectLayer[];
  /** Optional screenshot URLs (relative to /public). */
  screenshots?: string[];
  theme: ProjectTheme;
}
