import { Injectable } from '@angular/core';
import { BUILDINGS, BUILDING_MAP } from '../data/buildings.data';
import { EXPERIENCES } from '../data/experience.data';
import { COMPANIONS, LEARNING, PROFILE } from '../data/portfolio.data';
import { PROJECTS } from '../data/projects.data';
import { SKILL_GROUPS, TECH_ICONS } from '../data/skills.data';
import { BuildingId } from '../models/building.model';

/** Single access point for portfolio content — keeps data separate from rendering. */
@Injectable({ providedIn: 'root' })
export class PortfolioDataService {
  readonly profile = PROFILE;
  readonly buildings = BUILDINGS;
  readonly experiences = EXPERIENCES;
  readonly projects = PROJECTS;
  readonly skillGroups = SKILL_GROUPS;
  readonly learning = LEARNING;
  readonly companions = COMPANIONS;

  building(id: BuildingId) {
    return BUILDING_MAP[id];
  }

  project(id: string | null | undefined) {
    return id ? (this.projects.find((p) => p.id === id) ?? null) : null;
  }

  techIcon(name: string): string | null {
    const icon = TECH_ICONS[name];
    return icon ? `icons/tech/${icon}.svg` : null;
  }

  /** "2023-06" → "Jun 2023"; `null` → "Present". */
  formatMonth(value: string | null): string {
    if (!value) return 'Present';
    const [year, month] = value.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  }

  /** Human duration between two ISO months, inclusive of the start month. */
  duration(start: string, end: string | null, now = new Date()): string {
    const [sy, sm] = start.split('-').map(Number);
    const [ey, em] = end ? end.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1];
    const months = (ey - sy) * 12 + (em - sm) + 1;
    const years = Math.floor(months / 12);
    const rest = months % 12;
    const parts = [];
    if (years) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
    if (rest) parts.push(`${rest} mo${rest > 1 ? 's' : ''}`);
    return parts.join(' ');
  }
}
