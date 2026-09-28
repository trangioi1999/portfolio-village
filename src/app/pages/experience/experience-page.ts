import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ExperienceTimeline } from '../../components/experience-timeline/experience-timeline';
import { PortfolioPanel } from '../../components/portfolio-panel/portfolio-panel';
import { PortfolioDataService } from '../../services/portfolio-data.service';

@Component({
  selector: 'app-experience-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PortfolioPanel, ExperienceTimeline],
  template: `
    <app-portfolio-panel
      buildingId="career"
      intro="Each floor of the Career Tower is one chapter of my journey — newest at the top."
    >
      <app-experience-timeline [experiences]="data.experiences" />
    </app-portfolio-panel>
  `,
})
export class ExperiencePage {
  protected readonly data = inject(PortfolioDataService);
}
