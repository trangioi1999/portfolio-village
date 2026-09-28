import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { BuildingId } from '../../models/building.model';
import { PortfolioDataService } from '../../services/portfolio-data.service';
import { WorldStateService } from '../../services/world-state.service';
import { Icon } from '../icon/icon';
import { ViewInset } from '../view-inset.directive';

/**
 * BuildingInfoPanel — the parchment panel that opens when a building is entered.
 * Side sheet on desktop, full-screen sheet on mobile, regular page in classic view.
 */
@Component({
  selector: 'app-portfolio-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, ViewInset],
  host: {
    '(document:keydown.escape)': 'onEscape($event)',
  },
  template: `
    <section
      appViewInset="right"
      class="parchment flex flex-col overflow-hidden"
      [class]="layoutClass()"
      [attr.aria-labelledby]="headingId()"
    >
      <header
        class="ink-banner relative flex shrink-0 items-center gap-3 overflow-hidden px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6"
      >
        <span
          class="pointer-events-none absolute -right-6 -bottom-10 size-32 rounded-full bg-sun-400/10 blur-xl"
          aria-hidden="true"
        ></span>
        <span
          class="animate-pop grid size-11 shrink-0 place-items-center rounded-full bg-sun-400 text-ink-900 shadow-inner ring-4 ring-sun-400/25"
        >
          <app-icon [name]="building().icon" [size]="22" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="font-display text-xs font-bold tracking-[0.14em] text-sun-300 uppercase">
            {{ building().name }}
          </p>
          <h1
            [id]="headingId()"
            #heading
            tabindex="-1"
            class="truncate font-display text-2xl font-bold text-parchment-50 outline-none sm:text-[1.7rem]"
          >
            {{ building().section }}
          </h1>
        </div>
        @if (!classic()) {
          <button
            type="button"
            class="btn-icon bg-white/10 text-parchment-50 hover:bg-white/20"
            (click)="close()"
            aria-label="Close panel and return to the plaza"
          >
            <app-icon name="close" />
          </button>
        }
      </header>
      <div class="scroll-soft min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
        @if (intro()) {
          <p class="mb-6 font-hand text-xl leading-snug text-wood-700">{{ intro() }}</p>
        }
        <ng-content />
      </div>
    </section>
  `,
})
export class PortfolioPanel {
  private readonly data = inject(PortfolioDataService);
  private readonly state = inject(WorldStateService);
  private readonly router = inject(Router);

  readonly buildingId = input.required<BuildingId>();
  readonly intro = input<string>();

  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  protected readonly building = computed(() => this.data.building(this.buildingId()));
  protected readonly headingId = computed(() => `panel-title-${this.buildingId()}`);
  protected readonly classic = computed(() => this.state.viewMode() === 'classic');
  protected readonly layoutClass = computed(() => {
    if (this.classic()) return 'relative mx-auto w-full max-w-4xl animate-rise';
    if (this.state.isMobile())
      return 'fixed inset-x-0 top-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 !rounded-none !rounded-b-3xl animate-rise';
    return 'fixed top-3 right-3 bottom-3 z-30 w-[min(580px,46vw)] animate-slide';
  });

  constructor() {
    afterNextRender(() => this.heading().nativeElement.focus({ preventScroll: true }));
  }

  close(): void {
    void this.router.navigate(['/']);
  }

  protected onEscape(event: Event): void {
    // Let open dialogs handle Escape themselves.
    if (this.classic() || document.querySelector('dialog[open]')) return;
    event.preventDefault();
    this.close();
  }
}
