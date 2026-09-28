import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Flat SVG portrait of the chibi developer avatar (matches the 3D character). */
@Component({
  selector: 'app-avatar-portrait',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block', 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 120 120" [attr.width]="size()" [attr.height]="size()" class="block">
      <!-- Shoulders: white robe with navy trim -->
      <path
        d="M20 120c2-22 18-34 40-34s38 12 40 34z"
        fill="#f7f2e8"
        stroke="#2a1d1a"
        stroke-width="2"
      />
      <path
        d="M46 88l14 18 14-18"
        fill="none"
        stroke="#27304d"
        stroke-width="6"
        stroke-linejoin="round"
      />
      <path d="M22 116h76" stroke="#27304d" stroke-width="5" />
      <!-- Ears + face -->
      <circle cx="27" cy="58" r="7" fill="#f2c6a2" />
      <circle cx="93" cy="58" r="7" fill="#f2c6a2" />
      <ellipse cx="60" cy="56" rx="33" ry="31" fill="#f7d5b5" />
      <!-- Hair -->
      <path
        d="M25 55c-3-24 13-40 35-40s39 15 35 40c-4-6-7-11-9-17-5 6-12 9-19 9 3-3 4-6 4-9-6 6-15 9-24 9 3-2 5-5 5-8-7 6-15 10-27 16z"
        fill="#3a2a22"
      />
      <path d="M60 15c2-6 7-9 12-8-5 2-8 5-9 10z" fill="#3a2a22" />
      <path d="M31 36c2 3 2 7-2 10 5-1 7-4 7-8z" fill="#3a2a22" />
      <!-- Eyes -->
      <ellipse cx="47" cy="60" rx="5.2" ry="7" fill="#2a1d1a" />
      <ellipse cx="73" cy="60" rx="5.2" ry="7" fill="#2a1d1a" />
      <circle cx="49" cy="57" r="2" fill="#fff" />
      <circle cx="75" cy="57" r="2" fill="#fff" />
      <!-- Blush + smile -->
      <ellipse cx="38" cy="70" rx="5" ry="3" fill="#ff9f9f" opacity="0.6" />
      <ellipse cx="82" cy="70" rx="5" ry="3" fill="#ff9f9f" opacity="0.6" />
      <path
        d="M55 72c3 3 7 3 10 0"
        stroke="#7a3b2e"
        stroke-width="2.2"
        fill="none"
        stroke-linecap="round"
      />
    </svg>
  `,
})
export class AvatarPortrait {
  readonly size = input(96);
}
