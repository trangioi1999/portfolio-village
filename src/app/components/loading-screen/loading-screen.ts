import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { AudioService } from '../../services/audio.service';
import { WorldStateService } from '../../services/world-state.service';
import { AvatarPortrait } from '../avatar-portrait/avatar-portrait';
import { Icon } from '../icon/icon';

/**
 * Loader + "Enter the village" gate. The gate lets visitors opt into sound with a real user
 * gesture (required by browsers) and gives the intro camera flight a clear starting moment.
 * Shown once per browser session; the classic view skips it entirely.
 */
@Component({
  selector: 'app-loading-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarPortrait, Icon],
  styles: `
    .sun-rays {
      background: repeating-conic-gradient(
        from 0deg,
        rgb(255 255 255 / 0.22) 0deg 8deg,
        transparent 8deg 20deg
      );
      mask-image: radial-gradient(circle, #000 20%, transparent 65%);
      animation: spin 60s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    .bob {
      animation: float-soft 3.2s ease-in-out infinite;
    }
  `,
  template: `
    @if (visible()) {
      <div
        class="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-[radial-gradient(120%_80%_at_50%_0%,#e6f6fd_0%,#9fd5f0_45%,#f6e3bd_100%)] px-6 transition-opacity duration-700"
        [class.opacity-0]="leaving()"
        [class.pointer-events-none]="leaving()"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-title"
      >
        <div
          class="sun-rays pointer-events-none absolute -top-[80vmax] left-1/2 size-[160vmax] -translate-x-1/2"
        ></div>
        <div class="relative w-full max-w-md text-center">
          <div
            class="bob relative mx-auto mb-4 grid size-32 place-items-center rounded-full bg-parchment-50/80 shadow-[var(--shadow-lift)] ring-4 ring-white/70"
          >
            <app-avatar-portrait [size]="112" />
            <span
              class="absolute -right-1 -bottom-1 grid size-10 place-items-center rounded-full bg-leaf-500 text-white shadow ring-4 ring-parchment-50"
            >
              <app-icon name="sprout" [size]="18" />
            </span>
          </div>
          <p class="eyebrow">Trần Văn Giỏi · Frontend Developer</p>
          <h2
            id="gate-title"
            class="mt-1 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl"
          >
            Giỏi's Developer Village
          </h2>
          <p class="mt-1 font-hand text-xl text-wood-700">{{ message() }}</p>

          @if (!ready()) {
            <div
              class="wood mx-auto mt-6 h-4 w-full max-w-sm overflow-hidden rounded-full p-0.5"
              role="progressbar"
              aria-label="Loading the 3D village"
              aria-valuemin="0"
              aria-valuemax="100"
              [attr.aria-valuenow]="percent()"
            >
              <div
                class="h-full rounded-full bg-gradient-to-r from-sun-300 to-leaf-400"
                [style.width.%]="percent()"
              ></div>
            </div>
          } @else {
            <div class="animate-rise mt-6 flex flex-col items-center gap-3">
              <button
                #enterBtn
                type="button"
                class="btn btn-primary btn-shine !min-h-13 !px-8 !text-lg"
                data-silent
                (click)="enter(true)"
              >
                <app-icon name="sound-on" [size]="20" /> Enter the village
              </button>
              <button
                type="button"
                class="btn btn-ghost !min-h-10 !text-sm"
                data-silent
                (click)="enter(false)"
              >
                <app-icon name="sound-off" [size]="16" /> Enter quietly
              </button>
            </div>
          }
          <button
            type="button"
            class="mt-5 text-sm font-bold text-ink-700 underline decoration-wood-400/60 underline-offset-4 hover:text-ink-900"
            data-silent
            (click)="skip()"
          >
            Skip 3D — view the classic portfolio
          </button>
        </div>
      </div>
    }
  `,
})
export class LoadingScreen {
  private readonly state = inject(WorldStateService);
  private readonly audio = inject(AudioService);
  private readonly enterBtn = viewChild<ElementRef<HTMLButtonElement>>('enterBtn');

  private readonly timedOut = signal(false);
  protected readonly ready = computed(() => this.state.status() !== 'loading' || this.timedOut());
  private readonly done = computed(
    () =>
      this.state.viewMode() === 'classic' ||
      (this.state.entered() && this.state.status() !== 'loading'),
  );
  protected readonly leaving = signal(false);
  protected readonly visible = signal(!this.done());
  protected readonly percent = computed(() => Math.round(this.state.progress() * 100));
  protected readonly message = computed(() => {
    if (this.ready()) return 'Explore my world. Discover my work.';
    const p = this.state.progress();
    if (p < 0.25) return 'Waking up the village…';
    if (p < 0.55) return 'Shaping the floating island…';
    if (p < 0.85) return 'Building houses and planting trees…';
    return 'Calling the spirit companions…';
  });

  constructor() {
    effect(() => {
      if (this.done() && this.visible() && !this.leaving()) {
        this.leaving.set(true);
        setTimeout(() => this.visible.set(false), 750);
      }
    });
    afterRenderEffect(() => this.enterBtn()?.nativeElement.focus());
    // Never keep visitors waiting on a slow device: offer the gate anyway.
    setTimeout(() => this.timedOut.set(true), 12000);
  }

  protected enter(withSound: boolean): void {
    this.state.enterVillage(withSound);
    // Audio context is created inside this click → allowed by autoplay policies.
    if (withSound) setTimeout(() => this.audio.play('greet'), 150);
    if (this.state.status() === 'loading') {
      this.leaving.set(true);
      setTimeout(() => this.visible.set(false), 750);
    }
  }

  protected skip(): void {
    this.state.viewMode.set('classic');
  }
}
