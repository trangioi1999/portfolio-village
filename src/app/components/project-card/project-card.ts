import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Project } from '../../models/project.model';
import { Icon } from '../icon/icon';
import { TechnologyBadge } from '../technology-badge/technology-badge';
import { ProjectThumbnail } from './project-thumbnail';

@Component({
  selector: 'app-project-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProjectThumbnail, TechnologyBadge, Icon],
  host: { class: 'block' },
  template: `
    <article
      class="group overflow-hidden rounded-[var(--radius-card)] border border-wood-400/30 bg-white/75 shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
      [class.sm:flex]="layout() === 'row'"
    >
      <app-project-thumbnail
        [project]="project()"
        class="aspect-[16/9] overflow-hidden"
        [class.sm:aspect-auto]="layout() === 'row'"
        [class.sm:w-56]="layout() === 'row'"
        [class.sm:shrink-0]="layout() === 'row'"
      />
      <div class="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p class="eyebrow">{{ project().company }}</p>
          <h3 class="mt-1 font-display text-xl font-bold text-ink-900">
            {{ project().fullName }}
            @if (project().name !== project().fullName) {
              <span class="text-wood-600">· {{ project().name }}</span>
            }
          </h3>
          <p class="mt-1.5 text-[0.95rem] leading-relaxed text-ink-700">{{ project().summary }}</p>
        </div>
        <ul class="flex flex-wrap gap-1.5" aria-label="Main technologies">
          @for (tech of visibleTech(); track tech) {
            <li><app-technology-badge [name]="tech" compact /></li>
          }
          @if (hiddenCount() > 0) {
            <li class="chip !py-0.5 !text-xs">+{{ hiddenCount() }} more</li>
          }
        </ul>
        <div class="mt-auto pt-1">
          <button
            type="button"
            class="btn btn-leaf !min-h-10 !px-4 !text-sm"
            (click)="viewDetails.emit(project().id)"
          >
            View details
            <span class="sr-only">about {{ project().fullName }}</span>
            <app-icon name="arrow-right" [size]="16" />
          </button>
        </div>
      </div>
    </article>
  `,
})
export class ProjectCard {
  readonly project = input.required<Project>();
  readonly layout = input<'row' | 'stack'>('stack');
  readonly viewDetails = output<string>();

  protected readonly visibleTech = computed(() => this.project().technologies.slice(0, 5));
  protected readonly hiddenCount = computed(() => this.project().technologies.length - 5);
}
