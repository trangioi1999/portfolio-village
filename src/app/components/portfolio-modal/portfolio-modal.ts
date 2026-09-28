import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Icon } from '../icon/icon';

/** Accessible modal built on the native <dialog> element (focus trap + Escape for free). */
@Component({
  selector: 'app-portfolio-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  styles: `
    dialog::backdrop {
      background: rgb(28 38 64 / 0.55);
      backdrop-filter: blur(3px);
    }
    dialog[open] {
      animation: rise-in 360ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
  `,
  template: `
    <!-- Backdrop click is a pointer convenience; keyboard users close with Escape or the close button. -->
    <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
    <dialog
      #dialog
      class="parchment m-auto max-h-[min(92dvh,900px)] w-[min(760px,calc(100vw-1.5rem))] overflow-hidden p-0 text-ink-900 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-screen max-sm:max-w-none max-sm:!rounded-none"
      [attr.aria-labelledby]="titleId()"
      (close)="closed.emit()"
      (click)="onBackdrop($event)"
    >
      <div class="flex max-h-[inherit] flex-col">
        <div class="flex items-start gap-3 border-b border-wood-400/25 px-5 py-4 sm:px-7">
          <div class="min-w-0 flex-1">
            <ng-content select="[modal-title]" />
          </div>
          <button
            type="button"
            class="btn-icon -mr-2 text-wood-700 hover:bg-wood-400/15"
            aria-label="Close details"
            (click)="dialog.close()"
          >
            <app-icon name="close" />
          </button>
        </div>
        <div class="scroll-soft min-h-0 overflow-y-auto px-5 py-6 sm:px-7">
          <ng-content />
        </div>
      </div>
    </dialog>
  `,
})
export class PortfolioModal {
  readonly open = input(false);
  readonly titleId = input.required<string>();
  readonly closed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      if (this.open() && !el.open) el.showModal();
      if (!this.open() && el.open) el.close();
    });
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.dialog().nativeElement.close();
  }
}
