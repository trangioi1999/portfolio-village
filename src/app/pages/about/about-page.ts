import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../components/icon/icon';
import { PortfolioPanel } from '../../components/portfolio-panel/portfolio-panel';
import { PortfolioDataService } from '../../services/portfolio-data.service';

@Component({
  selector: 'app-about-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PortfolioPanel, Icon, RouterLink],
  templateUrl: './about-page.html',
})
export class AboutPage {
  protected readonly data = inject(PortfolioDataService);
  protected readonly profile = this.data.profile;
}
