import { Project } from '../models/project.model';

/**
 * Featured projects — sourced from the CV. The three akaMES products share the same
 * technology stack. Responsibilities are summarised from the CV profile; replace them
 * with the exact CV bullet points whenever they are updated.
 */
const SHARED_STACK = [
  'Angular',
  'Flutter',
  'Node.js',
  'Micro Frontend',
  'Java',
  'Spring Boot',
  'Microservices',
  'WebSocket',
  'Kafka',
  'Redis',
  'PostgreSQL',
  'Docker',
  'Azure',
];

const SHARED_LAYERS = [
  { label: 'Web & Mobile clients', technologies: ['Angular', 'Micro Frontend', 'Flutter'] },
  { label: 'Real-time', technologies: ['WebSocket', 'Kafka'] },
  { label: 'Services', technologies: ['Node.js', 'Java', 'Spring Boot', 'Microservices'] },
  { label: 'Data', technologies: ['PostgreSQL', 'Redis'] },
  { label: 'Infrastructure', technologies: ['Docker', 'Azure'] },
];

const SHARED_RESPONSIBILITIES = [
  'Build and maintain Angular front-end modules inside a Micro Frontend architecture.',
  'Develop cross-platform screens with Flutter alongside the web application.',
  'Integrate the UI with backend services through RESTful APIs and real-time WebSocket data.',
  'Deliver production-grade features for an enterprise MES (Manufacturing Execution System) platform.',
];

export const PROJECTS: readonly Project[] = [
  {
    id: 'stma',
    name: 'STMA',
    fullName: 'Station Tool Machine Asset',
    company: 'FPT IS Company Limited',
    summary: 'Smart asset management for stations, tools and machines.',
    description:
      'A smart asset management system designed to monitor and optimize the utilization of stations, tools, and machines throughout the manufacturing process.',
    responsibilities: SHARED_RESPONSIBILITIES,
    technologies: SHARED_STACK,
    keyFeatures: [
      'Monitoring of stations, tools and machines',
      'Utilization optimization across the manufacturing process',
    ],
    layers: SHARED_LAYERS,
    theme: { from: '#3f8f83', to: '#1f4f6b', accent: '#9be3c9' },
  },
  {
    id: 'ebr',
    name: 'EBR',
    fullName: 'Electronic Batch Records',
    company: 'FPT IS Company Limited',
    summary: 'Electronic batch records with compliance and traceability.',
    description:
      'A digital solution for managing and storing electronic batch production records, supporting compliance, traceability, and manufacturing efficiency.',
    responsibilities: SHARED_RESPONSIBILITIES,
    technologies: SHARED_STACK,
    keyFeatures: [
      'Management and storage of electronic batch production records',
      'Compliance support',
      'Production traceability',
    ],
    layers: SHARED_LAYERS,
    theme: { from: '#7a5cc2', to: '#2e2f6b', accent: '#d7c6ff' },
  },
  {
    id: 'dmp',
    name: 'Digital Manufacturing Platform',
    fullName: 'Digital Manufacturing Platform',
    company: 'FPT IS Company Limited',
    summary: 'Production execution, ERP & machinery integration, product lifecycle.',
    description:
      'A manufacturing platform supporting production execution, ERP integration, machinery integration, and the product lifecycle.',
    responsibilities: SHARED_RESPONSIBILITIES,
    technologies: SHARED_STACK,
    keyFeatures: [
      'Production execution',
      'ERP integration',
      'Machinery integration',
      'Product lifecycle support',
    ],
    layers: SHARED_LAYERS,
    theme: { from: '#e08a3c', to: '#8a3b2f', accent: '#ffd9a0' },
  },
];
