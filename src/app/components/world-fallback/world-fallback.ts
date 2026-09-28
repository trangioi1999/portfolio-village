import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { WorldStateService } from '../../services/world-state.service';

/**
 * Painted backdrop used when WebGL is unavailable, before the 3D chunk arrives,
 * and behind the classic view. Pure CSS/SVG — no WebGL required.
 */
@Component({
  selector: 'app-world-fallback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'fixed inset-0 -z-0 block overflow-hidden', 'aria-hidden': 'true' },
  template: `
    <div
      class="absolute inset-0 bg-[linear-gradient(180deg,#8fd0ef_0%,#cfeaf8_42%,#fbe7c6_100%)]"
    ></div>
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMax slice"
      class="absolute inset-0 h-full w-full"
    >
      <g fill="#9cc7a8" opacity="0.55">
        <path d="M60 620 110 300 150 250 190 320 220 620z" />
        <path d="M1180 640 1220 280 1260 230 1300 300 1340 640z" />
        <path d="M1320 660 1350 380 1380 350 1410 400 1430 660z" />
      </g>
      <g fill="#fff" opacity="0.85">
        <ellipse cx="260" cy="170" rx="90" ry="26" />
        <ellipse cx="320" cy="150" rx="60" ry="30" />
        <ellipse cx="1120" cy="120" rx="110" ry="28" />
        <ellipse cx="1060" cy="104" rx="60" ry="28" />
      </g>
      <g>
        <path
          d="M300 560c80-70 260-110 420-110s340 40 420 110c-20 90-200 150-420 150S320 650 300 560z"
          fill="#6fb24f"
        />
        <path
          d="M320 590c70 60 230 100 400 100s330-40 400-100l-60 120c-70 60-200 150-340 170-140-20-270-110-340-170z"
          fill="#8a6440"
        />
        <path
          d="M420 690c70 70 190 150 300 190 110-40 230-120 300-190l-110 80c-60 40-120 70-190 90-70-20-130-50-190-90z"
          fill="#6b4c33"
        />
        <ellipse cx="720" cy="560" rx="120" ry="42" fill="#e8d8b4" />
        <ellipse cx="720" cy="560" rx="70" ry="24" fill="#d8c59d" />
        <g transform="translate(700 380)">
          <rect
            x="-20"
            y="40"
            width="80"
            height="110"
            fill="#fbf1dc"
            stroke="#5f3d22"
            stroke-width="4"
          />
          <path d="M-40 50 20 0 80 50z" fill="#d65a4a" />
          <rect
            x="-10"
            y="-40"
            width="60"
            height="60"
            fill="#fbf1dc"
            stroke="#5f3d22"
            stroke-width="4"
          />
          <path d="M-30 -30 20 -80 70 -30z" fill="#d65a4a" />
          <rect x="10" y="100" width="20" height="50" fill="#f7bf4f" />
        </g>
        <g transform="translate(470 470)">
          <rect width="90" height="60" fill="#f3e2bf" stroke="#5f3d22" stroke-width="4" />
          <path d="M-12 4 45-34 102 4z" fill="#4d6a8f" />
        </g>
        <g transform="translate(900 480)">
          <rect width="80" height="55" fill="#fbf1dc" stroke="#5f3d22" stroke-width="4" />
          <path d="M-10 4 40-30 90 4z" fill="#e08a3c" />
        </g>
        <g fill="#3f8a3a">
          <circle cx="380" cy="560" r="30" />
          <circle cx="1050" cy="560" r="34" />
          <circle cx="600" cy="610" r="22" />
          <circle cx="860" cy="620" r="26" />
          <circle cx="440" cy="600" r="20" />
        </g>
        <path d="M1110 575 1125 575 1122 880 1112 880z" fill="#bfe8f6" opacity="0.9" />
      </g>
    </svg>
    @if (!state.webglSupported) {
      <p class="sr-only">
        Your browser does not support WebGL, so the classic portfolio view is shown.
      </p>
    }
  `,
})
export class WorldFallback {
  protected readonly state = inject(WorldStateService);
}
