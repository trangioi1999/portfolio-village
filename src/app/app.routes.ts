import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home-page';

const suffix = ' · Trần Văn Giỏi — Frontend Developer';

/** Each route maps to one building in the village via `data.building`. */
export const routes: Routes = [
  {
    path: '',
    component: HomePage,
    title: "Trần Văn Giỏi — Frontend Developer · Giỏi's Developer Village",
    data: { building: 'plaza' },
  },
  {
    path: 'experience',
    loadComponent: () => import('./pages/experience/experience-page').then((m) => m.ExperiencePage),
    title: `Work Experience${suffix}`,
    data: { building: 'career' },
  },
  {
    path: 'projects',
    loadComponent: () => import('./pages/projects/projects-page').then((m) => m.ProjectsPage),
    title: `Featured Projects${suffix}`,
    data: { building: 'workshop' },
  },
  {
    path: 'skills',
    loadComponent: () => import('./pages/skills/skills-page').then((m) => m.SkillsPage),
    title: `Technical Skills${suffix}`,
    data: { building: 'garden' },
  },
  {
    path: 'learning',
    loadComponent: () => import('./pages/learning/learning-page').then((m) => m.LearningPage),
    title: `Learning & Growth${suffix}`,
    data: { building: 'academy' },
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about-page').then((m) => m.AboutPage),
    title: `About Me${suffix}`,
    data: { building: 'about' },
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact-page').then((m) => m.ContactPage),
    title: `Contact${suffix}`,
    data: { building: 'contact' },
  },
  { path: '**', redirectTo: '' },
];
