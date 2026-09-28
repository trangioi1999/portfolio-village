import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Experience } from '../../models/experience.model';
import { PortfolioDataService } from '../../services/portfolio-data.service';
import { Icon } from '../icon/icon';
import { TechnologyBadge } from '../technology-badge/technology-badge';

/** Vertical timeline — one "floor" of the Career Tower per company. */
@Component({
  selector: 'app-experience-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, TechnologyBadge, RouterLink],
  template: `
    <ol
      class="stagger relative space-y-7 border-l-[3px] border-dashed border-wood-400/45 pl-6 sm:pl-8"
    >
      @for (exp of experiences(); track exp.id; let i = $index) {
        <li class="relative">
          <span
            class="absolute top-1 -left-[2.3rem] grid size-8 place-items-center rounded-full border-[3px] border-parchment-50 text-xs font-extrabold text-ink-900 shadow sm:-left-[2.8rem]"
            [class.bg-sun-400]="exp.end === null"
            [class.bg-parchment-300]="exp.end !== null"
            aria-hidden="true"
          >
            {{ experiences().length - i }}
          </span>
          <p class="eyebrow">
            Floor {{ experiences().length - i }}{{ i === 0 ? ' · Top floor' : '' }}
          </p>
          <h2 class="mt-1 font-display text-2xl font-bold text-ink-900">{{ exp.company }}</h2>
          <div
            class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-ink-700"
          >
            <span class="inline-flex items-center gap-1.5"
              ><app-icon name="briefcase" [size]="15" /> {{ exp.role }}</span
            >
            <span class="inline-flex items-center gap-1.5">
              <app-icon name="calendar" [size]="15" />
              <time [attr.datetime]="exp.start">{{ data.formatMonth(exp.start) }}</time> –
              @if (exp.end) {
                <time [attr.datetime]="exp.end">{{ data.formatMonth(exp.end) }}</time>
              } @else {
                Present
              }
              <span class="text-ink-500">· {{ data.duration(exp.start, exp.end) }}</span>
            </span>
          </div>

          <ul class="mt-4 space-y-2.5">
            @for (project of exp.projects; track project.name) {
              <li>
                <details
                  class="group rounded-2xl border border-wood-400/30 bg-white/70 open:bg-white/90 open:shadow-[var(--shadow-soft)]"
                >
                  <summary
                    class="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-2xl px-4 py-3 font-display text-[1.05rem] font-bold text-ink-900 [&::-webkit-details-marker]:hidden"
                  >
                    <span
                      class="size-2.5 shrink-0 rounded-full bg-leaf-500"
                      aria-hidden="true"
                    ></span>
                    <span class="flex-1">{{ project.name }}</span>
                    <app-icon
                      name="chevron-down"
                      [size]="18"
                      class="text-wood-600 transition group-open:rotate-180"
                    />
                  </summary>
                  <div class="space-y-4 px-4 pb-4 text-[0.95rem] leading-relaxed text-ink-700">
                    <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                      <dt class="font-bold text-ink-800">Company</dt>
                      <dd>{{ exp.company }}</dd>
                      <dt class="font-bold text-ink-800">Duration</dt>
                      <dd>{{ data.formatMonth(exp.start) }} – {{ data.formatMonth(exp.end) }}</dd>
                    </dl>
                    @if (project.description) {
                      <div>
                        <h3 class="mb-1 font-display text-base font-bold text-ink-900">
                          Project description
                        </h3>
                        <p>{{ project.description }}</p>
                      </div>
                    }
                    @if (project.responsibilities.length) {
                      <div>
                        <h3 class="mb-1 font-display text-base font-bold text-ink-900">
                          Responsibilities
                        </h3>
                        <ul class="list-disc space-y-1 pl-5 marker:text-leaf-500">
                          @for (r of project.responsibilities; track r) {
                            <li>{{ r }}</li>
                          }
                        </ul>
                      </div>
                    }
                    @if (project.technologies.length) {
                      <div>
                        <h3 class="mb-2 font-display text-base font-bold text-ink-900">
                          Technology stack
                        </h3>
                        <ul class="flex flex-wrap gap-1.5">
                          @for (t of project.technologies; track t) {
                            <li><app-technology-badge [name]="t" compact /></li>
                          }
                        </ul>
                      </div>
                    }
                    @if (!project.description && !project.responsibilities.length) {
                      <p class="rounded-xl bg-parchment-100 px-3 py-2 text-sm text-ink-500 italic">
                        Detailed project notes are available on request.
                      </p>
                    }
                    @if (project.projectId) {
                      <a
                        [routerLink]="['/projects']"
                        [queryParams]="{ project: project.projectId }"
                        class="inline-flex items-center gap-1.5 text-sm font-bold text-leaf-700 hover:underline"
                      >
                        Open in the Project Workshop <app-icon name="arrow-right" [size]="15" />
                      </a>
                    }
                  </div>
                </details>
              </li>
            }
          </ul>
        </li>
      }
    </ol>
  `,
})
export class ExperienceTimeline {
  protected readonly data = inject(PortfolioDataService);
  readonly experiences = input.required<readonly Experience[]>();
}
