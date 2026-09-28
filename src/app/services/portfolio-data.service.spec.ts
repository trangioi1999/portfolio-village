import { TestBed } from '@angular/core/testing';
import { BUILDINGS } from '../data/buildings.data';
import { routes } from '../app.routes';
import { PortfolioDataService } from './portfolio-data.service';

describe('PortfolioDataService', () => {
  let service: PortfolioDataService;

  beforeEach(() => {
    service = TestBed.inject(PortfolioDataService);
  });

  it('formats ISO months and open-ended dates', () => {
    expect(service.formatMonth('2023-06')).toBe('Jun 2023');
    expect(service.formatMonth(null)).toBe('Present');
  });

  it('computes inclusive durations', () => {
    expect(service.duration('2022-09', '2023-05')).toBe('9 mos');
    expect(service.duration('2021-03', '2022-06')).toBe('1 yr 4 mos');
  });

  it('keeps the CV work history in order, newest first', () => {
    expect(service.experiences.map((e) => e.company)).toEqual([
      'FPT IS Company Limited',
      'GSOFT',
      'Nata Vietnam Service Technology JSC',
    ]);
  });

  it('only features the three FPT IS projects', () => {
    expect(service.projects.map((p) => p.id)).toEqual(['stma', 'ebr', 'dmp']);
    expect(service.project('stma')?.fullName).toBe('Station Tool Machine Asset');
    expect(service.project('unknown')).toBeNull();
  });

  it('does not publish invented social profiles', () => {
    expect(service.profile.socials.every((s) => s.url === null)).toBe(true);
  });

  it('maps every building to a route', () => {
    const paths = routes.map((r) => r.path);
    for (const b of BUILDINGS) expect(paths).toContain(b.route);
  });

  it('resolves technology icons', () => {
    expect(service.techIcon('Angular')).toBe('icons/tech/angular.svg');
    expect(service.techIcon('Micro Frontend')).toBeNull();
  });
});
