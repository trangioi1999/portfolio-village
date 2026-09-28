import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AudioService } from '../../services/audio.service';
import { SoundMix, WorldStateService } from '../../services/world-state.service';
import { Icon } from '../icon/icon';

type MixKey = 'music' | 'ambience' | 'effects';

/** Sound settings: master switch, volume and per-channel toggles. */
@Component({
  selector: 'app-sound-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: { class: 'block' },
  template: `
    <div class="space-y-3">
      <button
        type="button"
        role="switch"
        [attr.aria-checked]="on()"
        class="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-left font-display font-bold text-ink-900 hover:bg-white/60"
        (click)="audio.toggle()"
      >
        <span
          class="grid size-9 place-items-center rounded-full"
          [class]="on() ? 'bg-leaf-500 text-white' : 'bg-wood-400/20 text-wood-700'"
        >
          <app-icon [name]="on() ? 'sound-on' : 'sound-off'" [size]="18" />
        </span>
        <span class="flex-1">Village sound</span>
        <span
          class="relative h-6 w-11 rounded-full transition"
          [class]="on() ? 'bg-leaf-500' : 'bg-wood-400/40'"
        >
          <span
            class="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition"
            [class.translate-x-5]="on()"
          ></span>
        </span>
      </button>

      <div class="space-y-2 px-2" [class.opacity-50]="!on()">
        <label class="flex items-center gap-3 text-sm font-bold text-ink-800">
          <span class="w-16">Volume</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            class="h-2 flex-1 cursor-pointer accent-leaf-600"
            [value]="mix().volume"
            [disabled]="!on()"
            (input)="setVolume($event)"
            aria-label="Volume"
          />
        </label>
        <div class="flex flex-wrap gap-1.5" role="group" aria-label="Sound channels">
          @for (ch of channels; track ch.key) {
            <button
              type="button"
              class="chip !min-h-9 transition"
              [class.!bg-leaf-500]="mix()[ch.key]"
              [class.!text-white]="mix()[ch.key]"
              [class.!border-leaf-600]="mix()[ch.key]"
              [attr.aria-pressed]="mix()[ch.key]"
              [disabled]="!on()"
              (click)="toggle(ch.key)"
            >
              {{ ch.label }}
            </button>
          }
        </div>
      </div>
    </div>
  `,
})
export class SoundControls {
  protected readonly audio = inject(AudioService);
  private readonly state = inject(WorldStateService);
  protected readonly on = this.state.soundEnabled;
  protected readonly mix = computed(() => this.state.soundMix());
  protected readonly channels: { key: MixKey; label: string }[] = [
    { key: 'music', label: 'Music' },
    { key: 'ambience', label: 'Nature' },
    { key: 'effects', label: 'Effects' },
  ];

  protected toggle(key: MixKey): void {
    this.state.soundMix.update((m: SoundMix) => ({ ...m, [key]: !m[key] }));
  }

  protected setVolume(event: Event): void {
    const volume = Number((event.target as HTMLInputElement).value);
    this.state.soundMix.update((m) => ({ ...m, volume }));
  }
}
