import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Project } from '../../models/project.model';

/**
 * Generated illustration used as the project thumbnail (no real screenshots are published).
 * Each project gets its own motif: machines (STMA), records (EBR), factory line (DMP).
 */
@Component({
  selector: 'app-project-thumbnail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <svg
      viewBox="0 0 320 180"
      class="h-full w-full"
      role="img"
      [attr.aria-label]="'Illustration for ' + project().fullName"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient [attr.id]="gid()" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" [attr.stop-color]="project().theme.from" />
          <stop offset="1" [attr.stop-color]="project().theme.to" />
        </linearGradient>
        <pattern [attr.id]="gid() + '-grid'" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0H0V16" fill="none" stroke="#fff" stroke-opacity="0.08" />
        </pattern>
      </defs>
      <rect width="320" height="180" [attr.fill]="'url(#' + gid() + ')'" />
      <rect width="320" height="180" [attr.fill]="'url(#' + gid() + '-grid)'" />
      <!-- app window -->
      <g transform="translate(24 22)">
        <rect width="190" height="136" rx="12" fill="#fff" fill-opacity="0.92" />
        <rect width="190" height="22" rx="12" [attr.fill]="project().theme.accent" />
        <rect y="11" width="190" height="11" [attr.fill]="project().theme.accent" />
        <circle cx="13" cy="11" r="3.5" fill="#fff" fill-opacity="0.8" />
        <circle cx="25" cy="11" r="3.5" fill="#fff" fill-opacity="0.6" />
        <rect
          x="12"
          y="34"
          width="46"
          height="90"
          rx="6"
          [attr.fill]="project().theme.to"
          fill-opacity="0.12"
        />
        @for (i of [0, 1, 2, 3]; track i) {
          <rect
            x="18"
            [attr.y]="42 + i * 18"
            width="34"
            height="7"
            rx="3.5"
            [attr.fill]="project().theme.to"
            fill-opacity="0.35"
          />
        }
        @switch (project().id) {
          @case ('ebr') {
            @for (i of [0, 1, 2]; track i) {
              <g [attr.transform]="'translate(' + (70 + i * 8) + ' ' + (36 + i * 8) + ')'">
                <rect
                  width="72"
                  height="70"
                  rx="5"
                  fill="#fff"
                  [attr.stroke]="project().theme.from"
                  stroke-width="1.5"
                />
                <rect
                  x="9"
                  y="12"
                  width="44"
                  height="5"
                  rx="2.5"
                  [attr.fill]="project().theme.from"
                  fill-opacity="0.6"
                />
                <rect x="9" y="24" width="54" height="4" rx="2" fill="#c9c3dd" />
                <rect x="9" y="34" width="48" height="4" rx="2" fill="#c9c3dd" />
                <path
                  d="M46 52l6 6 12-13"
                  fill="none"
                  [attr.stroke]="project().theme.from"
                  stroke-width="3"
                  stroke-linecap="round"
                />
              </g>
            }
          }
          @case ('dmp') {
            <path
              d="M70 118V78l22 12V78l22 12V78l22 12V60h14v58z"
              [attr.fill]="project().theme.from"
              fill-opacity="0.85"
            />
            <rect
              x="140"
              y="44"
              width="10"
              height="20"
              [attr.fill]="project().theme.to"
              fill-opacity="0.8"
            />
            <circle cx="150" cy="36" r="6" fill="#cfd4dc" />
            <circle cx="160" cy="28" r="8" fill="#e2e6ec" />
            @for (i of [0, 1, 2]; track i) {
              <rect
                [attr.x]="78 + i * 22"
                y="98"
                width="10"
                height="10"
                rx="2"
                fill="#fff"
                fill-opacity="0.8"
              />
            }
            <rect x="66" y="118" width="110" height="4" rx="2" [attr.fill]="project().theme.to" />
          }
          @default {
            <g transform="translate(118 78)">
              <circle
                r="30"
                fill="none"
                [attr.stroke]="project().theme.from"
                stroke-width="10"
                stroke-dasharray="11 6.3"
              />
              <circle r="18" [attr.fill]="project().theme.from" fill-opacity="0.85" />
              <circle r="7" fill="#fff" />
            </g>
            <rect
              x="160"
              y="40"
              width="20"
              height="78"
              rx="4"
              [attr.fill]="project().theme.to"
              fill-opacity="0.15"
            />
            <rect
              x="160"
              [attr.y]="74"
              width="20"
              height="44"
              rx="4"
              [attr.fill]="project().theme.from"
            />
            <rect
              x="70"
              y="112"
              width="80"
              height="6"
              rx="3"
              [attr.fill]="project().theme.to"
              fill-opacity="0.3"
            />
          }
        }
      </g>
      <!-- floating badge -->
      <g transform="translate(232 40)">
        <rect
          width="68"
          height="68"
          rx="18"
          fill="#fff"
          fill-opacity="0.18"
          stroke="#fff"
          stroke-opacity="0.5"
        />
        <text
          x="34"
          y="42"
          text-anchor="middle"
          font-family="Baloo 2, sans-serif"
          font-weight="800"
          font-size="18"
          fill="#fff"
        >
          {{ badge() }}
        </text>
      </g>
      <g transform="translate(232 120)" fill="#fff" fill-opacity="0.7">
        <rect width="68" height="8" rx="4" />
        <rect y="16" width="46" height="8" rx="4" fill-opacity="0.5" />
      </g>
    </svg>
  `,
})
export class ProjectThumbnail {
  readonly project = input.required<Project>();
  protected readonly gid = computed(() => `thumb-${this.project().id}`);
  protected readonly badge = computed(() =>
    this.project().name.length <= 5 ? this.project().name : 'DMP',
  );
}
