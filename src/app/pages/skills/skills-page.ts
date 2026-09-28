import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PortfolioPanel } from '../../components/portfolio-panel/portfolio-panel';
import { SkillBadge } from '../../components/skill-badge/skill-badge';
import { PortfolioDataService } from '../../services/portfolio-data.service';

@Component({
  selector: 'app-skills-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PortfolioPanel, SkillBadge],
  template: `
    <app-portfolio-panel
      buildingId="garden"
      intro="Every crystal in the garden is a family of tools I use in real projects."
    >
      <div class="stagger space-y-8">
        @for (group of data.skillGroups; track group.id) {
          <section [attr.aria-labelledby]="'skills-' + group.id">
            <div class="flex items-center gap-3">
              <span
                class="size-4 rotate-45 rounded-[3px] shadow"
                [style.background]="group.color"
                [style.box-shadow]="'0 0 12px ' + group.color"
                aria-hidden="true"
              ></span>
              <h2 [id]="'skills-' + group.id" class="font-display text-xl font-bold text-ink-900">
                {{ group.label }}
              </h2>
              <span class="text-sm text-ink-500">— {{ group.description }}</span>
            </div>
            <ul class="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              @for (skill of group.skills; track skill.name) {
                <li><app-skill-badge [skill]="skill" [color]="group.color" /></li>
              }
            </ul>
          </section>
        }
      </div>
    </app-portfolio-panel>
  `,
})
export class SkillsPage {
  protected readonly data = inject(PortfolioDataService);
}
