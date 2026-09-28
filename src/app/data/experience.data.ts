import { Experience } from '../models/experience.model';
import { PROJECTS } from './projects.data';

const featured = (id: string) => {
  const p = PROJECTS.find((project) => project.id === id);
  if (!p) throw new Error(`Unknown project ${id}`);
  return {
    projectId: p.id,
    name: `${p.fullName}${p.name !== p.fullName ? ` (${p.name})` : ''}`,
    description: p.description,
    responsibilities: p.responsibilities,
    technologies: p.technologies,
  };
};

/**
 * Work history from the CV, newest first. Floors of the Career Tower follow this order
 * (top floor = most recent). Projects without CV details keep empty lists and the UI
 * shows a short "details available on request" note instead of invented content.
 */
export const EXPERIENCES: readonly Experience[] = [
  {
    id: 'fpt-is',
    company: 'FPT IS Company Limited',
    role: 'Frontend Developer',
    start: '2023-06',
    end: null,
    projects: [featured('stma'), featured('ebr'), featured('dmp')],
  },
  {
    id: 'gsoft',
    company: 'GSOFT',
    role: 'Frontend Developer',
    start: '2022-09',
    end: '2023-05',
    projects: [
      { name: 'Centralized Procurement', responsibilities: [], technologies: [] },
      { name: 'Loyalty Web Application', responsibilities: [], technologies: [] },
    ],
  },
  {
    id: 'nata',
    company: 'Nata Vietnam Service Technology JSC',
    role: 'Frontend Developer',
    start: '2021-03',
    end: '2022-06',
    projects: [{ name: 'Fast pass-health', responsibilities: [], technologies: [] }],
  },
];
