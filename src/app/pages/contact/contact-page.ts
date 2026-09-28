import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ContactForm } from '../../components/contact-form/contact-form';
import { Icon } from '../../components/icon/icon';
import { PortfolioPanel } from '../../components/portfolio-panel/portfolio-panel';
import { AudioService } from '../../services/audio.service';
import { PortfolioDataService } from '../../services/portfolio-data.service';

@Component({
  selector: 'app-contact-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PortfolioPanel, ContactForm, Icon],
  templateUrl: './contact-page.html',
})
export class ContactPage {
  protected readonly profile = inject(PortfolioDataService).profile;
  protected readonly copied = signal(false);
  private readonly audio = inject(AudioService);

  protected async copyEmail(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.profile.email);
      this.copied.set(true);
      this.audio.play('success');
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.copied.set(false);
    }
  }
}
