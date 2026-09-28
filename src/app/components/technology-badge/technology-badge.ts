import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { PortfolioDataService } from '../../services/portfolio-data.service';

/** Compact pill for a technology name, with its logo when one is available. */
@Component({
  selector: 'app-technology-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `
    <span class="chip" [class.!py-0.5]="compact()" [class.!text-xs]="compact()">
      @if (icon() && !failed()) {
        <img
          [src]="icon()"
          alt=""
          width="14"
          height="14"
          class="size-3.5"
          loading="lazy"
          (error)="failed.set(true)"
        />
      }
      {{ name() }}
    </span>
  `,
})
export class TechnologyBadge {
  private readonly data = inject(PortfolioDataService);
  readonly name = input.required<string>();
  readonly compact = input(false, { transform: booleanAttribute });
  protected readonly failed = signal(false);
  protected readonly icon = computed(() => this.data.techIcon(this.name()));
}
