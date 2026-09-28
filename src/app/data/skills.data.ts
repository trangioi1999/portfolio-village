import { SkillGroup } from '../models/skill.model';

/** Technical skills from the CV. No proficiency percentages on purpose. */
export const SKILL_GROUPS: readonly SkillGroup[] = [
  {
    id: 'frontend',
    label: 'Frontend',
    description: 'Where I spend most of my days.',
    color: '#e0564b',
    skills: [
      { name: 'HTML', icon: 'html5' },
      { name: 'CSS', icon: 'css3' },
      { name: 'JavaScript', icon: 'javascript' },
      { name: 'TypeScript', icon: 'typescript' },
      { name: 'Angular', icon: 'angular' },
      { name: 'Flutter', icon: 'flutter' },
      { name: 'RxJS', icon: 'rxjs' },
      { name: 'PrimeNG', icon: 'primeng' },
      { name: 'Tailwind CSS', icon: 'tailwindcss' },
      { name: 'PrimeFlex' },
      { name: 'Angular Material', icon: 'angularmaterial' },
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    description: 'Server-side JavaScript for integrations.',
    color: '#5fae4f',
    skills: [{ name: 'Node.js', icon: 'nodejs' }],
  },
  {
    id: 'realtime',
    label: 'Real-time',
    description: 'Live data and notifications.',
    color: '#f2b23a',
    skills: [
      { name: 'Firebase Cloud Messaging', icon: 'firebase' },
      { name: 'Socket.IO', icon: 'socketio' },
      { name: 'Rx-STOMP' },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    description: 'Version control, containers and serving.',
    color: '#4f8fd6',
    skills: [
      { name: 'Git', icon: 'git' },
      { name: 'GitHub', icon: 'github' },
      { name: 'GitLab', icon: 'gitlab' },
      { name: 'Docker', icon: 'docker' },
      { name: 'Docker Compose', icon: 'docker' },
      { name: 'Nginx', icon: 'nginx' },
    ],
  },
  {
    id: 'databases',
    label: 'Databases',
    description: 'Storage I have worked with.',
    color: '#3aa8a0',
    skills: [
      { name: 'Firebase', icon: 'firebase' },
      { name: 'PostgreSQL', icon: 'postgresql' },
    ],
  },
  {
    id: 'cloud',
    label: 'Cloud',
    description: 'Microsoft Azure services.',
    color: '#2f7fe0',
    skills: [
      { name: 'Azure Cloud Service', icon: 'azure' },
      { name: 'Azure Kubernetes Service', icon: 'kubernetes' },
      { name: 'Azure Active Directory', icon: 'azure' },
      { name: 'Azure Blob Storage', icon: 'azure' },
    ],
  },
  {
    id: 'uiux',
    label: 'UI/UX',
    description: 'Design hand-off and prototyping.',
    color: '#c65fd6',
    skills: [{ name: 'Figma', icon: 'figma' }],
  },
  {
    id: 'pm',
    label: 'Project Management',
    description: 'Planning and tracking work with the team.',
    color: '#8c6a4a',
    skills: [{ name: 'Jira', icon: 'jira' }, { name: 'Redmine' }],
  },
];

/** Icon lookup for technology badges (project stacks etc.). */
export const TECH_ICONS: Readonly<Record<string, string>> = {
  ...Object.fromEntries(
    SKILL_GROUPS.flatMap((g) => g.skills)
      .filter((s) => s.icon)
      .map((s) => [s.name, s.icon as string]),
  ),
  Java: 'java',
  'Spring Boot': 'spring',
  Kafka: 'apachekafka',
  Redis: 'redis',
  Azure: 'azure',
  WebSocket: 'socketio',
};
