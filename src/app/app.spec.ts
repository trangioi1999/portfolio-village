import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { WorldStateService } from './services/world-state.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
    // jsdom has no WebGL — the app must fall back to the classic view.
    TestBed.inject(WorldStateService).viewMode.set('classic');
  });

  it('creates the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the primary navigation as accessible links', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const labels = Array.from(el.querySelectorAll('nav[aria-label="Village map"] a')).map((a) =>
      a.textContent?.trim(),
    );
    expect(labels).toContain('Experience');
    expect(labels).toContain('Contact');
    expect(el.querySelector('a[href="#main"]')).toBeTruthy();
  });
});
