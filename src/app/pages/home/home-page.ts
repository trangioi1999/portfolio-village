import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AvatarPortrait } from '../../components/avatar-portrait/avatar-portrait';
import { Icon } from '../../components/icon/icon';
import { TechnologyBadge } from '../../components/technology-badge/technology-badge';
import { ViewInset } from '../../components/view-inset.directive';
import { IconName } from '../../models/building.model';
import { PortfolioDataService } from '../../services/portfolio-data.service';
import { WorldStateService } from '../../services/world-state.service';

type BoardTab = 'about' | 'experience' | 'projects' | 'skills';

/** Central Plaza — the homepage. */
@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgTemplateOutlet, Icon, TechnologyBadge, ViewInset, AvatarPortrait],
  templateUrl: './home-page.html',
})
export class HomePage {
  protected readonly data = inject(PortfolioDataService);
  protected readonly state = inject(WorldStateService);
  protected readonly profile = this.data.profile;
  protected readonly classic = computed(() => this.state.viewMode() === 'classic');
  protected readonly compact = this.state.isMobile;
  protected readonly wide = this.state.isWide;
  protected readonly boardOpen = signal(window.innerHeight >= 700);
  protected readonly sheetExpanded = signal(false);
  protected readonly hintVisible = signal(true);
  protected readonly tab = signal<BoardTab>('about');
  protected readonly directory = this.data.buildings.filter((b) => b.id !== 'plaza');
  protected readonly topSkills = [
    'Angular',
    'TypeScript',
    'RxJS',
    'Flutter',
    'PrimeNG',
    'Tailwind CSS',
    'Node.js',
    'Firebase',
    'Docker',
    'Azure',
  ];
  protected readonly tabs: { id: BoardTab; label: string; icon: IconName }[] = [
    { id: 'about', label: 'About Me', icon: 'user' },
    { id: 'experience', label: 'Experience', icon: 'briefcase' },
    { id: 'projects', label: 'Projects', icon: 'hammer' },
    { id: 'skills', label: 'Skills', icon: 'sprout' },
  ];

  constructor() {
    setTimeout(() => this.hintVisible.set(false), 9000);
  }

  protected onTabKey(event: KeyboardEvent): void {
    const i = this.tabs.findIndex((t) => t.id === this.tab());
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = this.tabs[(i + delta + this.tabs.length) % this.tabs.length];
    this.tab.set(next.id);
    document.getElementById(`board-tab-${next.id}`)?.focus();
  }
}
