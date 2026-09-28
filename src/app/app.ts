import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingScreen } from './components/loading-screen/loading-screen';
import { NavigationMenu } from './components/navigation/navigation-menu';
import { WorldFallback } from './components/world-fallback/world-fallback';
import { AudioService } from './services/audio.service';
import { WorldStateService } from './services/world-state.service';
import { VillageWorld } from './world/village-world';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavigationMenu, LoadingScreen, WorldFallback, VillageWorld],
  template: `
    <a
      href="#main"
      class="sr-only-focusable fixed top-3 left-3 z-[60] rounded-full bg-ink-900 px-4 py-2 font-bold text-parchment-50"
    >
      Skip to content
    </a>

    <app-world-fallback />
    @if (worldMode()) {
      <!-- Three.js lives in a lazily loaded chunk so the portfolio content paints first. -->
      @defer (on immediate) {
        <app-village-world />
      }
    }

    <app-navigation-menu />

    <main id="main" tabindex="-1" class="outline-none" [class]="mainClass()">
      <router-outlet />
    </main>

    <app-loading-screen />
  `,
})
export class App {
  private readonly state = inject(WorldStateService);
  private readonly audio = inject(AudioService);

  protected readonly worldMode = computed(() => this.state.viewMode() === 'world');
  protected readonly mainClass = computed(() =>
    this.worldMode()
      ? 'relative z-10'
      : 'relative z-10 block min-h-dvh px-4 pt-24 pb-28 lg:pt-8 lg:pr-8 lg:pb-12 lg:pl-[18.5rem]',
  );

  constructor() {
    // Open / close sounds when entering or leaving a building (skip the initial route).
    let first = true;
    effect(() => {
      const id = this.state.activeBuilding();
      if (first) {
        first = false;
        return;
      }
      this.audio.enterBuilding(id === 'plaza');
    });
  }
}
