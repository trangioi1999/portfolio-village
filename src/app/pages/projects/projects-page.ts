import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { Icon } from '../../components/icon/icon';
import { PortfolioModal } from '../../components/portfolio-modal/portfolio-modal';
import { PortfolioPanel } from '../../components/portfolio-panel/portfolio-panel';
import { ProjectCard } from '../../components/project-card/project-card';
import { ProjectThumbnail } from '../../components/project-card/project-thumbnail';
import { TechnologyBadge } from '../../components/technology-badge/technology-badge';
import { PortfolioDataService } from '../../services/portfolio-data.service';
import { WorldStateService } from '../../services/world-state.service';

@Component({
  selector: 'app-projects-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PortfolioPanel, ProjectCard, PortfolioModal, ProjectThumbnail, TechnologyBadge, Icon],
  templateUrl: './projects-page.html',
})
export class ProjectsPage {
  protected readonly data = inject(PortfolioDataService);
  private readonly state = inject(WorldStateService);
  private readonly router = inject(Router);

  /** Bound from the `?project=` query parameter so details are deep-linkable. */
  readonly project = input<string>();
  protected readonly selected = computed(() => this.data.project(this.project()));
  protected readonly cardLayout = computed(() =>
    this.state.viewMode() === 'classic' ? 'row' : 'stack',
  );

  protected open(id: string): void {
    void this.router.navigate([], { queryParams: { project: id }, queryParamsHandling: 'merge' });
  }

  protected close(): void {
    if (!this.selected()) return;
    void this.router.navigate([], { queryParams: { project: null }, queryParamsHandling: 'merge' });
  }
}
