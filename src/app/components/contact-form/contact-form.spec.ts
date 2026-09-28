import { TestBed } from '@angular/core/testing';
import { ContactForm } from './contact-form';

describe('ContactForm', () => {
  it('shows validation errors when submitted empty', async () => {
    const fixture = TestBed.createComponent(ContactForm);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
    const errors = Array.from(el.querySelectorAll('.field-error')).map((e) =>
      e.textContent?.trim(),
    );
    expect(errors).toContain('Please tell me your name.');
    expect(errors).toContain('Please enter your email so I can reply.');
    expect(errors).toContain('Please write a short message.');
    expect(el.querySelector('#cf-name')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('flags an invalid email address', async () => {
    const fixture = TestBed.createComponent(ContactForm);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector<HTMLInputElement>('#cf-email')!;
    input.value = 'not-an-email';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(el.querySelector('#cf-email-error')?.textContent).toContain('does not look right');
  });
});
