import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { Skill } from '../../models/skill.model';

/** Skill tile with logo (or a monogram when no logo is available). */
@Component({
  selector: 'app-skill-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      class="group flex h-full items-center gap-3 rounded-2xl border border-wood-400/25 bg-white/70 px-3 py-2.5 shadow-[0_2px_0_rgb(154_106_63/0.12)] lift hover:bg-white"
    >
      <span class="grid size-9 shrink-0 place-items-center rounded-xl" [style.background]="tint()">
        @if (skill().icon && !failed()) {
          <img
            [src]="'icons/tech/' + skill().icon + '.svg'"
            alt=""
            width="22"
            height="22"
            class="size-5.5"
            loading="lazy"
            (error)="failed.set(true)"
          />
        } @else {
          <span class="font-display text-sm font-bold" [style.color]="color()">{{
            monogram()
          }}</span>
        }
      </span>
      <span class="text-sm leading-snug font-bold text-ink-800">{{ skill().name }}</span>
    </div>
  `,
})
export class SkillBadge {
  readonly skill = input.required<Skill>();
  readonly color = input('#5fa447');
  protected readonly failed = signal(false);
  protected readonly tint = computed(() => `${this.color()}1f`);
  protected readonly monogram = computed(() =>
    this.skill()
      .name.split(/[\s-]+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  );
}
