import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BuildingId, IconName } from '../../models/building.model';
import { AudioService } from '../../services/audio.service';
import { PortfolioDataService } from '../../services/portfolio-data.service';
import { WorldStateService } from '../../services/world-state.service';
import { AvatarPortrait } from '../avatar-portrait/avatar-portrait';
import { Icon } from '../icon/icon';
import { SoundControls } from '../sound-controls/sound-controls';
import { ViewInset } from '../view-inset.directive';

interface Tool {
  id: string;
  icon: IconName;
  label: string;
  pressed: boolean | null;
  action: () => void;
}

/**
 * Traditional HTML navigation — the accessible text alternative to exploring the 3D village.
 * Desktop: wooden signboard column on the left. Compact (< 1024px): top bar + bottom tab bar.
 */
@Component({
  selector: 'app-navigation-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Icon, ViewInset, SoundControls, AvatarPortrait],
  host: {
    '(document:keydown.escape)': 'closePopovers()',
    '(document:pointerdown)': 'onDocumentPointer($event)',
  },
  template: `
    <!-- ================= Desktop column ================= -->
    <aside
      appViewInset="left"
      class="pointer-events-none fixed top-5 bottom-5 left-5 z-20 hidden w-[15.5rem] flex-col gap-4 short:top-3 short:bottom-3 short:gap-3 lg:flex"
      aria-label="Site"
    >
      <a
        routerLink="/"
        class="glass animate-rise group pointer-events-auto flex w-fit items-center gap-2.5 !rounded-full py-1.5 pr-4 pl-1.5 transition hover:-translate-y-0.5"
        aria-label="Trần Văn Giỏi — Frontend Developer, go to home"
      >
        <span class="shrink-0 rounded-full bg-sky-200/80 ring-2 ring-white">
          <app-avatar-portrait [size]="38" />
        </span>
        <span class="min-w-0">
          <span
            class="flex items-center gap-1 font-display text-base leading-tight font-extrabold text-ink-900"
          >
            {{ profile.name }}
            <app-icon
              name="sprout"
              [size]="13"
              class="text-leaf-600 transition group-hover:rotate-12"
            />
          </span>
          <span class="block text-xs font-bold text-wood-700">{{ profile.role }}</span>
        </span>
      </a>

      <nav
        class="wood animate-rise pointer-events-auto w-44 rounded-2xl p-2 [animation-delay:120ms]"
        aria-label="Village map"
      >
        <ul class="space-y-0.5">
          @for (b of buildings; track b.id) {
            <li>
              <a
                [routerLink]="'/' + b.route"
                routerLinkActive="!bg-parchment-100 !text-wood-900 shadow-[inset_0_-2px_0_rgb(0_0_0/0.08)]"
                [routerLinkActiveOptions]="{ exact: b.id === 'plaza' }"
                ariaCurrentWhenActive="page"
                class="wiggle flex min-h-10 items-center gap-2.5 rounded-xl px-3 py-2 font-display text-[0.95rem] font-semibold text-parchment-50 transition hover:translate-x-0.5 hover:bg-white/15 short:min-h-9 short:py-1.5"
                (mouseenter)="hover(b.id)"
                (mouseleave)="hover(null)"
                (focus)="hover(b.id)"
                (blur)="hover(null)"
              >
                <app-icon [name]="b.icon" [size]="18" />
                {{ b.navLabel }}
                @if (b.id !== 'plaza' && visited().has(b.id)) {
                  <span
                    class="ml-auto grid size-4 place-items-center rounded-full bg-leaf-500 text-white"
                    title="Visited"
                  >
                    <app-icon name="check" [size]="10" />
                    <span class="sr-only">(visited)</span>
                  </span>
                }
              </a>
            </li>
          }
        </ul>
        <div class="mt-1.5 border-t border-white/15 px-3 pt-2 pb-1">
          <p class="flex justify-between text-[0.7rem] font-bold text-parchment-100/90">
            <span>Village explored</span>
            <span>{{ visitedCount() }}/{{ places }}</span>
          </p>
          <div
            class="mt-1 h-1.5 overflow-hidden rounded-full bg-black/20"
            role="progressbar"
            aria-label="Village explored"
            aria-valuemin="0"
            [attr.aria-valuemax]="places"
            [attr.aria-valuenow]="visitedCount()"
          >
            <div
              class="h-full rounded-full bg-sun-400 transition-[width] duration-700"
              [style.width.%]="(visitedCount() / places) * 100"
            ></div>
          </div>
        </div>
      </nav>

      <div class="pointer-events-auto relative mt-auto" data-popover>
        @if (soundOpen()) {
          <div
            class="glass animate-rise absolute bottom-full left-0 mb-2 w-72 p-3"
            id="sound-panel"
          >
            <app-sound-controls />
          </div>
        }
        <div class="flex flex-wrap gap-2" role="toolbar" aria-label="Village settings">
          @for (tool of tools(); track tool.id) {
            <button
              type="button"
              class="btn-icon glass !size-10 !rounded-xl text-wood-700 hover:-translate-y-0.5 hover:text-ink-900"
              [attr.aria-label]="tool.label"
              [attr.aria-pressed]="tool.pressed"
              [title]="tool.label"
              (click)="tool.action()"
            >
              <app-icon [name]="tool.icon" [size]="19" />
            </button>
          }
          <button
            type="button"
            class="btn-icon glass !size-10 !rounded-xl hover:-translate-y-0.5"
            [class.!bg-leaf-500]="soundOn()"
            [class.!text-white]="soundOn()"
            [class.text-wood-700]="!soundOn()"
            aria-label="Sound settings"
            title="Sound settings"
            aria-controls="sound-panel"
            [attr.aria-expanded]="soundOpen()"
            (click)="soundOpen.set(!soundOpen())"
          >
            <app-icon [name]="soundOn() ? 'sound-on' : 'sound-off'" [size]="19" />
          </button>
        </div>
      </div>
    </aside>

    <!-- ================= Compact top bar ================= -->
    <header
      appViewInset="top"
      class="fixed inset-x-0 top-0 z-20 flex items-center gap-2 px-3 pt-[max(0.6rem,env(safe-area-inset-top))] pb-2 xs:gap-3 xs:px-4 lg:hidden"
      [class.hidden]="panelOpen() && !classic()"
    >
      <a
        routerLink="/"
        data-avoid
        class="glass flex min-w-0 flex-1 items-center gap-2 rounded-2xl px-3 py-1.5 landscape-phone:flex-none landscape-phone:py-1"
        aria-label="Home"
      >
        <app-icon name="sprout" [size]="18" class="shrink-0 text-leaf-600" />
        <span class="min-w-0">
          <span
            class="block truncate font-display text-base leading-tight font-extrabold xs:text-lg"
            >{{ profile.name }}</span
          >
          <span
            class="block truncate text-[0.7rem] font-bold text-wood-700 landscape-phone:hidden xs:text-xs"
          >
            {{ profile.role }} · {{ profile.experienceLabel }}
          </span>
        </span>
      </a>
      <div class="relative" data-popover>
        <button
          type="button"
          class="btn-icon glass !rounded-2xl text-wood-700"
          aria-label="Village settings"
          [attr.aria-expanded]="settingsOpen()"
          aria-controls="compact-settings"
          (click)="settingsOpen.set(!settingsOpen())"
        >
          <app-icon name="settings" />
        </button>
        @if (settingsOpen()) {
          <div
            id="compact-settings"
            class="glass animate-rise absolute top-full right-0 z-40 mt-2 max-h-[calc(100dvh-9rem)] w-[min(18rem,calc(100vw-1.5rem))] overflow-y-auto p-2"
          >
            <app-sound-controls />
            <ul class="mt-2 border-t border-wood-400/25 pt-2">
              @for (tool of tools(); track tool.id) {
                <li>
                  <button
                    type="button"
                    class="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-ink-800 hover:bg-white/70"
                    [attr.aria-pressed]="tool.pressed"
                    (click)="tool.action(); settingsOpen.set(false)"
                  >
                    <app-icon [name]="tool.icon" [size]="18" /> {{ tool.label }}
                  </button>
                </li>
              }
            </ul>
          </div>
        }
      </div>
    </header>

    <!-- ================= Compact bottom tab bar ================= -->
    <nav
      appViewInset="bottom"
      class="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Village map"
    >
      <ul class="wood flex !rounded-none !border-x-0 !border-b-0">
        @for (b of buildings; track b.id) {
          <li class="min-w-0 flex-1">
            <a
              [routerLink]="'/' + b.route"
              routerLinkActive="is-active !text-sun-300"
              [routerLinkActiveOptions]="{ exact: b.id === 'plaza' }"
              ariaCurrentWhenActive="page"
              class="group flex h-[4.25rem] flex-col items-center justify-center gap-0.5 text-parchment-100 landscape-phone:h-12"
              [attr.aria-label]="b.navLabel"
            >
              <span
                class="grid h-7 w-10 place-items-center rounded-full transition group-[.is-active]:-translate-y-0.5 group-[.is-active]:bg-white/15"
              >
                <app-icon [name]="b.icon" [size]="19" />
              </span>
              <span
                class="max-w-full truncate px-0.5 text-[0.62rem] font-bold tracking-wide max-[359px]:hidden landscape-phone:hidden xs:text-[0.66rem]"
              >
                {{ b.shortLabel }}
              </span>
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
})
export class NavigationMenu {
  private readonly data = inject(PortfolioDataService);
  private readonly state = inject(WorldStateService);
  private readonly audio = inject(AudioService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly profile = this.data.profile;
  protected readonly buildings = this.data.buildings;
  protected readonly settingsOpen = signal(false);
  protected readonly soundOpen = signal(false);
  protected readonly soundOn = this.state.soundEnabled;
  protected readonly classic = computed(() => this.state.viewMode() === 'classic');
  protected readonly panelOpen = this.state.panelOpen;
  /** Explore progress: which sections this visitor has opened. */
  protected readonly visited = this.state.visited;
  protected readonly places = this.buildings.filter((b) => b.id !== 'plaza').length;
  protected readonly visitedCount = computed(
    () => this.buildings.filter((b) => b.id !== 'plaza' && this.visited().has(b.id)).length,
  );

  protected readonly tools = computed<Tool[]>(() => {
    const world = !this.classic();
    const reduced = this.state.reducedMotion();
    const list: Tool[] = [];
    if (world) {
      list.push({
        id: 'reset',
        icon: 'target',
        label: 'Reset camera to village overview',
        pressed: null,
        action: () => this.state.resetCamera(),
      });
    }
    if (this.state.webglSupported) {
      list.push({
        id: 'view',
        icon: world ? 'list' : 'cube',
        label: world ? 'Switch to classic (2D) view' : 'Switch to 3D village view',
        pressed: null,
        action: () => this.state.toggleViewMode(),
      });
    }
    list.push({
      id: 'motion',
      icon: 'motion',
      label: reduced ? 'Reduced motion is on — turn animations on' : 'Reduce motion',
      pressed: reduced,
      action: () => {
        this.state.cycleMotion();
        this.audio.play('toggle');
      },
    });
    return list;
  });

  protected hover(id: BuildingId | null): void {
    this.state.hoveredBuilding.set(id);
  }

  protected closePopovers(): void {
    this.settingsOpen.set(false);
    this.soundOpen.set(false);
  }

  protected onDocumentPointer(event: PointerEvent): void {
    const target = event.target as Element | null;
    const inside = target?.closest('[data-popover]');
    if (!inside || !this.host.nativeElement.contains(inside)) this.closePopovers();
  }
}
