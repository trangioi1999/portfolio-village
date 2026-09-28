import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import {
  FormField,
  email,
  form,
  maxLength,
  minLength,
  required,
  submit,
} from '@angular/forms/signals';
import { AudioService } from '../../services/audio.service';
import { PortfolioDataService } from '../../services/portfolio-data.service';
import { Icon } from '../icon/icon';

interface ContactModel {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const EMPTY: ContactModel = { name: '', email: '', subject: '', message: '' };

/**
 * Validated contact form. There is no backend, so a valid submission opens the visitor's
 * email app with the message pre-filled (mailto:) — nothing is sent silently.
 */
@Component({
  selector: 'app-contact-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, Icon],
  template: `
    <form novalidate (submit)="send($event)" aria-describedby="contact-form-note" class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="field-label" for="cf-name"
            >Your name <span aria-hidden="true" class="text-berry-500">*</span></label
          >
          <input
            id="cf-name"
            class="field-input"
            autocomplete="name"
            [formField]="contact.name"
            [attr.aria-invalid]="showError(contact.name)"
            [attr.aria-describedby]="showError(contact.name) ? 'cf-name-error' : null"
          />
          @if (showError(contact.name)) {
            <p id="cf-name-error" class="field-error">{{ firstError(contact.name) }}</p>
          }
        </div>
        <div>
          <label class="field-label" for="cf-email"
            >Email <span aria-hidden="true" class="text-berry-500">*</span></label
          >
          <input
            id="cf-email"
            type="email"
            class="field-input"
            autocomplete="email"
            inputmode="email"
            [formField]="contact.email"
            [attr.aria-invalid]="showError(contact.email)"
            [attr.aria-describedby]="showError(contact.email) ? 'cf-email-error' : null"
          />
          @if (showError(contact.email)) {
            <p id="cf-email-error" class="field-error">{{ firstError(contact.email) }}</p>
          }
        </div>
      </div>
      <div>
        <label class="field-label" for="cf-subject"
          >Subject <span class="font-semibold text-ink-500">(optional)</span></label
        >
        <input
          id="cf-subject"
          class="field-input"
          [formField]="contact.subject"
          [attr.aria-invalid]="showError(contact.subject)"
          [attr.aria-describedby]="showError(contact.subject) ? 'cf-subject-error' : null"
        />
        @if (showError(contact.subject)) {
          <p id="cf-subject-error" class="field-error">{{ firstError(contact.subject) }}</p>
        }
      </div>
      <div>
        <label class="field-label" for="cf-message"
          >Message <span aria-hidden="true" class="text-berry-500">*</span></label
        >
        <textarea
          id="cf-message"
          rows="5"
          class="field-input resize-y"
          [formField]="contact.message"
          [attr.aria-invalid]="showError(contact.message)"
          [attr.aria-describedby]="
            'cf-message-count' + (showError(contact.message) ? ' cf-message-error' : '')
          "
        ></textarea>
        <div class="mt-1 flex justify-between gap-3">
          @if (showError(contact.message)) {
            <p id="cf-message-error" class="field-error !mt-0">{{ firstError(contact.message) }}</p>
          } @else {
            <span></span>
          }
          <span id="cf-message-count" class="text-xs font-semibold text-ink-500">
            {{ model().message.length }} / {{ maxMessage }}
          </span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3 pt-1">
        <button type="submit" class="btn btn-leaf">
          <app-icon name="send" [size]="17" /> Send message
        </button>
        <p id="contact-form-note" class="text-sm text-ink-500">
          Opens your email app with the message ready to send.
        </p>
      </div>

      <p role="status" aria-live="polite" class="min-h-6 text-sm font-bold text-leaf-700">
        @if (status() === 'opened') {
          Your email app should open now. If it doesn't, write to {{ profile.email }}.
        } @else if (status() === 'invalid') {
          <span class="text-berry-500">Please fix the highlighted fields.</span>
        }
      </p>
    </form>
  `,
})
export class ContactForm {
  private readonly injector = inject(Injector);
  private readonly audio = inject(AudioService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly profile = inject(PortfolioDataService).profile;
  protected readonly maxMessage = 2000;
  protected readonly model = signal<ContactModel>({ ...EMPTY });
  protected readonly status = signal<'idle' | 'opened' | 'invalid'>('idle');

  protected readonly contact = form(this.model, (p) => {
    required(p.name, { message: 'Please tell me your name.' });
    minLength(p.name, 2, { message: 'Name should be at least 2 characters.' });
    maxLength(p.name, 80, { message: 'Name should be at most 80 characters.' });
    required(p.email, { message: 'Please enter your email so I can reply.' });
    email(p.email, { message: 'That email address does not look right.' });
    maxLength(p.subject, 120, { message: 'Subject should be at most 120 characters.' });
    required(p.message, { message: 'Please write a short message.' });
    minLength(p.message, 10, { message: 'Message should be at least 10 characters.' });
    maxLength(p.message, this.maxMessage, {
      message: `Message should be at most ${this.maxMessage} characters.`,
    });
  });

  protected showError(field: typeof this.contact.name): boolean {
    const state = field();
    return state.touched() && state.invalid();
  }

  protected firstError(field: typeof this.contact.name): string {
    return field().errors()[0]?.message ?? 'Invalid value.';
  }

  protected async send(event: Event): Promise<void> {
    event.preventDefault();
    const ok = await submit(this.contact, async () => {
      const { name, email: from, subject, message } = this.model();
      const body = `${message}\n\n— ${name} (${from})`;
      const url = `mailto:${this.profile.email}?subject=${encodeURIComponent(
        subject || `Hello from ${name}`,
      )}&body=${encodeURIComponent(body)}`;
      window.location.href = url;
      return undefined;
    });
    this.status.set(ok ? 'opened' : 'invalid');
    this.audio.play(ok ? 'success' : 'error');
    if (!ok) {
      afterNextRender(
        () => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        { injector: this.injector },
      );
    }
  }
}
