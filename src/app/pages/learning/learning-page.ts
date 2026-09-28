import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Icon } from '../../components/icon/icon';
import { PortfolioPanel } from '../../components/portfolio-panel/portfolio-panel';
import { IconName } from '../../models/building.model';
import { LearningStatus } from '../../models/portfolio.model';
import { PortfolioDataService } from '../../services/portfolio-data.service';

const SECTIONS: {
  status: LearningStatus;
  title: string;
  note: string;
  icon: IconName;
  tone: string;
}[] = [
  {
    status: 'practicing',
    title: 'Practicing now',
    note: 'Part of my current work and routine.',
    icon: 'check',
    tone: 'bg-leaf-500',
  },
  {
    status: 'exploring',
    title: 'Exploring',
    note: 'Actively learning and experimenting.',
    icon: 'compass',
    tone: 'bg-sky-400',
  },
  {
    status: 'goal',
    title: 'Future goals',
    note: 'Where I want to grow next — not achievements yet.',
    icon: 'flag',
    tone: 'bg-sun-400',
  },
];

@Component({
  selector: 'app-learning-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PortfolioPanel, Icon],
  template: `
    <app-portfolio-panel
      buildingId="academy"
      intro="A peaceful academy for growth — what I practise today and what I'm aiming for next."
    >
      <div class="stagger space-y-8">
        @for (section of sections; track section.status) {
          <section [attr.aria-labelledby]="'learn-' + section.status">
            <div class="flex items-center gap-3">
              <span
                class="grid size-8 place-items-center rounded-full text-white"
                [class]="section.tone"
              >
                <app-icon [name]="section.icon" [size]="16" />
              </span>
              <div>
                <h2
                  [id]="'learn-' + section.status"
                  class="font-display text-xl font-bold text-ink-900"
                >
                  {{ section.title }}
                </h2>
                <p class="text-sm text-ink-500">{{ section.note }}</p>
              </div>
            </div>
            <ul class="mt-3 grid gap-3 sm:grid-cols-2">
              @for (item of itemsFor(section.status); track item.id) {
                <li
                  class="rounded-2xl border border-wood-400/25 bg-white/70 p-4"
                  [class.border-dashed]="item.status === 'goal'"
                >
                  <h3 class="font-display text-lg font-bold text-ink-900">{{ item.title }}</h3>
                  <p class="mt-1 text-[0.95rem] leading-relaxed text-ink-700">
                    {{ item.description }}
                  </p>
                </li>
              }
            </ul>
          </section>
        }
      </div>
    </app-portfolio-panel>
  `,
})
export class LearningPage {
  private readonly data = inject(PortfolioDataService);
  protected readonly sections = SECTIONS;
  protected itemsFor(status: LearningStatus) {
    return this.data.learning.filter((l) => l.status === status);
  }
}
